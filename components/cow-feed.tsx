'use client'

import { type Cow } from '@/lib/types'
import { CowCard } from '@/components/cow-card'

interface CowFeedProps {
  initialCows: Cow[]
}

export function CowFeed({ initialCows }: CowFeedProps) {
  if (initialCows.length === 0) {
    return null
  }

  return (
    <div className="masonry-grid">
      {initialCows.map((cow) => (
        <div key={cow.id} className="masonry-item">
          <CowCard cow={cow} />
        </div>
      ))}
    </div>
  )
}
