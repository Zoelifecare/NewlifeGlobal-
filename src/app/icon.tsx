import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon cropped from the official New Life logo file (the cross mark is the left ~101px of the 300×101 lockup). */
export default async function Icon() {
  const png = await readFile(path.join(process.cwd(), "public/media/brand/nlc-logo-color.png"));
  const src = `data:image/png;base64,${png.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: 64, height: 64, display: "flex", overflow: "hidden", background: "#ffffff", borderRadius: 12, alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={190} height={64} style={{ marginLeft: 0 }} />
      </div>
    ),
    size,
  );
}
