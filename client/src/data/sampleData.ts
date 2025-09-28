import { Contractor, Lead } from '@/types/geo';

// Sample contractors for testing lead ranking system
export const sampleContractors: Contractor[] = [
  {
    id: "contractor-1",
    name: "Storm Response Georgia",
    location: { lat: 32.4609, lng: -84.9877 } // Columbus, GA
  },
  {
    id: "contractor-2", 
    name: "Emergency Roofing Atlanta",
    location: { lat: 33.7490, lng: -84.3880 } // Atlanta, GA
  },
  {
    id: "contractor-3",
    name: "Rapid Recovery Alabama", 
    location: { lat: 32.3617, lng: -86.2792 } // Montgomery, AL
  },
  {
    id: "contractor-4",
    name: "Hurricane Helpers FL",
    location: { lat: 30.4383, lng: -84.2807 } // Tallahassee, FL
  }
];

// Sample storm-damaged properties requiring immediate attention
export const sampleLeads: Lead[] = [
  {
    id: "lead-1",
    address: "1234 Peachtree St, Atlanta, GA 30309",
    location: { lat: 33.7701, lng: -84.3820 },
    priority: "TREE_ON_HOME"
  },
  {
    id: "lead-2", 
    address: "5678 Main St, Columbus, GA 31901",
    location: { lat: 32.4851, lng: -84.9549 },
    priority: "TREE_ON_BUILDING"
  },
  {
    id: "lead-3",
    address: "9012 Oak Ave, Montgomery, AL 36104", 
    location: { lat: 32.3792, lng: -86.3009 },
    priority: "CAR_ON_HOUSE"
  },
  {
    id: "lead-4",
    address: "3456 Pine Rd, Tallahassee, FL 32301",
    location: { lat: 30.4518, lng: -84.2742 },
    priority: "TREE_ON_STRUCTURE"
  },
  {
    id: "lead-5",
    address: "7890 Elm Dr, Valdosta, GA 31601",
    location: { lat: 30.8327, lng: -83.2785 },
    priority: "OTHER"
  },
  {
    id: "lead-6",
    address: "2468 Maple St, Macon, GA 31201", 
    location: { lat: 32.8407, lng: -83.6324 },
    priority: "TREE_ON_HOME"
  }
];