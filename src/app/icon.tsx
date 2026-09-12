import { ImageResponse } from "next/og";

export const contentType = "image/png";

const SIZES = [
  { id: "32", size: 32 },
  { id: "192", size: 192 },
  { id: "512", size: 512 },
];

export function generateImageMetadata() {
  return SIZES.map(({ id, size }) => ({
    id,
    size: { width: size, height: size },
    contentType,
  }));
}

export default function Icon({ id }: { id: string }) {
  const size = SIZES.find((entry) => entry.id === id)?.size ?? 32;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f6e5c",
          borderRadius: size >= 192 ? size * 0.22 : 6,
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: size * 0.56,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          h
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
