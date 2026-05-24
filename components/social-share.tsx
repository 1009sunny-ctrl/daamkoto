'use client'

import { useState } from 'react'

interface SocialShareProps {
  url: string
  title?: string
  price?: number
  imageUrl?: string
}

export function SocialShare({ url, title = 'কত নিলো?', price }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  const shareText = `${title}${price ? ` — দাম ৳${price.toLocaleString('bn-BD')}` : ''}`
  const finalUrl = url.startsWith('http') ? url : `https://www.pixork.com${url}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(finalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${finalUrl}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center py-3 rounded-xl bg-green-600 text-white font-semibold"
      >
        WhatsApp
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(finalUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center py-3 rounded-xl bg-blue-600 text-white font-semibold"
      >
        Facebook
      </a>

      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(finalUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center py-3 rounded-xl bg-black text-white font-semibold"
      >
        X
      </a>

      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(finalUrl)}&text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center py-3 rounded-xl bg-sky-500 text-white font-semibold"
      >
        Telegram
      </a>

      <button
        type="button"
        onClick={copyLink}
        className="col-span-2 md:col-span-2 py-3 rounded-xl bg-gray-200 text-gray-800 font-semibold"
      >
        {copied ? 'কপি হয়েছে' : 'লিংক কপি করুন'}
      </button>
    </div>
  )
}

export function SocialShareCompact({ url, title = 'কত নিলো?', price }: SocialShareProps) {
  const finalUrl = url.startsWith('http') ? url : `https://www.pixork.com${url}`
  const shareText = `${title}${price ? ` — দাম ৳${price.toLocaleString('bn-BD')}` : ''}`

  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${finalUrl}`)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-emerald-600 transition-colors"
      aria-label="Share"
    >
      <span className="material-symbols-outlined text-lg">share</span>
    </a>
  )
}
