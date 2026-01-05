'use client'

import { useState, useEffect } from 'react'

interface StampReward {
  stampsRequired: number
  rewardName: string
  rewardDescription: string | null
}

interface StampConfiguratorProps {
  stampsRequired: number
  stampRewards: StampReward[]
  onUpdate: (stampsRequired: number, stampRewards: StampReward[], advanceStep?: boolean) => void
}

export default function StampConfigurator({
  stampsRequired,
  stampRewards,
  onUpdate,
}: StampConfiguratorProps) {
  const [localStampsRequired, setLocalStampsRequired] = useState(stampsRequired)
  const [localRewards, setLocalRewards] = useState<StampReward[]>(stampRewards)

  // Initialize with default rewards if empty
  useEffect(() => {
    if (localRewards.length === 0) {
      setLocalRewards([
        {
          stampsRequired: 5,
          rewardName: '10% Off',
          rewardDescription: 'Get 10% off your next purchase',
        },
        {
          stampsRequired: 10,
          rewardName: 'Free Item',
          rewardDescription: 'Get a free item of your choice',
        },
      ])
    }
  }, [])

  const handleStampsRequiredChange = (value: number) => {
    const newValue = Math.max(1, value)
    setLocalStampsRequired(newValue)
    // Don't advance step on change, just update
    onUpdate(newValue, localRewards, false)
  }

  const handleRewardChange = (index: number, field: keyof StampReward, value: any) => {
    const updated = [...localRewards]
    updated[index] = { ...updated[index], [field]: value }
    setLocalRewards(updated)
    // Don't advance step on change, just update
    onUpdate(localStampsRequired, updated, false)
  }

  const addReward = () => {
    const maxStamps = localRewards.length > 0
      ? Math.max(...localRewards.map(r => r.stampsRequired))
      : 0
    const newRewards = [
      ...localRewards,
      {
        stampsRequired: maxStamps + 5,
        rewardName: '',
        rewardDescription: '',
      },
    ]
    setLocalRewards(newRewards)
    // Don't advance step on change, just update
    onUpdate(localStampsRequired, newRewards, false)
  }

  const removeReward = (index: number) => {
    if (localRewards.length > 1) {
      const newRewards = localRewards.filter((_, i) => i !== index)
      setLocalRewards(newRewards)
      // Don't advance step on change, just update
      onUpdate(localStampsRequired, newRewards, false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configure Your Stamp Card
        </h3>

        {/* Total Stamps Required */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Stamps Required
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={localStampsRequired}
              onChange={(e) => handleStampsRequiredChange(parseInt(e.target.value) || 10)}
              className="w-32 px-4 py-2 border border-gray-300 rounded-md"
            />
            <span className="text-sm text-gray-600">
              stamps per card
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Number of stamps needed to complete a stamp card
          </p>
        </div>

        {/* Reward Milestones */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-900">
              Reward Milestones
            </h4>
            <button
              onClick={addReward}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              + Add Reward
            </button>
          </div>

          <div className="space-y-4">
            {localRewards.map((reward, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <h5 className="font-medium text-gray-900">
                    Reward #{index + 1}
                  </h5>
                  {localRewards.length > 1 && (
                    <button
                      onClick={() => removeReward(index)}
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
                      onChange={(e) =>
                        handleRewardChange(index, 'stampsRequired', parseInt(e.target.value) || 0)
                      }
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
                      onChange={(e) =>
                        handleRewardChange(index, 'rewardName', e.target.value)
                      }
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
                    onChange={(e) =>
                      handleRewardChange(index, 'rewardDescription', e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Describe the reward..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-6">
          <button
            onClick={() => {
              // Validate that all rewards have names
              const allValid = localRewards.every(r => r.rewardName.trim().length > 0)
              if (!allValid) {
                alert('Please provide a name for all rewards')
                return
              }
              // Update and advance to image step
              onUpdate(localStampsRequired, localRewards, true)
            }}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Continue to Banner Selection
          </button>
        </div>
      </div>
    </div>
  )
}

