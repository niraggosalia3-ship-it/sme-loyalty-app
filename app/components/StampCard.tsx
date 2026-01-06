'use client'

import { useEffect, useState } from 'react'

interface StampCardProps {
  currentStamps: number
  totalStamps: number
  primaryColor?: string | null
  secondaryColor?: string | null
  size?: 'small' | 'medium' | 'large'
  rewards?: Array<{
    id: string
    stampsRequired: number
    rewardName: string
    rewardDescription?: string | null
  }>
  redeemedRewardIds?: string[]
  onRedeemReward?: (rewardId: string, rewardName: string) => void
  isRedeeming?: boolean
}

export default function StampCard({
  currentStamps,
  totalStamps,
  primaryColor = '#3B82F6',
  secondaryColor = '#60A5FA',
  size = 'medium',
  rewards = [],
  redeemedRewardIds = [],
  onRedeemReward,
  isRedeeming = false,
}: StampCardProps) {
  const [newStampIndex, setNewStampIndex] = useState<number | null>(null)
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false)
  const [previousStamps, setPreviousStamps] = useState(currentStamps)

  // Determine sizes based on prop
  const sizes = {
    small: { icon: 32, gap: 2 },
    medium: { icon: 48, gap: 3 },
    large: { icon: 64, gap: 4 },
  }
  const { icon: iconSize, gap } = sizes[size]

  // Create gradient from primary to secondary color
  const filledGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`

  // Detect new stamp and trigger animation
  useEffect(() => {
    if (currentStamps > previousStamps) {
      // New stamp earned!
      setNewStampIndex(currentStamps - 1)
      setTimeout(() => setNewStampIndex(null), 1000)
      
      // Check if card is complete
      if (currentStamps >= totalStamps && previousStamps < totalStamps) {
        setShowCompletionCelebration(true)
        setTimeout(() => setShowCompletionCelebration(false), 5000)
      }
    }
    setPreviousStamps(currentStamps)
  }, [currentStamps, previousStamps, totalStamps])

  const isComplete = currentStamps >= totalStamps
  const progress = Math.min(currentStamps, totalStamps) / totalStamps

  // Sort rewards by stampsRequired
  const sortedRewards = [...rewards].sort((a, b) => a.stampsRequired - b.stampsRequired)

  return (
    <div className="flex flex-col items-center relative">
      {/* Completion Celebration Overlay */}
      {showCompletionCelebration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 md:p-12 max-w-md w-full text-center shadow-2xl animate-bounce-in">
            <div className="text-6xl md:text-8xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Card Complete!
            </h2>
            <p className="text-lg md:text-xl text-gray-700 mb-6">
              Amazing! You've collected all {totalStamps} stamps!
            </p>
            <p className="text-base text-gray-600 mb-6">
              🎁 You've earned your reward! Visit the store to redeem.
            </p>
            <button
              onClick={() => setShowCompletionCelebration(false)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold text-lg shadow-lg"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Stamp Grid */}
      <div
        className="flex flex-wrap justify-center items-center gap-2 md:gap-3 relative"
        style={{ gap: `${gap * 4}px` }}
      >
        {Array.from({ length: totalStamps }).map((_, index) => {
          const isFilled = index < currentStamps
          const isNewStamp = newStampIndex === index
          const isRewardMilestone = sortedRewards.some(r => r.stampsRequired === index + 1)
          const isCompleteStamp = index === totalStamps - 1 && isFilled

          return (
            <div
              key={index}
              className="relative flex items-center justify-center"
              style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
            >
              {/* Animated Ring for New Stamp */}
              {isNewStamp && (
                <div
                  className="absolute rounded-full animate-ping"
                  style={{
                    width: `${iconSize * 1.5}px`,
                    height: `${iconSize * 1.5}px`,
                    border: `3px solid ${primaryColor}`,
                    opacity: 0.75,
                  }}
                />
              )}

              {/* Reward Milestone Badge */}
              {isRewardMilestone && (
                <div
                  className="absolute -top-2 -right-2 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg z-10"
                  style={{ width: '20px', height: '20px' }}
                >
                  <span className="text-xs font-bold text-yellow-900">🎁</span>
                </div>
              )}

              {/* Stamp Circle */}
              <div
                className={`rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                  isNewStamp ? 'animate-pulse scale-110' : ''
                } ${isCompleteStamp ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''}`}
                style={{
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  backgroundColor: isFilled ? undefined : 'transparent',
                  background: isFilled ? filledGradient : undefined,
                  borderColor: isFilled
                    ? primaryColor || '#3B82F6'
                    : '#D1D5DB',
                  borderStyle: isFilled ? 'solid' : 'dashed',
                  borderWidth: isFilled ? '3px' : '2px',
                  boxShadow: isFilled
                    ? isCompleteStamp
                      ? `0 4px 20px ${primaryColor}80, 0 0 0 4px rgba(251, 191, 36, 0.3)`
                      : `0 2px 12px ${primaryColor}60`
                    : 'none',
                  transform: isNewStamp ? 'scale(1.2)' : isCompleteStamp ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                }}
              >
                {/* Star Icon with Animation */}
                {isFilled ? (
                  <svg
                    width={iconSize * 0.5}
                    height={iconSize * 0.5}
                    viewBox="0 0 24 24"
                    fill="white"
                    className={`drop-shadow-lg ${isNewStamp ? 'animate-spin' : ''}`}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    }}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ) : (
                  <svg
                    width={iconSize * 0.4}
                    height={iconSize * 0.4}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth="1.5"
                    opacity={0.5}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}

                {/* Sparkle Effect for Complete Card */}
                {isCompleteStamp && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute animate-ping">
                      <span className="text-yellow-300 text-xl">✨</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Milestone Number */}
              {isRewardMilestone && (
                <span className="absolute -bottom-4 text-xs font-bold text-gray-600 bg-white px-1 rounded">
                  {index + 1}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Progress Text with Celebration */}
      <div className="mt-4 md:mt-6 text-center w-full">
        <div className="flex items-center justify-center gap-2 mb-2">
          <p
            className={`text-lg md:text-xl font-bold transition-all duration-300 ${
              isComplete ? 'text-yellow-600 scale-110' : ''
            }`}
            style={{ color: isComplete ? '#F59E0B' : primaryColor || '#3B82F6' }}
          >
            {currentStamps} / {totalStamps} Stamps
          </p>
          {isComplete && (
            <span className="text-2xl animate-bounce">🎉</span>
          )}
        </div>
        
        {/* Progress Bar with Animation */}
        <div className="mt-2 w-full max-w-md bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{
              width: `${progress * 100}%`,
              background: isComplete
                ? 'linear-gradient(90deg, #F59E0B 0%, #FCD34D 50%, #F59E0B 100%)'
                : filledGradient,
            }}
          >
            {/* Shimmer Effect for Complete Card */}
            {isComplete && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
            )}
          </div>
        </div>

        {/* Completion Message */}
        {isComplete && (
          <p className="mt-3 text-base md:text-lg font-semibold text-yellow-600 animate-pulse">
            🎊 Card Complete! Visit store to redeem your reward! 🎊
          </p>
        )}

        {/* Progress Percentage */}
        <p className="mt-2 text-sm text-gray-600">
          {Math.round(progress * 100)}% Complete
        </p>
      </div>

      {/* Rewards Section (if provided) */}
      {sortedRewards.length > 0 && onRedeemReward && (
        <div className="mt-6 w-full border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Rewards</h3>
          <div className="space-y-3">
            {sortedRewards.map((reward) => {
              const isRedeemable = currentStamps >= reward.stampsRequired && !redeemedRewardIds.includes(reward.id)
              const isAlreadyRedeemed = redeemedRewardIds.includes(reward.id)

              return (
                <div
                  key={reward.id}
                  className={`p-3 border rounded-lg flex items-center justify-between ${
                    isAlreadyRedeemed
                      ? 'bg-gray-100 border-gray-300'
                      : isRedeemable
                        ? 'bg-green-50 border-green-200'
                        : 'bg-blue-50 border-blue-200 opacity-70'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {reward.rewardName} ({reward.stampsRequired} stamps)
                    </p>
                    {reward.rewardDescription && (
                      <p className="text-sm text-gray-600 mt-1">{reward.rewardDescription}</p>
                    )}
                  </div>
                  {isAlreadyRedeemed ? (
                    <span className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full">Redeemed</span>
                  ) : (
                    <button
                      onClick={() => onRedeemReward(reward.id, reward.rewardName)}
                      disabled={!isRedeemable || isRedeeming}
                      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors
                        ${isRedeemable
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                      {isRedeeming ? 'Redeeming...' : 'Redeem'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
