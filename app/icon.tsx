import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 32, height: 32 };

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          backgroundColor: "#0a0a0a",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontWeight: "bold",
          fontSize: 14,
          color: "#22c55e",
        }}
      >
        TL
      </div>
    ),
    { ...size }
  );
}
