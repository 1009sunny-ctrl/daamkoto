import type { Metadata } from 'next'
import { Noto_Sans_Bengali } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const notoSansBengali = Noto_Sans_Bengali({ 
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: 'DAAMKOTO - কোরবানির গরুর দাম রেটিং',
  description: 'আপনার কোরবানির গরুর ছবি ও দাম আপলোড করুন, আর সবাই বলুক দামটা ভালো নাকি বেশি। বাংলাদেশের ঈদুল আযহা গরুর দাম রেটিং প্ল্যাটফর্ম।',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="bn" className="bg-background">
      <body className={`${notoSansBengali.className} antialiased min-h-screen`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
