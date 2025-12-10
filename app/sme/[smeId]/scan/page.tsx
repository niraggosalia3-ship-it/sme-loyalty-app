'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Html5Qrcode } from 'html5-qrcode'
import QRCode from 'react-qr-code'

interface Benefit {
  id: string | null
  name: string
  tierId: string
  tierName: string
  tierColor: string | null
  status: string
  unlockedAt: string | null
  usedAt: string | null
}

interface Customer {
  customerId: string
  name: string
  email: string
  points: number
  tier: string
  qrCodeId?: string
  sme: {
    id: string
    companyName: string
  }
  availableBenefits: Benefit[]
  allBenefits?: Benefit[]
}

interface TierUpgrade {
  upgraded: boolean
  oldTier: string
  newTier: string
  unlockedBenefits: string[]
}

export default function QRScanner() {
  const params = useParams()
  const smeId = params.smeId as string

  const [scanning, setScanning] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [qrCodeId, setQrCodeId] = useState('')
  const [manualEntry, setManualEntry] = useState(false)
  const [transactionData, setTransactionData] = useState({
    amount: '',
    taxAmount: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [tierUpgrade, setTierUpgrade] = useState<TierUpgrade | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  interface Transaction {
    id: string
    customerId: string
    points: number
    description: string
    amount: number | null
    taxAmount: number | null
    createdAt: string
  }

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader')
      scannerRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleQRCodeScanned(decodedText)
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      )

      setScanning(true)
    } catch (err) {
      console.error('Error starting scanner:', err)
      alert('Could not start camera. Please use manual entry.')
      setManualEntry(true)
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current = null
          setScanning(false)
        })
        .catch((err) => {
          console.error('Error stopping scanner:', err)
        })
    }
  }

  const handleQRCodeScanned = async (decodedText: string) => {
    stopScanning()
    
    // Extract QR code ID from scanned text
    // Could be just the ID or a URL containing it
    let codeId = decodedText.trim()
    
    // If it's a URL, extract the ID
    if (codeId.includes('/')) {
      const parts = codeId.split('/')
      codeId = parts[parts.length - 1]
    }
    
    setQrCodeId(codeId)
    await fetchCustomer(codeId)
  }

  const fetchCustomer = async (codeId: string) => {
    try {
      // Clean the QR code ID - remove any URL encoding or extra characters
      const cleanCodeId = codeId.trim().toUpperCase()
      
      const res = await fetch(`/api/customer/qr/${encodeURIComponent(cleanCodeId)}`)
      if (res.ok) {
        const data = await res.json()
        setCustomer(data)
        // Update qrCodeId state with the actual QR code ID from the response
        if (data.qrCodeId) {
          setQrCodeId(data.qrCodeId)
        }
        setManualEntry(false)
        // Fetch transactions for this customer
        fetchTransactions(data.customerId)
      } else {
        const error = await res.json()
        console.error('API Error:', error)
        alert(error.error || 'Customer not found. Please check the QR code.')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      alert('Error loading customer. Please check the QR code and try again.')
    }
  }

  const fetchTransactions = async (customerId: string) => {
    setLoadingTransactions(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/transactions`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data)
      } else {
        console.error('Failed to fetch transactions')
        setTransactions([])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrCodeId.trim()) {
      alert('Please enter QR code ID')
      return
    }
    await fetchCustomer(qrCodeId.trim())
  }

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer || !transactionData.amount) {
      alert('Please enter transaction amount')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.customerId,
          smeId: customer.sme.id,
          amount: parseFloat(transactionData.amount),
          taxAmount: transactionData.taxAmount
            ? parseFloat(transactionData.taxAmount)
            : null,
          description: transactionData.description || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        
        // Show tier upgrade notification if applicable
        if (data.tierUpgrade && data.tierUpgrade.upgraded) {
          setTierUpgrade(data.tierUpgrade)
        }

        // Update customer points
        setCustomer({
          ...customer,
          points: data.customer.points,
          tier: data.customer.tier,
        })

        // Add new transaction to the list
        setTransactions((prev) => [data.transaction, ...prev])

        // Reset form
        setTransactionData({
          amount: '',
          taxAmount: '',
          description: '',
        })

        alert(
          `Transaction added! Customer earned ${data.transaction.points} points.`
        )
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to add transaction')
      }
    } catch (error) {
      console.error('Error submitting transaction:', error)
      alert('Failed to add transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRedeemBenefit = async (benefitId: string, benefitName: string) => {
    if (!confirm(`Redeem benefit: ${benefitName}?`)) {
      return
    }

    try {
      const res = await fetch('/api/benefits/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer!.customerId,
          benefitId,
          smeId: customer!.sme.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        updateBenefitAfterRedemption(benefitId, benefitName, data.benefit.id)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to redeem benefit')
      }
    } catch (error) {
      console.error('Error redeeming benefit:', error)
      alert('Failed to redeem benefit')
    }
  }

  const handleRedeemBenefitByName = async (benefitName: string, tierId: string) => {
    if (!confirm(`Redeem benefit: ${benefitName}?`)) {
      return
    }

    try {
      const res = await fetch('/api/benefits/redeem-by-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer!.customerId,
          benefitName,
          tierId,
          smeId: customer!.sme.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        updateBenefitAfterRedemption(data.benefit.id, benefitName, data.benefit.id)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to redeem benefit')
      }
    } catch (error) {
      console.error('Error redeeming benefit:', error)
      alert('Failed to redeem benefit')
    }
  }

  const updateBenefitAfterRedemption = (benefitId: string | null, benefitName: string, newBenefitId: string) => {
    // Update benefit status in allBenefits
    if (customer!.allBenefits) {
      setCustomer({
        ...customer!,
        allBenefits: customer!.allBenefits.map((b) =>
          (b.id === benefitId || (b.name === benefitName && !b.id))
            ? { ...b, id: newBenefitId, status: 'used', usedAt: new Date().toISOString() }
            : b
        ),
        availableBenefits: customer!.availableBenefits.filter(
          (b) => b.id !== benefitId && b.name !== benefitName
        ),
      })
    } else {
      // Fallback: remove from availableBenefits
      setCustomer({
        ...customer!,
        availableBenefits: customer!.availableBenefits.filter(
          (b) => b.id !== benefitId && b.name !== benefitName
        ),
      })
    }
    alert(`Benefit "${benefitName}" redeemed successfully!`)
  }

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Scan Customer QR Code
        </h1>

        {/* QR Scanner Section */}
        {!customer && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {!scanning && !manualEntry && (
              <div className="space-y-4">
                <button
                  onClick={startScanning}
                  className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
                >
                  Start QR Scanner
                </button>
                <div className="text-center text-gray-500">or</div>
                <button
                  onClick={() => setManualEntry(true)}
                  className="w-full px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
                >
                  Enter QR Code Manually
                </button>
              </div>
            )}

            {scanning && (
              <div>
                <div id="qr-reader" className="mb-4"></div>
                <button
                  onClick={stopScanning}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Stop Scanner
                </button>
              </div>
            )}

            {manualEntry && (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter QR Code ID
                  </label>
                  <input
                    type="text"
                    value={qrCodeId}
                    onChange={(e) => setQrCodeId(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="CUST-XXXXXXXX"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Lookup Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualEntry(false)
                      setQrCodeId('')
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Customer Info & Transaction Form */}
        {customer && (
          <div className="space-y-6">
            {/* Tier Upgrade Notification */}
            {tierUpgrade && tierUpgrade.upgraded && (
              <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  🎉 Tier Upgrade!
                </h3>
                <p className="text-green-800">
                  Customer upgraded from <strong>{tierUpgrade.oldTier}</strong> to{' '}
                  <strong>{tierUpgrade.newTier}</strong>
                </p>
                {tierUpgrade.unlockedBenefits.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-green-900">
                      New Benefits Unlocked:
                    </p>
                    <ul className="list-disc list-inside text-green-800 mt-1">
                      {tierUpgrade.unlockedBenefits.map((benefit, idx) => (
                        <li key={idx}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => setTierUpgrade(null)}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Customer Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {customer.name}
                  </h2>
                  <p className="text-gray-600">{customer.email}</p>
                </div>
                <button
                  onClick={() => {
                    setCustomer(null)
                    setQrCodeId('')
                    setTransactionData({ amount: '', taxAmount: '', description: '' })
                    setTierUpgrade(null)
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                >
                  Scan Another
                </button>
              </div>

              {/* Transaction Form - Moved to Top */}
              <form onSubmit={handleTransactionSubmit} className="space-y-4 mb-6 border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Add Transaction
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={transactionData.amount}
                      onChange={(e) =>
                        setTransactionData({
                          ...transactionData,
                          amount: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Amount ($) <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={transactionData.taxAmount}
                      onChange={(e) =>
                        setTransactionData({
                          ...transactionData,
                          taxAmount: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={transactionData.description}
                    onChange={(e) =>
                      setTransactionData({
                        ...transactionData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="e.g., Product purchase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
                >
                  {submitting ? 'Processing...' : 'Add Transaction'}
                </button>
              </form>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm font-medium text-blue-600">Points</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {customer.points}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-sm font-medium text-amber-600">Tier</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {customer.tier}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="text-sm font-medium text-green-600">Benefits</p>
                  <p className="text-2xl font-bold text-green-900">
                    {customer.availableBenefits.length}
                  </p>
                </div>
              </div>

              {/* Customer QR Code - Small and Scannable */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Customer QR Code
                </h3>
                <div className="flex justify-center bg-white p-3 rounded border-2 border-gray-300">
                  <QRCode
                    value={qrCodeId}
                    size={120}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 120 120`}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center mt-2 font-mono">
                  {qrCodeId}
                </p>
                <p className="text-xs text-gray-400 text-center mt-1">
                  Scan this QR code to view customer details
                </p>
              </div>

              {/* All Benefits from Current and Previous Tiers */}
              {customer.allBenefits && customer.allBenefits.length > 0 && (
                <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-white">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Available Benefits
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Benefits from {customer.tier} tier and previous tiers
                  </p>
                  
                  {/* Group by tier */}
                  {Array.from(new Set(customer.allBenefits.map(b => b.tierName))).map((tierName) => {
                    const tierBenefits = customer.allBenefits!.filter(b => b.tierName === tierName)
                    const tierColor = tierBenefits[0]?.tierColor
                    const isCurrentTier = tierName === customer.tier
                    
                    return (
                      <div key={tierName} className="mb-4 last:mb-0">
                        <div className="flex items-center mb-2">
                          <h4
                            className="text-md font-semibold"
                            style={{ color: tierColor || '#6B7280' }}
                          >
                            {tierName} Tier
                          </h4>
                          {isCurrentTier && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {tierBenefits.map((benefit, idx) => (
                            <div
                              key={benefit.id || `${benefit.tierId}-${idx}`}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                benefit.status === 'used'
                                  ? 'bg-gray-100 border-gray-300'
                                  : 'bg-green-50 border-green-200'
                              }`}
                            >
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
                                {benefit.status === 'available' && !benefit.unlockedAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Available
                                  </p>
                                )}
                              </div>
                              {benefit.status === 'available' ? (
                                <button
                                  onClick={() => {
                                    if (benefit.id) {
                                      handleRedeemBenefit(benefit.id, benefit.name)
                                    } else {
                                      // If benefit doesn't have an ID, redeem by name
                                      handleRedeemBenefitByName(benefit.name, benefit.tierId)
                                    }
                                  }}
                                  className="ml-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
                                >
                                  Redeem
                                </button>
                              ) : (
                                <span className="ml-3 px-3 py-2 bg-gray-200 text-gray-600 text-xs font-semibold rounded whitespace-nowrap">
                                  Used
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {(!customer.allBenefits || customer.allBenefits.length === 0) && (
                <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-gray-500 text-center">
                    No benefits available at this time
                  </p>
                </div>
              )}

              {/* Transaction History */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Transaction History
                </h3>
                {loadingTransactions ? (
                  <p className="text-gray-500 text-center py-4">Loading transactions...</p>
                ) : transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No transactions yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Txn ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tax
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Points
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((txn) => (
                          <tr key={txn.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {txn.id.substring(0, 8)}...
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {new Date(txn.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {txn.description}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                              {txn.amount !== null ? `$${txn.amount.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                              {txn.taxAmount !== null ? `$${txn.taxAmount.toFixed(2)}` : '-'}
                            </td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                              txn.points >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {txn.points >= 0 ? '+' : ''}{txn.points}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

