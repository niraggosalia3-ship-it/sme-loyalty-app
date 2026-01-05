'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'react-qr-code'

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

interface Customer {
  id: string
  name: string
  email: string
  points: number
  tier: string
  qrCodeId: string
  lastTierUpgradeDate?: string | null
  sme: {
    companyName: string
    bannerImageUrl: string | null
    uniqueLinkId: string
  }
  tierBenefits: TierBenefits[]
  tierUpgrade?: TierUpgrade | null
}

interface Transaction {
  id: string
  points: number
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
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true)
      return
    }

    // Always enable wallet button (we'll handle different cases in the handler)
    setWalletSupported(true)

    // Capture beforeinstallprompt event (Android Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

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

    // Check if iOS Safari (cannot intercept prompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    
    if (isIOS && isSafari) {
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
          // Show success message
          alert('Wallet added successfully! You can now access it from your home screen.')
        }
      } catch (error) {
        console.error('Error showing install prompt:', error)
        alert('Failed to show install prompt. Please try again.')
      } finally {
        setAddingToWallet(false)
      }
    } else {
      // Fallback: Show instructions for manual install
      const isAndroid = /Android/.test(navigator.userAgent)
      if (isAndroid) {
        alert('To add to home screen:\n1. Tap the menu (three dots)\n2. Select "Add to Home screen" or "Install app"\n3. Tap "Add" or "Install"')
      } else {
        alert('To add to home screen:\n1. Look for the install icon in your browser\'s address bar\n2. Or use your browser\'s menu to add to home screen')
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

          {/* Add to Wallet Button */}
          <div className="mt-4 md:mt-6">
            {isInstalled ? (
              <a
                href="/"
                className="w-full px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors font-semibold text-base md:text-lg flex items-center justify-center gap-2 md:gap-3 shadow-lg"
              >
                <span>✅</span>
                <span>Open Wallet</span>
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
                      <span>Installing...</span>
                    </>
                  ) : (
                    <>
                      <span>💳</span>
                      <span>Add to Wallet</span>
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
                  Add to Home Screen
                </h3>
                <div className="space-y-4 text-gray-700">
                  <p className="text-sm">
                    To add this wallet to your iPhone home screen:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Tap the <strong>Share</strong> button at the bottom of your screen</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> in the top right corner</li>
                  </ol>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-blue-900">
                      💡 Once added, you can access your wallet offline and it will work like an app!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Got it
                </button>
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

          {/* Tier Benefits Section */}
          {customer.tierBenefits && customer.tierBenefits.length > 0 && (
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
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
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          transaction.points >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.points >= 0 ? '+' : ''}{transaction.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        Total Points:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        {customer.points}
                      </td>
                    </tr>
                  </tfoot>
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
                      <div className={`text-right ml-3 ${
                        transaction.points >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <p className="text-base font-bold">
                          {transaction.points >= 0 ? '+' : ''}{transaction.points}
                        </p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 mt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-900">Total Points:</p>
                    <p className="text-lg font-bold text-blue-900">{customer.points}</p>
                  </div>
                </div>
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

