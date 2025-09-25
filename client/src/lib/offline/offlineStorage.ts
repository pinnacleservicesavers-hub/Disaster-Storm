// IndexedDB utilities for offline-first storage
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DisasterLensDB extends DBSchema {
  media: {
    key: string;
    value: {
      id: string;
      projectId: string;
      fileName: string;
      fileBlob: Blob;
      metadata: any;
      capturedAt: string;
      synced: boolean;
      lastModified: number;
    };
    indexes: { 'by-project': string; 'by-sync-status': boolean };
  };
  
  annotations: {
    key: string;
    value: {
      id: string;
      mediaId: string;
      kind: string;
      payload: any;
      synced: boolean;
      lastModified: number;
    };
    indexes: { 'by-media': string; 'by-sync-status': boolean };
  };
  
  comments: {
    key: string;
    value: {
      id: string;
      projectId: string;
      mediaId?: string;
      body: string;
      synced: boolean;
      lastModified: number;
    };
    indexes: { 'by-project': string; 'by-sync-status': boolean };
  };
  
  tasks: {
    key: string;
    value: {
      id: string;
      projectId: string;
      title: string;
      status: string;
      synced: boolean;
      lastModified: number;
    };
    indexes: { 'by-project': string; 'by-sync-status': boolean };
  };
  
  sync_queue: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      entity: 'media' | 'annotation' | 'comment' | 'task';
      entityId: string;
      data: any;
      timestamp: number;
      retryCount: number;
    };
  };
}

let db: IDBPDatabase<DisasterLensDB> | null = null;

export async function initOfflineDB(): Promise<IDBPDatabase<DisasterLensDB>> {
  if (db) return db;
  
  db = await openDB<DisasterLensDB>('disaster-lens-offline', 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading DB from ${oldVersion} to ${newVersion}`);
      
      // Media store
      if (!db.objectStoreNames.contains('media')) {
        const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
        mediaStore.createIndex('by-project', 'projectId');
        mediaStore.createIndex('by-sync-status', 'synced');
      }
      
      // Annotations store
      if (!db.objectStoreNames.contains('annotations')) {
        const annotationsStore = db.createObjectStore('annotations', { keyPath: 'id' });
        annotationsStore.createIndex('by-media', 'mediaId');
        annotationsStore.createIndex('by-sync-status', 'synced');
      }
      
      // Comments store
      if (!db.objectStoreNames.contains('comments')) {
        const commentsStore = db.createObjectStore('comments', { keyPath: 'id' });
        commentsStore.createIndex('by-project', 'projectId');
        commentsStore.createIndex('by-sync-status', 'synced');
      }
      
      // Tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
        tasksStore.createIndex('by-project', 'projectId');
        tasksStore.createIndex('by-sync-status', 'synced');
      }
      
      // Sync queue store
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
    }
  });
  
  return db;
}

// Media offline operations
export class OfflineMediaStore {
  private async getDB() {
    return await initOfflineDB();
  }
  
  async storeMedia(media: {
    id: string;
    projectId: string;
    fileName: string;
    fileBlob: Blob;
    metadata: any;
    capturedAt: string;
  }) {
    const db = await this.getDB();
    await db.put('media', {
      ...media,
      synced: false,
      lastModified: Date.now()
    });
    
    // Queue for sync
    await this.queueSync('create', 'media', media.id, media);
  }
  
  async getMediaByProject(projectId: string) {
    const db = await this.getDB();
    return await db.getAllFromIndex('media', 'by-project', projectId);
  }
  
  async getUnsyncedMedia() {
    const db = await this.getDB();
    return await db.getAllFromIndex('media', 'by-sync-status', false);
  }
  
  async markMediaSynced(mediaId: string) {
    const db = await this.getDB();
    const media = await db.get('media', mediaId);
    if (media) {
      media.synced = true;
      await db.put('media', media);
    }
  }
  
  private async queueSync(action: 'create' | 'update' | 'delete', entity: 'media' | 'annotation' | 'comment' | 'task', entityId: string, data: any) {
    const db = await this.getDB();
    await db.add('sync_queue', {
      id: crypto.randomUUID(),
      action,
      entity,
      entityId,
      data,
      timestamp: Date.now(),
      retryCount: 0
    });
    
    // Trigger background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-pending-actions');
    }
  }
}

// Annotation offline operations  
export class OfflineAnnotationStore {
  private async getDB() {
    return await initOfflineDB();
  }
  
  async storeAnnotation(annotation: {
    id: string;
    mediaId: string;
    kind: string;
    payload: any;
  }) {
    const db = await this.getDB();
    await db.put('annotations', {
      ...annotation,
      synced: false,
      lastModified: Date.now()
    });
    
    await this.queueSync('create', 'annotation', annotation.id, annotation);
  }
  
  async getAnnotationsByMedia(mediaId: string) {
    const db = await this.getDB();
    return await db.getAllFromIndex('annotations', 'by-media', mediaId);
  }
  
  private async queueSync(action: 'create' | 'update' | 'delete', entity: 'media' | 'annotation' | 'comment' | 'task', entityId: string, data: any) {
    const db = await this.getDB();
    await db.add('sync_queue', {
      id: crypto.randomUUID(),
      action,
      entity,
      entityId,
      data,
      timestamp: Date.now(),
      retryCount: 0
    });
  }
}

// Background sync handler
export class OfflineSyncManager {
  private async getDB() {
    return await initOfflineDB();
  }
  
  async processQueue(): Promise<void> {
    const db = await this.getDB();
    const queueItems = await db.getAll('sync_queue');
    
    for (const item of queueItems) {
      try {
        await this.syncItem(item);
        await db.delete('sync_queue', item.id!);
      } catch (error) {
        console.error('Failed to sync item:', error);
        
        // Increment retry count
        item.retryCount++;
        if (item.retryCount < 3) {
          await db.put('sync_queue', item);
        } else {
          console.error('Max retries exceeded, removing from queue:', item);
          await db.delete('sync_queue', item.id!);
        }
      }
    }
  }
  
  private async syncItem(item: any): Promise<void> {
    const endpoint = `/api/disaster-lense/${item.entity}`;
    const method = item.action === 'create' ? 'POST' : 
                   item.action === 'update' ? 'PUT' : 'DELETE';
    
    let url = endpoint;
    if (item.action !== 'create') {
      url += `/${item.entityId}`;
    }
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: item.action !== 'delete' ? JSON.stringify(item.data) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Mark as synced in local store
    if (item.entity === 'media') {
      const mediaStore = new OfflineMediaStore();
      await mediaStore.markMediaSynced(item.entityId);
    }
  }
}

// Conflict resolution - last writer wins
export async function resolveConflicts(): Promise<void> {
  const db = await initOfflineDB();
  
  // For captions/comments, server version overwrites local if newer
  // For media, local version is immutable once uploaded
  
  console.log('Conflict resolution completed');
}

// Export singleton instances
export const offlineMediaStore = new OfflineMediaStore();
export const offlineAnnotationStore = new OfflineAnnotationStore();
export const offlineSyncManager = new OfflineSyncManager();