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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, ThumbsUp, ThumbsDown, Loader2, Scale, Clock } from 'lucide-react'

interface CowCardProps {
  cow: Cow
  onVote?: () => void
}

export function CowCard({ cow, onVote }: CowCardProps) {
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [localCow, setLocalCow] = useState(cow)

  useEffect(() => {
    setHasVoted(hasVotedOnCow(cow.id))
  }, [cow.id])

  const handleVote = async (voteType: 'good_deal' | 'overpriced') => {
    if (hasVoted || isVoting) return

    setIsVoting(true)
    setVoteError(null)

    try {
      const supabase = createClient()
      const anonymousUserId = getAnonymousUserId()

      // Insert vote
      const { error: voteError } = await supabase.from('votes').insert({
        cow_id: cow.id,
        vote_type: voteType,
        anonymous_user_id: anonymousUserId,
      })

      if (voteError) {
        if (voteError.code === '23505') {
          // Unique constraint violation - already voted
          setVoteError('আপনি ইতিমধ্যে ভোট দিয়েছেন')
          markCowAsVoted(cow.id)
          setHasVoted(true)
          return
        }
        throw voteError
      }

      // Update vote count
      const updateField = voteType === 'good_deal' ? 'good_deal_count' : 'overpriced_count'
      const { error: updateError } = await supabase
        .from('cows')
        .update({ [updateField]: localCow[updateField] + 1 })
        .eq('id', cow.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      setLocalCow({
        ...localCow,
        [updateField]: localCow[updateField] + 1,
      })

      markCowAsVoted(cow.id)
      setHasVoted(true)
      onVote?.()
    } catch {
      setVoteError('ভোট দেওয়া যায়নি। আবার চেষ্টা করুন।')
    } finally {
      setIsVoting(false)
    }
  }

  const totalVotes = localCow.good_deal_count + localCow.overpriced_count
  const goodDealPercent = totalVotes > 0 ? Math.round((localCow.good_deal_count / totalVotes) * 100) : 0

  return (
    <Card className="overflow-hidden border-border bg-card">
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
        <Image
          src={localCow.image_url}
          alt="কোরবানির গরু"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Price Badge */}
        <div className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1.5 font-semibold text-foreground backdrop-blur-sm">
          {formatPrice(localCow.price)}
        </div>
      </div>

      <CardContent className="space-y-4 p-4">
        {/* Location & Time */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{localCow.district}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{formatTimeAgoBangla(localCow.created_at)}</span>
          </div>
        </div>

        {/* Weight & Description */}
        {(localCow.estimated_weight || localCow.description) && (
          <div className="space-y-1 text-sm">
            {localCow.estimated_weight && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Scale className="h-4 w-4" />
                <span>~{localCow.estimated_weight} কেজি</span>
              </div>
            )}
            {localCow.description && (
              <p className="line-clamp-2 text-muted-foreground">{localCow.description}</p>
            )}
          </div>
        )}

        {/* Vote Result Bar (if has votes) */}
        {totalVotes > 0 && (
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${goodDealPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{goodDealPercent}% দাম ঠিক আছে</span>
              <span>{totalVotes} ভোট</span>
            </div>
          </div>
        )}

        {/* Voting Buttons */}
        {hasVoted ? (
          <div className="rounded-lg bg-secondary p-3 text-center text-sm text-muted-foreground">
            আপনি ইতিমধ্যে ভোট দিয়েছেন
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleVote('good_deal')}
              disabled={isVoting}
            >
              {isVoting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ThumbsUp className="mr-2 h-4 w-4" />
              )}
              দাম ঠিক
              <span className="ml-1 text-xs opacity-70">({localCow.good_deal_count})</span>
            </Button>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => handleVote('overpriced')}
              disabled={isVoting}
            >
              {isVoting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ThumbsDown className="mr-2 h-4 w-4" />
              )}
              দাম বেশি
              <span className="ml-1 text-xs opacity-70">({localCow.overpriced_count})</span>
            </Button>
          </div>
        )}

        {/* Vote Error */}
        {voteError && (
          <p className="text-center text-sm text-destructive">{voteError}</p>
        )}
      </CardContent>
    </Card>
  )
}
