'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { Navigation, OrganicBlobs } from '@/components/navigation'
import { BREEDS, type District, type Hut } from '@/lib/types'
import { cn } from '@/lib/utils'

const MAX_FILE_SIZE = 350 * 1024 // 350KB

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [compressedSize, setCompressedSize] = useState<number>(0)
  const [isCompressing, setIsCompressing] = useState(false)
  
  const [price, setPrice] = useState('')
  const [district, setDistrict] = useState('')
  const [hut, setHut] = useState('')
  const [customHut, setCustomHut] = useState('')
  const [breed, setBreed] = useState('')
  const [weight, setWeight] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Dynamic data from database
  const [districts, setDistricts] = useState<District[]>([])
  const [haats, setHaats] = useState<Hut[]>([])
  const [filteredHaats, setFilteredHaats] = useState<Hut[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Fetch districts and haats on mount
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      try {
        const [districtsRes, haatsRes] = await Promise.all([
          supabase.from('districts').select('*').order('name_bn'),
          supabase.from('huts').select('*').order('name_bn'),
        ])

        if (districtsRes.error) {
          console.error('[v0] Districts fetch error:', districtsRes.error)
        }
        if (haatsRes.error) {
          console.error('[v0] Haats fetch error:', haatsRes.error)
        }

        setDistricts(districtsRes.data || [])
        setHaats(haatsRes.data || [])
      } catch (err) {
        console.error('[v0] Data fetch error:', err)
      } finally {
        setLoadingData(false)
      }
    }

    fetchData()
  }, [])

  // Filter haats when district changes (use district_id for proper linking)
  useEffect(() => {
    if (district) {
      // Find the selected district to get its ID
      const selectedDistrict = districts.find(d => d.id === district)
      if (selectedDistrict) {
        // Filter haats by district_id for accurate linking
        const filtered = haats.filter(h => h.district_id === selectedDistrict.id || h.district === selectedDistrict.name)
        setFilteredHaats(filtered)
      } else {
        setFilteredHaats([])
      }
      setHut('') // Reset hut selection
    } else {
      setFilteredHaats([])
    }
  }, [district, haats, districts])

  const compressImage = useCallback(async (file: File): Promise<File> => {
    setIsCompressing(true)
    
    try {
      const options = {
        maxSizeMB: 0.35,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
        fileType: 'image/webp' as const,
        initialQuality: 0.8,
      }

      let compressed = await imageCompression(file, options)
      
      // Progressive compression if still too large
      let quality = 0.7
      while (compressed.size > MAX_FILE_SIZE && quality > 0.3) {
        compressed = await imageCompression(file, {
          ...options,
          initialQuality: quality,
        })
        quality -= 0.1
      }

      if (compressed.size > MAX_FILE_SIZE) {
        throw new Error('ছবির সাইজ ৩৫০KB এর বেশি। অন্য ছবি ব্যবহার করুন।')
      }

      setCompressedSize(compressed.size)
      return compressed
    } finally {
      setIsCompressing(false)
    }
  }, [])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('শুধুমাত্র JPG, PNG বা WebP ছবি সাপোর্ট করা হয়।')
      return
    }

    setError(null)

    try {
      const compressed = await compressImage(file)
      setImage(compressed)
      
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(compressed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ছবি প্রসেস করা যায়নি।')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!image || !price || !district) {
      setError('ছবি, দাম এবং জেলা আবশ্যক।')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Upload image
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`
      const { error: uploadError } = await supabase.storage
        .from('cow-images')
        .upload(fileName, image, { contentType: 'image/webp' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('cow-images')
        .getPublicUrl(fileName)

      // Get district info for proper linking
      const selectedDistrict = districts.find(d => d.id === district)
      const districtId = selectedDistrict?.id || null
      const districtName = selectedDistrict?.name || ''

      // Determine final hut info - use ID for linking, name for display
      const selectedHaat = hut && hut !== 'other' ? filteredHaats.find(h => h.id === hut) : null
      const hutId = selectedHaat?.id || null
      const finalHutName = hut === 'other' ? customHut : (selectedHaat?.name_bn || selectedHaat?.name || null)

      // Get anonymous user ID
      let anonymousUserId = localStorage.getItem('anonymous_user_id')
      if (!anonymousUserId) {
        anonymousUserId = crypto.randomUUID()
        localStorage.setItem('anonymous_user_id', anonymousUserId)
      }

      // Insert cow record with proper ID linking
      const { error: insertError } = await supabase.from('cows').insert({
        image_url: publicUrl,
        price: parseInt(price),
        district: districtName, // Display text fallback
        district_id: districtId, // Proper relationship
        hut: finalHutName, // Display text fallback
        hut_id: hutId, // Proper relationship (null for custom/other)
        breed: breed || null,
        estimated_weight: weight ? parseInt(weight) : null,
        status: 'pending',
      })

      if (insertError) throw insertError

      // Update hut upload count if a predefined hut was selected
      if (selectedHaat) {
        await supabase
          .from('huts')
          .update({ total_uploads: (selectedHaat.total_uploads || 0) + 1 })
          .eq('id', selectedHaat.id)
      }

      setSuccess(true)
    } catch (err) {
      console.error('Upload error:', err)
      setError('পোস্ট আপলোড করা যায়নি। আবার চেষ্টা করুন।')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen relative">
        <OrganicBlobs />
        <Navigation />
        
        <div className="pt-24 md:pt-32 px-4 pb-32">
          <div className="max-w-md mx-auto">
            <div className="premium-card p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 text-4xl">check_circle</span>
              </div>
              <h1 className="text-2xl font-bold text-emerald-900 mb-2">পোস্ট সফল হয়েছে!</h1>
              <p className="text-gray-600 mb-6">
                আপনার পোস্টটি পর্যালোচনার জন্য জমা দেও���়া হয়েছে। অনুমোদনের পর এটি প্রকাশিত হবে।
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  হোমে যান
                </button>
                <button
                  onClick={() => {
                    setSuccess(false)
                    setImage(null)
                    setImagePreview(null)
                    setPrice('')
                    setDistrict('')
                    setHut('')
                    setCustomHut('')
                    setBreed('')
                    setWeight('')
                  }}
                  className="flex-1 py-3 rounded-xl font-medium bg-emerald-900 text-white hover:bg-emerald-800 transition-colors"
                >
                  আরো পোস্ট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative">
      <OrganicBlobs />
      <Navigation />
      
      <div className="pt-24 md:pt-32 px-4 pb-32">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-emerald-950 mb-2">দাম শেয়ার করুন</h1>
            <p className="text-gray-600">আপনার কোরবানির পশুর দাম শেয়ার করুন</p>
          </div>

          <form onSubmit={handleSubmit} className="premium-card p-6 space-y-5">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ছবি <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              {imagePreview ? (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-gray-700">
                    {(compressedSize / 1024).toFixed(0)} KB
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                  >
                    পরিবর্তন করুন
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors"
                >
                  {isCompressing ? (
                    <>
                      <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                      <span className="text-gray-500">ছবি কম্প্রেস হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-600 text-3xl">add_photo_alternate</span>
                      </div>
                      <span className="text-gray-600 font-medium">ছবি আপলোড করুন</span>
                      <span className="text-gray-400 text-sm">JPG, PNG বা WebP (সর্বোচ্চ ৩৫০KB)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                দাম (টাকা) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">৳</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150000"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
            </div>

            {/* District - Dynamic from Database (value is district.id) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                জেলা <span className="text-red-500">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                disabled={loadingData}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none bg-white disabled:bg-gray-50"
              >
                <option value="">
                  {loadingData ? 'লোড হচ্ছে...' : 'জেলা নির্বাচন করুন'}
                </option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name_bn}</option>
                ))}
              </select>
            </div>

            {/* Hut - Dynamic based on District (value is haat.id) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                হাট/বাজার (ঐচ্ছিক)
              </label>
              {district ? (
                <>
                  <select
                    value={hut}
                    onChange={(e) => setHut(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none bg-white"
                  >
                    <option value="">হাট নির্বাচন করুন</option>
                    {filteredHaats.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name_bn || h.name}
                        {h.is_trending && ' 🔥'}
                      </option>
                    ))}
                    <option value="other">অন্যান্য (নিজে লিখুন)</option>
                  </select>
                  
                  {/* Custom hut input when "other" is selected */}
                  {hut === 'other' && (
                    <input
                      type="text"
                      value={customHut}
                      onChange={(e) => setCustomHut(e.target.value)}
                      placeholder="হাটের নাম লিখুন"
                      className="w-full mt-3 px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  )}
                  
                  {filteredHaats.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      এই জেলায় কোনো হাট নেই। নিজে লিখতে &quot;অন্যান্য&quot; নির্বাচন করুন।
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 py-3">
                  প্রথমে জেলা নির্বাচন করুন
                </p>
              )}
            </div>

            {/* Breed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                জাত (ঐচ্ছিক)
              </label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none bg-white"
              >
                <option value="">জাত নির্বাচন করুন</option>
                {BREEDS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                আনুমানিক ওজন (কেজি) (ঐচ্ছিক)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="300"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !image || !price || !district}
              className={cn(
                'w-full py-4 rounded-xl font-semibold text-lg transition-all',
                'bg-emerald-900 text-white hover:bg-emerald-800',
                (isSubmitting || !image || !price || !district) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>পোস্ট হচ্ছে...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined">publish</span>
                  <span>পোস্ট করুন</span>
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
