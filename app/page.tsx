import { createClient } from '@/lib/supabase/server'
import { Navigation, OrganicBlobs } from '@/components/navigation'
import { CowFeed } from '@/components/cow-feed'
import Link from 'next/link'

export const revalidate = 0

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: cows } = await supabase
    .from('cows')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(12)

  const { data: stats } = await supabase
    .from('cows')
    .select('price')
    .eq('status', 'approved')

  const totalPosts = stats?.length || 0
  const avgPrice = stats?.length 
    ? Math.round(stats.reduce((acc, c) => acc + c.price, 0) / stats.length) 
    : 0

  return (
    <main className="min-h-screen relative">
      <OrganicBlobs />
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium mb-6">
            <span className="material-symbols-outlined text-lg">verified</span>
            <span>বাংলাদেশের #১ কোরবানি পশু মূল্য প্ল্যাটফর্ম</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-emerald-950 mb-4 leading-tight">
            কত নিলো?
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            আপনার কোরবানির পশুর দাম শেয়ার করুন, অন্যদের দাম দেখুন এবং 
            <span className="text-emerald-600 font-semibold"> ভালো দাম</span> নাকি 
            <span className="text-orange-500 font-semibold"> বেশি দাম</span> তা রেট করুন।
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-emerald-900 text-white font-semibold text-lg shadow-lg hover:bg-emerald-800 transition-all hover:scale-105"
            >
              <span className="material-symbols-outlined">add_photo_alternate</span>
              <span>দাম শেয়ার করুন</span>
            </Link>
            <Link
              href="/huts"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-emerald-900 font-semibold text-lg shadow-lg border border-emerald-200 hover:bg-emerald-50 transition-all"
            >
              <span className="material-symbols-outlined">storefront</span>
              <span>হাট দেখুন</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="premium-card p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">pets</span>
              </div>
              <div className="text-2xl font-bold text-emerald-900">{totalPosts}</div>
              <div className="text-sm text-gray-500">মোট পোস্ট</div>
            </div>
            <div className="premium-card p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600 text-2xl">payments</span>
              </div>
              <div className="text-2xl font-bold text-emerald-900">৳{avgPrice.toLocaleString('bn-BD')}</div>
              <div className="text-sm text-gray-500">গড় দাম</div>
            </div>
            <div className="premium-card p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 text-2xl">storefront</span>
              </div>
              <div className="text-2xl font-bold text-emerald-900">১০+</div>
              <div className="text-sm text-gray-500">হাট</div>
            </div>
            <div className="premium-card p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-purple-600 text-2xl">location_on</span>
              </div>
              <div className="text-2xl font-bold text-emerald-900">১২+</div>
              <div className="text-sm text-gray-500">জেলা</div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-8 px-4 pb-32 md:pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-emerald-950">সাম্প্রতিক পোস্ট</h2>
            <Link 
              href="/all" 
              className="flex items-center gap-1 text-emerald-600 font-medium hover:text-emerald-700"
            >
              <span>সব দেখুন</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>

          {cows && cows.length > 0 ? (
            <CowFeed initialCows={cows} />
          ) : (
            <div className="premium-card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400 text-3xl">pets</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">এখনো কোনো পোস্ট নেই</h3>
              <p className="text-gray-500 mb-4">প্রথম পোস্ট করুন এবং অন্যদের সাহায্য করুন!</p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-900 text-white font-medium"
              >
                <span className="material-symbols-outlined">add</span>
                <span>পোস্ট করুন</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-4 py-8 bg-white/50">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>© ২০২৬ Koto Nilo by Pixork। ঈদুল আযহার জন্য তৈরি।</p>
        </div>
      </footer>
    </main>
  )
}
