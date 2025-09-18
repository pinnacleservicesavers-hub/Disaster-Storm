// Photo Management System for Service Category Backgrounds
// Maps service categories to their corresponding background photos

export interface ServicePhoto {
  category: string;
  photos: string[];
  fallbackIcon: string;
}

// Import all our stunning photos designed specifically for disaster management
import hotelPhoto1 from "@assets/stock_images/modern_emergency_dis_40a02e41.jpg";
import gasPhoto1 from "@assets/stock_images/gas_station_fuel_pum_9aa81689.jpg";
import hardwarePhoto1 from "@assets/stock_images/hardware_store_tools_43403a06.jpg";
import shelterPhoto1 from "@assets/stock_images/emergency_shelter_di_0984e808.jpg";
import femaPhoto1 from "@assets/stock_images/fema_emergency_respo_7fbec867.jpg";
import satellitePhoto1 from "@assets/stock_images/satellite_communicat_b643663d.jpg";
import alertPhoto1 from "@assets/stock_images/disaster_alert_warni_5e4a5268.jpg";

// Storm aftermath and community photos for StormShare
import stormDamage1 from "@assets/stock_images/storm_damage_trees_f_5ca3f1b8.jpg";
import stormDamage2 from "@assets/stock_images/storm_damage_trees_f_41db1547.jpg";
import stormDamage3 from "@assets/stock_images/storm_damage_trees_f_4e8100c9.jpg";
import hurricaneAftermath1 from "@assets/stock_images/hurricane_aftermath__672e4c6f.jpg";
import hurricaneAftermath2 from "@assets/stock_images/hurricane_aftermath__e986e410.jpg";
import stormCommunity1 from "@assets/stock_images/storm_community_neig_d4e087df.jpg";
import stormCommunity2 from "@assets/stock_images/storm_community_neig_7ce233fc.jpg";

// Service category photo mappings with stunning AI-generated images
export const SERVICE_PHOTOS: Record<string, ServicePhoto> = {
  hotels: {
    category: "hotels",
    photos: [hotelPhoto1],
    fallbackIcon: "🏨"
  },
  gas: {
    category: "gas",
    photos: [gasPhoto1],
    fallbackIcon: "⛽"
  },
  hardware: {
    category: "hardware",
    photos: [hardwarePhoto1],
    fallbackIcon: "🛠️"
  },
  shelters: {
    category: "shelters",
    photos: [shelterPhoto1],
    fallbackIcon: "🏠"
  },
  fema: {
    category: "fema",
    photos: [femaPhoto1],
    fallbackIcon: "🏘"
  },
  satellite: {
    category: "satellite",
    photos: [satellitePhoto1],
    fallbackIcon: "📡"
  },
  alerts: {
    category: "alerts",
    photos: [alertPhoto1],
    fallbackIcon: "⚠️"
  },
  stormshare: {
    category: "stormshare",
    photos: [stormDamage1, stormDamage2, stormDamage3, hurricaneAftermath1, hurricaneAftermath2, stormCommunity1, stormCommunity2],
    fallbackIcon: "🌪️"
  }
};

/**
 * Get a random photo for a service category
 */
export function getServicePhoto(category: string): string {
  const servicePhotos = SERVICE_PHOTOS[category];
  if (!servicePhotos || servicePhotos.photos.length === 0) {
    return '';
  }
  
  // Return random photo from the category
  const randomIndex = Math.floor(Math.random() * servicePhotos.photos.length);
  return servicePhotos.photos[randomIndex];
}

/**
 * Get the first photo for a service category (consistent choice)
 */
export function getPrimaryServicePhoto(category: string): string {
  const servicePhotos = SERVICE_PHOTOS[category];
  if (!servicePhotos || servicePhotos.photos.length === 0) {
    return '';
  }
  
  return servicePhotos.photos[0];
}

/**
 * Get all photos for a service category
 */
export function getAllServicePhotos(category: string): string[] {
  const servicePhotos = SERVICE_PHOTOS[category];
  if (!servicePhotos) {
    return [];
  }
  
  return servicePhotos.photos;
}

/**
 * Get fallback icon for a service category
 */
export function getServiceIcon(category: string): string {
  const servicePhotos = SERVICE_PHOTOS[category];
  if (!servicePhotos) {
    return "📍";
  }
  
  return servicePhotos.fallbackIcon;
}

/**
 * Check if a service category has photos available
 */
export function hasServicePhotos(category: string): boolean {
  const servicePhotos = SERVICE_PHOTOS[category];
  return !!(servicePhotos && servicePhotos.photos.length > 0);
}