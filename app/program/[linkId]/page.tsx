'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import StampCard from '@/app/components/StampCard'

interface Tier {
  id: string
  name: string
  pointsRequired: number
  benefits: string
  color: string | null
  order: number
}

interface StampReward {
  id: string
  stampsRequired: number
  rewardName: string
  rewardDescription: string | null
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
  pointsMultiplier: number
  primaryColor: string | null
  secondaryColor: string | null
  loyaltyType?: 'points' | 'stamps'
  stampsRequired?: number | null
  tiers: Tier[]
  stampRewards?: StampReward[]
}

export default function ProgramPage() {
  const params = useParams()
  const router = useRouter()
  const linkId = params.linkId as string

  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgram()
  }, [linkId])

  const fetchProgram = async () => {
    try {
      const res = await fetch(`/api/program/${linkId}`)
      if (res.ok) {
        const data = await res.json()
        setProgram(data)
      } else {
        alert('Program not found. Please check the link.')
      }
    } catch (error) {
      console.error('Error fetching program:', error)
      alert('Error loading program. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinProgram = () => {
    router.push(`/form/${linkId}`)
  }

  const parseBenefits = (benefits: string): string[] => {
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(benefits)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch {
      // If not JSON, split by comma or newline
      return benefits.split(/[,\n]/).map(b => b.trim()).filter(b => b.length > 0)
    }
    return []
  }

  const getTierColor = (tier: Tier, index: number): string => {
    if (tier.color) return tier.color
    
    // Default colors if not specified
    const defaultColors = [
      '#CD7F32', // Bronze
      '#C0C0C0', // Silver
      '#FFD700', // Gold
      '#E5E4E2', // Platinum
      '#B9F2FF', // Diamond
    ]
    return defaultColors[index % defaultColors.length]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading program...</div>
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

  const primaryColor = program.primaryColor || '#3B82F6'
  const secondaryColor = program.secondaryColor || '#60A5FA'
  const programTitle = program.programName || `${program.companyName} Loyalty Program`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      {program.bannerImageUrl && (
        <div className="w-full h-32 md:h-64 bg-gray-200 overflow-hidden">
          <img
            src={program.bannerImageUrl}
            alt={`${program.companyName} banner`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-4 md:py-8">
        {/* Program Title */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
            {programTitle}
          </h1>
          {program.programDescription && (
            <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto">
              {program.programDescription}
            </p>
          )}
        </div>

        {/* How to Earn Points Section */}
        {/* How to Earn Section - Conditional Based on Program Type */}
        {program.loyaltyType === 'points' && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3 md:mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              How to Earn Points
            </h2>
            <div className="mb-3 md:mb-4 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-base md:text-lg font-semibold text-blue-900">
                Earn {program.pointsMultiplier || 1} point{(program.pointsMultiplier || 1) !== 1 ? 's' : ''} for every $1 you spend!
              </p>
            </div>
            {program.pointsEarningRules && (
              <div className="prose max-w-none">
                <p className="text-sm md:text-base text-gray-700 whitespace-pre-line">
                  {program.pointsEarningRules}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tier Progression Section - Only for Points Programs */}
        {program.loyaltyType === 'points' && program.tiers && program.tiers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6 text-center">
              Membership Tiers
            </h2>

            {/* Progress Bar Visualization */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {program.tiers.map((tier, index) => (
                  <div
                    key={tier.id}
                    className="flex-1 flex flex-col items-center"
                    style={{ maxWidth: `${100 / program.tiers.length}%` }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2"
                      style={{ backgroundColor: getTierColor(tier, index) }}
                    >
                      {index + 1}
                    </div>
                    <span className="text-xs font-medium text-gray-700 text-center">
                      {tier.name}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {tier.pointsRequired} pts
                    </span>
                  </div>
                ))}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: '0%',
                    background: `linear-gradient(to right, ${program.tiers
                      .map((t, i) => getTierColor(t, i))
                      .join(', ')})`,
                  }}
                />
              </div>
            </div>

            {/* Display Based on Program Type */}
            {(program.loyaltyType as string) === 'stamps' ? (
              /* Stamp Card Display */
              <div className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 text-center">
                  How It Works
                </h2>
                <div className="mb-6">
                  <StampCard
                    currentStamps={0}
                    totalStamps={program.stampsRequired || 10}
                    primaryColor={program.primaryColor}
                    secondaryColor={program.secondaryColor}
                    size="large"
                  />
                </div>
                
                {program.stampRewards && program.stampRewards.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Rewards
                    </h3>
                    <div className="space-y-3">
                      {program.stampRewards.map((reward) => (
                        <div
                          key={reward.id}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {reward.rewardName}
                              </h4>
                              {reward.rewardDescription && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {reward.rewardDescription}
                                </p>
                              )}
                            </div>
                            <div className="ml-4 text-right">
                              <span
                                className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white"
                                style={{
                                  backgroundColor: program.primaryColor || '#3B82F6',
                                }}
                              >
                                {reward.stampsRequired} stamp
                                {reward.stampsRequired !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Tier Cards - Always Expanded */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {program.tiers.map((tier, index) => {
                const benefits = parseBenefits(tier.benefits)
                const tierColor = getTierColor(tier, index)

                return (
                  <div
                    key={tier.id}
                    className="border-2 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg bg-white"
                    style={{
                      borderColor: tierColor,
                    }}
                  >
                    {/* Tier Header */}
                    <div
                      className="p-4"
                      style={{
                        backgroundColor: `${tierColor}20`,
                      }}
                    >
                      <div>
                        <h3
                          className="text-xl font-bold mb-1 text-gray-900"
                        >
                          {tier.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {tier.pointsRequired} points required
                        </p>
                      </div>
                    </div>

                    {/* Tier Benefits - Always Visible */}
                    <div className="p-4 bg-white">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Benefits:
                      </h4>
                      <ul className="space-y-2">
                        {benefits.length > 0 ? (
                          benefits.map((benefit, idx) => (
                            <li
                              key={idx}
                              className="flex items-start text-gray-700"
                            >
                              <span
                                className="mr-2 mt-1 flex-shrink-0"
                                style={{ color: tierColor }}
                              >
                                ✓
                              </span>
                              <span className="text-sm">{benefit}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-gray-500 text-sm">
                            No benefits specified
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )
              })}
              </div>
            )}
          </div>
        )}

        {/* Join Program CTA */}
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3 md:mb-4">
            Ready to Start Earning Rewards?
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
            {program.loyaltyType === 'stamps'
              ? `Join ${program.companyName}'s loyalty program and start collecting stamps today!`
              : `Join ${program.companyName}'s loyalty program and start earning points today!`}
          </p>
          <button
            onClick={handleJoinProgram}
            className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-semibold text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            style={{
              backgroundColor: primaryColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = secondaryColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = primaryColor
            }}
          >
            Join the Program
          </button>
        </div>
      </div>
    </div>
  )
}

