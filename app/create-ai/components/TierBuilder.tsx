'use client'

import { useState, useEffect } from 'react'
import InteractiveCard from './InteractiveCard'

interface Tier {
  order: number
  name: string
  pointsRequired: number
  color: string | null
  benefits: string[]
}

interface TierBuilderProps {
  tiers: Tier[]
  suggestions: Tier[]
  onUpdate: (tiers: Tier[], advanceStep?: boolean) => void
  isGenerating: boolean
}

export default function TierBuilder({ tiers, suggestions, onUpdate, isGenerating }: TierBuilderProps) {
  const [editingTier, setEditingTier] = useState<number | null>(null)
  const [localTiers, setLocalTiers] = useState<Tier[]>(tiers)
  
  // Sync local state with props when tiers change externally
  useEffect(() => {
    setLocalTiers(tiers)
  }, [tiers])

  if (isGenerating) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          🤖
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900">Generating tier structure...</p>
          </div>
        </div>
      </div>
    )
  }

  const handleTierEdit = (index: number, field: string, value: any) => {
    // Update local state immediately for responsive UI
    const updated = [...localTiers]
    updated[index] = { ...updated[index], [field]: value }
    setLocalTiers(updated)
  }
  
  const handleSaveEdit = () => {
    // Save the local state to parent when done editing
    onUpdate(localTiers, false)
    setEditingTier(null)
  }
  
  const handleCancelEdit = () => {
    // Revert to original tiers
    setLocalTiers(tiers)
    setEditingTier(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          🤖
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 mb-4">
              Here's your suggested tier structure. Click Edit on any tier to customize it.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {localTiers.map((tier, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {index === 0 ? '🥉' : index === 1 ? '🥈' : index === 2 ? '🥇' : '💎'}
                </span>
                <div>
                  {editingTier === index ? (
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handleTierEdit(index, 'name', e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="px-2 py-1 border border-gray-300 rounded text-sm font-semibold"
                      autoFocus
                    />
                  ) : (
                    <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingTier === index ? (
                  <>
                    <input
                      type="number"
                      value={tier.pointsRequired}
                      onChange={(e) => handleTierEdit(index, 'pointsRequired', parseInt(e.target.value) || 0)}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-600">points</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSaveEdit()
                      }}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Done
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancelEdit()
                      }}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-600">{tier.pointsRequired} points</span>
                    <button
                      onClick={() => setEditingTier(index)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button
          onClick={() => {
            const newTier = { order: localTiers.length, name: 'New Tier', pointsRequired: 0, color: null, benefits: [] }
            const updated = [...localTiers, newTier]
            setLocalTiers(updated)
            onUpdate(updated, false)
          }}
          className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 hover:bg-gray-50"
        >
          + Add Tier
        </button>
        <button
          onClick={() => {
            // Save current local state and advance
            onUpdate(localTiers, true)
          }}
          className="ml-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Looks Good - Continue
        </button>
      </div>
    </div>
  )
}

