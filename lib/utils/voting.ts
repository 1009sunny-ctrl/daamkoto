const ANONYMOUS_USER_ID_KEY = 'daamkoto_anonymous_user_id'
const VOTED_COWS_KEY = 'daamkoto_voted_cows'

export function getAnonymousUserId(): string {
  if (typeof window === 'undefined') return ''
  
  let userId = localStorage.getItem(ANONYMOUS_USER_ID_KEY)
  if (!userId) {
    userId = `anon_${crypto.randomUUID()}`
    localStorage.setItem(ANONYMOUS_USER_ID_KEY, userId)
  }
  return userId
}

export function hasVotedOnCow(cowId: string): boolean {
  if (typeof window === 'undefined') return false
  
  const votedCows = getVotedCows()
  return votedCows.includes(cowId)
}

export function markCowAsVoted(cowId: string): void {
  if (typeof window === 'undefined') return
  
  const votedCows = getVotedCows()
  if (!votedCows.includes(cowId)) {
    votedCows.push(cowId)
    localStorage.setItem(VOTED_COWS_KEY, JSON.stringify(votedCows))
  }
}

function getVotedCows(): string[] {
  try {
    const stored = localStorage.getItem(VOTED_COWS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price).replace('BDT', '৳')
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  return date.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })
}

export function formatTimeAgoBangla(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'এইমাত্র'
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} মিনিট আগে`
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    return `${hours} ঘন্টা আগে`
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400)
    return `${days} দিন আগে`
  }
  
  return date.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })
}
