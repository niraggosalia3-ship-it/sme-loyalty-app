'use client'

import { ProgramBuilderState } from '../hooks/useProgramBuilder'

interface LivePreviewProps {
  state: ProgramBuilderState
  onSave: () => void
  isSaving: boolean
}

export default function LivePreview({ state, onSave, isSaving }: LivePreviewProps) {
  const canSave =
    state.context.companyName &&
    state.selectedProgramName &&
    state.selectedTiers.length > 0

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Program Preview</h2>

      <div className="space-y-4">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={state.context.companyName || ''}
            onChange={(e) => {
              // Update context through the parent component
              // For now, this is read-only in preview - main input is in chat
            }}
            placeholder="Enter company name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
            readOnly
          />
        </div>

        {/* Program Name */}
        {state.selectedProgramName && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program Name
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900">
              {state.selectedProgramName}
            </div>
          </div>
        )}

        {/* Banner Preview */}
        {state.selectedImage && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banner Image
            </label>
            <div className="w-full h-24 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={state.selectedImage}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Tiers */}
        {state.selectedTiers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiers ({state.selectedTiers.length})
            </label>
            <div className="space-y-2">
              {state.selectedTiers.map((tier, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{tier.name}</span>
                    <span className="text-gray-600">{tier.pointsRequired} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Points Multiplier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Points Multiplier
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            {state.pointsMultiplier}x points per dollar
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">Setup Progress</div>
          <div className="space-y-1">
            <div className={`text-xs ${state.context.businessType ? 'text-green-600' : 'text-gray-400'}`}>
              {state.context.businessType ? '✓' : '○'} Business Context
            </div>
            <div className={`text-xs ${state.selectedProgramName ? 'text-green-600' : 'text-gray-400'}`}>
              {state.selectedProgramName ? '✓' : '○'} Program Name
            </div>
            <div className={`text-xs ${state.selectedTiers.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {state.selectedTiers.length > 0 ? '✓' : '○'} Tiers
            </div>
            <div className={`text-xs ${Object.keys(state.selectedBenefits).length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {Object.keys(state.selectedBenefits).length > 0 ? '✓' : '○'} Benefits
            </div>
            <div className={`text-xs ${state.selectedImage ? 'text-green-600' : 'text-gray-400'}`}>
              {state.selectedImage ? '✓' : '○'} Banner Image
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={!canSave || isSaving}
          className={`w-full mt-6 px-4 py-3 rounded-lg font-medium ${
            canSave && !isSaving
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Creating Program...' : 'Create Program'}
        </button>

        {!canSave && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Complete all steps to create your program
          </p>
        )}
      </div>
    </div>
  )
}

