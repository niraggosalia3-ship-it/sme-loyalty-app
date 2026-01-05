'use client'

interface StampCardProps {
  currentStamps: number
  totalStamps: number
  primaryColor?: string | null
  secondaryColor?: string | null
  size?: 'small' | 'medium' | 'large'
}

export default function StampCard({
  currentStamps,
  totalStamps,
  primaryColor = '#3B82F6',
  secondaryColor = '#60A5FA',
  size = 'medium',
}: StampCardProps) {
  // Determine sizes based on prop
  const sizes = {
    small: { icon: 32, gap: 2 },
    medium: { icon: 48, gap: 3 },
    large: { icon: 64, gap: 4 },
  }
  const { icon: iconSize, gap } = sizes[size]

  // Create gradient from primary to secondary color
  const filledGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`

  return (
    <div className="flex flex-col items-center">
      {/* Stamp Grid */}
      <div
        className="flex flex-wrap justify-center items-center gap-2 md:gap-3"
        style={{ gap: `${gap * 4}px` }}
      >
        {Array.from({ length: totalStamps }).map((_, index) => {
          const isFilled = index < currentStamps
          return (
            <div
              key={index}
              className="relative flex items-center justify-center"
              style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
            >
              {/* Stamp Circle */}
              <div
                className="rounded-full border-2 flex items-center justify-center transition-all duration-300"
                style={{
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  backgroundColor: isFilled ? undefined : 'transparent',
                  background: isFilled ? filledGradient : undefined,
                  borderColor: isFilled
                    ? primaryColor || '#3B82F6'
                    : '#D1D5DB',
                  borderStyle: isFilled ? 'solid' : 'dashed',
                  borderWidth: '2px',
                  boxShadow: isFilled
                    ? `0 2px 8px ${primaryColor}40`
                    : 'none',
                }}
              >
                {/* Star Icon */}
                {isFilled ? (
                  <svg
                    width={iconSize * 0.5}
                    height={iconSize * 0.5}
                    viewBox="0 0 24 24"
                    fill="white"
                    className="drop-shadow-sm"
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
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress Text */}
      <div className="mt-4 text-center">
        <p className="text-lg md:text-xl font-bold" style={{ color: primaryColor || '#3B82F6' }}>
          {currentStamps} / {totalStamps} Stamps
        </p>
        {/* Progress Bar */}
        <div className="mt-2 w-full max-w-md bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(currentStamps / totalStamps) * 100}%`,
              background: filledGradient,
            }}
          />
        </div>
      </div>
    </div>
  )
}

