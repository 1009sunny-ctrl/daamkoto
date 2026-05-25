import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Noto_Sans_Bengali } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
})

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-bengali',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.kotonilo.com'),

  title: 'Koto Nilo - কোরবানির গরুর দাম',

  description:
    'বাংলাদেশের কোরবানির গরুর দাম জানুন, শেয়ার করুন এবং রেট করুন। মানুষ কী দামে গরু কিনছে দেখুন।',

  keywords: [
    'কোরবানির গরু',
    'গরুর দাম',
    'কোরবানির হাট',
    'ঢাকা গরুর হাট',
    'qurbani cow price',
    'cow price bangladesh',
    'livestock bangladesh',
    'eid ul adha',
    'cattle market',
  ],

  generator: 'v0.app',

  openGraph: {
    title: 'Koto Nilo - কোরবানির গরুর দাম',

    description:
      'বাংলাদেশের কোরবানির গরুর দাম জানুন, শেয়ার করুন এবং রেট করুন।',

    url: 'https://www.kotonilo.com',

    siteName: 'KotoNilo',

    images: [
      {
url: '/images/Logo1.jpg',
        width: 1200,
        height: 630,
        alt: 'KotoNilo',
      },
    ],

    locale: 'bn_BD',

    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',

    title: 'Koto Nilo - কোরবানির গরুর দাম',

    description:
      'বাংলাদেশের কোরবানির গরুর দাম জানুন, শেয়ার করুন এবং রেট করুন।',

images: ['/images/Logo1.jpg'],
  },

  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },

      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },

      { url: '/icon.svg', type: 'image/svg+xml' },
    ],

    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#14532d',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="bn" className={`${plusJakarta.variable} ${notoSansBengali.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        />
      </head>
      <body className="font-sans antialiased min-h-screen bg-[#fdfbf7]">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
