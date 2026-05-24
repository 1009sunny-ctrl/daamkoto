'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { type Cow, type Profile, type Hut, type District, type Report, type UserRole, type AnalyticsStats } from '@/lib/types'
import { HaatManagement } from './haat-management'
import { SiteSettings } from './site-settings'
import { formatPrice, formatTimeAgoBangla } from '@/lib/utils/voting'
import { hasPermission, getRoleDisplayName, getRoleBadgeColor, canAccessAdmin } from '@/lib/utils/permissions'
import { cn } from '@/lib/utils'

interface AdminDashboardProps {
  initialCows: Cow[]
  userEmail: string
  userRole: UserRole
}

type MainTabType = 'dashboard' | 'posts' | 'haats' | 'districts' | 'votes' | 'reports' | 'users' | 'settings'
type PostTabType = 'pending' | 'approved' | 'rejected' | 'featured' | 'hidden'

export function AdminDashboard({ initialCows, userEmail, userRole }: AdminDashboardProps) {
  const router = useRouter()
  const [cows, setCows] = useState(initialCows)
  const [mainTab, setMainTab] = useState<MainTabType>('dashboard')
  const [postTab, setPostTab] = useState<PostTabType>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedCows, setSelectedCows] = useState<string[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Data states
  const [haats, setHaats] = useState<Hut[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<AnalyticsStats | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const supabase = createClient()

      try {
        if (mainTab === 'dashboard') {
          // Fetch analytics stats
          const [cowsRes, votesRes, reportsRes, usersRes] = await Promise.all([
            supabase.from('cows').select('price, status, created_at'),
            supabase.from('votes').select('created_at', { count: 'exact' }),
            supabase.from('reports').select('*', { count: 'exact' }),
            supabase.from('profiles').select('*', { count: 'exact' }),
          ])

          const today = new Date().toISOString().split('T')[0]
          const cowsData = cowsRes.data || []
          
          setStats({
            totalPosts: cowsData.length,
            pendingPosts: cowsData.filter(c => c.status === 'pending').length,
            approvedPosts: cowsData.filter(c => c.status === 'approved').length,
            rejectedPosts: cowsData.filter(c => c.status === 'rejected').length,
            totalVotes: votesRes.count || 0,
            totalReports: reportsRes.count || 0,
            totalUsers: usersRes.count || 0,
            avgPrice: cowsData.length > 0 ? Math.round(cowsData.reduce((acc, c) => acc + (c.price || 0), 0) / cowsData.length) : 0,
            postsToday: cowsData.filter(c => c.created_at?.startsWith(today)).length,
            votesToday: 0, // Would need more complex query
          })
        } else if (mainTab === 'haats') {
          const { data } = await supabase.from('huts').select('*').order('name')
          setHaats(data || [])
        } else if (mainTab === 'districts') {
          const { data } = await supabase.from('districts').select('*').order('division, name')
          setDistricts(data || [])
        } else if (mainTab === 'users' && hasPermission(userRole, 'users:view')) {
          const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
          setUsers(data || [])
        } else if (mainTab === 'reports') {
          const { data } = await supabase.from('reports').select('*, cow:cows(*)').order('created_at', { ascending: false })
          setReports(data || [])
        }
      } catch (error) {
        console.error('[v0] Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [mainTab, userRole])

  const getFilteredCows = () => {
    if (postTab === 'featured') return cows.filter(c => c.is_featured)
    if (postTab === 'hidden') return cows.filter(c => c.is_hidden)
    return cows.filter(c => c.status === postTab && !c.is_hidden)
  }

  const filteredCows = getFilteredCows()

  const handleAction = async (cowId: string, action: 'approve' | 'reject' | 'delete' | 'feature' | 'unfeature' | 'hide' | 'unhide') => {
    setActionLoading(cowId)
    const supabase = createClient()

    try {
      if (action === 'delete') {
        const cow = cows.find(c => c.id === cowId)
        if (cow) {
          const urlParts = cow.image_url.split('/')
          const fileName = urlParts[urlParts.length - 1]
          await supabase.storage.from('cow-images').remove([fileName])
        }
        await supabase.from('cows').delete().eq('id', cowId)
        setCows(prev => prev.filter(c => c.id !== cowId))
      } else if (action === 'feature' || action === 'unfeature') {
        const isFeatured = action === 'feature'
        await supabase.from('cows').update({ is_featured: isFeatured }).eq('id', cowId)
        setCows(prev => prev.map(c => c.id === cowId ? { ...c, is_featured: isFeatured } : c))
      } else if (action === 'hide' || action === 'unhide') {
        const isHidden = action === 'hide'
        await supabase.from('cows').update({ is_hidden: isHidden }).eq('id', cowId)
        setCows(prev => prev.map(c => c.id === cowId ? { ...c, is_hidden: isHidden } : c))
      } else {
        const newStatus = action === 'approve' ? 'approved' : 'rejected'
        await supabase.from('cows').update({ 
          status: newStatus,
          moderated_at: new Date().toISOString()
        }).eq('id', cowId)
        setCows(prev => prev.map(c => c.id === cowId ? { ...c, status: newStatus } : c))
      }
    } catch (error) {
      console.error('[v0] Action error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedCows.length === 0) return
    
    for (const cowId of selectedCows) {
      await handleAction(cowId, action)
    }
    setSelectedCows([])
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleUserRoleChange = async (userId: string, newRole: UserRole) => {
    const supabase = createClient()
    try {
      await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (error) {
      console.error('[v0] Role update error:', error)
    }
  }

  const counts = {
    pending: cows.filter(c => c.status === 'pending').length,
    approved: cows.filter(c => c.status === 'approved' && !c.is_hidden).length,
    rejected: cows.filter(c => c.status === 'rejected').length,
    featured: cows.filter(c => c.is_featured).length,
    hidden: cows.filter(c => c.is_hidden).length,
  }

  const sidebarItems: { key: MainTabType; label: string; icon: string; permission?: string }[] = [
    { key: 'dashboard', label: 'ড্যাশবোর্ড', icon: 'dashboard' },
    { key: 'posts', label: 'পোস্ট ম্যানেজমেন্ট', icon: 'article', permission: 'posts:view' },
    { key: 'haats', label: 'হাট ম্যানেজমেন্ট', icon: 'storefront', permission: 'haats:view' },
    { key: 'districts', label: 'জেলা ম্যানেজমেন্ট', icon: 'location_city', permission: 'districts:view' },
    { key: 'votes', label: 'ভোট বিশ্লেষণ', icon: 'how_to_vote', permission: 'votes:view' },
    { key: 'reports', label: 'রিপোর্ট', icon: 'flag', permission: 'reports:view' },
    { key: 'users', label: 'ইউজার ম্যানেজমেন্ট', icon: 'group', permission: 'users:view' },
    { key: 'settings', label: 'সেটিংস', icon: 'settings', permission: 'settings:view' },
  ]

  const postTabs: { key: PostTabType; label: string; icon: string }[] = [
    { key: 'pending', label: 'অপেক্ষমাণ', icon: 'hourglass_top' },
    { key: 'approved', label: 'অনুমোদিত', icon: 'check_circle' },
    { key: 'rejected', label: 'বাতিল', icon: 'cancel' },
    { key: 'featured', label: 'ফিচার্ড', icon: 'star' },
    { key: 'hidden', label: 'লুকানো', icon: 'visibility_off' },
  ]

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-emerald-950 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-emerald-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-white">pets</span>
              </div>
              <div>
                <h1 className="font-bold text-white">Koto Nilo</h1>
                <p className="text-xs text-emerald-400">অ্যাডমিন প্যানেল</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-emerald-900">
            <p className="text-sm text-emerald-300 truncate">{userEmail}</p>
            <span className={cn('inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium', getRoleBadgeColor(userRole))}>
              {getRoleDisplayName(userRole)}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map(item => {
              if (item.permission && !hasPermission(userRole, item.permission as never)) return null
              return (
                <button
                  key={item.key}
                  onClick={() => { setMainTab(item.key); setSidebarOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    mainTab === item.key
                      ? 'bg-emerald-800 text-white'
                      : 'text-emerald-300 hover:bg-emerald-900 hover:text-white'
                  )}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-emerald-900 space-y-2">
            <a
              href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-300 hover:bg-emerald-900 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">home</span>
              <span>হোমপেজে যান</span>
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-900/30 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <h2 className="font-semibold text-gray-900">
                {sidebarItems.find(i => i.key === mainTab)?.label}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {mainTab === 'posts' && selectedCows.length > 0 && (
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-gray-600">{selectedCows.length} নির্বাচিত</span>
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium hover:bg-emerald-200"
                  >
                    অনুমোদন
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-sm font-medium hover:bg-orange-200"
                  >
                    বাতিল
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200"
                  >
                    মুছুন
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6">
          {/* Dashboard View */}
          {mainTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="premium-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600 text-2xl">article</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats?.totalPosts ?? 0}</div>
                      <div className="text-sm text-gray-500">মোট পোস্ট</div>
                    </div>
                  </div>
                </div>
                <div className="premium-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-amber-600 text-2xl">hourglass_top</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-amber-600">{stats?.pendingPosts ?? 0}</div>
                      <div className="text-sm text-gray-500">অপেক্ষমাণ</div>
                    </div>
                  </div>
                </div>
                <div className="premium-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-600 text-2xl">how_to_vote</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">{stats?.totalVotes ?? 0}</div>
                      <div className="text-sm text-gray-500">মোট ভোট</div>
                    </div>
                  </div>
                </div>
                <div className="premium-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-purple-600 text-2xl">group</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{stats?.totalUsers ?? 0}</div>
                      <div className="text-sm text-gray-500">ইউজার</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="premium-card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">দ্রুত কার্যক্রম</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => { setMainTab('posts'); setPostTab('pending') }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-amber-600 text-2xl">pending_actions</span>
                    <span className="text-sm font-medium text-amber-700">পেন্ডিং রিভিউ ({counts.pending})</span>
                  </button>
                  <button
                    onClick={() => setMainTab('reports')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-red-600 text-2xl">flag</span>
                    <span className="text-sm font-medium text-red-700">রিপোর্ট ({stats?.totalReports ?? 0})</span>
                  </button>
                  <button
                    onClick={() => setMainTab('haats')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-emerald-600 text-2xl">add_business</span>
                    <span className="text-sm font-medium text-emerald-700">নতুন হাট</span>
                  </button>
                  <button
                    onClick={() => setMainTab('settings')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-gray-600 text-2xl">tune</span>
                    <span className="text-sm font-medium text-gray-700">সেটিংস</span>
                  </button>
                </div>
              </div>

              {/* Price Stats */}
              <div className="premium-card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">মূল্য পরিসংখ্যান</h3>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-emerald-600">৳{(stats?.avgPrice ?? 0).toLocaleString('bn-BD')}</div>
                  <div className="text-gray-500 mt-2">গড় মূল্য</div>
                </div>
              </div>
            </div>
          )}

          {/* Posts Management View */}
          {mainTab === 'posts' && (
            <div className="space-y-4">
              {/* Post Tabs */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {postTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setPostTab(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors whitespace-nowrap',
                      postTab === tab.key
                        ? 'bg-emerald-900 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    )}
                  >
                    <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs',
                      postTab === tab.key ? 'bg-white/20' : 'bg-gray-100'
                    )}>
                      {counts[tab.key]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Select All */}
              {filteredCows.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCows.length === filteredCows.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCows(filteredCows.map(c => c.id))
                        } else {
                          setSelectedCows([])
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">সব নির্বাচন করুন</span>
                  </label>
                </div>
              )}

              {/* Posts Grid */}
              {filteredCows.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCows.map(cow => (
                    <div key={cow.id} className={cn(
                      'premium-card overflow-hidden',
                      selectedCows.includes(cow.id) && 'ring-2 ring-emerald-500'
                    )}>
                      {/* Selection Checkbox */}
                      <div className="absolute top-3 right-3 z-10">
                        <input
                          type="checkbox"
                          checked={selectedCows.includes(cow.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCows(prev => [...prev, cow.id])
                            } else {
                              setSelectedCows(prev => prev.filter(id => id !== cow.id))
                            }
                          }}
                          className="w-5 h-5 rounded border-gray-300 bg-white/80"
                        />
                      </div>

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
                        {cow.is_featured && (
                          <div className="absolute bottom-3 left-3 bg-amber-500 text-white rounded-full px-2 py-0.5 text-xs font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">star</span>
                            ফিচার্ড
                          </div>
                        )}
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

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {postTab === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(cow.id, 'approve')}
                                disabled={actionLoading === cow.id}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50 text-sm"
                              >
                                <span className="material-symbols-outlined text-lg">check</span>
                                অনুমোদন
                              </button>
                              <button
                                onClick={() => handleAction(cow.id, 'reject')}
                                disabled={actionLoading === cow.id}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 transition-colors disabled:opacity-50 text-sm"
                              >
                                <span className="material-symbols-outlined text-lg">close</span>
                                বাতিল
                              </button>
                            </>
                          )}
                          {postTab === 'approved' && (
                            <>
                              <button
                                onClick={() => handleAction(cow.id, cow.is_featured ? 'unfeature' : 'feature')}
                                disabled={actionLoading === cow.id}
                                className={cn(
                                  'flex-1 flex items-center justify-center gap-1 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 text-sm',
                                  cow.is_featured ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                                )}
                              >
                                <span className="material-symbols-outlined text-lg">star</span>
                                {cow.is_featured ? 'আনফিচার' : 'ফিচার'}
                              </button>
                              <button
                                onClick={() => handleAction(cow.id, 'hide')}
                                disabled={actionLoading === cow.id}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
                              >
                                <span className="material-symbols-outlined text-lg">visibility_off</span>
                                লুকান
                              </button>
                            </>
                          )}
                          {postTab === 'hidden' && (
                            <button
                              onClick={() => handleAction(cow.id, 'unhide')}
                              disabled={actionLoading === cow.id}
                              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-100 text-emerald-700 font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50 text-sm"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                              দেখান
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
                  <h3 className="text-lg font-semibold text-gray-700">কোনো পোস্ট নেই</h3>
                </div>
              )}
            </div>
          )}

          {/* Haats Management View */}
          {mainTab === 'haats' && (
            <HaatManagement 
              initialHaats={haats} 
              districts={districts}
              onUpdate={() => {
                // Refetch haats data
                const fetchHaats = async () => {
                  const supabase = createClient()
                  const { data } = await supabase.from('huts').select('*').order('name')
                  if (data) setHaats(data)
                }
                fetchHaats()
              }}
            />
          )}

          {/* Districts Management View */}
          {mainTab === 'districts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">জেলা তালিকা ({districts.length})</h3>
              </div>
              
              {loading ? (
                <div className="premium-card p-12 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : (
                <div className="premium-card overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">জেলা</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">বিভাগ</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">স্ট্যাটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {districts.map(district => (
                        <tr key={district.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{district.name_bn}</div>
                            <div className="text-sm text-gray-500">{district.name}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{district.division}</td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                              district.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                            )}>
                              {district.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Users Management View */}
          {mainTab === 'users' && hasPermission(userRole, 'users:view') && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">ইউজার তালিকা ({users.length})</h3>
              </div>
              
              {loading ? (
                <div className="premium-card p-12 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : (
                <div className="premium-card overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">ইমেইল</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">নাম</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">রোল</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">যোগদান</th>
                        {hasPermission(userRole, 'users:roles') && (
                          <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">অ্যাকশন</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{user.email}</td>
                          <td className="px-4 py-3 text-gray-600">{user.display_name || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex px-2 py-1 rounded-full text-xs font-medium', getRoleBadgeColor(user.role))}>
                              {getRoleDisplayName(user.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatTimeAgoBangla(user.created_at)}</td>
                          {hasPermission(userRole, 'users:roles') && (
                            <td className="px-4 py-3 text-right">
                              <select
                                value={user.role}
                                onChange={(e) => handleUserRoleChange(user.id, e.target.value as UserRole)}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                                disabled={user.email === userEmail}
                              >
                                <option value="user">ইউজার</option>
                                <option value="analyst">বিশ্লেষক</option>
                                <option value="moderator">মডারেটর</option>
                                <option value="content_manager">কন্টেন্ট ম্যানেজার</option>
                                <option value="admin">অ্যাডমিন</option>
                                <option value="super_admin">সুপার অ্যাডমিন</option>
                              </select>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Reports View */}
          {mainTab === 'reports' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">রিপোর্ট তালিকা ({reports.length})</h3>
              
              {loading ? (
                <div className="premium-card p-12 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map(report => (
                    <div key={report.id} className="premium-card p-4">
                      <div className="flex items-start gap-4">
                        {report.cow && (
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                            <Image
                              src={report.cow.image_url}
                              alt="Reported cow"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-red-500">flag</span>
                            <span className="font-medium text-gray-900">রিপোর্ট #{report.id.slice(0, 8)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{report.reason || 'অনুপযুক্ত কন্টেন্ট'}</p>
                          <p className="text-xs text-gray-400">{formatTimeAgoBangla(report.created_at)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200">
                            পোস্ট মুছুন
                          </button>
                          <button className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200">
                            উপেক্ষা
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="premium-card p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-400 text-3xl">flag</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700">কোনো রিপোর্ট নেই</h3>
                </div>
              )}
            </div>
          )}

          {/* Settings View */}
          {mainTab === 'settings' && hasPermission(userRole, 'settings:view') && (
            <SiteSettings onUpdate={() => {}} />
          )}

          {/* Votes View */}
          {mainTab === 'votes' && (
            <div className="space-y-6">
              <div className="premium-card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">ভোট বিশ্লেষণ</h3>
                <p className="text-gray-500">ভোট বিশ্লেষণ ফিচার শীঘ্রই আসছে...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
