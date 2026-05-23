'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', icon: 'home', label: 'হোম', labelEn: 'Home' },
  { href: '/upload', icon: 'add_circle', label: 'আপলোড', labelEn: 'Upload' },
  { href: '/huts', icon: 'storefront', label: 'হাট', labelEn: 'Huts' },
  { href: '/leaderboard', icon: 'leaderboard', label: 'লিডারবোর্ড', labelEn: 'Top' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <div className="glass rounded-full px-2 py-2 shadow-lg">
          <div className="flex items-center gap-1">
            <Link href="/" className="flex items-center gap-2 px-4 py-2 mr-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">pets</span>
              </div>
              <span className="font-bold text-emerald-900 text-lg">Koto Nilo</span>
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
      <header className="md:hidden fixed top-0 left-0 right-0 z-40">
        <div className="glass px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">pets</span>
            </div>
            <span className="font-bold text-emerald-900 text-lg">Koto Nilo</span>
          </Link>
          <Link 
            href="/auth/login"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium"
          >
            <span className="material-symbols-outlined text-lg">person</span>
            <span>লগইন</span>
          </Link>
        </div>
      </header>
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
