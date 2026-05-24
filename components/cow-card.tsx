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

  // Fetch vote counts from votes table on mount
  useEffect(() => {
    const fetchVoteCounts = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('cow_id', cow.id)

        if (error) {
          console.error('[v0] Failed to fetch vote counts:', error)
          return
        }

        const goodDeals = data?.filter(v => v.vote_type === 'good_deal').length ?? 0
        const overpriced = data?.filter(v => v.vote_type === 'overpriced').length ?? 0
        
        setGoodDealCount(goodDeals)
        setOverpricedCount(overpriced)
      } catch (error) {
        console.error('[v0] Error fetching vote counts:', error)
      }
    }

    fetchVoteCounts()
  }, [cow.id])

  const handleVote = async (voteType: 'good_deal' | 'overpriced') => {
    if (hasVoted || isVoting) return

    setIsVoting(true)

    try {
      const supabase = createClient()
      const anonymousUserId = getAnonymousUserId()

      const { error: voteError } = await supabase.from('votes').insert({
        cow_id: cow.id,
        vote_type: voteType,
        anonymous_user_id: anonymousUserId,
      })

      if (voteError) {
        console.error('[v0] Vote insert error:', voteError)
        if (voteError.code === '23505') {
          // Duplicate vote - user already voted
          markCowAsVoted(cow.id)
          setHasVoted(true)
          return
        }
        throw voteError
      }

      // Update local count immediately
      if (voteType === 'good_deal') {
        setGoodDealCount(prev => prev + 1)
      } else {
        setOverpricedCount(prev => prev + 1)
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
      const { error } = await supabase.from('reports').insert({
        cow_id: cow.id,
        anonymous_user_id: anonymousUserId,
        reason: 'inappropriate',
      })
      if (error) {
        console.error('[v0] Report error:', error)
      }
      setShowReportModal(false)
    } catch (error) {
      console.error('[v0] Report error:', error)
    }
  }

  const totalVotes = goodDealCount + overpricedCount
  const goodDealPercent = totalVotes > 0 ? Math.round((goodDealCount / totalVotes) * 100) : 50

  // Price sentiment based on community votes
  const getPriceSentiment = () => {
    if (totalVotes < 3) return null // Need at least 3 votes for sentiment
    if (goodDealPercent >= 70) return { label: 'ভালো দাম', color: 'bg-emerald-500', icon: 'verified' }
    if (goodDealPercent <= 30) return { label: 'বেশি দাম', color: 'bg-orange-500', icon: 'warning' }
    return { label: 'মিশ্র মতামত', color: 'bg-gray-500', icon: 'thumbs_up_down' }
  }
  const sentiment = getPriceSentiment()

  return (
    <>
      <div className="premium-card overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={cow.image_url}
            alt={cow.title || 'কোরবানির গরু'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Price Badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
              <span className="text-emerald-900 font-bold text-lg">{formatPrice(cow.price)}</span>
            </div>
            {/* Sentiment Badge */}
            {sentiment && (
              <div className={cn(
                'mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-medium',
                sentiment.color
              )}>
                <span className="material-symbols-outlined text-xs">{sentiment.icon}</span>
                <span>{sentiment.label}</span>
              </div>
            )}
          </div>

          {/* Breed Badge */}
          {cow.breed && (
            <div className="absolute top-3 right-3">
              <div className="bg-amber-400/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-lg">
                <span className="text-amber-900 font-medium text-xs capitalize">{cow.breed}</span>
              </div>
            </div>
          )}

          {/* Share & Report Buttons */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <SocialShareCompact 
              url={typeof window !== 'undefined' ? `${window.location.origin}/cow/${cow.id}` : `/cow/${cow.id}`}
              title={cow.title || 'কোরবানির গরু'}
              price={cow.price}
            />
            <button
              onClick={() => setShowReportModal(true)}
              className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">flag</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          {cow.title && (
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{cow.title}</h3>
          )}

          {/* Location & Info */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">location_on</span>
              <span>{cow.hut || cow.district}</span>
            </div>
            {cow.estimated_weight && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">scale</span>
                <span>{cow.estimated_weight} কেজি</span>
              </div>
            )}
          </div>

          {/* Description */}
          {cow.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{cow.description}</p>
          )}

          {/* Vote Progress Bar */}
          <div className="mb-3">
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                style={{ width: `${goodDealPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-emerald-600 font-medium">{goodDealCount} ভালো দাম</span>
              <span className="text-orange-500 font-medium">{overpricedCount} বেশি দাম</span>
            </div>
          </div>

          {/* Vote Buttons */}
          {hasVoted ? (
            <div className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 rounded-xl text-gray-500 text-sm">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>আপনি ভোট দিয়েছেন</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleVote('good_deal')}
                disabled={isVoting}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all',
                  'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
                  isVoting && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="material-symbols-outlined text-lg">thumb_up</span>
                <span>ভালো দাম</span>
              </button>
              <button
                onClick={() => handleVote('overpriced')}
                disabled={isVoting}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all',
                  'bg-orange-100 text-orange-700 hover:bg-orange-200',
                  isVoting && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="material-symbols-outlined text-lg">thumb_down</span>
                <span>বেশি দাম</span>
              </button>
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-3 text-xs text-gray-400 text-center">
            {formatTimeAgoBangla(cow.created_at)}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-2xl">flag</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">পোস্ট রিপোর্ট করুন</h3>
                <p className="text-sm text-gray-500">এই পোস্টে সমস্যা আছে?</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              আপনি কি নিশ্চিত যে এই পোস্টটি রিপোর্ট করতে চান? আমাদের টিম এটি পর্যালোচনা করবে।
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={handleReport}
                className="flex-1 py-2.5 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
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
