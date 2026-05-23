'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { DISTRICTS, type CowFormData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X, Loader2, Check, AlertCircle, ImageIcon } from 'lucide-react'

const MAX_FILE_SIZE = 350 * 1024 // 350KB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

interface UploadFormProps {
  onSuccess?: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function UploadForm({ onSuccess }: UploadFormProps) {
  const [formData, setFormData] = useState<CowFormData>({
    image: null,
    price: '',
    district: '',
    description: '',
    estimated_weight: '',
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [compressedSize, setCompressedSize] = useState<number | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setCompressedSize(null)
    setIsCompressing(true)

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('এই ধরনের ছবি সাপোর্ট করা হয় না। JPG, PNG, বা WebP ছবি আপলোড করুন।')
      setIsCompressing(false)
      return
    }

    try {
      // Progressive compression to reach target size
      let compressedFile: File = file
      let quality = 0.8
      const maxAttempts = 5

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const options = {
          maxSizeMB: 0.35, // 350KB
          maxWidthOrHeight: 1280,
          useWebWorker: true,
          fileType: 'image/webp' as const,
          initialQuality: quality,
        }

        compressedFile = await imageCompression(file, options)

        if (compressedFile.size <= MAX_FILE_SIZE) {
          break
        }

        // Reduce quality for next attempt
        quality -= 0.15
        if (quality < 0.3) quality = 0.3
      }

      // Final check
      if (compressedFile.size > MAX_FILE_SIZE) {
        setError(`ছবির সাইজ বেশি। কম্প্রেশনের পরেও ছবি ${formatFileSize(compressedFile.size)} (সর্বোচ্চ ৩৫০ KB)।`)
        setIsCompressing(false)
        return
      }

      setFormData({ ...formData, image: compressedFile })
      setCompressedSize(compressedFile.size)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(compressedFile)
    } catch {
      setError('ছবি প্রসেস করা যায়নি। অন্য একটি ছবি ব্যবহার করুন।')
    } finally {
      setIsCompressing(false)
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, image: null })
    setImagePreview(null)
    setCompressedSize(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!formData.image) {
      setError('গরুর ছবি সিলেক্ট করুন')
      return
    }
    if (!formData.price || parseInt(formData.price) <= 0) {
      setError('সঠিক দাম লিখুন')
      return
    }
    if (!formData.district) {
      setError('জেলা সিলেক্ট করুন')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Upload image to storage
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cow-images')
        .upload(fileName, formData.image, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error('ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।')
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cow-images')
        .getPublicUrl(uploadData.path)

      // Insert cow record
      const { error: insertError } = await supabase.from('cows').insert({
        image_url: urlData.publicUrl,
        price: parseInt(formData.price),
        district: formData.district,
        description: formData.description || null,
        estimated_weight: formData.estimated_weight ? parseInt(formData.estimated_weight) : null,
        status: 'approved', // For MVP, auto-approve. Change to 'pending' for moderation
      })

      if (insertError) {
        throw new Error('ডাটা সেভ করা যায়নি। আবার চেষ্টা করুন।')
      }

      // Success
      setSuccess(true)
      setFormData({
        image: null,
        price: '',
        district: '',
        description: '',
        estimated_weight: '',
      })
      setImagePreview(null)
      setCompressedSize(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      onSuccess?.()

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div className="space-y-2">
        <Label>গরুর ছবি *</Label>
        <div className="relative">
          {isCompressing ? (
            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/50">
              <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">ছবি কম্প্রেস হচ্ছে...</span>
            </div>
          ) : imagePreview ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-secondary">
              <Image
                src={imagePreview}
                alt="গরুর প্রিভিউ"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
              {compressedSize && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                  <ImageIcon className="h-3 w-3" />
                  <span>{formatFileSize(compressedSize)}</span>
                </div>
              )}
            </div>
          ) : (
            <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-accent hover:bg-secondary">
              <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">গরুর ছবি আপলোড করতে ক্লিক করুন</span>
              <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP (সর্বোচ্চ ৩৫০ KB)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label htmlFor="price">দাম (টাকা) *</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
          <Input
            id="price"
            type="number"
            placeholder="১৫০০০০"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="pl-8"
            min="0"
          />
        </div>
      </div>

      {/* District */}
      <div className="space-y-2">
        <Label htmlFor="district">জেলা *</Label>
        <Select
          value={formData.district}
          onValueChange={(value) => setFormData({ ...formData, district: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="জেলা সিলেক্ট করুন" />
          </SelectTrigger>
          <SelectContent>
            {DISTRICTS.map((district) => (
              <SelectItem key={district} value={district}>
                {district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Estimated Weight */}
      <div className="space-y-2">
        <Label htmlFor="weight">আনুমানিক ওজন (কেজি) - ঐচ্ছিক</Label>
        <Input
          id="weight"
          type="number"
          placeholder="২৫০"
          value={formData.estimated_weight}
          onChange={(e) => setFormData({ ...formData, estimated_weight: e.target.value })}
          min="0"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">বিস্তারিত - ঐচ্ছিক</Label>
        <Textarea
          id="description"
          placeholder="গরু সম্পর্কে কিছু লিখুন..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-accent/10 p-3 text-sm text-accent">
          <Check className="h-4 w-4 shrink-0" />
          <span>পোস্ট সফলভাবে জমা হয়েছে!</span>
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isSubmitting || isCompressing}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            আপলোড হচ্ছে...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            পোস্ট করুন
          </>
        )}
      </Button>
    </form>
  )
}
