'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SiteSettingsProps {
  onUpdate?: () => void
}

export function SiteSettings({ onUpdate }: SiteSettingsProps) {
  const [approvalRequired, setApprovalRequired] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchSetting = async () => {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'post_approval_required')
        .single()

      if (!error && data) {
        setApprovalRequired(data.value !== 'false')
      }

      setLoading(false)
    }

    fetchSetting()
  }, [])

  const updateApprovalSetting = async (checked: boolean) => {
    setSaving(true)
    setMessage(null)

    const supabase = createClient()

    const { error } = await supabase
      .from('site_settings')
      .upsert(
        {
          key: 'post_approval_required',
          value: checked ? 'true' : 'false',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('[admin] Setting update error:', error)
      setMessage('সেটিংস আপডেট করা যায়নি')
    } else {
      setApprovalRequired(checked)
      setMessage('সেটিংস আপডেট হয়েছে')
      onUpdate?.()
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="premium-card p-6">
        <p className="text-gray-500">সেটিংস লোড হচ্ছে...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="premium-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          সাইট সেটিংস
        </h3>

        <p className="text-sm text-gray-500 mb-6">
          এখান থেকে ওয়েবসাইটের গুরুত্বপূর্ণ কনফিগারেশন পরিবর্তন করা যাবে।
        </p>

        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
          <div>
            <h4 className="font-semibold text-gray-900">
              পোস্ট অনুমোদন প্রয়োজন
            </h4>

            <p className="text-sm text-gray-500 mt-1">
              চালু থাকলে নতুন পোস্ট অ্যাডমিন অনুমোদনের পর প্রকাশ হবে। বন্ধ থাকলে পোস্ট সরাসরি প্রকাশ হবে।
            </p>

            <p className="text-xs mt-2 font-medium">
              বর্তমান অবস্থা:{' '}
              <span className={approvalRequired ? 'text-amber-600' : 'text-emerald-600'}>
                {approvalRequired ? 'অনুমোদন প্রয়োজন' : 'সরাসরি প্রকাশ'}
              </span>
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => updateApprovalSetting(!approvalRequired)}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
              approvalRequired ? 'bg-amber-500' : 'bg-emerald-600'
            } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                approvalRequired ? 'translate-x-9' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {message && (
          <div className="mt-4 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
