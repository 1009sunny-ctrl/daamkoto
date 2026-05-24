import { createClient } from '@/lib/supabase/server'
import { Navigation, OrganicBlobs } from '@/components/navigation'
import { CowFeed } from '@/components/cow-feed'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 0

interface HutDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function HutDetailPage({ params }: HutDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  // Fetch the haat details
  const { data: hut } = await supabase
    .from('huts')
    .select('*')
    .eq('id', id)
    .single()

  if (!hut) {
    notFound()
  }

  // Fetch district info
  const { data: district } = hut.district_id 
    ? await supabase
        .from('districts')
        .select('*')
        .eq('id', hut.district_id)
        .single()
    : { data: null }

  // Fetch approved cows for this haat using hut_id relationship
  const { data: cows } = await supabase
    .from('cows')
    .select('*')
    .eq('hut_id', id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  // Calculate stats from approved cows
  const cowCount = cows?.length || 0
  const totalPrice = (cows || []).reduce((sum, cow) => sum + (cow.price || 0), 0)
  const avgPrice = cowCount > 0 ? Math.round(totalPrice / cowCount) : 0

  return (
    <main className="min-h-screen relative">
      <OrganicBlobs />
      <Navigation />
      
      <div className="pt-24 md:pt-32 px-4 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link href="/huts" className="hover:text-emerald-600 transition-colors">
              হাট সমূহ
            </Link>
            <span className="material-symbols-outlined text-base">chevron_right</span>
            {district && (
              <>
                <span>{district.name_bn}</span>
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </>
            )}
            <span className="text-emerald-600 font-medium">{hut.name_bn || hut.name}</span>
          </div>

          {/* Haat Header */}
          <div className="premium-card p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-emerald-600 text-3xl">storefront</span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-emerald-950 mb-1">
                  {hut.name_bn || hut.name}
                </h1>
                {district && (
                  <p className="text-gray-500 mb-4">
                    <span className="material-symbols-outlined text-sm align-middle mr-1">location_on</span>
                    {district.name_bn}
                  </p>
                )}
                
                {/* Stats */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50">
                    <span className="material-symbols-outlined text-emerald-600">pets</span>
                    <span className="text-emerald-900 font-medium">{cowCount} টি পোস্ট</span>
                  </div>
                  {avgPrice > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50">
                      <span className="material-symbols-outlined text-amber-600">payments</span>
                      <span className="text-amber-900 font-medium">গড় ৳{avgPrice.toLocaleString('bn-BD')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cow Posts */}
          {cows && cows.length > 0 ? (
            <div>
              <h2 className="text-xl font-bold text-emerald-900 mb-4">এই হাটের পোস্টসমূহ</h2>
              <CowFeed initialCows={cows} />
            </div>
          ) : (
            <div className="premium-card p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400 text-4xl">pets</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">এই হাটে এখনো কোনো গরুর পোস্ট নেই</h3>
              <p className="text-gray-500 mb-6">প্রথম পোস্টটি করে এই হাটের তথ্য শুরু করুন!</p>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
                পোস্ট করুন
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
