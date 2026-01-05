import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SME Customer Management',
  description: 'Manage SME companies and customer loyalty programs',
  manifest: '/manifest.json',
  themeColor: '#667eea',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Loyalty Wallet',
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
        <link rel="icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#667eea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Loyalty Wallet" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                // Register service worker immediately (don't wait for load)
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                  .then((registration) => {
                    console.log('SW registered:', registration);
                    // Force update check
                    registration.update();
                  })
                  .catch((error) => {
                    console.error('SW registration failed:', error);
                  });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}


