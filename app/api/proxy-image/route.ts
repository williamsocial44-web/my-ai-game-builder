import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Server-side image proxy → Base64 Data URI.
 *
 * Generated fal.ai sprites live on a remote CDN. Drawing them onto a game canvas
 * directly would taint it (CORS) and would leave an external URL in an otherwise
 * self-contained game. We fetch the image here and hand back a `data:` URI so the
 * sprite can be embedded inline — no CORS, no external references in the export.
 */
export async function POST(req: Request) {
  let body: { imageUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const imageUrl = body.imageUrl;
  if (!imageUrl || typeof imageUrl !== "string" || !/^https?:\/\//i.test(imageUrl)) {
    return NextResponse.json({ error: "A valid http(s) imageUrl is required." }, { status: 400 });
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Upstream returned ${res.status}`);

    const contentType = res.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) throw new Error("That URL is not an image.");

    const buf = Buffer.from(await res.arrayBuffer());
    // Guardrail: refuse anything implausibly large for a sprite (~8 MB).
    if (buf.length > 8 * 1024 * 1024) throw new Error("Image is too large to inline.");

    const dataUri = `data:${contentType};base64,${buf.toString("base64")}`;
    return NextResponse.json({ dataUri, bytes: buf.length });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message || "Failed to fetch image." },
      { status: 502 }
    );
  }
}
