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
}

export interface Vote {
  id: string
  cow_id: string
  vote_type: 'good_deal' | 'overpriced'
  anonymous_user_id: string
  created_at: string
}

export interface CowFormData {
  image: File | null
  price: string
  district: string
  description: string
  estimated_weight: string
}

export const DISTRICTS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
  'Comilla',
  'Gazipur',
  'Narayanganj',
  'Bogura',
  'Cox\'s Bazar',
  'Jessore',
  'Dinajpur',
  'Brahmanbaria',
  'Tangail',
  'Narsingdi',
  'Savar',
  'Other'
] as const
