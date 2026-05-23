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
}

export interface Vote {
  id: string
  cow_id: string
  vote_type: 'good_deal' | 'overpriced'
  anonymous_user_id: string
  created_at: string
}

export interface Hut {
  id: string
  name: string
  name_bn: string | null
  district: string
  image_url: string | null
  total_uploads: number
  avg_price: number
  created_at: string
}

export interface Report {
  id: string
  cow_id: string
  reason: string | null
  anonymous_user_id: string
  created_at: string
}

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  phone: string | null
  role: 'user' | 'admin' | 'moderator'
  created_at: string
  updated_at: string
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

export const DISTRICTS = [
  { value: 'Dhaka', label: 'ঢাকা', labelEn: 'Dhaka' },
  { value: 'Chattogram', label: 'চট্টগ্রাম', labelEn: 'Chattogram' },
  { value: 'Rajshahi', label: 'রাজশাহী', labelEn: 'Rajshahi' },
  { value: 'Khulna', label: 'খুলনা', labelEn: 'Khulna' },
  { value: 'Barishal', label: 'বরিশাল', labelEn: 'Barishal' },
  { value: 'Sylhet', label: 'সিলেট', labelEn: 'Sylhet' },
  { value: 'Rangpur', label: 'রংপুর', labelEn: 'Rangpur' },
  { value: 'Mymensingh', label: 'ময়মনসিংহ', labelEn: 'Mymensingh' },
  { value: 'Comilla', label: 'কুমিল্লা', labelEn: 'Comilla' },
  { value: 'Gazipur', label: 'গাজীপুর', labelEn: 'Gazipur' },
  { value: 'Narayanganj', label: 'নারায়ণগঞ্জ', labelEn: 'Narayanganj' },
  { value: 'Bogura', label: 'বগুড়া', labelEn: 'Bogura' },
] as const

export const BREEDS = [
  { value: 'brahman', label: 'ব্রাহমা', labelEn: 'Brahman' },
  { value: 'sahiwal', label: 'সাহিওয়াল', labelEn: 'Sahiwal' },
  { value: 'deshi', label: 'দেশী', labelEn: 'Deshi' },
  { value: 'gheer', label: 'গীর', labelEn: 'Gheer' },
  { value: 'red_chittagong', label: 'রেড চিটাগং', labelEn: 'Red Chittagong' },
  { value: 'mixed', label: 'মিক্স/ক্রস', labelEn: 'Mixed/Cross' },
  { value: 'other', label: 'অন্যান্য', labelEn: 'Other' },
] as const

export type District = typeof DISTRICTS[number]['value']
export type Breed = typeof BREEDS[number]['value']
