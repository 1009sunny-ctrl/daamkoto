import { createClient } from '@/lib/supabase/server'
import { Navigation, OrganicBlobs } from '@/components/navigation'
import Link from 'next/link'
import { DIVISIONS } from '@/lib/types'

export const revalidate = 0

export default async function HutsPage() {
  const supabase = await createClient()
  
  const { data: huts } = await supabase
    .from('huts')
    .select('*')
    .order('total_uploads', { ascending: false })

  // Group huts by district
  const hutsByDistrict = huts?.reduce((acc, hut) => {
    if (!acc[hut.district]) acc[hut.district] = []
    acc[hut.district].push(hut)
    return acc
  }, {} as Record<string, typeof huts>)

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

          {/* District Cards */}
          <div className="space-y-8">
            {DIVISIONS.map((district) => {
              const districtHuts = hutsByDistrict?.[district.value] || []
              
              return (
                <div key={district.value} className="premium-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-600">location_city</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-emerald-900">{district.label}</h2>
                      <p className="text-sm text-gray-500">{districtHuts.length} টি হাট</p>
                    </div>
                  </div>

                  {districtHuts.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {districtHuts.map((hut) => (
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
                              <span>{hut.total_uploads} পোস্ট</span>
                              {hut.avg_price > 0 && (
                                <span>গড় ৳{hut.avg_price.toLocaleString('bn-BD')}</span>
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
          </div>
        </div>
      </div>
    </main>
  )
}
