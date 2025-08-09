import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: { path: string[] } },
) {
  const segments = (await context.params).path || [];
  if (segments.length === 0) {
    return new Response("Missing file path", { status: 400 });
  }

  // Prevent path traversal by normalizing and ensuring within base directory
  const fileRelativePath = segments.join("/");
  const baseDir = path.join(process.cwd(), "data", "VRMmodels");
  const resolvedPath = path.join(baseDir, fileRelativePath);

  if (!resolvedPath.startsWith(baseDir)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const data = await fs.promises.readFile(resolvedPath);
    const headers = new Headers();
    const ext = path.extname(resolvedPath).toLowerCase();
    // VRM and VRMA are GLB-based; serve as glTF binary for better loader compatibility
    if (ext === ".vrm" || ext === ".vrma" || ext === ".glb") {
      headers.set("Content-Type", "model/gltf-binary");
    } else if (ext === ".gltf") {
      headers.set("Content-Type", "model/gltf+json");
    } else {
      headers.set("Content-Type", "application/octet-stream");
    }
    headers.set("Cache-Control", "public, max-age=3600, immutable");
    return new Response(data, { status: 200, headers });
  } catch (error: any) {
    if (error && error.code === "ENOENT") {
      return new Response("Not found", { status: 404 });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
