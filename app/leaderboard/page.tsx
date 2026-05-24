import { createClient } from '@/lib/supabase/server'
import { Navigation, OrganicBlobs } from '@/components/navigation'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 0

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: cows } = await supabase
    .from('cows')
    .select('*')
    .eq('status', 'approved')

  const { data: votes } = await supabase
    .from('votes')
    .select('cow_id, vote_type')

  const voteMap = (votes || []).reduce((acc, vote) => {
    if (!vote.cow_id) return acc

    if (!acc[vote.cow_id]) {
      acc[vote.cow_id] = {
        good_deal_count: 0,
        overpriced_count: 0,
        total_votes: 0,
      }
    }

    if (vote.vote_type === 'good_deal') {
      acc[vote.cow_id].good_deal_count += 1
    }

    if (vote.vote_type === 'overpriced') {
      acc[vote.cow_id].overpriced_count += 1
    }

    acc[vote.cow_id].total_votes += 1

    return acc
  }, {} as Record<
    string,
    {
      good_deal_count: number
      overpriced_count: number
      total_votes: number
    }
  >)

  const topCows = (cows || [])
    .map((cow) => {
      const stats = voteMap[cow.id] || {
        good_deal_count: 0,
        overpriced_count: 0,
        total_votes: 0,
      }

      const percent =
        stats.total_votes > 0
          ? Math.round((stats.good_deal_count / stats.total_votes) * 100)
          : 0

      return {
        ...cow,
        good_deal_count: stats.good_deal_count,
        overpriced_count: stats.overpriced_count,
        total_votes: stats.total_votes,
        percent,
      }
    })
    .filter((cow) => cow.total_votes > 0)
    .sort((a, b) => {
      if (b.good_deal_count !== a.good_deal_count) {
        return b.good_deal_count - a.good_deal_count
      }

      return b.total_votes - a.total_votes
    })
    .slice(0, 20)

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
              <span className="material-symbols-outlined text-amber-600 text-3xl">
                trophy
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-emerald-950 mb-2">
              লিডারবোর্ড
            </h1>

            <p className="text-gray-600">
              সবচেয়ে বেশি ভালো দাম রেটিং পাওয়া গরু
            </p>
          </div>

          {/* Cards */}
          {topCows.length > 0 ? (
            <div className="space-y-4">
              {topCows.map((cow, index) => (
                <Link
                  key={cow.id}
                  href={`/posts/${cow.id}`}
                  className={`premium-card p-4 flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-xl ${
                    index < 3 ? 'ring-2 ring-amber-400' : ''
                  }`}
                >
                  {/* Rank */}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg ${
                      index === 0
                        ? 'bg-amber-400 text-amber-900 shadow-lg'
                        : index === 1
                        ? 'bg-gray-300 text-gray-700'
                        : index === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {index === 0 ? '👑' : index + 1}
                  </div>

                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={cow.image_url}
                      alt="Cow"
                      fill
                      className="object-cover"
                    />

                    {cow.percent >= 80 && cow.total_votes >= 10 && (
                      <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                        BEST DEAL
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-xl text-emerald-900">
                        ৳{formatPrice(cow.price)}
                      </span>

                      {cow.breed && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs">
                          {cow.breed}
                        </span>
                      )}

                      {cow.total_votes >= 15 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
                          🔥 ট্রেন্ডিং
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <span className="material-symbols-outlined text-base">
                        location_on
                      </span>

                      <span className="truncate">
                        {cow.hut || cow.district}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400">
                      {cow.total_votes} মোট ভোট
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center justify-end gap-1 text-emerald-600 font-bold text-lg">
                      <span className="material-symbols-outlined text-lg">
                        thumb_up
                      </span>

                      <span>{cow.good_deal_count}</span>
                    </div>

                    <div className="text-xs text-gray-500 font-medium">
                      {cow.percent}% ভালো দাম
                    </div>

                    {/* Progress */}
                    <div className="w-20 h-2 rounded-full bg-gray-100 mt-2 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${cow.percent}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="premium-card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400 text-3xl">
                  leaderboard
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                এখনো কোনো ডেটা নেই
              </h3>

              <p className="text-gray-500 mb-4">
                ভোট দিয়ে লিডারবোর্ড তৈরি করুন!
              </p>

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
