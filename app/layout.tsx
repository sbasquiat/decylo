import type { Metadata } from 'next'
import './globals.css'
import PWARegister from '@/components/PWARegister'
import { Analytics } from '@vercel/analytics/next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Decylo — Make Better Decisions Every Day',
  description: 'Decylo is a decision-making app and personal productivity tool that helps you capture decisions, evaluate options, commit with confidence, and learn from every outcome.',
  manifest: '/manifest.json',
  themeColor: '#0B0E14',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Decylo',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <PWARegister />
        <Analytics />
      </body>
    </html>
  )
}
