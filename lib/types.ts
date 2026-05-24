// User roles for RBAC
export type UserRole = 'user' | 'admin' | 'super_admin' | 'moderator' | 'content_manager' | 'analyst'

// Permissions for granular access control
export type Permission = 
  | 'posts:view' | 'posts:approve' | 'posts:reject' | 'posts:delete' | 'posts:feature' | 'posts:hide'
  | 'users:view' | 'users:edit' | 'users:delete' | 'users:roles'
  | 'haats:view' | 'haats:create' | 'haats:edit' | 'haats:delete'
  | 'districts:view' | 'districts:create' | 'districts:edit' | 'districts:delete'
  | 'votes:view' | 'votes:delete' | 'votes:analyze'
  | 'reports:view' | 'reports:resolve'
  | 'settings:view' | 'settings:edit'
  | 'analytics:view'

// Role permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [],
  analyst: ['posts:view', 'votes:view', 'votes:analyze', 'reports:view', 'analytics:view'],
  moderator: ['posts:view', 'posts:approve', 'posts:reject', 'posts:hide', 'votes:view', 'votes:delete', 'reports:view', 'reports:resolve'],
  content_manager: ['posts:view', 'posts:approve', 'posts:reject', 'posts:delete', 'posts:feature', 'posts:hide', 'haats:view', 'haats:create', 'haats:edit', 'districts:view'],
  admin: ['posts:view', 'posts:approve', 'posts:reject', 'posts:delete', 'posts:feature', 'posts:hide', 'users:view', 'users:edit', 'haats:view', 'haats:create', 'haats:edit', 'haats:delete', 'districts:view', 'districts:create', 'districts:edit', 'votes:view', 'votes:delete', 'votes:analyze', 'reports:view', 'reports:resolve', 'settings:view', 'settings:edit', 'analytics:view'],
  super_admin: ['posts:view', 'posts:approve', 'posts:reject', 'posts:delete', 'posts:feature', 'posts:hide', 'users:view', 'users:edit', 'users:delete', 'users:roles', 'haats:view', 'haats:create', 'haats:edit', 'haats:delete', 'districts:view', 'districts:create', 'districts:edit', 'districts:delete', 'votes:view', 'votes:delete', 'votes:analyze', 'reports:view', 'reports:resolve', 'settings:view', 'settings:edit', 'analytics:view'],
}

export interface Cow {
  id: string
  image_url: string
  price: number
  district: string
  description: string | null
  estimated_weight: number | null
  good_deal_count: number
  overpriced_count: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  hut: string | null
  breed: string | null
  title: string | null
  reported_count: number
  // New fields
  is_featured?: boolean
  is_hidden?: boolean
  device_fingerprint?: string
  user_id?: string
  moderation_note?: string
  moderated_by?: string
  moderated_at?: string
}

export interface Vote {
  id: string
  cow_id: string
  vote_type: 'good_deal' | 'overpriced'
  anonymous_user_id: string
  created_at: string
  device_fingerprint?: string
  ip_address?: string
}

export interface District {
  id: string
  name: string
  name_bn: string
  division: string | null
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Hut {
  id: string
  name: string
  name_bn: string | null
  district: string
  district_id: string | null
  image_url: string | null
  total_uploads: number
  avg_price: number
  created_at: string
  is_active?: boolean
  is_trending?: boolean
  sort_order?: number
}

export interface Report {
  id: string
  cow_id: string
  reason: string | null
  anonymous_user_id: string
  created_at: string
  cow?: Cow
}

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  phone: string | null
  role: UserRole
  permissions: Permission[]
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface SiteSetting {
  id: string
  key: string
  value: unknown
  description: string | null
  updated_at: string
  updated_by: string | null
}

export interface DeviceTracking {
  id: string
  device_fingerprint: string
  anonymous_user_id: string
  ip_address: string | null
  user_agent: string | null
  vote_count: number
  is_suspicious: boolean
  first_seen: string
  last_seen: string
}

export interface FeaturedPost {
  id: string
  cow_id: string
  featured_from: string
  featured_until: string | null
  sort_order: number
  created_at: string
  created_by: string | null
  cow?: Cow
}

export interface CowFormData {
  image: File | null
  title: string
  price: string
  district: string
  hut: string
  breed: string
  description: string
  estimated_weight: string
}

// Analytics types
export interface AnalyticsStats {
  totalPosts: number
  pendingPosts: number
  approvedPosts: number
  rejectedPosts: number
  totalVotes: number
  totalReports: number
  totalUsers: number
  avgPrice: number
  postsToday: number
  votesToday: number
}

export const DIVISIONS = [
  { value: 'Dhaka', label: 'ঢাকা' },
  { value: 'Chattogram', label: 'চট্টগ্রাম' },
  { value: 'Rajshahi', label: 'রাজশাহী' },
  { value: 'Khulna', label: 'খুলনা' },
  { value: 'Barisal', label: 'বরিশাল' },
  { value: 'Sylhet', label: 'সিলেট' },
  { value: 'Rangpur', label: 'রংপুর' },
  { value: 'Mymensingh', label: 'ময়মনসিংহ' },
] as const

export const BREEDS = [
  { value: 'brahman', label: 'ব্রাহমা', labelEn: 'Brahman' },
  { value: 'sahiwal', label: 'সাহিওয়াল', labelEn: 'Sahiwal' },
  { value: 'deshi', label: 'দেশী', labelEn: 'Deshi' },
  { value: 'gheer', label: 'গীর', labelEn: 'Gheer' },
  { value: 'sindhi', label: 'সিন্ধি', labelEn: 'Sindhi' },
  { value: 'friesian_cross', label: 'ফ্রিজিয়ান ক্রস', labelEn: 'Friesian Cross' },
  { value: 'red_chittagong', label: 'রেড চিটাগং', labelEn: 'Red Chittagong' },
  { value: 'other', label: 'অন্যান্য', labelEn: 'Other' },
] as const

export type BreedType = typeof BREEDS[number]['value']
