'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChatInterface from './components/ChatInterface'
import LivePreview from './components/LivePreview'
import { useProgramBuilder } from './hooks/useProgramBuilder'

export default function CreateAIProgram() {
  const router = useRouter()
  const {
    state,
    updateContext,
    selectProgramName,
    updateTiers,
    updateBenefits,
    selectImage,
    generateSuggestions,
    saveProgram,
  } = useProgramBuilder()

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await saveProgram()
      if (result.success) {
        // Redirect to the SME dashboard
        router.push(`/sme/${result.smeId}`)
      } else {
        alert(result.error || 'Failed to create program')
      }
    } catch (error) {
      console.error('Error saving program:', error)
      alert('Failed to create program. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Create Your Loyalty Program with AI
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Let AI help you build the perfect program for your business
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Chat and Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Chat Interface */}
          <div className="flex-1 overflow-y-auto">
            <ChatInterface
              state={state}
              updateContext={updateContext}
              selectProgramName={selectProgramName}
              updateTiers={updateTiers}
              updateBenefits={updateBenefits}
              selectImage={selectImage}
              generateSuggestions={generateSuggestions}
            />
          </div>

          {/* Live Preview Sidebar */}
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <LivePreview
              state={state}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

