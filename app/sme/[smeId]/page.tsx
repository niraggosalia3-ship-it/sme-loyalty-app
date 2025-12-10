'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  email: string
  birthDate: string
  gender: string
  points: number
  tier: string
  qrCodeId: string
  createdAt: string
}

interface Transaction {
  id: string
  customerId: string
  points: number
  description: string
  amount: number | null
  taxAmount: number | null
  createdAt: string
}

interface SME {
  id: string
  companyName: string
  uniqueLinkId: string
  bannerImageUrl: string | null
}

export default function SMEDashboard() {
  const params = useParams()
  const router = useRouter()
  const smeId = params.smeId as string

  const [sme, setSme] = useState<SME | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({})
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Customer>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [apiKeyVisible, setApiKeyVisible] = useState(false)
  const [generatingApiKey, setGeneratingApiKey] = useState(false)

  useEffect(() => {
    fetchSME()
    fetchCustomers()
    fetchAPIKey()
  }, [smeId])

  const fetchAPIKey = async () => {
    try {
      const res = await fetch(`/api/smes/id/${smeId}/api-key`)
      if (res.ok) {
        const data = await res.json()
        if (data.hasApiKey && data.apiKey) {
          // Store the API key but don't show it until user clicks "Show"
          setApiKey(data.apiKey)
        } else {
          setApiKey(null)
        }
      }
    } catch (error) {
      console.error('Error fetching API key:', error)
    }
  }

  const handleGenerateAPIKey = async () => {
    if (!confirm('Generate new API key? The old key will be invalidated.')) {
      return
    }

    setGeneratingApiKey(true)
    try {
      const res = await fetch(`/api/smes/id/${smeId}/api-key`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        setApiKey(data.apiKey)
        setApiKeyVisible(true)
        alert('API key generated! Make sure to copy it - it will only be shown once.')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to generate API key')
      }
    } catch (error) {
      console.error('Error generating API key:', error)
      alert('Failed to generate API key')
    } finally {
      setGeneratingApiKey(false)
    }
  }

  const fetchSME = async () => {
    try {
      const res = await fetch(`/api/smes/id/${smeId}`)
      if (res.ok) {
        const data = await res.json()
        setSme({
          id: data.id,
          companyName: data.companyName,
          uniqueLinkId: data.uniqueLinkId,
          bannerImageUrl: data.bannerImageUrl,
        })
      } else {
        // Fallback: fetch from all SMEs
        const allSMEs = await fetch('/api/smes').then(r => r.json())
        const foundSME = allSMEs.find((s: any) => s.id === smeId)
        if (foundSME) {
          setSme({
            id: foundSME.id,
            companyName: foundSME.companyName,
            uniqueLinkId: foundSME.uniqueLinkId,
            bannerImageUrl: foundSME.bannerImageUrl,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching SME:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/smes/id/${smeId}/customers`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async (customerId: string) => {
    if (transactions[customerId]) {
      return // Already loaded
    }

    try {
      const res = await fetch(`/api/customers/${customerId}/transactions`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(prev => ({ ...prev, [customerId]: data }))
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const handleCustomerClick = (customerId: string) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null)
    } else {
      setExpandedCustomer(customerId)
      fetchTransactions(customerId)
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer.id)
    setEditFormData({
      name: customer.name,
      email: customer.email,
      birthDate: new Date(customer.birthDate).toISOString().split('T')[0],
      gender: customer.gender,
      points: customer.points,
      tier: customer.tier,
    })
  }

  const handleSave = async (customerId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })

      if (res.ok) {
        const updatedCustomer = await res.json()
        setCustomers(prev =>
          prev.map(c => (c.id === customerId ? updatedCustomer : c))
        )
        setEditingCustomer(null)
        setEditFormData({})
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update customer')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingCustomer(null)
    setEditFormData({})
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!sme) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">SME not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {sme.companyName} - Customer Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your customers and view transaction history
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
            <Link
              href={`/form/${sme.uniqueLinkId}`}
              target="_blank"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm whitespace-nowrap"
            >
              + Add Customer
            </Link>
            <Link
              href={`/sme/${smeId}/scan`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm whitespace-nowrap"
            >
              Scan QR Code
            </Link>
            <Link
              href={`/sme/${smeId}/program`}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm whitespace-nowrap"
            >
              Edit Program
            </Link>
            <Link
              href={`/sme/${smeId}/import`}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm whitespace-nowrap"
            >
              Import Customers
            </Link>
          </div>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">API Integration</h3>
              <p className="text-xs text-gray-600">
                Use your API key to integrate with your existing systems
              </p>
            </div>
            <div className="flex items-center gap-2">
              {apiKeyVisible && apiKey ? (
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono">
                    {apiKey}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey)
                      alert('API key copied to clipboard!')
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setApiKeyVisible(false)}
                    className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Hide
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {apiKey && (
                    <button
                      onClick={() => setApiKeyVisible(true)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                    >
                      Show API Key
                    </button>
                  )}
                  <button
                    onClick={handleGenerateAPIKey}
                    disabled={generatingApiKey}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm disabled:opacity-50"
                  >
                    {generatingApiKey ? 'Generating...' : apiKey ? 'Regenerate' : 'Generate API Key'}
                  </button>
                </div>
              )}
            </div>
          </div>
          {apiKey && !apiKeyVisible && (
            <p className="text-xs text-gray-500 mt-2">
              API key exists. Click "Show API Key" to view it. Note: Regenerating will invalidate the old key.
            </p>
          )}
        </div>

        {/* Banner */}
        {sme.bannerImageUrl && (
          <div className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="w-full h-48 bg-gray-200 overflow-hidden">
              <img
                src={sme.bannerImageUrl}
                alt={`${sme.companyName} banner`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Customers List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Customers ({customers.length})
            </h2>
          </div>

          {customers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No customers yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Customers will appear here once they submit the form.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map((customer) => {
                const isExpanded = expandedCustomer === customer.id
                const isEditing = editingCustomer === customer.id
                const customerTransactions = transactions[customer.id] || []

                return (
                  <div
                    key={customer.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Customer Header */}
                    <div
                      className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => !isEditing && handleCustomerClick(customer.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={editFormData.name || ''}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, name: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Email
                                </label>
                                <input
                                  type="email"
                                  value={editFormData.email || ''}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, email: e.target.value })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Birth Date
                                  </label>
                                  <input
                                    type="date"
                                    value={editFormData.birthDate || ''}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, birthDate: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Gender
                                  </label>
                                  <select
                                    value={editFormData.gender || ''}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, gender: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Points
                                  </label>
                                  <input
                                    type="number"
                                    value={editFormData.points || 0}
                                    onChange={(e) =>
                                      setEditFormData({
                                        ...editFormData,
                                        points: parseInt(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Tier
                                  </label>
                                  <input
                                    type="text"
                                    value={editFormData.tier || ''}
                                    onChange={(e) =>
                                      setEditFormData({ ...editFormData, tier: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-4">
                                <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {customer.tier}
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                  {customer.points} pts
                                </span>
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                <p>{customer.email}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {customer.gender} • Born: {new Date(customer.birthDate).toLocaleDateString()}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSave(customer.id)}
                                disabled={saving}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400"
                              >
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={handleCancel}
                                className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <div className="flex gap-2">
                              <Link
                                href={`/sme/${smeId}/scan?qrCode=${customer.qrCodeId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 whitespace-nowrap"
                              >
                                View Customer
                              </Link>
                              <button
                                onClick={() => handleEdit(customer)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Transaction History */}
                    {isExpanded && !isEditing && (
                      <div className="border-t border-gray-200 bg-white p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">
                          Transaction History ({customerTransactions.length})
                        </h4>
                        {customerTransactions.length === 0 ? (
                          <p className="text-sm text-gray-500">No transactions yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Transaction ID
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Customer ID
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Date
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Amount (ex. tax)
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Tax Amount
                                  </th>
                                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                    Points
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Description
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {customerTransactions.map((transaction) => (
                                  <tr key={transaction.id}>
                                    <td className="px-4 py-2 text-gray-900 font-mono text-xs">
                                      {transaction.id.slice(0, 8)}...
                                    </td>
                                    <td className="px-4 py-2 text-gray-900 font-mono text-xs">
                                      {transaction.customerId.slice(0, 8)}...
                                    </td>
                                    <td className="px-4 py-2 text-gray-900">
                                      {new Date(transaction.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-2 text-right text-gray-900">
                                      {transaction.amount !== null
                                        ? `$${transaction.amount.toFixed(2)}`
                                        : 'N/A'}
                                    </td>
                                    <td className="px-4 py-2 text-right text-gray-900">
                                      {transaction.taxAmount !== null
                                        ? `$${transaction.taxAmount.toFixed(2)}`
                                        : 'N/A'}
                                    </td>
                                    <td className={`px-4 py-2 text-right font-medium ${
                                      transaction.points >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {transaction.points >= 0 ? '+' : ''}{transaction.points}
                                    </td>
                                    <td className="px-4 py-2 text-gray-900">
                                      {transaction.description}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
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

