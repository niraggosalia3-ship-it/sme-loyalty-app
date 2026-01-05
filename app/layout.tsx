import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SME Customer Management',
  description: 'Manage SME companies and customer loyalty programs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


