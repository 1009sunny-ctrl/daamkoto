'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Hut, type District } from '@/lib/types'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'

interface HaatManagementProps {
  initialHaats: Hut[]
  districts: District[]
  onUpdate: () => void
}

interface HaatFormData {
  name: string
  name_bn: string
  district: string
  district_id: string
  is_active: boolean
  is_trending: boolean
}

export function HaatManagement({ initialHaats, districts, onUpdate }: HaatManagementProps) {
  const [haats, setHaats] = useState(initialHaats)
  const [showForm, setShowForm] = useState(false)
  const [editingHaat, setEditingHaat] = useState<Hut | null>(null)
  const [loading, setLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<HaatFormData>({
    name: '',
    name_bn: '',
    district: '',
    district_id: '',
    is_active: true,
    is_trending: false,
  })

  const resetForm = () => {
    setFormData({
      name: '',
      name_bn: '',
      district: '',
      district_id: '',
      is_active: true,
      is_trending: false,
    })
    setEditingHaat(null)
    setShowForm(false)
  }

  const handleEdit = (haat: Hut) => {
    setEditingHaat(haat)
    setFormData({
      name: haat.name,
      name_bn: haat.name_bn || '',
      district: haat.district,
      district_id: haat.district_id || '',
      is_active: haat.is_active ?? true,
      is_trending: haat.is_trending ?? false,
    })
    setShowForm(true)
  }

  const handleDistrictChange = (districtId: string) => {
  const selectedDistrict = districts.find(d => String(d.id) === String(districtId))

  setFormData(prev => ({
    ...prev,
    district_id: districtId,
    district: selectedDistrict?.name_bn || selectedDistrict?.name || '',
  }))
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    try {
      if (editingHaat) {
        // Update existing haat
        const { error } = await supabase
          .from('huts')
          .update({
            name: formData.name,
            name_bn: formData.name_bn,
            district: formData.district,
            district_id: formData.district_id || null,
            is_active: formData.is_active,
            is_trending: formData.is_trending,
          })
          .eq('id', editingHaat.id)

        if (error) throw error

        setHaats(prev => prev.map(h => 
          h.id === editingHaat.id 
            ? { ...h, ...formData } 
            : h
        ))
      } else {
        // Create new haat
        const { data, error } = await supabase
          .from('huts')
          .insert({
            name: formData.name,
            name_bn: formData.name_bn,
            district: formData.district,
            district_id: formData.district_id || null,
            is_active: formData.is_active,
            is_trending: formData.is_trending,
          })
          .select()
          .single()

        if (error) throw error

        setHaats(prev => [data, ...prev])
      }

      resetForm()
      onUpdate()
    } catch (error) {
      console.error('[v0] Error saving haat:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (haatId: string) => {
    if (!confirm('এই হাট মুছে ফেলতে চান?')) return

    const supabase = createClient()
    try {
      const { error } = await supabase.from('huts').delete().eq('id', haatId)
      if (error) throw error
      setHaats(prev => prev.filter(h => h.id !== haatId))
      onUpdate()
    } catch (error) {
      console.error('[v0] Error deleting haat:', error)
    }
  }

  const handleToggleActive = async (haat: Hut) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('huts')
        .update({ is_active: !haat.is_active })
        .eq('id', haat.id)

      if (error) throw error
      setHaats(prev => prev.map(h => 
        h.id === haat.id ? { ...h, is_active: !h.is_active } : h
      ))
    } catch (error) {
      console.error('[v0] Error toggling haat status:', error)
    }
  }

  const handleToggleTrending = async (haat: Hut) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('huts')
        .update({ is_trending: !haat.is_trending })
        .eq('id', haat.id)

      if (error) throw error
      setHaats(prev => prev.map(h => 
        h.id === haat.id ? { ...h, is_trending: !h.is_trending } : h
      ))
    } catch (error) {
      console.error('[v0] Error toggling trending:', error)
    }
  }

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    setImportResults(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<{
        name?: string
        name_bn?: string
        district?: string
        is_active?: boolean | string
      }>(worksheet)

      const supabase = createClient()
      let success = 0
      let failed = 0
      const errors: string[] = []

      for (const row of jsonData) {
        if (!row.name || !row.district) {
          failed++
          errors.push(`Row missing name or district: ${JSON.stringify(row)}`)
          continue
        }

        // Find district ID
        const district = districts.find(d => 
          d.name.toLowerCase() === row.district?.toLowerCase() ||
          d.name_bn === row.district
        )

        const { error } = await supabase.from('huts').insert({
          name: row.name,
          name_bn: row.name_bn || row.name,
          district: district?.name || row.district,
          district_id: district?.id || null,
          is_active: row.is_active === true || row.is_active === 'true' || row.is_active === 'yes',
        })

        if (error) {
          failed++
          if (error.code === '23505') {
            errors.push(`Duplicate: ${row.name}`)
          } else {
            errors.push(`Error for ${row.name}: ${error.message}`)
          }
        } else {
          success++
        }
      }

      setImportResults({ success, failed, errors })

      // Refresh haats list
      const { data: updatedHaats } = await supabase
        .from('huts')
        .select('*')
        .order('name')
      
      if (updatedHaats) {
        setHaats(updatedHaats)
      }

      onUpdate()
    } catch (error) {
      console.error('[v0] Excel import error:', error)
      setImportResults({ success: 0, failed: 1, errors: ['ফাইল পড়তে সমস্যা হয়েছে'] })
    } finally {
      setImportLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const downloadTemplate = () => {
    const template = [
      { name: 'Example Haat', name_bn: 'উদাহরণ হাট', district: 'Dhaka', is_active: 'true' }
    ]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Haats')
    XLSX.writeFile(wb, 'haat_import_template.xlsx')
  }

  // Group haats by district
  const groupedHaats = haats.reduce((acc, haat) => {
    const district = haat.district || 'অন্যান্য'
    if (!acc[district]) acc[district] = []
    acc[district].push(haat)
    return acc
  }, {} as Record<string, Hut[]>)

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h3 className="font-semibold text-gray-900">হাট তালিকা ({haats.length})</h3>
        <div className="flex gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            টেমপ্লেট ডাউনলোড
          </button>
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 text-blue-700 font-medium hover:bg-blue-200 transition-colors cursor-pointer text-sm">
            <span className="material-symbols-outlined text-lg">upload_file</span>
            {importLoading ? 'ইমপোর্ট হচ্ছে...' : 'Excel ইমপোর্ট'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelImport}
              className="hidden"
              disabled={importLoading}
            />
          </label>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            নতুন হাট
          </button>
        </div>
      </div>

      {/* Import Results */}
      {importResults && (
        <div className={cn(
          'p-4 rounded-xl',
          importResults.failed > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'
        )}>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'material-symbols-outlined',
              importResults.failed > 0 ? 'text-amber-600' : 'text-emerald-600'
            )}>
              {importResults.failed > 0 ? 'warning' : 'check_circle'}
            </span>
            <span className="font-medium">
              সফল: {importResults.success}, ব্যর্থ: {importResults.failed}
            </span>
          </div>
          {importResults.errors.length > 0 && (
            <ul className="text-sm text-gray-600 list-disc list-inside">
              {importResults.errors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {importResults.errors.length > 5 && (
                <li>...এবং আরো {importResults.errors.length - 5} টি সমস্যা</li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-lg mb-4">
              {editingHaat ? 'হাট সম্পাদনা' : 'নতুন হাট যোগ করুন'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  হাটের নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  হাটের নাম (বাংলা)
                </label>
                <input
                  type="text"
                  value={formData.name_bn}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_bn: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  জেলা
                </label>
                <select
                  value={formData.district_id}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">জেলা নির্বাচন করুন</option>
                  {districts.map(d => (
<option key={d.id} value={d.id}>
  {d.name_bn || d.name}
</option>                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600"
                  />
                  <span className="text-sm text-gray-700">সক্রিয়</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_trending}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_trending: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600"
                  />
                  <span className="text-sm text-gray-700">ট্রেন্ডিং</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : editingHaat ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Haats Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">হাট</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">জেলা</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">আপলোড</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">স্ট্যাটাস</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {haats.map(haat => (
                <tr key={haat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{haat.name_bn || haat.name}</div>
                      {haat.is_trending && (
                        <span className="material-symbols-outlined text-amber-500 text-sm">trending_up</span>
                      )}
                    </div>
                    {haat.name_bn && <div className="text-sm text-gray-500">{haat.name}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{haat.district}</td>
                  <td className="px-4 py-3 text-gray-600">{haat.total_uploads}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(haat)}
                      className={cn(
                        'inline-flex px-2 py-1 rounded-full text-xs font-medium transition-colors',
                        haat.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      {haat.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleToggleTrending(haat)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          haat.is_trending ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-400'
                        )}
                        title="ট্রেন্ডিং"
                      >
                        <span className="material-symbols-outlined text-lg">trending_up</span>
                      </button>
                      <button
                        onClick={() => handleEdit(haat)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                        title="সম্পাদনা"
                      >
                        <span className="material-symbols-outlined text-gray-600 text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(haat.id)}
                        className="p-2 rounded-lg hover:bg-red-50"
                        title="মুছুন"
                      >
                        <span className="material-symbols-outlined text-red-600 text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {haats.length === 0 && (
        <div className="premium-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-400 text-3xl">storefront</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">কোনো হাট নেই</h3>
          <p className="text-gray-500 mb-4">নতুন হাট যোগ করুন অথবা Excel থেকে ইমপোর্ট করুন</p>
        </div>
      )}
    </div>
  )
}
