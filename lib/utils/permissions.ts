import { type UserRole, type Permission, ROLE_PERMISSIONS } from '@/lib/types'

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

// Check if a role has any of the given permissions
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

// Check if a role has all of the given permissions
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

// Get all permissions for a role
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

// Check if user is admin or super_admin
export function isAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin'
}

// Check if user is super_admin
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'super_admin'
}

// Check if user can access admin panel
export function canAccessAdmin(role: UserRole): boolean {
  return ['admin', 'super_admin', 'moderator', 'content_manager', 'analyst'].includes(role)
}

// Get role display name in Bangla
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    user: 'সাধারণ ব্যবহারকারী',
    analyst: 'বিশ্লেষক',
    moderator: 'মডারেটর',
    content_manager: 'কন্টেন্ট ম্যানেজার',
    admin: 'অ্যাডমিন',
    super_admin: 'সুপার অ্যাডমিন',
  }
  return roleNames[role] || role
}

// Get role badge color
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    user: 'bg-gray-100 text-gray-700',
    analyst: 'bg-blue-100 text-blue-700',
    moderator: 'bg-amber-100 text-amber-700',
    content_manager: 'bg-purple-100 text-purple-700',
    admin: 'bg-emerald-100 text-emerald-700',
    super_admin: 'bg-red-100 text-red-700',
  }
  return colors[role] || 'bg-gray-100 text-gray-700'
}

// Admin email check
export const ADMIN_EMAIL = '1009.personal@gmail.com'

export function isAdminEmail(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL
}
