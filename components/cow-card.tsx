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

interface CowCardProps {
  cow: Cow
  onVote?: () => void
}

export function CowCard({ cow, onVote }: CowCardProps) {
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [localCow, setLocalCow] = useState(cow)
  const [showReportModal, setShowReportModal] = useState(false)

  useEffect(() => {
    setHasVoted(hasVotedOnCow(cow.id))
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
        if (voteError.code === '23505') {
          markCowAsVoted(cow.id)
          setHasVoted(true)
          return
        }
        throw voteError
      }

      const updateField = voteType === 'good_deal' ? 'good_deal_count' : 'overpriced_count'
      await supabase
        .from('cows')
        .update({ [updateField]: localCow[updateField] + 1 })
        .eq('id', cow.id)

      setLocalCow({
        ...localCow,
        [updateField]: localCow[updateField] + 1,
      })

      markCowAsVoted(cow.id)
      setHasVoted(true)
      onVote?.()
    } catch (error) {
      console.error('Vote error:', error)
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
      console.error('Report error:', error)
    }
  }

  const totalVotes = localCow.good_deal_count + localCow.overpriced_count
  const goodDealPercent = totalVotes > 0 ? Math.round((localCow.good_deal_count / totalVotes) * 100) : 50

  return (
    <>
      <div className="premium-card overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={localCow.image_url}
            alt={localCow.title || 'কোরবানির গরু'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          
          {/* Price Badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
              <span className="text-emerald-900 font-bold text-lg">{formatPrice(localCow.price)}</span>
            </div>
          </div>

          {/* Breed Badge */}
          {localCow.breed && (
            <div className="absolute top-3 right-3">
              <div className="bg-amber-400/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-lg">
                <span className="text-amber-900 font-medium text-xs capitalize">{localCow.breed}</span>
              </div>
            </div>
          )}

          {/* Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">flag</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          {localCow.title && (
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{localCow.title}</h3>
          )}

          {/* Location & Info */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">location_on</span>
              <span>{localCow.hut || localCow.district}</span>
            </div>
            {localCow.estimated_weight && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">scale</span>
                <span>{localCow.estimated_weight} কেজি</span>
              </div>
            )}
          </div>

          {/* Description */}
          {localCow.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{localCow.description}</p>
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
              <span className="text-emerald-600 font-medium">{localCow.good_deal_count} ভালো দাম</span>
              <span className="text-orange-500 font-medium">{localCow.overpriced_count} বেশি দাম</span>
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
            {formatTimeAgoBangla(localCow.created_at)}
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
