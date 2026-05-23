'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { OrganicBlobs } from '@/components/navigation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
          `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'রিসেট লিংক পাঠানো যায়নি।')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen relative flex items-center justify-center p-4">
        <OrganicBlobs />
        
        <div className="w-full max-w-md">
          <div className="premium-card p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 text-3xl">mark_email_read</span>
            </div>
            <h1 className="text-2xl font-bold text-emerald-950 mb-2">ইমেইল পাঠানো হয়েছে</h1>
            <p className="text-gray-600 mb-6">
              আমরা {email} এ পাসওয়ার্ড রিসেট লিংক পাঠিয়েছি। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-900 text-white font-medium"
            >
              লগইন পেজে ফিরে যান
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4">
      <OrganicBlobs />
      
      <div className="w-full max-w-md">
        <div className="premium-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">pets</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-emerald-950 mt-4">পাসওয়ার্ড ভুলে গেছেন?</h1>
            <p className="text-gray-600 text-sm mt-1">আপনার ইমেইলে রিসেট লিংক পাঠানো হবে</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ইমেইল
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="আপনার ইমেইল"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold bg-emerald-900 text-white hover:bg-emerald-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            পাসওয়ার্ড মনে আছে?{' '}
            <Link href="/auth/login" className="text-emerald-600 font-medium hover:text-emerald-700">
              লগইন করুন
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              হোমে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
