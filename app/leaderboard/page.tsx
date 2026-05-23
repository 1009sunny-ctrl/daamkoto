import { createClient } from '@/lib/supabase/server'
import { Navigation, OrganicBlobs } from '@/components/navigation'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 0

export default async function LeaderboardPage() {
  const supabase = await createClient()
  
  // Get top 10 cows by good_deal votes
  const { data: topCows } = await supabase
    .from('cows')
    .select('*')
    .eq('status', 'approved')
    .order('good_deal_count', { ascending: false })
    .limit(10)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('bn-BD').format(price)
  }

  return (
    <main className="min-h-screen relative">
      <OrganicBlobs />
      <Navigation />
      
      <div className="pt-24 md:pt-32 px-4 pb-32">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <span className="material-symbols-outlined text-amber-600 text-3xl">trophy</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-950 mb-2">লিডারবোর্ড</h1>
            <p className="text-gray-600">সবচেয়ে বেশি ভালো দাম রেটিং পাওয়া গরু</p>
          </div>

          {/* Leaderboard */}
          {topCows && topCows.length > 0 ? (
            <div className="space-y-3">
              {topCows.map((cow, index) => {
                const totalVotes = cow.good_deal_count + cow.overpriced_count
                const percent = totalVotes > 0 ? Math.round((cow.good_deal_count / totalVotes) * 100) : 0
                
                return (
                  <div
                    key={cow.id}
                    className={`premium-card p-4 flex items-center gap-4 ${
                      index < 3 ? 'ring-2 ring-amber-400' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg ${
                      index === 0 ? 'bg-amber-400 text-amber-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-600 text-amber-100' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={cow.image_url}
                        alt={cow.title || 'Cow'}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-emerald-900">৳{formatPrice(cow.price)}</span>
                        {cow.breed && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs capitalize">
                            {cow.breed}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        <span className="truncate">{cow.hut || cow.district}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <span className="material-symbols-outlined text-lg">thumb_up</span>
                        <span>{cow.good_deal_count}</span>
                      </div>
                      <div className="text-xs text-gray-500">{percent}% ভালো দাম</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="premium-card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400 text-3xl">leaderboard</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">এখনো কোনো ডেটা নেই</h3>
              <p className="text-gray-500 mb-4">ভোট দিয়ে লিডারবোর্ড তৈরি করুন!</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-900 text-white font-medium"
              >
                <span>হোমে যান</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
