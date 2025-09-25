# Disaster Lens API Design (Express, REST-style)

## Authentication & Organization Context

All API endpoints require:
- Authentication (JWT/session)
- Organization membership verification
- Role-based permissions
- Audit logging

## Base URL Structure
```
/api/disaster-lense/
```

## Core Endpoints

### Organizations
```
GET    /api/disaster-lense/organizations              # List user's orgs
POST   /api/disaster-lense/organizations              # Create org (owner only)
GET    /api/disaster-lense/organizations/:id          # Get org details
PUT    /api/disaster-lense/organizations/:id          # Update org
DELETE /api/disaster-lense/organizations/:id          # Delete org

# Members
GET    /api/disaster-lense/organizations/:id/members  # List members
POST   /api/disaster-lense/organizations/:id/members  # Invite member
PUT    /api/disaster-lense/organizations/:id/members/:userId # Update member role
DELETE /api/disaster-lense/organizations/:id/members/:userId # Remove member
```

### Projects
```
GET    /api/disaster-lense/projects                   # List org projects
POST   /api/disaster-lense/projects                   # Create project (manager+)
GET    /api/disaster-lense/projects/:id               # Get project details  
PUT    /api/disaster-lense/projects/:id               # Update project
DELETE /api/disaster-lense/projects/:id               # Delete project (admin+)

# Project assignment for SUB role
PUT    /api/disaster-lense/projects/:id/assign        # Assign techs to project
```

### Media
```
GET    /api/disaster-lense/media                      # List media (filtered by project)
POST   /api/disaster-lense/media                      # Upload media
GET    /api/disaster-lense/media/:id                  # Get media details
PUT    /api/disaster-lense/media/:id                  # Update media metadata
DELETE /api/disaster-lense/media/:id                  # Delete media

# Media operations
POST   /api/disaster-lense/media/:id/analyze          # Trigger AI analysis
GET    /api/disaster-lense/media/:id/download         # Download original file
GET    /api/disaster-lense/media/:id/thumbnail        # Get thumbnail
```

### Annotations
```
GET    /api/disaster-lense/annotations                # List annotations (by media)
POST   /api/disaster-lense/annotations                # Create annotation
GET    /api/disaster-lense/annotations/:id            # Get annotation
PUT    /api/disaster-lense/annotations/:id            # Update annotation
DELETE /api/disaster-lense/annotations/:id            # Delete annotation
```

### Comments
```
GET    /api/disaster-lense/comments                   # List comments (by project/media)
POST   /api/disaster-lense/comments                   # Create comment
GET    /api/disaster-lense/comments/:id               # Get comment
PUT    /api/disaster-lense/comments/:id               # Update comment (author only)
DELETE /api/disaster-lense/comments/:id               # Delete comment (author/admin)
```

### Tasks
```
GET    /api/disaster-lense/tasks                      # List tasks (by project)
POST   /api/disaster-lense/tasks                      # Create task (manager+)
GET    /api/disaster-lense/tasks/:id                  # Get task
PUT    /api/disaster-lense/tasks/:id                  # Update task
DELETE /api/disaster-lense/tasks/:id                  # Delete task
PUT    /api/disaster-lense/tasks/:id/complete         # Mark complete (tech+)
```

### Reports
```
GET    /api/disaster-lense/reports                    # List reports
POST   /api/disaster-lense/reports                    # Generate report
GET    /api/disaster-lense/reports/:id                # Get report details
PUT    /api/disaster-lense/reports/:id                # Update report config
DELETE /api/disaster-lense/reports/:id                # Delete report
GET    /api/disaster-lense/reports/:id/download       # Download PDF
```

### Shares (Public Links)
```
GET    /api/disaster-lense/shares                     # List shares (manager+)
POST   /api/disaster-lense/shares                     # Create share link
GET    /api/disaster-lense/shares/:id                 # Get share details  
PUT    /api/disaster-lense/shares/:id                 # Update share (expiry)
DELETE /api/disaster-lense/shares/:id                 # Revoke share

# Public access (no auth required)
GET    /api/public/shares/:token                      # Access shared content
```

### File Upload
```
POST   /api/disaster-lense/upload/presigned           # Get presigned upload URL
POST   /api/disaster-lense/upload/complete            # Complete multipart upload
```

## Query Parameters

### Filtering
```
?projectId=uuid           # Filter by project
?mediaType=photo|video    # Filter media type  
?status=active            # Filter by status
?role=tech                # Filter by user role
?synced=false             # Filter unsynced (offline)
```

### Pagination  
```
?page=1&limit=50          # Page-based pagination
?cursor=uuid&limit=50     # Cursor-based for real-time
```

### Sorting
```
?sort=createdAt&order=desc
?sort=name&order=asc
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "hasNext": true
  }
}
```

### Error Response  
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "FORBIDDEN",
  "details": {
    "required": "manager",
    "current": "tech"
  }
}
```

## Permission Middleware Stack

Each endpoint uses middleware chain:
```typescript
[
  requireAuth,           // Basic authentication
  requireOrgMembership,  // Verify org membership
  requirePermission(PERMISSION),  // Role-based check
  requireProjectAccess,  // Project-specific access (SUB role)
  auditAction(action, entity)     // Audit logging
]
```

## Role-Based Access Examples

```typescript
// Only managers+ can create projects
POST /api/disaster-lense/projects
Middleware: requirePermission(Permission.CREATE_PROJECTS)

// SUBs can only upload to assigned projects  
POST /api/disaster-lense/media
Middleware: [requireProjectAccess, requirePermission(Permission.UPLOAD_MEDIA)]

// Viewers have read-only access
GET /api/disaster-lense/projects
Middleware: requirePermission(Permission.READ_ONLY)
```

## Offline Support

- All mutations return `202 Accepted` when queued offline
- Sync endpoint: `POST /api/disaster-lense/sync` processes offline queue
- Conflict resolution with last-writer-wins policy
- Media uploads get storage keys after successful upload