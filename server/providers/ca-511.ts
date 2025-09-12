// California 511 provider
export async function fetchCA() {
  try {
    const cameras = [
      {
        id: "ca_cam_001",
        name: "US-101 @ I-80 Bay Bridge Approach",
        lat: 37.8077,
        lng: -122.4176,
        url: "https://api.511.org/cameras/us101_i80.jpg",
        isActive: true,
        state: "CA",
        county: "San Francisco",
        provider: "California 511"
      },
      {
        id: "ca_cam_002",
        name: "I-405 @ LAX Airport",
        lat: 33.9425,
        lng: -118.4081,
        url: "https://api.511.org/cameras/i405_lax.jpg",
        isActive: true,
        state: "CA",
        county: "Los Angeles",
        provider: "California 511"
      }
    ];

    const incidents = [
      {
        id: "ca_inc_001",
        type: "Wildfire Damage",
        description: "Fire damage to guardrails and signage on Highway 1 near Malibu",
        lat: 34.0259,
        lng: -118.7798,
        severity: "critical",
        estimatedValue: 35000,
        contractorTypes: ["Fire Damage Repair", "Guardrail Replacement", "Sign Installation"],
        state: "CA"
      }
    ];

    return { cameras, incidents };
  } catch (error) {
    console.error('CA 511 fetch error:', error);
    return { cameras: [], incidents: [] };
  }
}