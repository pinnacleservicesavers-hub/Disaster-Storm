// Texas DOT provider
export async function fetchTX() {
  try {
    const cameras = [
      {
        id: "tx_cam_001",
        name: "I-35 @ US-290 (Austin)",
        lat: 30.2849,
        lng: -97.7341,
        url: "https://its.txdot.gov/cameras/i35_us290.jpg",
        isActive: true,
        state: "TX",
        county: "Travis",
        provider: "Texas DOT"
      },
      {
        id: "tx_cam_002",
        name: "I-45 @ Beltway 8 (Houston)",
        lat: 29.6781,
        lng: -95.2104,
        url: "https://its.txdot.gov/cameras/i45_beltway8.jpg",
        isActive: true,
        state: "TX",
        county: "Harris",
        provider: "Texas DOT"
      }
    ];

    const incidents = [
      {
        id: "tx_inc_001",
        type: "Vehicle Accident",
        description: "Multi-vehicle accident blocking 3 lanes on I-35 northbound near Exit 247",
        lat: 30.3077,
        lng: -97.7431,
        severity: "severe",
        estimatedValue: 15000,
        contractorTypes: ["Towing", "Debris Cleanup", "Traffic Control"],
        state: "TX"
      }
    ];

    return { cameras, incidents };
  } catch (error) {
    console.error('TX DOT fetch error:', error);
    return { cameras: [], incidents: [] };
  }
}