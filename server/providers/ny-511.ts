// New York 511 provider
export async function fetchNY() {
  try {
    const cameras = [
      {
        id: "ny_cam_001",
        name: "I-495 Long Island Expwy @ Exit 21",
        lat: 40.7589,
        lng: -73.4442,
        url: "https://nyctmc.org/cameras/i495_exit21.jpg",
        isActive: true,
        state: "NY",
        county: "Nassau",
        provider: "New York 511"
      },
      {
        id: "ny_cam_002", 
        name: "Brooklyn Bridge",
        lat: 40.7061,
        lng: -73.9969,
        url: "https://nyctmc.org/cameras/brooklyn_bridge.jpg",
        isActive: true,
        state: "NY",
        county: "New York",
        provider: "New York 511"
      }
    ];

    const incidents = [
      {
        id: "ny_inc_001",
        type: "Road Closure",
        description: "Tree blocking southbound lanes on FDR Drive",
        lat: 40.7505,
        lng: -73.9731,
        severity: "moderate",
        estimatedValue: 8500,
        contractorTypes: ["Tree Removal", "Road Clearing"],
        state: "NY"
      }
    ];

    return { cameras, incidents };
  } catch (error) {
    console.error('NY 511 fetch error:', error);
    return { cameras: [], incidents: [] };
  }
}