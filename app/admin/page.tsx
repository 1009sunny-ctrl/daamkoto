import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

const ADMIN_EMAIL = '1009.personal@gmail.com'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  if (user.email !== ADMIN_EMAIL) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[#fdfbf7]">
        <div className="premium-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-500 text-3xl">block</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">অ্যাক্সেস নিষেধ</h1>
          <p className="text-gray-600 mb-6">আপনার অ্যাডমিন অ্যাক্সেস নেই</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-900 text-white font-medium"
          >
            হোমে ফিরে যান
          </a>
        </div>
      </main>
    )
  }

  // Fetch all cows for admin
  const { data: cows } = await supabase
    .from('cows')
    .select('*')
    .order('created_at', { ascending: false })

  return <AdminDashboard initialCows={cows || []} userEmail={user.email} />
}
