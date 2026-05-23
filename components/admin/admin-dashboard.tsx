'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { type Cow } from '@/lib/types'
import { formatPrice, formatTimeAgoBangla } from '@/lib/utils/voting'
import { cn } from '@/lib/utils'

interface AdminDashboardProps {
  initialCows: Cow[]
  userEmail: string
}

type TabType = 'pending' | 'approved' | 'rejected'

export function AdminDashboard({ initialCows, userEmail }: AdminDashboardProps) {
  const router = useRouter()
  const [cows, setCows] = useState(initialCows)
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const filteredCows = cows.filter((cow) => cow.status === activeTab)

  const handleAction = async (cowId: string, action: 'approve' | 'reject' | 'delete') => {
    setActionLoading(cowId)
    const supabase = createClient()

    try {
      if (action === 'delete') {
        // Get the cow to delete the image
        const cow = cows.find((c) => c.id === cowId)
        if (cow) {
          // Extract filename from URL
          const urlParts = cow.image_url.split('/')
          const fileName = urlParts[urlParts.length - 1]
          
          // Delete from storage
          await supabase.storage.from('cow-images').remove([fileName])
        }

        // Delete from database
        await supabase.from('cows').delete().eq('id', cowId)
        setCows((prev) => prev.filter((c) => c.id !== cowId))
      } else {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        await supabase.from('cows').update({ status: newStatus }).eq('id', cowId)
        setCows((prev) =>
          prev.map((c) => (c.id === cowId ? { ...c, status: newStatus } : c))
        )
      }
    } catch (error) {
      console.error('Action error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'pending', label: 'অপেক্ষমাণ', icon: 'hourglass_top' },
    { key: 'approved', label: 'অনুমোদিত', icon: 'check_circle' },
    { key: 'rejected', label: 'বাতিল', icon: 'cancel' },
  ]

  const counts = {
    pending: cows.filter((c) => c.status === 'pending').length,
    approved: cows.filter((c) => c.status === 'approved').length,
    rejected: cows.filter((c) => c.status === 'rejected').length,
  }

  return (
    <main className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-white">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="font-bold text-emerald-950">অ্যাডমিন প্যানেল</h1>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">home</span>
              <span className="hidden sm:inline">হোম</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="premium-card p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{counts.pending}</div>
            <div className="text-sm text-gray-500">অপেক্ষমাণ</div>
          </div>
          <div className="premium-card p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{counts.approved}</div>
            <div className="text-sm text-gray-500">অনুমোদিত</div>
          </div>
          <div className="premium-card p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{counts.rejected}</div>
            <div className="text-sm text-gray-500">বাতিল</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-emerald-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                activeTab === tab.key ? 'bg-white/20' : 'bg-gray-100'
              )}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Posts Grid */}
        {filteredCows.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCows.map((cow) => (
              <div key={cow.id} className="premium-card overflow-hidden">
                {/* Image */}
                <div className="relative aspect-[4/3]">
                  <Image
                    src={cow.image_url}
                    alt={cow.title || 'Cow'}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="font-bold text-emerald-900">{formatPrice(cow.price)}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  {cow.title && (
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{cow.title}</h3>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span className="material-symbols-outlined text-base">location_on</span>
                    <span>{cow.hut || cow.district}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <span className="material-symbols-outlined text-base">schedule</span>
                    <span>{formatTimeAgoBangla(cow.created_at)}</span>
                  </div>
                  {cow.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{cow.description}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {activeTab === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(cow.id, 'approve')}
                          disabled={actionLoading === cow.id}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">check</span>
                          <span>অনুমোদন</span>
                        </button>
                        <button
                          onClick={() => handleAction(cow.id, 'reject')}
                          disabled={actionLoading === cow.id}
                          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                          <span>বাতিল</span>
                        </button>
                      </>
                    )}
                    {activeTab === 'approved' && (
                      <button
                        onClick={() => handleAction(cow.id, 'reject')}
                        disabled={actionLoading === cow.id}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                        <span>বাতিল করুন</span>
                      </button>
                    )}
                    {activeTab === 'rejected' && (
                      <button
                        onClick={() => handleAction(cow.id, 'approve')}
                        disabled={actionLoading === cow.id}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">check</span>
                        <span>অনুমোদন করুন</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(cow.id, 'delete')}
                      disabled={actionLoading === cow.id}
                      className="px-3 py-2 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="premium-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-400 text-3xl">inbox</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {activeTab === 'pending' && 'কোনো অপেক্ষমাণ পোস্ট নেই'}
              {activeTab === 'approved' && 'কোনো অনুমোদিত পোস্ট নেই'}
              {activeTab === 'rejected' && 'কোনো বাতিল পোস্ট নেই'}
            </h3>
          </div>
        )}
      </div>
    </main>
  )
}
