import { createClient } from '@/lib/supabase/server'
import { Navigation, OrganicBlobs } from '@/components/navigation'
import { CowCard } from '@/components/cow-card'

export const revalidate = 0

export default async function PostsPage() {
  const supabase = await createClient()

  const { data: cows } = await supabase
    .from('cows')
    .select('*')
    .eq('status', 'approved')
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen relative">
      <OrganicBlobs />
      <Navigation />

      <div className="pt-24 md:pt-32 px-4 pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-950 mb-2">
              সব পোস্ট
            </h1>
            <p className="text-gray-600">
              সর্বশেষ আপলোড করা কোরবানির পশুর দাম দেখুন
            </p>
          </div>

          {cows && cows.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cows.map((cow) => (
                <CowCard key={cow.id} cow={cow} />
              ))}
            </div>
          ) : (
            <div className="premium-card p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                এখনো কোনো পোস্ট নেই
              </h3>
              <p className="text-gray-500">
                প্রথম পোস্টটি আপলোড করুন।
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
