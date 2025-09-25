import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

// Role hierarchy and permissions
export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin', 
  MANAGER = 'manager',
  TECH = 'tech',
  SUB = 'sub',
  VIEWER = 'viewer'
}

export enum Permission {
  // Organization permissions
  MANAGE_ORG = 'manage_org',
  MANAGE_BILLING = 'manage_billing',
  DELETE_PROJECTS = 'delete_projects',
  
  // Project permissions
  CREATE_PROJECTS = 'create_projects',
  MANAGE_TASKS = 'manage_tasks', 
  MANAGE_REPORTS = 'manage_reports',
  SHARE_LINKS = 'share_links',
  
  // Media permissions
  CAPTURE_MEDIA = 'capture_media',
  UPLOAD_MEDIA = 'upload_media',
  ANNOTATE_MEDIA = 'annotate_media',
  
  // Task permissions
  COMPLETE_TASKS = 'complete_tasks',
  
  // Read permissions
  READ_ONLY = 'read_only'
}

// Role to permissions mapping
const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    Permission.MANAGE_ORG,
    Permission.MANAGE_BILLING,
    Permission.DELETE_PROJECTS,
    Permission.CREATE_PROJECTS,
    Permission.MANAGE_TASKS,
    Permission.MANAGE_REPORTS,
    Permission.SHARE_LINKS,
    Permission.CAPTURE_MEDIA,
    Permission.UPLOAD_MEDIA,
    Permission.ANNOTATE_MEDIA,
    Permission.COMPLETE_TASKS,
    Permission.READ_ONLY
  ],
  [Role.ADMIN]: [
    Permission.MANAGE_ORG,
    Permission.DELETE_PROJECTS,
    Permission.CREATE_PROJECTS,
    Permission.MANAGE_TASKS,
    Permission.MANAGE_REPORTS,
    Permission.SHARE_LINKS,
    Permission.CAPTURE_MEDIA,
    Permission.UPLOAD_MEDIA,
    Permission.ANNOTATE_MEDIA,
    Permission.COMPLETE_TASKS,
    Permission.READ_ONLY
  ],
  [Role.MANAGER]: [
    Permission.CREATE_PROJECTS,
    Permission.MANAGE_TASKS,
    Permission.MANAGE_REPORTS,
    Permission.SHARE_LINKS,
    Permission.CAPTURE_MEDIA,
    Permission.UPLOAD_MEDIA,
    Permission.ANNOTATE_MEDIA,
    Permission.COMPLETE_TASKS,
    Permission.READ_ONLY
  ],
  [Role.TECH]: [
    Permission.CAPTURE_MEDIA,
    Permission.UPLOAD_MEDIA,
    Permission.ANNOTATE_MEDIA,
    Permission.COMPLETE_TASKS,
    Permission.READ_ONLY
  ],
  [Role.SUB]: [
    Permission.UPLOAD_MEDIA, // only to assigned projects
    Permission.READ_ONLY
  ],
  [Role.VIEWER]: [
    Permission.READ_ONLY
  ]
};

// Extended Request interface
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    organizationId: string;
    role: Role;
  };
  auditInfo?: {
    action: string;
    entity: string;
    userId: string;
    organizationId: string;
  };
}

// Extend the base Request interface
declare module 'express' {
  interface Request {
    user?: { id: string };
    auditInfo?: {
      action: string;
      entity: string;
      userId: string;
      organizationId: string;
    };
  }
}

// Middleware to verify organization membership and role
export const requireOrgMembership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const orgId = req.params.orgId || req.body.organizationId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    // Check organization membership
    const membership = await storage.getOrganizationMembership(userId, orgId);
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }

    // Attach org context to request
    (req as AuthenticatedRequest).user = {
      id: userId,
      organizationId: orgId,
      role: membership.role as Role
    };

    next();
  } catch (error) {
    console.error('Organization membership check failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to require specific permissions
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const userRole = authReq.user?.role;

    if (!userRole) {
      return res.status(403).json({ error: 'Role not found' });
    }

    const userPermissions = rolePermissions[userRole];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        role: userRole 
      });
    }

    next();
  };
};

// Project-specific permission check (for SUB role limitations)
export const requireProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const projectId = req.params.projectId || req.body.projectId;
    const userRole = authReq.user.role;
    const userId = authReq.user.id;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID required' });
    }

    const project = await storage.getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if project belongs to user's organization
    if (project.organizationId !== authReq.user.organizationId) {
      return res.status(403).json({ error: 'Project not in your organization' });
    }

    // SUB role can only access assigned projects
    if (userRole === Role.SUB) {
      const isAssigned = project.assignedTechIds?.includes(userId);
      if (!isAssigned) {
        return res.status(403).json({ error: 'Not assigned to this project' });
      }
    }

    next();
  } catch (error) {
    console.error('Project access check failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Audit logging middleware
export const auditAction = (action: string, entity: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    
    // Store audit info in request for post-action logging
    req.auditInfo = {
      action,
      entity,
      userId: authReq.user.id,
      organizationId: authReq.user.organizationId
    };

    // Override res.json to capture response for audit
    const originalJson = res.json;
    res.json = function(data: any) {
      // Log successful actions
      if (res.statusCode >= 200 && res.statusCode < 300) {
        storage.createAuditLog({
          orgId: authReq.user.organizationId,
          userId: authReq.user.id,
          action,
          entity,
          entityId: data?.id || req.params.id,
          meta: {
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          }
        }).catch(console.error);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

// Combined middleware for typical endpoint protection
export const protectEndpoint = (permission: Permission, action: string, entity: string) => {
  return [
    requireOrgMembership,
    requirePermission(permission),
    auditAction(action, entity)
  ];
};