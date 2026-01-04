'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import QRCode from 'react-qr-code'

interface SME {
  id: string
  companyName: string
  uniqueLinkId: string
  bannerImageUrl: string | null
  createdAt: string
}

export default function AdminDashboard() {
  const [smes, setSmes] = useState<SME[]>([])
  const [companyName, setCompanyName] = useState('')
  const [bannerImage, setBannerImage] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newLink, setNewLink] = useState<string | null>(null)

  useEffect(() => {
    fetchSMEs()
  }, [])

  const fetchSMEs = async () => {
    try {
      const res = await fetch('/api/smes')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error fetching SMEs:', errorData)
        alert(`Failed to load data: ${errorData.error || 'Unknown error'}`)
        return
      }
      const data = await res.json()
      setSmes(data)
    } catch (error) {
      console.error('Error fetching SMEs:', error)
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link)
    alert('Link copied to clipboard!')
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      setBannerImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBannerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!bannerImage) return null

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', bannerImage)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        return data.url
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to upload image')
        return null
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) return

    setLoading(true)
    try {
      // Upload image first if provided
      let bannerImageUrl = null
      if (bannerImage) {
        bannerImageUrl = await uploadImage()
        if (!bannerImageUrl) {
          setLoading(false)
          return
        }
      }

      const res = await fetch('/api/smes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, bannerImageUrl }),
      })

      if (res.ok) {
        const data = await res.json()
        setNewLink(`${window.location.origin}/form/${data.uniqueLinkId}`)
        setCompanyName('')
        setBannerImage(null)
        setBannerPreview(null)
        fetchSMEs()
      }
    } catch (error) {
      console.error('Error creating SME:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <a
            href="/create-ai"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold text-sm flex items-center gap-2"
          >
            <span>✨</span>
            <span>Create Program with AI</span>
          </a>
        </div>

        {/* Create SME Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New SME Company</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter company name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="bannerImage" className="block text-sm font-medium text-gray-700 mb-2">
                Banner Image (Optional)
              </label>
              <input
                type="file"
                id="bannerImage"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 1200x300px horizontal banner. Max 5MB.
              </p>
              {bannerPreview && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-32 object-cover rounded-md border border-gray-300"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {uploadingImage ? 'Uploading image...' : loading ? 'Creating...' : 'Create SME'}
            </button>
          </form>

          {newLink && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm font-medium text-green-800 mb-4">✅ SME created successfully!</p>
              
              <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* QR Code */}
                <div className="flex-shrink-0 bg-white p-4 rounded-lg border border-green-300">
                  <p className="text-xs font-medium text-gray-600 mb-2 text-center">QR Code</p>
                  <QRCode
                    value={newLink}
                    size={150}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 150 150`}
                    className="mx-auto"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center max-w-[150px]">
                    Scan to open form
                  </p>
                </div>

                {/* Link Section */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-md text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(newLink)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
                    >
                      Copy Link
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Share this link or QR code with the SME to distribute to their customers
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SME List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Existing SMEs</h2>
          {smes.length === 0 ? (
            <p className="text-gray-500">No SMEs created yet.</p>
          ) : (
            <div className="space-y-4">
              {smes.map((sme) => {
                const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/form/${sme.uniqueLinkId}`
                return (
                  <div key={sme.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Left: Company Info and Link */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{sme.companyName}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Created: {new Date(sme.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => copyToClipboard(link)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 whitespace-nowrap"
                            >
                              Customer Registration Link
                            </button>
                            <Link
                              href={`/program/${sme.uniqueLinkId}`}
                              target="_blank"
                              className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 whitespace-nowrap inline-block text-center"
                            >
                              View Program Page
                            </Link>
                            <Link
                              href={`/sme/${sme.id}`}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 whitespace-nowrap inline-block text-center"
                            >
                              View Customers
                            </Link>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 break-all">{link}</p>
                        </div>
                      </div>

                      {/* Right: QR Code */}
                      <div className="flex-shrink-0 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-2 text-center">QR Code</p>
                        <QRCode
                          value={link}
                          size={120}
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                          viewBox={`0 0 120 120`}
                          className="mx-auto"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Scan to open form
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

