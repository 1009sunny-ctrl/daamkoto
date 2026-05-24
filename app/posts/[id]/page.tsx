import { createClient } from '@/lib/supabase/server'
import { Navigation, OrganicBlobs } from '@/components/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: cow } = await supabase
    .from('cows')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!cow) {
    notFound()
  }

  const { data: votes } = await supabase
    .from('votes')
    .select('vote_type')
    .eq('cow_id', id)

  const goodVotes = (votes || []).filter((v) => v.vote_type === 'good_deal').length
  const overpricedVotes = (votes || []).filter((v) => v.vote_type === 'overpriced').length
  const totalVotes = goodVotes + overpricedVotes
  const goodPercent = totalVotes > 0 ? Math.round((goodVotes / totalVotes) * 100) : 0

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('bn-BD').format(price)
  }

  return (
    <main className="min-h-screen relative">
      <OrganicBlobs />
      <Navigation />

      <div className="pt-24 md:pt-32 px-4 pb-32">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1 text-emerald-700 font-medium mb-6"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            লিডারবোর্ডে ফিরে যান
          </Link>

          <div className="premium-card overflow-hidden">
            <div className="relative aspect-[4/3] bg-gray-100">
              <Image
                src={cow.image_url}
                alt={cow.title || 'Cow'}
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="p-6 space-y-5">
              <div>
                <div className="text-3xl font-extrabold text-emerald-950">
                  ৳{formatPrice(cow.price)}
                </div>
                <p className="text-gray-500 mt-1">
                  {cow.hut || cow.district || 'লোকেশন নেই'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <div className="text-2xl font-bold text-emerald-700">{goodVotes}</div>
                  <div className="text-sm text-gray-600">ভালো দাম</div>
                </div>

                <div className="rounded-2xl bg-orange-50 p-4">
                  <div className="text-2xl font-bold text-orange-600">{overpricedVotes}</div>
                  <div className="text-sm text-gray-600">বেশি দাম</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">ভ্যালু স্কোর</span>
                  <span className="font-bold text-emerald-700">{goodPercent}% ভালো দাম</span>
                </div>

                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${goodPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {cow.breed && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="text-gray-500">জাত</div>
                    <div className="font-semibold text-gray-800">{cow.breed}</div>
                  </div>
                )}

                {cow.estimated_weight && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="text-gray-500">ওজন</div>
                    <div className="font-semibold text-gray-800">{cow.estimated_weight} কেজি</div>
                  </div>
                )}

                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-gray-500">জেলা</div>
                  <div className="font-semibold text-gray-800">{cow.district || '-'}</div>
                </div>

                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-gray-500">হাট</div>
                  <div className="font-semibold text-gray-800">{cow.hut || '-'}</div>
                </div>
              </div>

<div className="grid grid-cols-2 md:grid-cols-3 gap-3">

  {/* Native Share */}
  <button
    onClick={() => {
      if (navigator.share) {
        navigator.share({
          title: 'কত নিলো?',
          text: `এই গরুর দাম দেখুন — ৳${cow.price}`,
          url: `${window.location.origin}/posts/${cow.id}`,
        })
      }
    }}
    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-900 text-white font-semibold"
  >
    <span className="material-symbols-outlined">share</span>
    শেয়ার
  </button>

  {/* WhatsApp */}
  <a
    href={`https://wa.me/?text=${encodeURIComponent(
      `এই গরুর দাম দেখুন: ৳${cow.price}\n${window.location.origin}/posts/${cow.id}`
    )}`}
    target="_blank"
    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-semibold"
  >
    WhatsApp
  </a>

  {/* Facebook */}
  <a
    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      `${window.location.origin}/posts/${cow.id}`
    )}`}
    target="_blank"
    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold"
  >
    Facebook
  </a>

  {/* X / Twitter */}
  <a
    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `এই গরুর দাম দেখুন ৳${cow.price}`
    )}&url=${encodeURIComponent(
      `${window.location.origin}/posts/${cow.id}`
    )}`}
    target="_blank"
    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-white font-semibold"
  >
    X
  </a>

  {/* Telegram */}
  <a
    href={`https://t.me/share/url?url=${encodeURIComponent(
      `${window.location.origin}/posts/${cow.id}`
    )}&text=${encodeURIComponent(
      `এই গরুর দাম দেখুন ৳${cow.price}`
    )}`}
    target="_blank"
    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 text-white font-semibold"
  >
    Telegram
  </a>

  {/* Copy Link */}
  <button
    onClick={() => {
      navigator.clipboard.writeText(
        `${window.location.origin}/posts/${cow.id}`
      )

      alert('লিংক কপি হয়েছে')
    }}
    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-200 text-gray-800 font-semibold"
  >
    <span className="material-symbols-outlined">content_copy</span>
    কপি
  </button>

</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
