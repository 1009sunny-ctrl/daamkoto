'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { OrganicBlobs } from '@/components/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/admin')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'লগইন করা যায়নি।')
    } finally {
      setIsLoading(false)
    }
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
            <h1 className="text-2xl font-bold text-emerald-950 mt-4">লগইন করুন</h1>
            <p className="text-gray-600 text-sm mt-1">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                পাসওয়ার্ড
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="আপনার পাসওয়ার্ড"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700">
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
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
              {isLoading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            অ্যাকাউন্ট নেই?{' '}
            <Link href="/auth/signup" className="text-emerald-600 font-medium hover:text-emerald-700">
              সাইন আপ করুন
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
