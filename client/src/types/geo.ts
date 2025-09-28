export type LatLng = { lat: number; lng: number };

export type Lead = {
  id: string;
  address: string;
  location: LatLng; // geocoded lat/lng
  priority: "TREE_ON_HOME" | "TREE_ON_BUILDING" | "TREE_ON_STRUCTURE" | "CAR_ON_HOUSE" | "OTHER";
};

export type Contractor = {
  id: string; 
  name: string; 
  location: LatLng;
};

export type RankedLead = Lead & { 
  bestContractorId: string; 
  etaSec: number; 
  distanceMeters: number 
};