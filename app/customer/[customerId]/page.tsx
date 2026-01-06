'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'react-qr-code'
import StampCard from '@/app/components/StampCard'

interface TierBenefit {
  name: string
  status: string
  unlockedAt: string | null
  usedAt: string | null
}

interface TierBenefits {
  tierId: string
  tierName: string
  tierColor: string | null
  benefits: TierBenefit[]
}

interface TierUpgrade {
  upgraded: boolean
  oldTier: string
  newTier: string
  unlockedBenefits: string[]
}

interface StampReward {
  id: string
  stampsRequired: number
  rewardName: string
  rewardDescription?: string | null
}

interface Customer {
  id: string
  name: string
  email: string
  points: number
  stamps?: number
  tier: string
  qrCodeId: string
  lastTierUpgradeDate?: string | null
  cardCycleNumber?: number
  sme: {
    id: string
    companyName: string
    bannerImageUrl: string | null
    uniqueLinkId: string
    loyaltyType?: string
    stampsRequired?: number | null
    primaryColor?: string | null
    secondaryColor?: string | null
    stampRewards?: StampReward[]
  }
  tierBenefits: TierBenefits[]
  tierUpgrade?: TierUpgrade | null
  redeemedRewardIds?: string[] // Current cycle only - for display filtering
  previousCycleRedeemedRewardIds?: string[] // Previous cycle redemptions - to hide old card rewards that were redeemed
  allRedeemedRewardIds?: string[] // All cycles - for eligibility check
  displayStamps?: number // Stamps for current card visualization
  totalStamps?: number // Total accumulated stamps (for eligibility)
}

interface Transaction {
  id: string
  points: number
  amount?: number | null
  taxAmount?: number | null
  stampsEarned?: number | null
  description: string
  createdAt: string
}

export default function CustomerDashboard() {
  const params = useParams()
  const customerId = params.customerId as string

  // Type definition for beforeinstallprompt event
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToWallet, setAddingToWallet] = useState(false)
  const [walletSupported, setWalletSupported] = useState(false)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  // PWA Install Prompt Handler
  useEffect(() => {
    // Check if already installed (PWA standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    
    if (isStandalone) {
      setIsInstalled(true)
      // Store customerId if not already stored (for iOS manual installs)
      if (customerId && !localStorage.getItem('pwa_customerId')) {
        localStorage.setItem('pwa_customerId', customerId)
      }
      return
    }

    // Always enable wallet button (we'll handle different cases in the handler)
    setWalletSupported(true)

    // Capture beforeinstallprompt event (Android Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      console.log('PWA install prompt event captured')
    }

    // Add event listener
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Also check if service worker is ready (sometimes event fires after SW registration)
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          console.log('Service worker ready:', registration)
          // Event might fire after SW is ready, so we keep the listener active
        } catch (error) {
          console.log('Service worker not ready yet:', error)
        }
      }
    }
    checkServiceWorker()

    // The event might fire with a delay, so we keep listening
    // Some browsers fire it after user interaction or page load

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  useEffect(() => {
    fetchCustomerData()
  }, [customerId])

  const fetchCustomerData = async () => {
    try {
      const [customerRes, transactionsRes] = await Promise.all([
        fetch(`/api/customers/${customerId}`),
        fetch(`/api/customers/${customerId}/transactions`),
      ])

      if (customerRes.ok) {
        const customerData = await customerRes.json()
        setCustomer(customerData)
      } else {
        const errorData = await customerRes.json()
        console.error('Error fetching customer:', errorData)
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json()
        setTransactions(transactionsData)
      }
    } catch (error) {
      console.error('Error fetching customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToWallet = async () => {
    if (!customer) return

    // Check if iOS (Safari or Chrome - both use WebKit and don't support beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    // iOS doesn't support beforeinstallprompt event (even Chrome on iOS uses WebKit)
    // So we need to show manual instructions
    if (isIOS) {
      // Store customerId before showing instructions
      if (customerId) {
        localStorage.setItem('pwa_customerId', customerId)
      }
      // Show iOS instructions modal
      setShowIOSInstructions(true)
      return
    }

    // Android/Desktop: Use PWA install prompt if available
    if (installEvent) {
      setAddingToWallet(true)
      try {
        // Trigger the install prompt immediately (no delay)
        await installEvent.prompt()
        
        // Wait for user's choice
        const { outcome } = await installEvent.userChoice
        
        if (outcome === 'accepted') {
          setIsInstalled(true)
          setInstallEvent(null) // Clear the event
          // Store customerId in localStorage so PWA opens to their dashboard
          localStorage.setItem('pwa_customerId', customerId)
          // Show success message
          alert('Saved to phone successfully! You can now access it from your home screen.')
        } else {
          // User dismissed the prompt
          console.log('User dismissed install prompt')
        }
      } catch (error) {
        console.error('Error showing install prompt:', error)
        // If prompt fails, try to show instructions
        const isAndroid = /Android/.test(navigator.userAgent)
        if (isAndroid) {
          alert('Install prompt failed. To add manually:\n1. Tap the menu (three dots)\n2. Select "Add to Home screen" or "Install app"\n3. Tap "Add" or "Install"')
        } else {
          alert('Install prompt not available. Please use your browser\'s menu to add to home screen.')
        }
      } finally {
        setAddingToWallet(false)
      }
    } else {
      // No install event - check if we can trigger it or show instructions
      // Sometimes the event hasn't fired yet, so let's wait a bit and check again
      setAddingToWallet(true)
      
      // Wait a moment for the event to potentially fire
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Check again if event is now available
      if (installEvent) {
        setAddingToWallet(false)
        // Retry with the event
        handleAddToWallet()
        return
      }
      
      setAddingToWallet(false)
      
      // Check if app is installable by checking for manifest and service worker
      const hasManifest = document.querySelector('link[rel="manifest"]')
      const hasServiceWorker = 'serviceWorker' in navigator
      
      if (hasManifest && hasServiceWorker) {
        // App should be installable, but event didn't fire
        // Most common reason: Icons are too small (1x1 placeholders)
        // Browsers require proper 192x192 and 512x512 icons
        const isAndroid = /Android/.test(navigator.userAgent)
        if (isAndroid) {
          alert('Install prompt not available. Common reasons:\n\n1. Icons are too small (need 192x192 and 512x512)\n2. You dismissed the prompt before\n3. Browser hasn\'t determined app is installable\n\nTo add manually:\n1. Tap menu (three dots) → "Add to Home screen"\n2. Or "Install app" → "Install"\n\nNote: Proper icons are required for automatic install prompt.')
        } else {
          alert('Install prompt not available. Please:\n1. Look for install icon in address bar\n2. Or use browser menu to add to home screen\n\nNote: Proper icons (192x192, 512x512) are required.')
        }
      } else {
        // PWA requirements not met
        const missing = []
        if (!hasManifest) missing.push('Manifest file')
        if (!hasServiceWorker) missing.push('Service worker')
        alert(`PWA installation requires:\n- Valid manifest file\n- Service worker registered\n- HTTPS connection\n- Proper icons (192x192, 512x512)\n\nMissing: ${missing.join(', ')}\n\nPlease ensure all requirements are met.`)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Customer not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {/* Banner Image */}
          {customer.sme.bannerImageUrl && (
            <div className="w-full h-32 md:h-48 bg-gray-200 overflow-hidden">
              <img
                src={customer.sme.bannerImageUrl}
                alt={`${customer.sme.companyName} banner`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Welcome, {customer.name}!
            </h1>
            <p className="text-sm md:text-base text-gray-600 mb-4">
              {customer.sme.companyName} - Loyalty Program
            </p>

            {/* Tier Upgrade Notification */}
            {customer.tierUpgrade && customer.tierUpgrade.upgraded && (
              <div className="mb-4 md:mb-6 bg-green-50 border-2 border-green-500 rounded-lg p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-bold text-green-900 mb-2">
                  🎉 Tier Upgrade!
                </h3>
                <p className="text-sm md:text-base text-green-800">
                  Congratulations! You've upgraded from <strong>{customer.tierUpgrade.oldTier}</strong> to{' '}
                  <strong>{customer.tierUpgrade.newTier}</strong>
                </p>
                {customer.tierUpgrade.unlockedBenefits.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs md:text-sm font-semibold text-green-900">
                      New Benefits Unlocked:
                    </p>
                    <ul className="list-disc list-inside text-sm text-green-800 mt-1">
                      {customer.tierUpgrade.unlockedBenefits.map((benefit, idx) => (
                        <li key={idx}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          {/* Display Based on Program Type */}
          {customer.sme.loyaltyType === 'stamps' ? (
            <div className="bg-white rounded-lg p-6 md:p-8 border border-gray-200 mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 text-center">
                Your Stamp Card
              </h2>
              <StampCard
                currentStamps={customer.displayStamps ?? (customer.stamps || 0) % (customer.sme.stampsRequired || 10)}
                totalStamps={customer.sme.stampsRequired || 10}
                primaryColor={customer.sme.primaryColor}
                secondaryColor={customer.sme.secondaryColor}
                size="large"
                rewards={customer.sme.stampRewards || []}
                redeemedRewardIds={customer.redeemedRewardIds || []}
              />
              
              {/* Stamp Rewards */}
              {customer.sme.stampRewards && customer.sme.stampRewards.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3">
                    Stamp Rewards
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const totalStamps = customer.totalStamps ?? customer.stamps ?? 0
                      const displayStamps = customer.displayStamps ?? (customer.stamps || 0)
                      const stampsRequired = customer.sme.stampsRequired || 10
                      const currentCardCycle = customer.cardCycleNumber || 1
                      const stampsFromPreviousCycles = totalStamps - displayStamps
                      
                      // Build array of rewards to display
                      const rewardsToDisplay: Array<{
                        reward: typeof customer.sme.stampRewards[0]
                        isOldCard: boolean
                        canRedeem: boolean
                      }> = []
                      
                      customer.sme.stampRewards
                        .sort((a, b) => a.stampsRequired - b.stampsRequired)
                        .forEach((reward) => {
                          const isRedeemedInCurrentCycle = customer.redeemedRewardIds?.includes(reward.id) || false
                          const wasEligibleInPreviousCycle = stampsFromPreviousCycles >= reward.stampsRequired
                          const hasEnoughStampsOnCurrentCard = displayStamps >= reward.stampsRequired
                          
                          // If on a new card (cycle > 1), show rewards twice:
                          // 1. Old card version (show even if redeemed - will show with strikethrough)
                          // 2. New card version (always shown)
                          if (currentCardCycle > 1) {
                            // Check if reward was redeemed in PREVIOUS cycle (not current cycle)
                            const isRedeemedInPreviousCycle = customer.previousCycleRedeemedRewardIds?.includes(reward.id) || false
                            
                            // Old card reward: show if eligible in previous cycle (even if redeemed)
                            if (wasEligibleInPreviousCycle) {
                              rewardsToDisplay.push({
                                reward,
                                isOldCard: true,
                                canRedeem: !isRedeemedInPreviousCycle, // Redeemable only if not redeemed
                              })
                            }
                            
                            // New card reward: always show (grey until earned on current card, or strikethrough if redeemed)
                            rewardsToDisplay.push({
                              reward,
                              isOldCard: false,
                              canRedeem: hasEnoughStampsOnCurrentCard && !isRedeemedInCurrentCycle,
                            })
                          } else {
                            // First card: show all rewards (even if redeemed)
                            const canRedeem = totalStamps >= reward.stampsRequired && !isRedeemedInCurrentCycle
                            rewardsToDisplay.push({
                              reward,
                              isOldCard: false,
                              canRedeem,
                            })
                          }
                        })
                      
                      return rewardsToDisplay.map((item, index) => {
                        const { reward, isOldCard, canRedeem } = item
                        const displayStamps = customer.displayStamps ?? (customer.stamps || 0)
                        
                        // Check if this reward is redeemed
                        const isRedeemedInCurrentCycle = customer.redeemedRewardIds?.includes(reward.id) || false
                        const isRedeemedInPreviousCycle = customer.previousCycleRedeemedRewardIds?.includes(reward.id) || false
                        const isRedeemed = isOldCard ? isRedeemedInPreviousCycle : isRedeemedInCurrentCycle
                        
                        return (
                          <div
                            key={`${reward.id}-${isOldCard ? 'old' : 'new'}-${index}`}
                            className={`border rounded-lg p-4 ${
                              isRedeemed
                                ? 'bg-gray-100 border-gray-300'
                                : canRedeem
                                ? 'bg-green-50 border-green-500'
                                : 'bg-blue-50 border-blue-200 opacity-70'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`font-semibold ${
                                  isRedeemed
                                    ? 'text-gray-500 line-through'
                                    : canRedeem
                                    ? 'text-green-900'
                                    : 'text-gray-700'
                                }`}>
                                  {reward.rewardName}
                                </h4>
                                {reward.rewardDescription && (
                                  <p className={`text-sm mt-1 ${
                                    isRedeemed ? 'text-gray-400 line-through' : 'text-gray-600'
                                  }`}>
                                    {reward.rewardDescription}
                                  </p>
                                )}
                                {(isOldCard || (!isOldCard && currentCardCycle > 1)) && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    {isOldCard && (
                                      <span className="text-purple-600 font-medium">
                                        (Previous Card)
                                      </span>
                                    )}
                                    {!isOldCard && currentCardCycle > 1 && (
                                      <span className="text-blue-600 font-medium">
                                        (New Card)
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                              {isRedeemed ? (
                                <div className="ml-4 px-4 py-2 bg-gray-400 text-white rounded-lg font-medium text-sm text-center">
                                  Redeemed
                                </div>
                              ) : canRedeem ? (
                                <div className="ml-4 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-medium text-sm text-center">
                                  Visit store to redeem
                                </div>
                              ) : (
                                <div className="ml-4 px-3 py-2 bg-gray-300 text-gray-500 text-xs font-semibold rounded whitespace-nowrap">
                                  Not Available
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-blue-50 rounded-lg p-4 md:p-6 border border-blue-200">
                <h2 className="text-xs md:text-sm font-medium text-blue-600 mb-2">Points Balance</h2>
                <p className="text-3xl md:text-4xl font-bold text-blue-900">{customer.points}</p>
              </div>

              <div className="bg-amber-50 rounded-lg p-4 md:p-6 border border-amber-200">
                <h2 className="text-xs md:text-sm font-medium text-amber-600 mb-2">Current Tier</h2>
                <p className="text-3xl md:text-4xl font-bold text-amber-900">{customer.tier}</p>
              </div>
            </div>
          )}

          {/* Save to Phone Button */}
          <div className="mt-4 md:mt-6">
            {isInstalled ? (
              <a
                href={`/customer/${customerId}`}
                className="w-full px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors font-semibold text-base md:text-lg flex items-center justify-center gap-2 md:gap-3 shadow-lg"
              >
                <span>✅</span>
                <span>Open on Phone</span>
              </a>
            ) : (
              <>
                <button
                  onClick={handleAddToWallet}
                  disabled={addingToWallet}
                  className="w-full px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-semibold text-base md:text-lg flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {addingToWallet ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>📱</span>
                      <span>Save to Phone</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  {/iPad|iPhone|iPod/.test(navigator.userAgent) 
                    ? 'Tap to see installation instructions' 
                    : installEvent 
                    ? 'Install to access your wallet offline'
                    : 'Tap to see installation options'}
                </p>
              </>
            )}
          </div>

          {/* iOS Instructions Modal */}
          {showIOSInstructions && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Save to Phone
                </h3>
                <div className="space-y-4 text-gray-700">
                  <p className="text-sm">
                    To save this wallet to your iPhone:
                  </p>
                  <ol className="list-decimal list-inside space-y-3 text-sm">
                    <li>Tap the <strong>Share</strong> button <span className="text-blue-600">(square with arrow ↑)</span> at the bottom of your screen</li>
                    <li>Scroll down in the menu and tap <strong>"Add to Home Screen"</strong> or <strong>"Add to Home"</strong></li>
                    <li>Tap <strong>"Add"</strong> in the top right corner</li>
                  </ol>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-yellow-900">
                      ⚠️ <strong>Note:</strong> Even on Chrome, iOS requires manual installation. This is an iOS limitation, not a browser issue.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-blue-900">
                      💡 Once saved, you can access your wallet offline and it will work like an app!
                    </p>
                    <p className="text-xs text-blue-800 mt-2">
                      📱 After saving, open the app from your home screen to access your personalized dashboard.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      // Store customerId before they add to home screen
                      if (customerId) {
                        localStorage.setItem('pwa_customerId', customerId)
                      }
                      setShowIOSInstructions(false)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Store customerId before they add to home screen
                      if (customerId) {
                        localStorage.setItem('pwa_customerId', customerId)
                      }
                      setShowIOSInstructions(false)
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Section - Small and Scannable */}
          <div id="qr-code-section" className="mt-4 md:mt-6 bg-white rounded-lg p-4 md:p-6 border border-gray-200">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
              Your QR Code
            </h2>
            <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
              Show this QR code at {customer.sme.companyName} to earn points and redeem benefits
            </p>
            <div className="flex justify-center bg-white p-2 md:p-3 rounded-lg border-2 border-gray-300">
              <QRCode
                value={customer.qrCodeId}
                size={120}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 120 120`}
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2 font-mono break-all">
              {customer.qrCodeId}
            </p>
          </div>

          {/* Tier Benefits Section - Only for Points Programs */}
          {customer.sme.loyaltyType !== 'stamps' && customer.tierBenefits && customer.tierBenefits.length > 0 && (
            <div id="benefits-section" className="mt-4 md:mt-6 bg-white rounded-lg p-4 md:p-6 border border-gray-200">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                Your Benefits
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                Benefits available from your current tier and previous tiers
              </p>
              
              <div className="space-y-6">
                {customer.tierBenefits.map((tierData) => (
                  <div key={tierData.tierId} className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <h3
                        className="text-lg font-bold text-gray-900"
                        style={{
                          color: tierData.tierColor || '#6B7280',
                        }}
                      >
                        {tierData.tierName} Tier
                      </h3>
                      {tierData.tierName === customer.tier && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                          Current
                        </span>
                      )}
                    </div>
                    
                    {tierData.benefits.length > 0 ? (
                      <div className="space-y-2">
                        {tierData.benefits.map((benefit, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start p-3 rounded-lg ${
                              benefit.status === 'used'
                                ? 'bg-gray-100 border border-gray-300'
                                : 'bg-green-50 border border-green-200'
                            }`}
                          >
                            <span
                              className={`mr-2 mt-1 flex-shrink-0 ${
                                benefit.status === 'used'
                                  ? 'text-gray-400'
                                  : 'text-green-600'
                              }`}
                            >
                              {benefit.status === 'used' ? '✓' : '✓'}
                            </span>
                            <div className="flex-1">
                              <p
                                className={`font-medium ${
                                  benefit.status === 'used'
                                    ? 'text-gray-500 line-through'
                                    : 'text-gray-900'
                                }`}
                              >
                                {benefit.name}
                              </p>
                              {benefit.status === 'used' && benefit.usedAt && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Redeemed: {new Date(benefit.usedAt).toLocaleDateString()}
                                </p>
                              )}
                              {benefit.status === 'available' && benefit.unlockedAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Available since: {new Date(benefit.unlockedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {benefit.status === 'used' && (
                              <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded">
                                Used
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No benefits for this tier</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>

        <div id="transaction-history-section" className="bg-white rounded-lg shadow-md p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
            Transaction History
          </h2>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm md:text-base">No transactions yet.</p>
              <p className="text-xs md:text-sm text-gray-400 mt-2">
                Your transaction history will appear here as you earn or spend points.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      {customer.sme.loyaltyType === 'stamps' ? (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stamps
                        </th>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tax
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Points
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        {customer.sme.loyaltyType === 'stamps' ? (
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                            (transaction.stampsEarned || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(transaction.stampsEarned || 0) >= 0 ? '+' : ''}{transaction.stampsEarned || 0}
                          </td>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {transaction.amount !== null && transaction.amount !== undefined ? `$${transaction.amount.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {transaction.taxAmount !== null && transaction.taxAmount !== undefined ? `$${transaction.taxAmount.toFixed(2)}` : '-'}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                              transaction.points >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.points >= 0 ? '+' : ''}{transaction.points}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  {customer.sme.loyaltyType !== 'stamps' && (
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                          Total Points:
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                          {customer.points}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {customer.sme.loyaltyType === 'stamps' ? (
                        <div className={`text-right ml-3 ${
                          (transaction.stampsEarned || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <p className="text-base font-bold">
                            {(transaction.stampsEarned || 0) >= 0 ? '+' : ''}{transaction.stampsEarned || 0}
                          </p>
                          <p className="text-xs text-gray-500">stamp{(transaction.stampsEarned || 0) !== 1 ? 's' : ''}</p>
                        </div>
                      ) : (
                        <>
                          <div className={`text-right ml-3 ${
                            transaction.points >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            <p className="text-base font-bold">
                              {transaction.points >= 0 ? '+' : ''}{transaction.points}
                            </p>
                            <p className="text-xs text-gray-500">points</p>
                          </div>
                          <div className="text-right ml-3 text-xs text-gray-600">
                            {transaction.amount !== null && transaction.amount !== undefined && (
                              <p className="mb-1">${transaction.amount.toFixed(2)}</p>
                            )}
                            {transaction.taxAmount !== null && transaction.taxAmount !== undefined && (
                              <p className="text-gray-500">Tax: ${transaction.taxAmount.toFixed(2)}</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {customer.sme.loyaltyType !== 'stamps' && (
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 mt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-gray-900">Total Points:</p>
                      <p className="text-lg font-bold text-blue-900">{customer.points}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fixed Bottom Navigation Bar - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => {
              document.getElementById('qr-code-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="flex flex-col items-center justify-center py-3 px-2 text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
          >
            <span className="text-xl mb-1">📱</span>
            <span className="text-xs font-medium">QR Code</span>
          </button>
          <button
            onClick={() => {
              document.getElementById('benefits-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="flex flex-col items-center justify-center py-3 px-2 text-green-600 hover:bg-green-50 active:bg-green-100 transition-colors"
          >
            <span className="text-xl mb-1">🎁</span>
            <span className="text-xs font-medium">Benefits</span>
          </button>
          <button
            onClick={() => {
              document.getElementById('transaction-history-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="flex flex-col items-center justify-center py-3 px-2 text-purple-600 hover:bg-purple-50 active:bg-purple-100 transition-colors"
          >
            <span className="text-xl mb-1">📊</span>
            <span className="text-xs font-medium">History</span>
          </button>
          <a
            href={`/program/${customer.sme.uniqueLinkId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-3 px-2 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 transition-colors"
          >
            <span className="text-xl mb-1">ℹ️</span>
            <span className="text-xs font-medium">Program</span>
          </a>
        </div>
      </div>
    </div>
  )
}

