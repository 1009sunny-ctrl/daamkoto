'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Cow } from '@/lib/types'
import { CowCard } from '@/components/cow-card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'

interface CowFeedProps {
  refreshTrigger?: number
}

export function CowFeed({ refreshTrigger }: CowFeedProps) {
  const [cows, setCows] = useState<Cow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCows = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('cows')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50)

      if (fetchError) throw fetchError

      setCows(data || [])
    } catch {
      setError('গরুর তালিকা লোড করা যায়নি। আবার চেষ্টা করুন।')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCows()
  }, [fetchCows, refreshTrigger])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">লোড হচ্ছে...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchCows}>
          <RefreshCw className="mr-2 h-4 w-4" />
          আবার চেষ্টা করুন
        </Button>
      </div>
    )
  }

  if (cows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-lg font-medium text-foreground">এখনো কোনো গরু নেই</p>
        <p className="text-sm text-muted-foreground">
          প্রথম হোন! আপনার কোরবানির গরু আপলোড করুন এবং রেটিং পান!
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cows.map((cow) => (
        <CowCard key={cow.id} cow={cow} />
      ))}
    </div>
  )
}
