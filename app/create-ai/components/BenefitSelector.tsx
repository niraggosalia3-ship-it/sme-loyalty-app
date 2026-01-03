'use client'

interface Benefit {
  name: string
  description: string
  tierName: string
}

interface BenefitSelectorProps {
  tiers: any[]
  suggestions: Record<string, Benefit[]>
  selected: Record<string, Benefit[]>
  onUpdate: (tierName: string, benefits: Benefit[], advanceStep?: boolean) => void
  isGenerating: boolean
}

export default function BenefitSelector({
  tiers,
  suggestions,
  selected,
  onUpdate,
  isGenerating,
}: BenefitSelectorProps) {
  if (isGenerating) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          🤖
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900">Generating benefit suggestions...</p>
          </div>
        </div>
      </div>
    )
  }

  const toggleBenefit = (tierName: string, benefit: Benefit) => {
    const currentBenefits = selected[tierName] || []
    const isSelected = currentBenefits.some((b) => b.name === benefit.name)
    
    if (isSelected) {
      onUpdate(tierName, currentBenefits.filter((b) => b.name !== benefit.name), false)
    } else {
      onUpdate(tierName, [...currentBenefits, benefit], false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          🤖
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 mb-4">
              Here are suggested benefits for each tier. Click to select/deselect benefits.
            </p>
          </div>
        </div>
      </div>

      {tiers.map((tier) => {
        const tierBenefits = suggestions[tier.name] || []
        const selectedBenefits = selected[tier.name] || []

        return (
          <div key={tier.name} className="border border-gray-200 rounded-lg p-4 bg-white">
            <h3 className="font-semibold text-gray-900 mb-3">{tier.name} Tier</h3>
            <div className="space-y-2">
              {tierBenefits.map((benefit, index) => {
                const isSelected = selectedBenefits.some((b) => b.name === benefit.name)
                return (
                  <div
                    key={index}
                    onClick={() => toggleBenefit(tier.name, benefit)}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleBenefit(tier.name, benefit)}
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="font-medium text-gray-900">{benefit.name}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 ml-6">{benefit.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <button
        onClick={() => {
          // Advance to image step by calling onUpdate with advanceStep=true for any tier
          // We just need to trigger the step change, so we'll update the first tier's benefits
          const firstTier = tiers[0]
          if (firstTier) {
            const currentBenefits = selected[firstTier.name] || []
            onUpdate(firstTier.name, currentBenefits, true)
          }
        }}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Continue to Image Selection
      </button>
    </div>
  )
}

