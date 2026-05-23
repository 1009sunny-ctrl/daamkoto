'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { OrganicBlobs } from '@/components/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Handle the hash fragment from the email link
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    
    if (accessToken && refreshToken) {
      const supabase = createClient()
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড মিলছে না।')
      return
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'পাসওয়ার্ড আপডেট করা যায়নি।')
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
              <span className="material-symbols-outlined text-emerald-600 text-3xl">check_circle</span>
            </div>
            <h1 className="text-2xl font-bold text-emerald-950 mb-2">পাসওয়ার্ড আপডেট হয়েছে</h1>
            <p className="text-gray-600 mb-6">
              আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। লগইন পেজে নিয়ে যাওয়া হচ্ছে...
            </p>
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
            <h1 className="text-2xl font-bold text-emerald-950 mt-4">নতুন পাসওয়ার্ড সেট করুন</h1>
            <p className="text-gray-600 text-sm mt-1">আপনার নতুন পাসওয়ার্ড লিখুন</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                নতুন পাসওয়ার্ড
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                পাসওয়ার্ড নিশ্চিত করুন
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="পাসওয়ার্ড আবার লিখুন"
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
              {isLoading ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-700">
              লগইন পেজে ফিরে যান
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
