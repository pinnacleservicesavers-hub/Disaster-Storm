// Florida 511 provider
export async function fetchFL() {
  try {
    const cameras = [
      {
        id: "fl_cam_001",
        name: "I-95 @ SR-836 (Dolphin Expressway)",
        lat: 25.7743,
        lng: -80.2105,
        url: "https://fl511.com/cameras/i95_sr836.jpg",
        isActive: true,
        state: "FL",
        county: "Miami-Dade",
        provider: "Florida 511"
      },
      {
        id: "fl_cam_002",
        name: "I-4 @ US-192 (Disney Area)",
        lat: 28.3200,
        lng: -81.5912,
        url: "https://fl511.com/cameras/i4_us192.jpg", 
        isActive: true,
        state: "FL",
        county: "Orange",
        provider: "Florida 511"
      }
    ];

    const incidents = [
      {
        id: "fl_inc_001",
        type: "Storm Damage",
        description: "Hurricane debris blocking multiple lanes on I-75 southbound",
        lat: 26.1224,
        lng: -81.7943,
        severity: "critical",
        estimatedValue: 25000,
        contractorTypes: ["Storm Cleanup", "Debris Removal", "Emergency Response"],
        state: "FL"
      }
    ];

    return { cameras, incidents };
  } catch (error) {
    console.error('FL 511 fetch error:', error);
    return { cameras: [], incidents: [] };
  }
}