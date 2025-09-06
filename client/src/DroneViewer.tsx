interface DroneViewerProps {
  streamUrl: string;
}

export default function DroneViewer({ streamUrl }: DroneViewerProps) {
  return (
    <iframe
      src={streamUrl}
      style={{
        width: "100%",
        height: "450px",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        boxSizing: "border-box",
      }}
      allowFullScreen
      title="Drone Live Stream"
    />
  );
}