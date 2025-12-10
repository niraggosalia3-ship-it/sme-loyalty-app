'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'react-qr-code'

interface PassData {
  customerName: string
  points: number
  tier: string
  qrCodeId: string
  companyName: string
}

export default function WalletPassPage() {
  const params = useParams()
  const customerId = params.customerId as string
  const [passData, setPassData] = useState<PassData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPassData()
    // Auto-refresh every 30 seconds to get updated points/tier
    const interval = setInterval(fetchPassData, 30000)
    return () => clearInterval(interval)
  }, [customerId])

  const fetchPassData = async () => {
    try {
      const res = await fetch(`/api/customers/${customerId}`)
      if (res.ok) {
        const customer = await res.json()
        setPassData({
          customerName: customer.name,
          points: customer.points,
          tier: customer.tier,
          qrCodeId: customer.qrCodeId,
          companyName: customer.sme.companyName,
        })
      }
    } catch (error) {
      console.error('Error fetching pass data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToWallet = () => {
    // Save card as image or add to home screen
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    if (isIOS) {
      // iOS: Instructions to add to home screen
      alert('To save this card:\n\n1. Tap the Share button (square with arrow)\n2. Select "Add to Home Screen"\n3. The card will appear on your home screen\n\nYou can also take a screenshot to save it.')
    } else if (isAndroid) {
      // Android: Instructions to add to home screen
      alert('To save this card:\n\n1. Tap the menu (3 dots)\n2. Select "Add to Home Screen"\n3. The card will appear on your home screen\n\nYou can also take a screenshot to save it.')
    } else {
      // Desktop: Print or screenshot
      window.print()
    }
  }

  if (loading || !passData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading pass...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Wallet Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-2xl font-bold">{passData.companyName}</h1>
            <p className="text-blue-100 text-sm mt-1">Loyalty Card</p>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {/* Customer Name */}
            <div className="mb-4">
              <p className="text-sm text-gray-500">Member</p>
              <p className="text-xl font-semibold text-gray-900">{passData.customerName}</p>
            </div>

            {/* Points Display */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-600 font-medium mb-1">Points Balance</p>
              <p className="text-4xl font-bold text-blue-900">{passData.points}</p>
            </div>

            {/* Tier Display */}
            <div className="bg-amber-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-600 font-medium mb-1">Current Tier</p>
              <p className="text-2xl font-bold text-amber-900">{passData.tier}</p>
            </div>

            {/* QR Code */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 text-center mb-2">Scan for Transactions</p>
              <div className="flex justify-center bg-white p-3 rounded border-2 border-gray-300">
                <QRCode
                  value={passData.qrCodeId}
                  size={150}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 150 150`}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-2 font-mono">{passData.qrCodeId}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleAddToWallet}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                💾 Save to Home Screen
              </button>
              <a
                href={`/customer/${customerId}`}
                className="block w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-center"
              >
                View Full Dashboard
              </a>
            </div>
            
            {/* Auto-update indicator */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                🔄 Card updates automatically every 30 seconds
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-white rounded-lg p-4 text-sm text-gray-600">
          <p className="font-semibold mb-2">How to use:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Show this card at {passData.companyName}</li>
            <li>Scan the QR code to earn points</li>
            <li>Your points and tier update automatically</li>
            <li>Tap "Save Card" to save as image</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

