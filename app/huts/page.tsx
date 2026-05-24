import { createClient } from '@/lib/supabase/server'
import { Navigation, OrganicBlobs } from '@/components/navigation'
import Link from 'next/link'

export const revalidate = 0

export default async function HutsPage() {
  const supabase = await createClient()
  
  // Fetch real districts from database instead of hardcoded DIVISIONS
  const { data: districts } = await supabase
    .from('districts')
    .select('*')
    .eq('is_active', true)
    .order('name_bn')

  // Fetch all active haats
  const { data: huts } = await supabase
    .from('huts')
    .select('*')
    .eq('is_active', true)
    .order('total_uploads', { ascending: false })

  // Fetch approved cows to calculate real post counts and avg prices per haat
  const { data: approvedCows } = await supabase
    .from('cows')
    .select('hut_id, price')
    .eq('status', 'approved')
    .not('hut_id', 'is', null)

  // Calculate stats per haat from approved cows
  const haatStats = (approvedCows || []).reduce((acc, cow) => {
    if (cow.hut_id) {
      if (!acc[cow.hut_id]) {
        acc[cow.hut_id] = { count: 0, totalPrice: 0 }
      }
      acc[cow.hut_id].count++
      acc[cow.hut_id].totalPrice += cow.price || 0
    }
    return acc
  }, {} as Record<string, { count: number; totalPrice: number }>)

  // Enhance huts with calculated stats
  const hutsWithStats = (huts || []).map(hut => {
    const stats = haatStats[hut.id] || { count: 0, totalPrice: 0 }
    return {
      ...hut,
      calculated_uploads: stats.count,
      calculated_avg_price: stats.count > 0 ? Math.round(stats.totalPrice / stats.count) : 0,
    }
  })

  // Group huts by district_id for proper linking
  const hutsByDistrictId = hutsWithStats.reduce((acc, hut) => {
  const key = String(hut.district_id || hut.district || 'unknown')

  if (!acc[key]) {
    acc[key] = []
  }

  acc[key].push(hut)

  return acc
}, {} as Record<string, typeof hutsWithStats>)

  return (
    <main className="min-h-screen relative">
      <OrganicBlobs />
      <Navigation />
      
      <div className="pt-24 md:pt-32 px-4 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-950 mb-2">হাট সমূহ</h1>
            <p className="text-gray-600">বাংলাদেশের বিভিন্ন পশুর হাট থেকে দাম দেখুন</p>
          </div>

          {/* District Cards - fetched from database */}
          <div className="space-y-8">
            {(districts || [])
  .map((district) => {
    const districtHuts = hutsByDistrictId[String(district.id)] || []
    const districtPostCount = districtHuts.reduce(
      (sum, hut) => sum + Number(hut.calculated_uploads ?? hut.total_uploads ?? 0),
      0
    )

    return { ...district, districtPostCount }
  })
  .sort((a, b) => b.districtPostCount - a.districtPostCount)
  .map((district) => {
              // Get huts for this district by district_id
              const districtHuts = hutsByDistrictId[String(district.id)] || []
              
              // Sort by calculated uploads (most active first)
              const sortedHuts = [...districtHuts].sort((a, b) => {
  const aCount = Number(a.calculated_uploads ?? a.total_uploads ?? 0)
  const bCount = Number(b.calculated_uploads ?? b.total_uploads ?? 0)

  if (bCount !== aCount) {
    return bCount - aCount
  }

  return (a.name_bn || a.name || '').localeCompare(b.name_bn || b.name || '', 'bn')
})
              
              return (
                <div key={district.id} className="premium-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-600">location_city</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-emerald-900">{district.name_bn}</h2>
                      <p className="text-sm text-gray-500">{sortedHuts.length} টি হাট</p>
                    </div>
                  </div>

                  {sortedHuts.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {sortedHuts.map((hut) => (
                        <Link
                          key={hut.id}
                          href={`/huts/${hut.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-emerald-600">storefront</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{hut.name_bn || hut.name}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span>{hut.calculated_uploads} পোস্ট</span>
                              {hut.calculated_avg_price > 0 && (
                                <span>গড় ৳{hut.calculated_avg_price.toLocaleString('bn-BD')}</span>
                              )}
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">এই জেলায় এখনো কোনো হাট যোগ করা হয়নি।</p>
                  )}
                </div>
              )
            })}

            {/* Fallback if no districts found */}
            {(!districts || districts.length === 0) && (
              <div className="premium-card p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-400 text-3xl">location_off</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">কোনো জেলা পাওয়া যায়নি</h3>
                <p className="text-gray-500">অ্যাডমিন প্যানেল থেকে জেলা যোগ করুন।</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
