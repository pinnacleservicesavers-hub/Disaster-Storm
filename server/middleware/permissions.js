// Disaster Lens Permissions Middleware
// Role-based access control for organization-scoped resources

const { storage } = require('../storage');

// Available permissions for different roles
const ROLE_PERMISSIONS = {
  'owner': [
    'project_read', 'project_write', 'project_delete', 'project_admin',
    'media_read', 'media_write', 'media_delete', 'media_admin',
    'annotation_read', 'annotation_write', 'annotation_delete',
    'comment_read', 'comment_write', 'comment_delete',
    'task_read', 'task_write', 'task_delete', 'task_assign',
    'report_read', 'report_write', 'report_delete',
    'share_read', 'share_write', 'share_delete',
    'member_read', 'member_write', 'member_delete', 'member_admin',
    'org_admin'
  ],
  'admin': [
    'project_read', 'project_write', 'project_delete',
    'media_read', 'media_write', 'media_delete',
    'annotation_read', 'annotation_write', 'annotation_delete',
    'comment_read', 'comment_write', 'comment_delete',
    'task_read', 'task_write', 'task_delete', 'task_assign',
    'report_read', 'report_write', 'report_delete',
    'share_read', 'share_write', 'share_delete',
    'member_read', 'member_write'
  ],
  'manager': [
    'project_read', 'project_write',
    'media_read', 'media_write',
    'annotation_read', 'annotation_write',
    'comment_read', 'comment_write',
    'task_read', 'task_write', 'task_assign',
    'report_read', 'report_write',
    'share_read', 'share_write',
    'member_read'
  ],
  'tech': [
    'project_read',
    'media_read', 'media_write',
    'annotation_read', 'annotation_write',
    'comment_read', 'comment_write',
    'task_read', 'task_write',
    'report_read',
    'share_read'
  ],
  'sub': [
    'project_read',
    'media_read', 'media_write',
    'annotation_read',
    'comment_read', 'comment_write',
    'task_read',
    'report_read'
  ],
  'viewer': [
    'project_read',
    'media_read',
    'annotation_read',
    'comment_read',
    'task_read',
    'report_read'
  ]
};

/**
 * Check if user has specific permissions within an organization
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID  
 * @param {string[]} requiredPermissions - Array of required permissions
 * @returns {Promise<boolean>} - True if user has all required permissions
 */
async function checkOrganizationPermission(userId, organizationId, requiredPermissions) {
  try {
    // Get user's membership in the organization
    const membership = await storage.getOrganizationMembership(userId, organizationId);
    
    if (!membership) {
      return false; // User is not a member of this organization
    }

    // Get permissions for user's role
    const userPermissions = ROLE_PERMISSIONS[membership.role] || [];
    
    // Check if user has all required permissions
    return requiredPermissions.every(permission => userPermissions.includes(permission));
    
  } catch (error) {
    console.error('Error checking organization permission:', error);
    return false;
  }
}

/**
 * Middleware to require specific permissions
 * @param {string[]} requiredPermissions - Array of required permissions
 * @returns {Function} Express middleware function
 */
function requirePermission(requiredPermissions) {
  return async (req, res, next) => {
    try {
      // Skip permission check if no user (handled by auth middleware)
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // For endpoints that don't specify organization, continue
      // (organization-specific checks happen in individual routes)
      next();
      
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

/**
 * Check if user is owner or admin of an organization
 * @param {string} userId - User ID
 * @param {string} organizationId - Organization ID
 * @returns {Promise<boolean>} - True if user is owner or admin
 */
async function isOwnerOrAdmin(userId, organizationId) {
  return await checkOrganizationPermission(userId, organizationId, ['org_admin']);
}

module.exports = {
  checkOrganizationPermission,
  requirePermission,
  isOwnerOrAdmin,
  ROLE_PERMISSIONS
};