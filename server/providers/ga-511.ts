// Georgia DOT provider
export async function fetchGA() {
  try {
    const cameras = [
      {
        id: "ga_cam_001",
        name: "I-285 @ US-78 (Stone Mountain Freeway)",
        lat: 33.8176,
        lng: -84.2861,
        url: "https://511ga.org/cameras/i285_us78.jpg",
        isActive: true,
        state: "GA",
        county: "DeKalb",
        provider: "Georgia DOT"
      },
      {
        id: "ga_cam_002",
        name: "I-75 @ I-285 Interchange", 
        lat: 33.8870,
        lng: -84.4632,
        url: "https://511ga.org/cameras/i75_i285.jpg",
        isActive: true,
        state: "GA",
        county: "Fulton",
        provider: "Georgia DOT"
      }
    ];

    const incidents = [
      {
        id: "ga_inc_001",
        type: "Tree Down",
        description: "Large tree blocking 2 lanes on I-85 northbound near Exit 102",
        lat: 33.8651,
        lng: -84.3797,
        severity: "severe",
        estimatedValue: 12500,
        contractorTypes: ["Tree Removal", "Road Clearing", "Traffic Control"],
        state: "GA"
      }
    ];

    return { cameras, incidents };
  } catch (error) {
    console.error('GA DOT fetch error:', error);
    return { cameras: [], incidents: [] };
  }
}