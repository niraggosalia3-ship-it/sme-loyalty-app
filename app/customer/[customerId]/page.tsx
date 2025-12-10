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

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToWallet, setAddingToWallet] = useState(false)
  const [walletSupported, setWalletSupported] = useState(false)

  useEffect(() => {
    fetchCustomerData()
    // Always show wallet button (works on all devices)
    // Mobile devices can save to home screen, desktop can view/print
    setWalletSupported(true)
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

    setAddingToWallet(true)
    try {
      // Detect platform
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const platform = isIOS ? 'ios' : 'android'

      // Generate pass
      const res = await fetch('/api/passes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          platform,
        }),
      })

      if (res.ok) {
        const data = await res.json()

        // Redirect to pass page (works for both iOS and Android)
        if (data.passUrl) {
          window.open(data.passUrl, '_blank')
        } else {
          alert(data.message || 'Pass generated successfully!')
        }
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to generate wallet pass')
      }
    } catch (error) {
      console.error('Error adding to wallet:', error)
      alert('Failed to add to wallet. Please try again.')
    } finally {
      setAddingToWallet(false)
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {/* Banner Image */}
          {customer.sme.bannerImageUrl && (
            <div className="w-full h-48 bg-gray-200 overflow-hidden">
              <img
                src={customer.sme.bannerImageUrl}
                alt={`${customer.sme.companyName} banner`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {customer.name}!
            </h1>
            <p className="text-gray-600 mb-4">
              {customer.sme.companyName} - Loyalty Program
            </p>

            {/* Tier Upgrade Notification */}
            {customer.tierUpgrade && customer.tierUpgrade.upgraded && (
              <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-lg p-6">
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  🎉 Tier Upgrade!
                </h3>
                <p className="text-green-800">
                  Congratulations! You've upgraded from <strong>{customer.tierUpgrade.oldTier}</strong> to{' '}
                  <strong>{customer.tierUpgrade.newTier}</strong>
                </p>
                {customer.tierUpgrade.unlockedBenefits.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-green-900">
                      New Benefits Unlocked:
                    </p>
                    <ul className="list-disc list-inside text-green-800 mt-1">
                      {customer.tierUpgrade.unlockedBenefits.map((benefit, idx) => (
                        <li key={idx}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h2 className="text-sm font-medium text-blue-600 mb-2">Points Balance</h2>
              <p className="text-4xl font-bold text-blue-900">{customer.points}</p>
            </div>

            <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
              <h2 className="text-sm font-medium text-amber-600 mb-2">Current Tier</h2>
              <p className="text-4xl font-bold text-amber-900">{customer.tier}</p>
            </div>
          </div>

          {/* Quick Navigation Buttons */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => {
                document.getElementById('qr-code-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <span>📱</span>
              <span>QR Code</span>
            </button>
            <button
              onClick={() => {
                document.getElementById('benefits-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <span>🎁</span>
              <span>Benefits</span>
            </button>
            <button
              onClick={() => {
                document.getElementById('transaction-history-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <span>📊</span>
              <span>History</span>
            </button>
            <a
              href={`/program/${customer.sme.uniqueLinkId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <span>ℹ️</span>
              <span>Program</span>
            </a>
          </div>

          {/* Add to Wallet Button */}
          <div className="mt-6">
            <button
              onClick={handleAddToWallet}
              disabled={addingToWallet}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-semibold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {addingToWallet ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Generating Pass...</span>
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
                ? 'Save to home screen for quick access' 
                : /Android/.test(navigator.userAgent)
                ? 'Save to home screen or add to Google Wallet'
                : 'View your wallet card (can be saved as image)'}
            </p>
          </div>

          {/* QR Code Section - Small and Scannable */}
          <div id="qr-code-section" className="mt-6 bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Your QR Code
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Show this QR code at {customer.sme.companyName} to earn points and redeem benefits
            </p>
            <div className="flex justify-center bg-white p-3 rounded-lg border-2 border-gray-300">
              <QRCode
                value={customer.qrCodeId}
                size={120}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 120 120`}
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2 font-mono">
              {customer.qrCodeId}
            </p>
          </div>

          {/* Tier Benefits Section */}
          {customer.tierBenefits && customer.tierBenefits.length > 0 && (
            <div id="benefits-section" className="mt-6 bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Your Benefits
              </h2>
              <p className="text-sm text-gray-600 mb-4">
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

        <div id="transaction-history-section" className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Transaction History
          </h2>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Your transaction history will appear here as you earn or spend points.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
          )}
        </div>
      </div>
    </div>
  )
}

