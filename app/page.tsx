'use client'

import { useState } from 'react'
import { UploadModal } from '@/components/upload-modal'
import { CowFeed } from '@/components/cow-feed'

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative px-4 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-background to-background" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground md:text-7xl">
            DAAMKOTO
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-balance text-lg leading-relaxed text-muted-foreground md:text-xl">
            আপনার কোরবানির গরুর ছবি ও দাম আপলোড করুন, আর সবাই বলুক দামটা ভালো নাকি বেশি।
          </p>
          <UploadModal onSuccess={handleUploadSuccess} />
        </div>
      </section>

      {/* Cow Feed Section */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-semibold text-foreground md:text-3xl">
              সাম্প্রতিক পোস্ট
            </h2>
            <p className="text-muted-foreground">
              এই ঈদে অন্যরা কত টাকায় গরু কিনেছে দেখুন
            </p>
          </div>
          <CowFeed refreshTrigger={refreshTrigger} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>© ২০২৫ DAAMKOTO by Pixork। ঈদুল আযহার জন্য তৈরি।</p>
        </div>
      </footer>
    </main>
  )
}
