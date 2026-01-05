'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface SME {
  id: string
  companyName: string
  uniqueLinkId: string
  bannerImageUrl: string | null
}

export default function CustomerForm() {
  const params = useParams()
  const router = useRouter()
  const linkId = params.linkId as string

  const [sme, setSme] = useState<SME | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    email: '',
    gender: '',
  })

  useEffect(() => {
    fetchSME()
  }, [linkId])

  const fetchSME = async () => {
    try {
      const res = await fetch(`/api/smes/${linkId}`)
      if (res.ok) {
        const data = await res.json()
        setSme(data)
      } else {
        alert('Invalid link. Please check your form URL.')
      }
    } catch (error) {
      console.error('Error fetching SME:', error)
      alert('Error loading form. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.birthDate || !formData.email || !formData.gender) {
      alert('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          linkId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/customer/${data.customerId}`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to submit form. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error submitting form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading form...</div>
      </div>
    )
  }

  if (!sme) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Invalid form link</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Banner Image */}
          {sme.bannerImageUrl && (
            <div className="w-full h-32 md:h-48 bg-gray-200 overflow-hidden">
              <img
                src={sme.bannerImageUrl}
                alt={`${sme.companyName} banner`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-4 md:p-8">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Welcome to {sme.companyName}
            </h1>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">Please fill in your details to get started</p>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                Birth Date *
              </label>
              <input
                type="date"
                id="birthDate"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email ID *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 md:py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-base"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
          </div>
        </div>
      </div>
    </div>
  )
}

