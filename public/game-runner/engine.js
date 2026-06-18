/* =============================================================================
 * GameCraft declarative Phaser runtime.
 *
 * Listens for { type: 'UPDATE_GAME_STATE_JSON', payload: GameStateConfig }
 * messages from the parent builder and hot-reloads the running game to match —
 * no rebuild, no page reload. See types/engine.ts for the payload contract.
 *
 * Supports: tile maps (floor/wall/goal), a movable player, collectibles with
 * scoring, enemies (patrol/chase/static), win conditions (collect-all /
 * reach-goal / survive), remote or solid-color sprites, and live resize.
 * Reports ENGINE_READY, ENGINE_ERROR, and GAME_EVENT back to the parent.
 * ===========================================================================*/

(function () {
  "use strict";

  // 1×1 transparent-ish default textures so a game renders even before any real
  // sprites are supplied (these are the spec's base64 placeholders).
  var DEFAULT_PLAYER =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAMElEQVRYR2Nk4P/PgEYwEwEGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGJgIADAQAC996bJgAAAAASUVORK5CYII=";
  var DEFAULT_WALL =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAM0lEQVRYR2NkgID/DAzMxAemGjAagVEPjHpg1AOjHhj1wKgHRj0w6oFRD4x6YMgHGBgYGAEAAQACpZ6ptgAAAABJRU5CYII=";

  var boot = document.getElementById("boot");

  function post(message) {
    try {
      window.parent.postMessage(message, "*");
    } catch (e) {
      /* no parent / cross-origin teardown */
    }
    // Also notify our own window so a self-contained build (engine + state in one
    // file, running inside a srcdoc iframe) can hear ENGINE_READY and inject state.
    try {
      if (window.parent !== window) window.postMessage(message, "*");
    } catch (e) {
      /* ignore */
    }
  }

  function bootError(msg) {
    if (boot) {
      boot.textContent = msg;
      boot.className = "error";
      boot.style.display = "flex";
    }
    post({ type: "ENGINE_ERROR", message: msg });
  }

  window.__onPhaserLoadError = function () {
    bootError(
      "Couldn't load the game engine (Phaser CDN unreachable). Check your network and reload."
    );
  };

  function start() {
    if (typeof Phaser === "undefined") {
      bootError("Game engine failed to initialize.");
      return;
    }

    var DeclarativeRunner = new Phaser.Class({
      Extends: Phaser.Scene,

      initialize: function DeclarativeRunner() {
        Phaser.Scene.call(this, { key: "DeclarativeRunner" });
        this.gameStateConfig = null;
        this.pendingConfig = null;
        this.playerInstance = null;
        this.wallsGroup = null;
        this.collectiblesGroup = null;
        this.enemiesGroup = null;
        this.goalZone = null;
        this.hud = null;
        this.statusText = null;
        this.score = 0;
        this.outcome = null; // null | 'win' | 'lose'
        this.surviveTimer = 0;
        this.isEngineReady = false;
        this.registeredTextureKeys = {};
      },

      init: function () {
        var self = this;
        window.addEventListener("message", function (event) {
          var data = event && event.data;
          if (data && data.type === "UPDATE_GAME_STATE_JSON" && data.payload) {
            if (self.isEngineReady) self.hotReloadEngineState(data.payload);
            else self.pendingConfig = data.payload;
          }
        });
      },

      preload: function () {
        this.load.image("default_player", DEFAULT_PLAYER);
        this.load.image("default_wall", DEFAULT_WALL);
      },

      create: function () {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
          up: Phaser.Input.Keyboard.KeyCodes.W,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D,
        });

        this.wallsGroup = this.physics.add.staticGroup();
        this.collectiblesGroup = this.physics.add.group();
        this.enemiesGroup = this.physics.add.group();

        this.hud = this.add
          .text(12, 10, "", {
            fontFamily: "monospace",
            fontSize: "16px",
            color: "#ffffff",
          })
          .setScrollFactor(0)
          .setDepth(1000);

        this.statusText = this.add
          .text(0, 0, "", {
            fontFamily: "monospace",
            fontSize: "28px",
            color: "#ffffff",
            align: "center",
            backgroundColor: "rgba(0,0,0,0.55)",
            padding: { x: 18, y: 12 },
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(1001)
          .setVisible(false);

        // Restart on R after a win/lose.
        this.input.keyboard.on("keydown-R", () => {
          if (this.outcome && this.gameStateConfig) {
            this.hotReloadEngineState(this.gameStateConfig);
          }
        });

        this.isEngineReady = true;
        if (boot) boot.style.display = "none";
        post({ type: "ENGINE_READY" });

        if (this.pendingConfig) {
          var pending = this.pendingConfig;
          this.pendingConfig = null;
          this.hotReloadEngineState(pending);
        }
      },

      // Build a solid-color texture on the fly for sprites that have no PNG.
      makeColorTexture: function (key, color, w, h) {
        if (this.textures.exists(key)) this.textures.remove(key);
        var g = this.make.graphics({ x: 0, y: 0, add: false });
        var col = Phaser.Display.Color.HexStringToColor(color || "#ffffff").color;
        g.fillStyle(col, 1);
        g.fillRoundedRect(0, 0, w, h, Math.min(8, w / 4));
        g.lineStyle(2, 0xffffff, 0.25);
        g.strokeRoundedRect(1, 1, w - 2, h - 2, Math.min(8, w / 4));
        g.generateTexture(key, w, h);
        g.destroy();
      },

      // Collect every sprite that needs a remote PNG load, queue them, and call
      // done() once the loader settles (or immediately if nothing to load).
      ensureTextures: function (config, done) {
        var self = this;
        var tile = (config.map && config.map.tileGridSize) || 32;
        var toLoad = [];
        var colorMade = {};

        function consider(sprite, fallbackColor, fallbackSize) {
          if (!sprite || !sprite.key) return;
          var w = sprite.width || fallbackSize || tile;
          var h = sprite.height || fallbackSize || tile;
          if (sprite.url) {
            if (!self.textures.exists(sprite.key)) {
              toLoad.push({ key: sprite.key, url: sprite.url });
            }
          } else if (sprite.color && !colorMade[sprite.key]) {
            self.makeColorTexture(sprite.key, sprite.color, w, h);
            colorMade[sprite.key] = true;
          }
        }

        if (config.player) consider(config.player.sprite, "#5b8cff", tile);
        if (config.map) consider(config.map.wallSprite, "#3a4055", tile);
        (config.collectibles || []).forEach(function (c) {
          consider(c.sprite, "#ffd166", Math.round(tile * 0.6));
        });
        (config.enemies || []).forEach(function (e) {
          consider(e.sprite, "#ef476f", tile);
        });
        (config.sprites || []).forEach(function (s) {
          consider(s, "#9b8cff", tile);
        });

        if (!toLoad.length) {
          done();
          return;
        }

        toLoad.forEach(function (item) {
          self.load.image(item.key, item.url);
        });
        this.load.once("complete", function () {
          done();
        });
        // Swallow individual load failures so one bad asset URL can't wedge the build.
        this.load.once("loaderror", function (file) {
          if (!self.textures.exists(file.key)) {
            self.makeColorTexture(file.key, "#9b8cff", tile, tile);
          }
        });
        this.load.start();
      },

      hotReloadEngineState: function (config) {
        if (!this.isEngineReady || !config) return;
        var self = this;
        this.ensureTextures(config, function () {
          self.buildScene(config);
        });
      },

      buildScene: function (config) {
        this.gameStateConfig = config;
        this.outcome = null;
        this.score = 0;
        this.surviveTimer = 0;
        if (this.statusText) this.statusText.setVisible(false);

        // Reset dynamic objects.
        if (this.playerInstance) {
          this.playerInstance.destroy();
          this.playerInstance = null;
        }
        this.wallsGroup.clear(true, true);
        this.collectiblesGroup.clear(true, true);
        this.enemiesGroup.clear(true, true);
        if (this.goalZone) {
          this.goalZone.destroy();
          this.goalZone = null;
        }

        var map = config.map || { tileGridSize: 32, layout: [] };
        var defaults = config.defaults || {};
        var layout = Array.isArray(map.layout) ? map.layout : [];
        var tile = map.tileGridSize || 32;
        var rows = layout.length || 1;
        var cols = layout.reduce(function (m, r) {
          return Math.max(m, (r && r.length) || 0);
        }, 1);
        var worldW = cols * tile;
        var worldH = rows * tile;

        this.cameras.main.setBackgroundColor(map.background || "#0e1118");
        this.physics.world.setBounds(0, 0, worldW, worldH);
        this.cameras.main.setBounds(0, 0, worldW, worldH);
        this.scale.resize(worldW, worldH);
        this.scale.setGameSize(worldW, worldH);

        var wallKey =
          map.wallSprite && map.wallSprite.key ? map.wallSprite.key : "default_wall";

        // Tiles + tile-embedded spawns.
        var tileCollectibles = [];
        var tileEnemies = [];
        var goalCell = null;
        for (var row = 0; row < layout.length; row++) {
          var line = layout[row] || [];
          for (var col = 0; col < line.length; col++) {
            var cx = col * tile + tile / 2;
            var cy = row * tile + tile / 2;
            var code = line[col];
            if (code === 2) {
              this.wallsGroup
                .create(cx, cy, wallKey)
                .setDisplaySize(tile, tile)
                .refreshBody();
            } else if (code === 3) {
              tileCollectibles.push({ x: cx, y: cy });
            } else if (code === 4) {
              tileEnemies.push({ x: cx, y: cy });
            } else if (code === 5) {
              goalCell = { x: cx, y: cy };
            }
          }
        }

        // Collectibles (explicit list + tile spawns).
        var self = this;
        var cSize = Math.round(tile * 0.6);
        (config.collectibles || []).forEach(function (c) {
          self.spawnCollectible(
            c.x,
            c.y,
            c.sprite && c.sprite.key ? c.sprite.key : null,
            c.value || 1,
            cSize
          );
        });
        tileCollectibles.forEach(function (c) {
          self.spawnCollectible(c.x, c.y, defaults.collectibleKey || null, 1, cSize);
        });

        // Enemies (explicit list + tile spawns).
        (config.enemies || []).forEach(function (e) {
          self.spawnEnemy(e.startX, e.startY, e, tile);
        });
        tileEnemies.forEach(function (e) {
          self.spawnEnemy(
            e.x,
            e.y,
            { behavior: "patrol", speed: 90, sprite: defaults.enemyKey ? { key: defaults.enemyKey } : null },
            tile
          );
        });

        // Goal zone for reach-goal games.
        if (goalCell) {
          this.goalZone = this.add.rectangle(
            goalCell.x,
            goalCell.y,
            tile,
            tile,
            0x06d6a0,
            0.35
          );
          this.physics.add.existing(this.goalZone, true);
        }

        // Player.
        var p = config.player || { startX: worldW / 2, startY: worldH / 2, speed: 220 };
        var playerKey =
          p.sprite && p.sprite.key ? p.sprite.key : "default_player";
        this.playerInstance = this.physics.add.sprite(
          p.startX != null ? p.startX : worldW / 2,
          p.startY != null ? p.startY : worldH / 2,
          playerKey
        );
        this.playerInstance.setDisplaySize(tile * 0.8, tile * 0.8);
        this.playerInstance.setCollideWorldBounds(true);
        this.cameras.main.startFollow(this.playerInstance, true, 0.1, 0.1);

        // Physics relationships.
        this.physics.add.collider(this.playerInstance, this.wallsGroup);
        this.physics.add.collider(this.enemiesGroup, this.wallsGroup);
        this.physics.add.overlap(
          this.playerInstance,
          this.collectiblesGroup,
          this.onCollect,
          null,
          this
        );
        this.physics.add.overlap(
          this.playerInstance,
          this.enemiesGroup,
          this.onHitEnemy,
          null,
          this
        );
        if (this.goalZone) {
          this.physics.add.overlap(
            this.playerInstance,
            this.goalZone,
            this.onReachGoal,
            null,
            this
          );
        }

        this.updateHud();
      },

      spawnCollectible: function (x, y, key, value, size) {
        var useKey = key || "__collectible_default";
        if (!this.textures.exists(useKey)) {
          this.makeColorTexture(useKey, "#ffd166", size, size);
        }
        var c = this.collectiblesGroup.create(x, y, useKey);
        c.setDisplaySize(size, size);
        c.value = value;
        if (c.body) c.body.setAllowGravity(false);
        this.tweens.add({
          targets: c,
          scale: { from: c.scale * 0.85, to: c.scale * 1.0 },
          yoyo: true,
          repeat: -1,
          duration: 600,
        });
        return c;
      },

      spawnEnemy: function (x, y, def, tile) {
        var key = def && def.sprite && def.sprite.key ? def.sprite.key : "__enemy_default";
        if (!this.textures.exists(key)) {
          this.makeColorTexture(key, "#ef476f", tile, tile);
        }
        var e = this.enemiesGroup.create(x, y, key);
        e.setDisplaySize(tile * 0.8, tile * 0.8);
        e.behavior = (def && def.behavior) || "patrol";
        e.speed = (def && def.speed) || 90;
        e.setCollideWorldBounds(true);
        e.setBounce(1);
        if (e.body) e.body.setAllowGravity(false);
        if (e.behavior === "patrol") {
          e.setVelocity(
            Phaser.Math.Between(-1, 1) * e.speed || e.speed,
            Phaser.Math.Between(-1, 1) * e.speed
          );
        }
        return e;
      },

      onCollect: function (player, item) {
        this.score += item.value || 1;
        item.destroy();
        post({ type: "GAME_EVENT", event: "score", score: this.score });
        this.cameras.main.shake(80, 0.004);
        this.updateHud();
        var settings = this.gameStateConfig.settings || {};
        if (
          settings.winCondition === "collect-all" &&
          this.collectiblesGroup.countActive(true) === 0
        ) {
          this.endGame("win");
        }
      },

      onHitEnemy: function () {
        if (this.outcome) return;
        this.endGame("lose");
      },

      onReachGoal: function () {
        if (this.outcome) return;
        var settings = this.gameStateConfig.settings || {};
        if (settings.winCondition === "reach-goal") this.endGame("win");
      },

      endGame: function (outcome) {
        if (this.outcome) return;
        this.outcome = outcome;
        if (this.playerInstance && this.playerInstance.body) {
          this.playerInstance.setVelocity(0, 0);
        }
        this.enemiesGroup.children.iterate(function (e) {
          if (e && e.body) e.setVelocity(0, 0);
        });
        var cam = this.cameras.main;
        this.statusText
          .setPosition(cam.width / 2, cam.height / 2)
          .setText(
            (outcome === "win" ? "You win! 🎉" : "Game over") + "\nPress R to restart"
          )
          .setVisible(true);
        if (outcome === "win") this.cameras.main.flash(250, 6, 214, 160);
        else this.cameras.main.shake(250, 0.01);
        post({ type: "GAME_EVENT", event: outcome, score: this.score });
      },

      updateHud: function () {
        if (!this.hud) return;
        var settings = (this.gameStateConfig && this.gameStateConfig.settings) || {};
        var parts = ["Score: " + this.score];
        if (settings.winCondition === "collect-all") {
          parts.push("Left: " + this.collectiblesGroup.countActive(true));
        } else if (settings.winCondition === "survive" && settings.surviveSeconds) {
          parts.push(
            "Survive: " +
              Math.max(0, Math.ceil(settings.surviveSeconds - this.surviveTimer)) +
              "s"
          );
        }
        this.hud.setText(parts.join("    "));
      },

      update: function (time, delta) {
        if (!this.playerInstance || !this.gameStateConfig || this.outcome) return;
        var dt = delta / 1000;
        var speed = (this.gameStateConfig.player && this.gameStateConfig.player.speed) || 200;
        var c = this.cursors;
        var w = this.wasd;
        var vx = 0;
        var vy = 0;
        if (c.left.isDown || w.left.isDown) vx = -speed;
        else if (c.right.isDown || w.right.isDown) vx = speed;
        if (c.up.isDown || w.up.isDown) vy = -speed;
        else if (c.down.isDown || w.down.isDown) vy = speed;
        this.playerInstance.setVelocity(vx, vy);

        // Enemy AI.
        var player = this.playerInstance;
        this.enemiesGroup.children.iterate(function (e) {
          if (!e || !e.body) return;
          if (e.behavior === "chase") {
            this.physics.moveToObject(e, player, e.speed);
          } else if (e.behavior === "static") {
            e.setVelocity(0, 0);
          }
          // patrol enemies keep their bounce velocity.
        }, this);

        // Survive timer.
        var settings = this.gameStateConfig.settings || {};
        if (settings.winCondition === "survive" && settings.surviveSeconds) {
          this.surviveTimer += dt;
          if (this.surviveTimer >= settings.surviveSeconds) this.endGame("win");
        }
        this.updateHud();
      },
    });

    var config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: "game-canvas-container",
      backgroundColor: "#0e1118",
      physics: {
        default: "arcade",
        arcade: { gravity: { y: 0 }, debug: false },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [DeclarativeRunner],
    };

    // eslint-disable-next-line no-new
    new Phaser.Game(config);
  }

  // Phaser may already be present (cached) or still loading.
  if (window.__phaserLoaded || typeof Phaser !== "undefined") {
    start();
  } else {
    var tries = 0;
    var poll = setInterval(function () {
      tries++;
      if (typeof Phaser !== "undefined") {
        clearInterval(poll);
        start();
      } else if (tries > 100) {
        clearInterval(poll);
        bootError("Game engine took too long to load. Reload to try again.");
      }
    }, 100);
  }
})();
