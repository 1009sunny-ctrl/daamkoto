'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const navItems = [
  { href: '/', icon: 'home', label: 'হোম', labelEn: 'Home' },
  { href: '/upload', icon: 'add_circle', label: 'আপলোড', labelEn: 'Upload' },
  { href: '/huts', icon: 'storefront', label: 'হাট', labelEn: 'Huts' },
  { href: '/leaderboard', icon: 'leaderboard', label: 'লিডারবোর্ড', labelEn: 'Top' },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch user role from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, display_name')
            .eq('id', session.user.id)
            .single()
          
          if (profile) {
            setUserRole(profile.role)
          }
        }
      } catch (error) {
        console.error('[v0] Error fetching session:', error)
      } finally {
        setLoading(false)
      }
    }
    
    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, display_name')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          setUserRole(profile.role)
        }
      } else {
        setUserRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    setShowUserMenu(false)
    router.push('/')
    router.refresh()
  }

  const isAdmin = userRole && ['admin', 'super_admin', 'moderator', 'content_manager'].includes(userRole)

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="glass rounded-full px-2 py-2 shadow-lg">
          <div className="flex items-center gap-1">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 px-3 py-1 mr-2">
              <Image
                src="/images/logo.jpeg"
                alt="Koto Nilo"
                width={40}
                height={40}
                className="rounded-lg"
              />
            </Link>
            
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200',
                    isActive
                      ? 'bg-emerald-900 text-white'
                      : 'text-emerald-800 hover:bg-emerald-100'
                  )}
                >
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}

            {/* User Section */}
            {!loading && (
              <>
                {user ? (
                  <div className="relative ml-2">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-lg">expand_more</span>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                          {userRole && (
                            <p className="text-xs text-emerald-600 capitalize">{userRole}</p>
                          )}
                        </div>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                            অ্যাডমিন প্যানেল
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <span className="material-symbols-outlined text-lg">logout</span>
                          লগআউট
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="glass border-t border-white/20 px-2 py-2 safe-area-inset-bottom">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 min-w-[64px]',
                    isActive
                      ? 'bg-emerald-900 text-white'
                      : 'text-emerald-800'
                  )}
                >
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      {/* Mobile Header */}
<header className="md:hidden fixed top-0 left-0 right-0 z-40">
  <div className="glass px-4 py-3 flex items-center justify-center relative h-16">

    {/* Center Logo + Name */}
    <Link
  href="/"
  className="flex items-center justify-center"
>
  <Image
    src="/images/logo1.jpeg"
    alt="Koto Nilo"
    width={150}
    height={45}
    className="object-contain"
    priority
  />
</Link>

    {/* User Menu */}
    {!loading && user && (
      <div className="absolute right-4">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-800"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.email}
                </p>

                {userRole && (
                  <p className="text-xs text-emerald-600 capitalize">
                    {userRole}
                  </p>
                )}
              </div>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="material-symbols-outlined text-lg">
                    admin_panel_settings
                  </span>
                  অ্যাডমিন প্যানেল
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <span className="material-symbols-outlined text-lg">
                  logout
                </span>
                লগআউট
              </button>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
</header>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  )
}

export function OrganicBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="blob blob-1 -top-32 -left-32" />
      <div className="blob blob-2 top-1/4 -right-32" />
      <div className="blob blob-3 bottom-1/4 left-1/4" />
    </div>
  )
}
