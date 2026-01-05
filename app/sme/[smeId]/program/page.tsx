'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Tier {
  id?: string
  name: string
  pointsRequired: number
  benefits: string
  color: string
  order: number
}

interface StampReward {
  id?: string
  stampsRequired: number
  rewardName: string
  rewardDescription?: string | null
  order: number
}

interface Program {
  id: string
  companyName: string
  uniqueLinkId: string
  bannerImageUrl: string | null
  programName: string | null
  programDescription: string | null
  pointsEarningRules: string | null
  primaryColor: string | null
  secondaryColor: string | null
  loyaltyType?: string
  stampsRequired?: number | null
  tiers: Tier[]
  stampRewards?: StampReward[]
}

export default function ProgramEditor() {
  const params = useParams()
  const router = useRouter()
  const smeId = params.smeId as string

  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    programName: '',
    programDescription: '',
    pointsEarningRules: '',
    pointsMultiplier: 1.0,
    primaryColor: '#3B82F6',
    secondaryColor: '#60A5FA',
    loyaltyType: 'points',
    stampsRequired: 10,
  })
  const [tiers, setTiers] = useState<Tier[]>([])
  const [stampRewards, setStampRewards] = useState<StampReward[]>([])

  useEffect(() => {
    fetchProgram()
  }, [smeId])

  const fetchProgram = async () => {
    try {
      const res = await fetch(`/api/smes/id/${smeId}/program`)
      if (res.ok) {
        const data = await res.json()
        setProgram(data)
        setFormData({
          programName: data.programName || '',
          programDescription: data.programDescription || '',
          pointsEarningRules: data.pointsEarningRules || '',
          pointsMultiplier: data.pointsMultiplier || 1.0,
          primaryColor: data.primaryColor || '#3B82F6',
          secondaryColor: data.secondaryColor || '#60A5FA',
          loyaltyType: data.loyaltyType || 'points',
          stampsRequired: data.stampsRequired || 10,
        })
        setStampRewards(
          data.stampRewards && data.stampRewards.length > 0
            ? data.stampRewards
            : [
                {
                  stampsRequired: 5,
                  rewardName: '10% Off',
                  rewardDescription: 'Get 10% off your next purchase',
                  order: 0,
                },
                {
                  stampsRequired: 10,
                  rewardName: 'Free Item',
                  rewardDescription: 'Get a free item of your choice',
                  order: 1,
                },
              ]
        )
        setTiers(
          data.tiers && data.tiers.length > 0
            ? data.tiers
            : [
                {
                  name: 'Bronze',
                  pointsRequired: 0,
                  benefits: 'Welcome bonus\nBasic rewards',
                  color: '#CD7F32',
                  order: 0,
                },
                {
                  name: 'Silver',
                  pointsRequired: 100,
                  benefits: 'Exclusive discounts\nPriority support',
                  color: '#C0C0C0',
                  order: 1,
                },
                {
                  name: 'Gold',
                  pointsRequired: 500,
                  benefits: 'VIP access\nSpecial promotions\nFree shipping',
                  color: '#FFD700',
                  order: 2,
                },
              ]
        )
      }
    } catch (error) {
      console.error('Error fetching program:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/smes/id/${smeId}/program`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programName: formData.programName,
          programDescription: formData.programDescription,
          pointsEarningRules: formData.pointsEarningRules,
          pointsMultiplier: formData.pointsMultiplier,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          loyaltyType: formData.loyaltyType,
          stampsRequired: formData.loyaltyType === 'stamps' ? formData.stampsRequired : null,
          tiers: formData.loyaltyType === 'points' ? tiers.map((tier, index) => ({
            ...tier,
            order: index,
          })) : [],
          stampRewards: formData.loyaltyType === 'stamps' ? stampRewards.map((reward, index) => ({
            ...reward,
            order: index,
          })) : [],
        }),
      })

      if (res.ok) {
        alert('Program saved successfully!')
        fetchProgram()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save program')
      }
    } catch (error) {
      console.error('Error saving program:', error)
      alert('Failed to save program')
    } finally {
      setSaving(false)
    }
  }

  const handleTierChange = (index: number, field: string, value: any) => {
    const updatedTiers = [...tiers]
    updatedTiers[index] = { ...updatedTiers[index], [field]: value }
    setTiers(updatedTiers)
  }

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        name: 'New Tier',
        pointsRequired: tiers.length > 0 ? tiers[tiers.length - 1].pointsRequired + 100 : 0,
        benefits: '',
        color: '#808080',
        order: tiers.length,
      },
    ])
  }

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index))
    } else {
      alert('You must have at least one tier')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Program not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Program: {program.companyName}
              </h1>
              <p className="text-gray-600 mt-1">
                Customize your loyalty program details and tiers
              </p>
            </div>
            <Link
              href={`/sme/${smeId}`}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm whitespace-nowrap"
            >
              Back to Customers
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Program Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Name
              </label>
              <input
                type="text"
                value={formData.programName}
                onChange={(e) =>
                  setFormData({ ...formData, programName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Gold Rewards Program"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Description
              </label>
              <textarea
                value={formData.programDescription}
                onChange={(e) =>
                  setFormData({ ...formData, programDescription: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                placeholder="Describe your loyalty program..."
              />
            </div>

            {/* Loyalty Type Toggle */}
            <div className="border-t pt-4 mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Loyalty Program Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="loyaltyType"
                    value="points"
                    checked={formData.loyaltyType === 'points'}
                    onChange={(e) =>
                      setFormData({ ...formData, loyaltyType: e.target.value })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Points & Tiers System</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="loyaltyType"
                    value="stamps"
                    checked={formData.loyaltyType === 'stamps'}
                    onChange={(e) =>
                      setFormData({ ...formData, loyaltyType: e.target.value })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Stamp Card System</span>
                </label>
              </div>
            </div>

            {/* Conditional Fields Based on Loyalty Type */}
            {formData.loyaltyType === 'points' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How to Earn Points
                  </label>
                  <textarea
                    value={formData.pointsEarningRules}
                    onChange={(e) =>
                      setFormData({ ...formData, pointsEarningRules: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="Explain how customers can earn points...&#10;Example:&#10;• 1 point per $1 spent&#10;• 10 points for referrals&#10;• 5 points for reviews"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points Multiplier
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.pointsMultiplier}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pointsMultiplier: parseFloat(e.target.value) || 1.0,
                        })
                      }
                      className="w-32 px-4 py-2 border border-gray-300 rounded-md"
                      placeholder="1.0"
                    />
                    <span className="text-sm text-gray-600">
                      points per $1 spent
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Example: 1.5 means customers earn 1.5 points for every $1 spent
                  </p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Stamps Required
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={formData.stampsRequired}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stampsRequired: parseInt(e.target.value) || 10,
                        })
                      }
                      className="w-32 px-4 py-2 border border-gray-300 rounded-md"
                      placeholder="10"
                    />
                    <span className="text-sm text-gray-600">
                      stamps per card
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Number of stamps needed to complete a stamp card
                  </p>
                </div>

                {/* Stamp Rewards Configuration */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Reward Milestones
                    </h3>
                    <button
                      onClick={() => {
                        const maxStamps = stampRewards.length > 0
                          ? Math.max(...stampRewards.map(r => r.stampsRequired))
                          : 0
                        setStampRewards([
                          ...stampRewards,
                          {
                            stampsRequired: maxStamps + 5,
                            rewardName: '',
                            rewardDescription: '',
                            order: stampRewards.length,
                          },
                        ])
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      + Add Reward
                    </button>
                  </div>

                  <div className="space-y-4">
                    {stampRewards.map((reward, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-gray-900">
                            Reward #{index + 1}
                          </h4>
                          {stampRewards.length > 1 && (
                            <button
                              onClick={() => {
                                setStampRewards(
                                  stampRewards.filter((_, i) => i !== index)
                                )
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Stamps Required
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={reward.stampsRequired}
                              onChange={(e) => {
                                const updated = [...stampRewards]
                                updated[index] = {
                                  ...updated[index],
                                  stampsRequired: parseInt(e.target.value) || 0,
                                }
                                setStampRewards(updated)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Reward Name
                            </label>
                            <input
                              type="text"
                              value={reward.rewardName}
                              onChange={(e) => {
                                const updated = [...stampRewards]
                                updated[index] = {
                                  ...updated[index],
                                  rewardName: e.target.value,
                                }
                                setStampRewards(updated)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="e.g., Free Coffee"
                            />
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Reward Description (Optional)
                          </label>
                          <textarea
                            value={reward.rewardDescription || ''}
                            onChange={(e) => {
                              const updated = [...stampRewards]
                              updated[index] = {
                                ...updated[index],
                                rewardDescription: e.target.value,
                              }
                              setStampRewards(updated)
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            placeholder="Describe the reward..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) =>
                    setFormData({ ...formData, primaryColor: e.target.value })
                  }
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) =>
                    setFormData({ ...formData, secondaryColor: e.target.value })
                  }
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tiers Section - Only for Points Programs */}
        {formData.loyaltyType === 'points' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Membership Tiers</h2>
            <button
              onClick={addTier}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              + Add Tier
            </button>
          </div>

          <div className="space-y-4">
            {tiers.map((tier, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
                style={{ borderLeftColor: tier.color, borderLeftWidth: '4px' }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900">Tier {index + 1}</h3>
                  {tiers.length > 1 && (
                    <button
                      onClick={() => removeTier(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Tier Name
                    </label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) =>
                        handleTierChange(index, 'name', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Points Required
                    </label>
                    <input
                      type="number"
                      value={tier.pointsRequired}
                      onChange={(e) =>
                        handleTierChange(
                          index,
                          'pointsRequired',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Benefits (one per line)
                  </label>
                  <textarea
                    value={tier.benefits}
                    onChange={(e) =>
                      handleTierChange(index, 'benefits', e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Benefit 1&#10;Benefit 2&#10;Benefit 3"
                  />
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tier Color
                  </label>
                  <input
                    type="color"
                    value={tier.color}
                    onChange={(e) =>
                      handleTierChange(index, 'color', e.target.value)
                    }
                    className="w-full h-8 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Preview Link */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-blue-900 mb-2">
            Program Preview Link:
          </p>
          <p className="text-xs text-blue-700 break-all">
            {typeof window !== 'undefined'
              ? `${window.location.origin}/program/${program.uniqueLinkId}`
              : `/program/${program.uniqueLinkId}`}
          </p>
          <Link
            href={`/program/${program.uniqueLinkId}`}
            target="_blank"
            className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
          >
            View Program Page →
          </Link>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 font-semibold"
          >
            {saving ? 'Saving...' : 'Save Program'}
          </button>
        </div>
      </div>
    </div>
  )
}

