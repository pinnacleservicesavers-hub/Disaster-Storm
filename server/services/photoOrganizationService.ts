import path from 'path';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';

export interface PhotoMetadata {
  id: string;
  fileName: string;
  originalName: string;
  customerName: string;
  jobAddress: string;
  location?: string;
  jobId?: string;
  dateTaken: Date;
  tags: string[];
  description?: string;
  aiAnalysis?: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
  };
  fileSize: number;
  mimeType: string;
  storagePath: string;
  thumbnailPath?: string;
  isEditable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhotoEditRequest {
  photoId: string;
  customerName?: string;
  jobAddress?: string;
  location?: string;
  jobId?: string;
  description?: string;
  tags?: string[];
  fileName?: string;
}

export class PhotoOrganizationService {
  private readonly baseStoragePath: string;
  private readonly photoMetadataMap: Map<string, PhotoMetadata> = new Map();

  constructor(baseStoragePath: string = './uploads/photos') {
    this.baseStoragePath = baseStoragePath;
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      await fs.access(this.baseStoragePath);
    } catch {
      await fs.mkdir(this.baseStoragePath, { recursive: true });
    }
  }

  /**
   * Generate smart folder structure: /Photos/YEAR/CITY_STATE/CustomerName_Address/
   */
  private generateFolderPath(customerName: string, jobAddress: string, dateTaken: Date): string {
    const year = dateTaken.getFullYear();
    
    // Extract city/state from address (basic parsing)
    const addressParts = jobAddress.split(',').map(part => part.trim());
    let location = 'Unknown_Location';
    
    if (addressParts.length >= 2) {
      const city = addressParts[addressParts.length - 2].replace(/\s+/g, '_');
      const state = addressParts[addressParts.length - 1].replace(/\s+/g, '_');
      location = `${city}_${state}`;
    }

    // Clean customer name and address for folder naming
    const cleanCustomerName = customerName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    const cleanAddress = addressParts[0]?.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') || 'Unknown_Address';
    
    const customerFolder = `${cleanCustomerName}_${cleanAddress}`;
    
    return path.join(this.baseStoragePath, year.toString(), location, customerFolder);
  }

  /**
   * Automatically organize and store uploaded photo
   */
  async organizePhoto(
    fileBuffer: Buffer,
    fileName: string,
    customerName: string,
    jobAddress: string,
    options: {
      jobId?: string;
      description?: string;
      aiAnalysis?: string;
      gpsCoordinates?: { latitude: number; longitude: number };
      mimeType?: string;
      additionalTags?: string[];
    } = {}
  ): Promise<PhotoMetadata> {
    const photoId = nanoid();
    const dateTaken = new Date();
    const folderPath = this.generateFolderPath(customerName, jobAddress, dateTaken);
    
    // Ensure folder exists
    await fs.mkdir(folderPath, { recursive: true });
    
    // Generate unique filename to avoid conflicts
    const fileExt = path.extname(fileName);
    const baseName = path.basename(fileName, fileExt);
    const uniqueFileName = `${baseName}_${photoId}${fileExt}`;
    const storagePath = path.join(folderPath, uniqueFileName);
    
    // Write file to organized location
    await fs.writeFile(storagePath, fileBuffer);
    
    // Generate standard tags
    const standardTags = [
      customerName.toLowerCase(),
      jobAddress.toLowerCase(),
      dateTaken.getFullYear().toString(),
      ...(options.additionalTags || [])
    ];
    
    if (options.jobId) {
      standardTags.push(`job-${options.jobId}`);
    }
    
    // Extract location from address for tagging
    const addressParts = jobAddress.split(',');
    if (addressParts.length >= 2) {
      standardTags.push(addressParts[addressParts.length - 2].trim().toLowerCase()); // city
      standardTags.push(addressParts[addressParts.length - 1].trim().toLowerCase()); // state
    }
    
    const photoMetadata: PhotoMetadata = {
      id: photoId,
      fileName: uniqueFileName,
      originalName: fileName,
      customerName,
      jobAddress,
      location: addressParts.length >= 2 ? `${addressParts[addressParts.length - 2].trim()}, ${addressParts[addressParts.length - 1].trim()}` : undefined,
      jobId: options.jobId,
      dateTaken,
      tags: standardTags,
      description: options.description,
      aiAnalysis: options.aiAnalysis,
      gpsCoordinates: options.gpsCoordinates,
      fileSize: fileBuffer.length,
      mimeType: options.mimeType || 'image/jpeg',
      storagePath,
      isEditable: true,
      createdAt: dateTaken,
      updatedAt: dateTaken
    };
    
    this.photoMetadataMap.set(photoId, photoMetadata);
    
    console.log(`📸 Photo organized: ${storagePath}`);
    return photoMetadata;
  }

  /**
   * Edit photo metadata and potentially reorganize if customer/address changed
   */
  async editPhoto(editRequest: PhotoEditRequest): Promise<PhotoMetadata | null> {
    const photo = this.photoMetadataMap.get(editRequest.photoId);
    if (!photo || !photo.isEditable) {
      return null;
    }

    const hasLocationChange = 
      editRequest.customerName && editRequest.customerName !== photo.customerName ||
      editRequest.jobAddress && editRequest.jobAddress !== photo.jobAddress;

    let newStoragePath = photo.storagePath;
    
    // If customer or address changed, reorganize the file
    if (hasLocationChange) {
      const newCustomerName = editRequest.customerName || photo.customerName;
      const newJobAddress = editRequest.jobAddress || photo.jobAddress;
      const newFolderPath = this.generateFolderPath(newCustomerName, newJobAddress, photo.dateTaken);
      
      await fs.mkdir(newFolderPath, { recursive: true });
      
      const newFileName = editRequest.fileName || photo.fileName;
      newStoragePath = path.join(newFolderPath, newFileName);
      
      // Move file to new location
      await fs.rename(photo.storagePath, newStoragePath);
      
      console.log(`📸 Photo reorganized: ${photo.storagePath} -> ${newStoragePath}`);
    }

    // Update metadata
    const updatedPhoto: PhotoMetadata = {
      ...photo,
      customerName: editRequest.customerName || photo.customerName,
      jobAddress: editRequest.jobAddress || photo.jobAddress,
      location: editRequest.location || photo.location,
      jobId: editRequest.jobId || photo.jobId,
      description: editRequest.description || photo.description,
      tags: editRequest.tags || photo.tags,
      fileName: editRequest.fileName || photo.fileName,
      storagePath: newStoragePath,
      updatedAt: new Date()
    };

    this.photoMetadataMap.set(editRequest.photoId, updatedPhoto);
    return updatedPhoto;
  }

  /**
   * Delete photo and cleanup file system
   */
  async deletePhoto(photoId: string): Promise<boolean> {
    const photo = this.photoMetadataMap.get(photoId);
    if (!photo) {
      return false;
    }

    try {
      // Delete the actual file
      await fs.unlink(photo.storagePath);
      
      // Delete thumbnail if exists
      if (photo.thumbnailPath) {
        try {
          await fs.unlink(photo.thumbnailPath);
        } catch {
          // Thumbnail might not exist, ignore error
        }
      }
      
      // Remove from metadata
      this.photoMetadataMap.delete(photoId);
      
      console.log(`📸 Photo deleted: ${photo.storagePath}`);
      return true;
    } catch (error) {
      console.error(`Error deleting photo ${photoId}:`, error);
      return false;
    }
  }

  /**
   * Search photos by metadata
   */
  searchPhotos(query: {
    customerName?: string;
    jobAddress?: string;
    location?: string;
    jobId?: string;
    tags?: string[];
    dateFrom?: Date;
    dateTo?: Date;
  }): PhotoMetadata[] {
    const results: PhotoMetadata[] = [];
    
    for (const photo of this.photoMetadataMap.values()) {
      let matches = true;
      
      if (query.customerName && !photo.customerName.toLowerCase().includes(query.customerName.toLowerCase())) {
        matches = false;
      }
      
      if (query.jobAddress && !photo.jobAddress.toLowerCase().includes(query.jobAddress.toLowerCase())) {
        matches = false;
      }
      
      if (query.location && photo.location && !photo.location.toLowerCase().includes(query.location.toLowerCase())) {
        matches = false;
      }
      
      if (query.jobId && photo.jobId !== query.jobId) {
        matches = false;
      }
      
      if (query.tags && query.tags.length > 0) {
        const hasAllTags = query.tags.every(tag => 
          photo.tags.some(photoTag => photoTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasAllTags) {
          matches = false;
        }
      }
      
      if (query.dateFrom && photo.dateTaken < query.dateFrom) {
        matches = false;
      }
      
      if (query.dateTo && photo.dateTaken > query.dateTo) {
        matches = false;
      }
      
      if (matches) {
        results.push(photo);
      }
    }
    
    return results.sort((a, b) => b.dateTaken.getTime() - a.dateTaken.getTime());
  }

  /**
   * Get all photos for a specific customer or job
   */
  getPhotosByCustomer(customerName: string): PhotoMetadata[] {
    return this.searchPhotos({ customerName });
  }

  getPhotosByJob(jobId: string): PhotoMetadata[] {
    return this.searchPhotos({ jobId });
  }

  getPhotosByLocation(location: string): PhotoMetadata[] {
    return this.searchPhotos({ location });
  }

  /**
   * Get photo metadata by ID
   */
  getPhotoById(photoId: string): PhotoMetadata | null {
    return this.photoMetadataMap.get(photoId) || null;
  }

  /**
   * Get all photos (with optional pagination)
   */
  getAllPhotos(limit?: number, offset?: number): PhotoMetadata[] {
    const allPhotos = Array.from(this.photoMetadataMap.values())
      .sort((a, b) => b.dateTaken.getTime() - a.dateTaken.getTime());
    
    if (limit && offset !== undefined) {
      return allPhotos.slice(offset, offset + limit);
    }
    
    return allPhotos;
  }

  /**
   * Generate folder structure summary for reporting
   */
  getFolderStructure(): Record<string, Record<string, string[]>> {
    const structure: Record<string, Record<string, string[]>> = {};
    
    for (const photo of this.photoMetadataMap.values()) {
      const year = photo.dateTaken.getFullYear().toString();
      const location = photo.location || 'Unknown_Location';
      const customerFolder = `${photo.customerName}_${photo.jobAddress.split(',')[0]?.trim()}`;
      
      if (!structure[year]) {
        structure[year] = {};
      }
      
      if (!structure[year][location]) {
        structure[year][location] = [];
      }
      
      if (!structure[year][location].includes(customerFolder)) {
        structure[year][location].push(customerFolder);
      }
    }
    
    return structure;
  }
}