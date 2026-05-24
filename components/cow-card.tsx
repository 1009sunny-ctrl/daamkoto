'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { type Cow } from '@/lib/types'
import {
  formatPrice,
  formatTimeAgoBangla,
  hasVotedOnCow,
  markCowAsVoted,
  getAnonymousUserId,
} from '@/lib/utils/voting'
import { cn } from '@/lib/utils'
import { SocialShareCompact } from './social-share'

interface CowWithVotes extends Cow {
  vote_good_deal_count?: number
  vote_overpriced_count?: number
}

interface CowCardProps {
  cow: CowWithVotes
  onVote?: () => void
}

export function CowCard({ cow, onVote }: CowCardProps) {
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [goodDealCount, setGoodDealCount] = useState(cow.vote_good_deal_count ?? cow.good_deal_count ?? 0)
  const [overpricedCount, setOverpricedCount] = useState(cow.vote_overpriced_count ?? cow.overpriced_count ?? 0)
  const [showReportModal, setShowReportModal] = useState(false)

  useEffect(() => {
    setHasVoted(hasVotedOnCow(cow.id))
  }, [cow.id])

  useEffect(() => {
    const fetchVoteCounts = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('cow_id', cow.id)

      if (error) return

      setGoodDealCount(data?.filter((v) => v.vote_type === 'good_deal').length ?? 0)
      setOverpricedCount(data?.filter((v) => v.vote_type === 'overpriced').length ?? 0)
    }

    fetchVoteCounts()
  }, [cow.id])

  const handleVote = async (voteType: 'good_deal' | 'overpriced') => {
    if (hasVoted || isVoting) return

    setIsVoting(true)

    try {
      const supabase = createClient()
      const anonymousUserId = getAnonymousUserId()

      const { error } = await supabase.from('votes').insert({
        cow_id: cow.id,
        vote_type: voteType,
        anonymous_user_id: anonymousUserId,
      })

      if (error) {
        if (error.code === '23505') {
          markCowAsVoted(cow.id)
          setHasVoted(true)
          return
        }
        throw error
      }

      if (voteType === 'good_deal') {
        setGoodDealCount((prev) => prev + 1)
      } else {
        setOverpricedCount((prev) => prev + 1)
      }

      markCowAsVoted(cow.id)
      setHasVoted(true)
      onVote?.()
    } catch (error) {
      console.error('[v0] Vote error:', error)
    } finally {
      setIsVoting(false)
    }
  }

  const handleReport = async () => {
    const supabase = createClient()
    const anonymousUserId = getAnonymousUserId()

    try {
      await supabase.from('reports').insert({
        cow_id: cow.id,
        anonymous_user_id: anonymousUserId,
        reason: 'inappropriate',
      })

      setShowReportModal(false)
    } catch (error) {
      console.error('[v0] Report error:', error)
    }
  }

  const totalVotes = goodDealCount + overpricedCount
  const goodDealPercent = totalVotes > 0 ? Math.round((goodDealCount / totalVotes) * 100) : 50

  return (
    <>
      <div className="premium-card overflow-hidden">
        <div className="relative aspect-[5/3] sm:aspect-[4/3] overflow-hidden">
          <Image
            src={cow.image_url}
            alt={cow.title || 'কোরবানির গরু'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
            <SocialShareCompact
              url={typeof window !== 'undefined' ? `${window.location.origin}/posts/${cow.id}` : `/posts/${cow.id}`}
              title={cow.title || 'কোরবানির গরু'}
              price={cow.price}
            />

            <button
              onClick={() => setShowReportModal(true)}
              className="w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Report post"
            >
              <span className="material-symbols-outlined text-lg">flag</span>
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950 leading-tight">
              {formatPrice(cow.price)}
            </div>

            {cow.breed && (
              <div className="shrink-0 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize">
                {cow.breed}
              </div>
            )}
          </div>

          {cow.title && (
            <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-1 text-sm sm:text-base">
              {cow.title}
            </h3>
          )}

          <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 mb-2">
            <div className="flex items-center gap-1 min-w-0">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span className="truncate">{cow.hut || cow.district}</span>
            </div>

            {cow.estimated_weight && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-sm">scale</span>
                <span>{cow.estimated_weight} কেজি</span>
              </div>
            )}
          </div>

          {cow.description && (
            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-1">
              {cow.description}
            </p>
          )}

          <div className="mb-2">
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                style={{ width: `${goodDealPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] sm:text-xs mt-1">
              <span className="text-emerald-600 font-medium">{goodDealCount} ভালো দাম</span>
              <span className="text-orange-500 font-medium">{overpricedCount} বেশি দাম</span>
            </div>
          </div>

          {hasVoted ? (
            <div className="flex items-center justify-center gap-1.5 py-2 bg-gray-50 rounded-xl text-gray-500 text-xs sm:text-sm">
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>আপনি ভোট দিয়েছেন</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleVote('good_deal')}
                disabled={isVoting}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-medium text-sm transition-all',
                  'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
                  isVoting && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="material-symbols-outlined text-base">thumb_up</span>
                <span>ভালো দাম</span>
              </button>

              <button
                onClick={() => handleVote('overpriced')}
                disabled={isVoting}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-medium text-sm transition-all',
                  'bg-orange-100 text-orange-700 hover:bg-orange-200',
                  isVoting && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="material-symbols-outlined text-base">thumb_down</span>
                <span>বেশি দাম</span>
              </button>
            </div>
          )}

          <div className="mt-2 text-[11px] text-gray-400 text-center">
            {formatTimeAgoBangla(cow.created_at)}
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">পোস্ট রিপোর্ট করুন</h3>
            <p className="text-sm text-gray-600 mb-6">
              আপনি কি নিশ্চিত যে এই পোস্টটি রিপোর্ট করতে চান?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 rounded-xl font-medium bg-gray-100 text-gray-700"
              >
                বাতিল
              </button>

              <button
                onClick={handleReport}
                className="flex-1 py-2.5 rounded-xl font-medium bg-red-500 text-white"
              >
                রিপোর্ট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
