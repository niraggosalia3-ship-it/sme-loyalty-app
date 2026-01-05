'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WalletRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Check if running in PWA standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone

    // Get customerId from localStorage (stored when PWA was installed)
    const customerId = localStorage.getItem('pwa_customerId')

    if (customerId) {
      // Redirect to customer's personalized dashboard
      router.replace(`/customer/${customerId}`)
    } else if (isStandalone) {
      // PWA is installed but no customerId found
      // Redirect to home page where they can navigate
      router.replace('/')
    } else {
      // Not in PWA mode, just redirect to home
      router.replace('/')
    }
  }, [router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-600">Opening your wallet...</div>
      </div>
    </div>
  )
}

