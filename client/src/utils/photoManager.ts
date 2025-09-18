// Photo Management System for Service Category Backgrounds
// Maps service categories to their corresponding background photos

export interface ServicePhoto {
  category: string;
  photos: string[];
  fallbackIcon: string;
}

// Import all our stunning AI-generated photos designed specifically for disaster management
import hotelPhoto1 from "@assets/generated_images/Emergency_Relief_Hotel_Exterior_a1019bef.png";
import gasPhoto1 from "@assets/generated_images/Emergency_Fuel_Station_Scene_6efc907f.png";
import hardwarePhoto1 from "@assets/generated_images/Emergency_Hardware_Store_Interior_35b85708.png";
import shelterPhoto1 from "@assets/generated_images/Emergency_Shelter_Relief_Center_57584237.png";
import femaPhoto1 from "@assets/generated_images/FEMA_Emergency_Relief_Center_53ba829a.png";
import satellitePhoto1 from "@assets/generated_images/Emergency_Satellite_Communication_Hub_c1f4d455.png";
import alertPhoto1 from "@assets/generated_images/Emergency_Alert_Command_Center_c21fdabd.png";

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