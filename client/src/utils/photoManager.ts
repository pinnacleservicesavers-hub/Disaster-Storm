// Photo Management System for Service Category Backgrounds
// Maps service categories to their corresponding background photos

export interface ServicePhoto {
  category: string;
  photos: string[];
  fallbackIcon: string;
}

// Import all our real photos
import hotelPhoto1 from "@assets/stock_images/modern_emergency_dis_40a02e41.jpg";
import hotelPhoto2 from "@assets/stock_images/modern_emergency_dis_4eaf7a35.jpg";
import gasPhoto1 from "@assets/stock_images/gas_station_fuel_pum_9aa81689.jpg";
import gasPhoto2 from "@assets/stock_images/gas_station_fuel_pum_f072a6c7.jpg";
import hardwarePhoto1 from "@assets/stock_images/hardware_store_tools_43403a06.jpg";
import hardwarePhoto2 from "@assets/stock_images/hardware_store_tools_ceaf26b7.jpg";
import shelterPhoto1 from "@assets/stock_images/emergency_shelter_di_0984e808.jpg";
import shelterPhoto2 from "@assets/stock_images/emergency_shelter_di_22d48713.jpg";
import femaPhoto1 from "@assets/stock_images/fema_emergency_respo_7fbec867.jpg";
import femaPhoto2 from "@assets/stock_images/fema_emergency_respo_ad5e1c3b.jpg";
import satellitePhoto1 from "@assets/stock_images/satellite_communicat_b643663d.jpg";
import satellitePhoto2 from "@assets/stock_images/satellite_communicat_91331028.jpg";
import alertPhoto1 from "@assets/stock_images/disaster_alert_warni_5e4a5268.jpg";
import alertPhoto2 from "@assets/stock_images/disaster_alert_warni_0bdea3b9.jpg";

// Service category photo mappings
export const SERVICE_PHOTOS: Record<string, ServicePhoto> = {
  hotels: {
    category: "hotels",
    photos: [hotelPhoto1, hotelPhoto2],
    fallbackIcon: "🏨"
  },
  gas: {
    category: "gas",
    photos: [gasPhoto1, gasPhoto2],
    fallbackIcon: "⛽"
  },
  hardware: {
    category: "hardware",
    photos: [hardwarePhoto1, hardwarePhoto2],
    fallbackIcon: "🛠️"
  },
  shelters: {
    category: "shelters",
    photos: [shelterPhoto1, shelterPhoto2],
    fallbackIcon: "🏠"
  },
  fema: {
    category: "fema",
    photos: [femaPhoto1, femaPhoto2],
    fallbackIcon: "🏘"
  },
  satellite: {
    category: "satellite",
    photos: [satellitePhoto1, satellitePhoto2],
    fallbackIcon: "📡"
  },
  alerts: {
    category: "alerts",
    photos: [alertPhoto1, alertPhoto2],
    fallbackIcon: "⚠️"
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