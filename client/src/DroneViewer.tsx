import React from "react";

type Props = { streamUrl: string };

export default function DroneViewer({ streamUrl }: Props) {
  return (
    <div style={{ width: "100%", maxWidth: 1000, margin: "20px auto" }}>
      <h2 style={{ marginBottom: 12 }}>Live Stream</h2>
      <div
        style={{
          position: "relative",
          paddingTop: "56.25%",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <iframe
          src={streamUrl}
          title="Drone Stream"
          allow="autoplay; fullscreen; picture-in-picture"
          frameBorder="0"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}
