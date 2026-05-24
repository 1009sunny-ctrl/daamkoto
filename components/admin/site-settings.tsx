'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type SiteSetting } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SiteSettingsProps {
  onUpdate?: () => void
}

interface SettingConfig {
  key: string
  label: string
  description: string
  type: 'text' | 'textarea' | 'boolean' | 'number' | 'json'
}

const SETTING_CONFIGS: SettingConfig[] = [
  { key: 'hero_title', label: 'হিরো শিরোনাম', description: 'হোমপেজের মূল শিরোনাম', type: 'text' },
  { key: 'hero_subtitle', label: 'হিরো সাবটাইটেল', description: 'হোমপেজের উপশিরোনাম', type: 'textarea' },
  { key: 'announcement', label: 'ঘোষণা', description: 'সাইটের শীর্ষে দেখানো হবে (খালি রাখলে দেখাবে না)', type: 'textarea' },
  { key: 'featured_enabled', label: 'ফিচার্ড পোস্ট দেখান', description: 'হোমপেজে ফিচার্ড পোস্ট সেকশন', type: 'boolean' },
  { key: 'upload_enabled', label: 'আপলোড চালু', description: 'নতুন পোস্ট আপলোড করার অনুমতি', type: 'boolean' },
  { key: 'voting_enabled', label: 'ভোটিং চালু', description: 'পোস্টে ভোট দেওয়ার অনুমতি', type: 'boolean' },
  { key: 'max_upload_size_kb', label: 'সর্বোচ্চ ছবির সাইজ (KB)', description: 'আপলোডের সর্বোচ্চ ফাইল সাইজ', type: 'number' },
  { key: 'breeds', label: 'জাতের তালিকা', description: 'ড্রপডাউনে দেখানো জাতসমূহ (JSON array)', type: 'json' },
]

export function SiteSettings({ onUpdate }: SiteSettingsProps) {
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from('site_settings').select('*')
    
    if (data && !error) {
      const settingsMap: Record<string, unknown> = {}
      data.forEach(s => {
        settingsMap[s.key] = s.value
      })
      setSettings(settingsMap)
    }
    setLoading(false)
  }

  const handleSave = async (key: string, value: unknown) => {
    setSaving(key)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })

      if (error) throw error

      setSettings(prev => ({ ...prev, [key]: value }))
      setEditingKey(null)
      onUpdate?.()
    } catch (error) {
      console.error('[v0] Error saving setting:', error)
    } finally {
      setSaving(null)
    }
  }

  const handleToggle = async (key: string) => {
    const currentValue = settings[key] === true || settings[key] === 'true'
    await handleSave(key, !currentValue)
  }

  const startEditing = (key: string) => {
    const config = SETTING_CONFIGS.find(c => c.key === key)
    let value = settings[key]
    
    if (config?.type === 'json') {
      value = JSON.stringify(value, null, 2)
    } else if (typeof value === 'string') {
      // Remove quotes if it's a JSON string
      try {
        value = JSON.parse(value)
      } catch {
        // Keep as is
      }
    }
    
    setEditValue(String(value ?? ''))
    setEditingKey(key)
  }

  const saveEditing = async () => {
    if (!editingKey) return
    
    const config = SETTING_CONFIGS.find(c => c.key === editingKey)
    let value: unknown = editValue

    if (config?.type === 'number') {
      value = parseInt(editValue) || 0
    } else if (config?.type === 'json') {
      try {
        value = JSON.parse(editValue)
      } catch {
        alert('Invalid JSON format')
        return
      }
    }

    await handleSave(editingKey, value)
  }

  const renderSettingInput = (config: SettingConfig) => {
    const value = settings[config.key]
    const isEditing = editingKey === config.key
    const isSaving = saving === config.key

    if (config.type === 'boolean') {
      const isEnabled = value === true || value === 'true'
      return (
        <button
          onClick={() => handleToggle(config.key)}
          disabled={isSaving}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            isEnabled ? 'bg-emerald-600' : 'bg-gray-200',
            isSaving && 'opacity-50'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      )
    }

    if (isEditing) {
      return (
        <div className="space-y-2">
          {config.type === 'textarea' || config.type === 'json' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={config.type === 'json' ? 6 : 3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
            />
          ) : (
            <input
              type={config.type === 'number' ? 'number' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={saveEditing}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSaving ? 'সংরক্ষণ...' : 'সংরক্ষণ'}
            </button>
            <button
              onClick={() => setEditingKey(null)}
              className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
            >
              বাতিল
            </button>
          </div>
        </div>
      )
    }

    // Display value
    let displayValue = value
    if (config.type === 'json' && value) {
      try {
        displayValue = JSON.stringify(value)
        if (String(displayValue).length > 50) {
          displayValue = String(displayValue).slice(0, 50) + '...'
        }
      } catch {
        displayValue = String(value)
      }
    } else if (typeof value === 'string') {
      try {
        displayValue = JSON.parse(value)
      } catch {
        displayValue = value
      }
    }

    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-700 text-sm truncate max-w-xs">
          {displayValue === null || displayValue === undefined || displayValue === 'null' 
            ? <span className="text-gray-400 italic">সেট করা হয়নি</span>
            : String(displayValue)
          }
        </span>
        <button
          onClick={() => startEditing(config.key)}
          className="p-1 rounded hover:bg-gray-100"
        >
          <span className="material-symbols-outlined text-gray-500 text-lg">edit</span>
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="premium-card p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-gray-900">সাইট সেটিংস</h3>

      <div className="premium-card divide-y">
        {SETTING_CONFIGS.map(config => (
          <div key={config.key} className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">{config.label}</div>
              <div className="text-sm text-gray-500">{config.description}</div>
            </div>
            <div className="flex-shrink-0">
              {renderSettingInput(config)}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Info */}
      <div className="premium-card p-4 bg-blue-50 border border-blue-100">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-blue-600">info</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">সেটিংস সম্পর্কে</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>সেটিংস পরিবর্তন সাথে সাথেই কার্যকর হবে</li>
              <li>ঘোষণা খালি রাখলে ব্যানার দেখাবে না</li>
              <li>JSON ফরম্যাট সঠিক রাখুন</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
