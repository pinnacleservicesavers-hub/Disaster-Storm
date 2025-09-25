// Disaster Lense Module Types
import { z } from 'zod';

// Project & Organization
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  orgId: z.string().uuid(),
  address: z.string().optional(),
  coords: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

// Media Capture
export const MediaItemSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['photo', 'video']),
  fileName: z.string(),
  originalName: z.string(),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  
  // Auto-stamped metadata
  capturedAt: z.date().default(() => new Date()),
  coords: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracy: z.number().optional()
  }).optional(),
  deviceInfo: z.object({
    userAgent: z.string(),
    platform: z.string().optional()
  }).optional(),
  
  // EXIF and technical data
  exifData: z.record(z.any()).optional(),
  dimensions: z.object({
    width: z.number(),
    height: z.number()
  }).optional(),
  fileSize: z.number(),
  
  // Content analysis
  aiAnalysis: z.object({
    caption: z.string().optional(),
    tags: z.array(z.string()).default([]),
    hazards: z.array(z.string()).default([]),
    confidence: z.number().min(0).max(1).optional()
  }).optional(),
  
  // User annotations
  annotations: z.array(z.object({
    type: z.enum(['draw', 'arrow', 'text', 'measure', 'blur']),
    data: z.record(z.any()),
    createdBy: z.string().uuid(),
    createdAt: z.date().default(() => new Date())
  })).default([]),
  
  // Organization
  tags: z.array(z.string()).default([]),
  isRedacted: z.boolean().default(false),
  chainOfCustodyHash: z.string().optional()
});

// Comments & Collaboration
export const CommentSchema = z.object({
  id: z.string().uuid(),
  mediaItemId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string(),
  mentions: z.array(z.string().uuid()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

// Tasks & Checklists
export const TaskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  requiresPhoto: z.boolean().default(false),
  requiredPhotos: z.number().default(0),
  attachedMedia: z.array(z.string().uuid()).default([]),
  dueDate: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  completedAt: z.date().optional()
});

// Share Links
export const ShareLinkSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  createdBy: z.string().uuid(),
  type: z.enum(['view_only', 'client_review', 'adjuster_access']),
  expiresAt: z.date().optional(),
  isActive: z.boolean().default(true),
  allowedEmails: z.array(z.string().email()).optional(),
  createdAt: z.date().default(() => new Date())
});

// Types
export type Project = z.infer<typeof ProjectSchema>;
export type MediaItem = z.infer<typeof MediaItemSchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type ShareLink = z.infer<typeof ShareLinkSchema>;

// API Response types
export type APIResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = APIResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}>;