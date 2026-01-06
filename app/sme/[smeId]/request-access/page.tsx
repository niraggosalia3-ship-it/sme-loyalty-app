'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function RequestAccess() {
  const params = useParams()
  const router = useRouter()
  const smeId = params.smeId as string
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkUrl, setMagicLinkUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setSuccess(false)

    try {
      const res = await fetch(`/api/smes/id/${smeId}/send-access-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setSuccess(true)
        setMagicLinkUrl(data.magicLinkUrl)
        
        // If email was sent, show success message
        if (data.message.includes('sent')) {
          // Email was sent successfully
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to send access link')
      }
    } catch (error) {
      setError('Error requesting access link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (magicLinkUrl) {
      navigator.clipboard.writeText(magicLinkUrl)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Request Access
          </h1>
          <p className="text-sm text-gray-600">
            Enter your email to receive a secure access link
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800 font-medium mb-2">
                ✓ Access link sent!
              </p>
              <p className="text-sm text-green-700">
                Check your email for the access link. Click the link to instantly access your dashboard (no password needed).
              </p>
            </div>

            {magicLinkUrl && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-xs text-blue-800 font-medium mb-2">
                  Or use this link directly:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={magicLinkUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-xs"
                  />
                  <button
                    onClick={copyLink}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => router.push(`/sme/${smeId}`)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Continue to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                required
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                We'll send you a secure link to access your dashboard. No password needed!
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Sending...' : 'Send Access Link'}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            The access link expires in 24 hours. You can request a new one anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

