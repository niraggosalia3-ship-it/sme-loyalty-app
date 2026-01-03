'use client'

import { useState, useEffect, useRef } from 'react'
import { ProgramBuilderState } from '../hooks/useProgramBuilder'
import InteractiveCard from './InteractiveCard'
import ProgramNameSelector from './ProgramNameSelector'
import TierBuilder from './TierBuilder'
import BenefitSelector from './BenefitSelector'
import ImageSelector from './ImageSelector'

interface ChatInterfaceProps {
  state: ProgramBuilderState
  updateContext: (updates: any) => void
  selectProgramName: (name: string) => void
  updateTiers: (tiers: any[], advanceStep?: boolean) => void
  updateBenefits: (tierName: string, benefits: any[], advanceStep?: boolean) => void
  selectImage: (imageUrl: string) => void
  generateSuggestions: (type: 'name' | 'tiers' | 'benefits' | 'image') => Promise<void>
}

export default function ChatInterface({
  state,
  updateContext,
  selectProgramName,
  updateTiers,
  updateBenefits,
  selectImage,
  generateSuggestions,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState<'companyName' | 'programObjective' | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.chatHistory])

  // Initialize current question only once when we reach this step
  // Don't update based on values - only change when user clicks Continue
  useEffect(() => {
    if (state.step === 'context' && state.context.uniqueValues.length > 0 && currentQuestion === null) {
      // Always start with company name question
      setCurrentQuestion('companyName')
    }
    // Reset when step changes away from context
    if (state.step !== 'context') {
      setCurrentQuestion(null)
    }
  }, [state.step, state.context.uniqueValues.length]) // Only depend on step and uniqueValues, NOT the input values

  // Auto-advance: Generate tiers when program name is selected
  useEffect(() => {
    if (state.selectedProgramName && state.step === 'tiers' && state.tierSuggestions.length === 0 && !state.isGenerating) {
      generateSuggestions('tiers')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedProgramName, state.step, state.tierSuggestions.length, state.isGenerating])

  // Auto-advance: Generate benefits when tiers are selected
  useEffect(() => {
    if (state.selectedTiers.length > 0 && state.step === 'benefits' && Object.keys(state.benefitSuggestions).length === 0 && !state.isGenerating) {
      generateSuggestions('benefits')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedTiers.length, state.step, Object.keys(state.benefitSuggestions).length, state.isGenerating])

  // Auto-advance: Generate images when step changes to image
  useEffect(() => {
    if (state.step === 'image' && state.imageSuggestions.length === 0 && !state.isGenerating) {
      generateSuggestions('image')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step, state.imageSuggestions.length, state.isGenerating])

  const handleBusinessTypeSelect = (type: string) => {
    updateContext({ businessType: type })
    addAIMessage(`Great! I see you have a ${type}. Let me ask a few more questions to create the perfect program for you.`)
    addAIMessage('What is your average transaction amount?', 'transaction')
  }

  const handleTransactionSelect = (range: string) => {
    const amounts: Record<string, number> = {
      'under-5': 4,
      '5-10': 7.5,
      '10-20': 15,
      '20-50': 35,
      '50-plus': 75,
    }
    updateContext({ averageTransaction: amounts[range] || 10 })
    addAIMessage(`Perfect! Now, how often do customers typically visit?`, 'frequency')
  }

  const handleFrequencySelect = (frequency: string) => {
    updateContext({ visitFrequency: frequency })
    addAIMessage('Excellent! What makes your business unique? (Select all that apply)', 'values')
  }

  const handleValueToggle = (value: string) => {
    const currentValues = state.context.uniqueValues || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]
    updateContext({ uniqueValues: newValues })
  }

  const handleContinue = async () => {
    // Check if all context is gathered
    if (
      state.step === 'context' &&
      state.context.businessType &&
      state.context.averageTransaction &&
      state.context.visitFrequency &&
      state.context.uniqueValues.length > 0 &&
      state.context.companyName &&
      state.context.programObjective
    ) {
      await generateSuggestions('name')
    }
  }

  const addAIMessage = (content: string, type?: string) => {
    // This would update chat history - simplified for now
    console.log('AI Message:', content, type)
  }

  const renderContextGathering = () => {
    if (!state.context.businessType) {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['Coffee Shop', 'Restaurant', 'Retail Store', 'Salon', 'Gym', 'Other'].map((type) => (
              <button
                key={type}
                onClick={() => handleBusinessTypeSelect(type)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-900"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (!state.context.averageTransaction) {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Under $5', value: 'under-5' },
              { label: '$5-10', value: '5-10' },
              { label: '$10-20', value: '10-20' },
              { label: '$20-50', value: '20-50' },
              { label: '$50+', value: '50-plus' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleTransactionSelect(option.value)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-900"
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <input
              type="number"
              placeholder="Or type custom amount..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              onChange={(e) => updateContext({ averageTransaction: parseFloat(e.target.value) || null })}
            />
          </div>
        </div>
      )
    }

    if (!state.context.visitFrequency) {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['Daily', '2-3x/week', 'Weekly', 'Monthly', 'Rarely'].map((freq) => (
              <button
                key={freq}
                onClick={() => handleFrequencySelect(freq)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-900"
              >
                {freq}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (state.context.uniqueValues.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['Sustainability', 'Family-owned', 'Organic', 'Local', 'Premium', 'Fast service'].map((value) => (
              <button
                key={value}
                onClick={() => handleValueToggle(value)}
                className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                  state.context.uniqueValues?.includes(value)
                    ? 'bg-green-100 border-green-300 text-green-900'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {state.context.uniqueValues?.includes(value) ? '✓ ' : ''}
                {value}
              </button>
            ))}
          </div>
          <button
            onClick={handleContinue}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Continue
          </button>
        </div>
      )
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Welcome Message */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            🤖
          </div>
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900">
                Hi! I'll help you create a loyalty program for your business. Let me ask a few quick questions to get started.
              </p>
            </div>
          </div>
        </div>

        {/* Context Gathering */}
        {state.step === 'context' && (
          <>
            {!state.context.businessType && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  🤖
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 mb-3">What type of business do you have?</p>
                    {renderContextGathering()}
                  </div>
                </div>
              </div>
            )}

            {state.context.businessType && !state.context.averageTransaction && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  🤖
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 mb-3">What's your average transaction amount?</p>
                    {renderContextGathering()}
                  </div>
                </div>
              </div>
            )}

            {state.context.averageTransaction && !state.context.visitFrequency && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  🤖
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 mb-3">How often do customers typically visit?</p>
                    {renderContextGathering()}
                  </div>
                </div>
              </div>
            )}

            {state.context.visitFrequency && state.context.uniqueValues.length === 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  🤖
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 mb-3">What makes your business unique? (Select all that apply)</p>
                    {renderContextGathering()}
                  </div>
                </div>
              </div>
            )}

            {state.context.uniqueValues.length > 0 && state.step === 'context' && (
              <>
                {/* Company Name Question */}
                {currentQuestion === 'companyName' && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      🤖
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-900 mb-3">Great! What is your company name?</p>
                        <input
                          type="text"
                          value={state.context.companyName || ''}
                          onChange={(e) => {
                            updateContext({ companyName: e.target.value })
                          }}
                          placeholder="Enter your company name..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            // Only advance if there's a value
                            if (state.context.companyName && state.context.companyName.trim().length > 0) {
                              setCurrentQuestion('programObjective')
                            }
                          }}
                          disabled={!state.context.companyName || state.context.companyName.trim().length === 0}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Program Objective Question */}
                {currentQuestion === 'programObjective' && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      🤖
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-900 mb-3">What is the main objective of creating this loyalty program?</p>
                        <textarea
                          value={state.context.programObjective || ''}
                          onChange={(e) => {
                            updateContext({ programObjective: e.target.value })
                          }}
                          placeholder="e.g., Increase customer retention, drive repeat visits, reward loyal customers, increase average order value..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 min-h-[100px] resize-y"
                          autoFocus
                        />
                        {state.context.programObjective && state.context.programObjective.trim().length > 0 && (
                          <button
                            onClick={handleContinue}
                            disabled={state.isGenerating}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {state.isGenerating ? 'Generating...' : 'Continue'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Program Name Selection */}
        {state.step === 'name' && state.programNameSuggestions.length > 0 && (
          <ProgramNameSelector
            suggestions={state.programNameSuggestions}
            selected={state.selectedProgramName}
            onSelect={selectProgramName}
            isGenerating={state.isGenerating}
          />
        )}

        {/* Tier Builder */}
        {state.step === 'tiers' && (
          <>
            {state.isGenerating && state.tierSuggestions.length === 0 && (
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
            )}
            {state.tierSuggestions.length > 0 && (
              <TierBuilder
                tiers={state.selectedTiers}
                suggestions={state.tierSuggestions}
                onUpdate={updateTiers}
                isGenerating={state.isGenerating}
              />
            )}
          </>
        )}

        {/* Benefit Selector */}
        {state.step === 'benefits' && (
          <>
            {state.isGenerating && Object.keys(state.benefitSuggestions).length === 0 && (
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
            )}
            {Object.keys(state.benefitSuggestions).length > 0 && (
              <BenefitSelector
                tiers={state.selectedTiers}
                suggestions={state.benefitSuggestions}
                selected={state.selectedBenefits}
                onUpdate={updateBenefits}
                isGenerating={state.isGenerating}
              />
            )}
          </>
        )}

        {/* Image Selector */}
        {state.step === 'image' && (
          <>
            {state.isGenerating && state.imageSuggestions.length === 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  🤖
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">Generating banner images...</p>
                  </div>
                </div>
              </div>
            )}
            {(state.imageSuggestions.length > 0 || !state.isGenerating) && (
              <ImageSelector
                suggestions={state.imageSuggestions}
                selected={state.selectedImage}
                onSelect={selectImage}
                isGenerating={state.isGenerating}
              />
            )}
          </>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && inputValue.trim()) {
                // Handle custom input
                setInputValue('')
              }
            }}
            placeholder="Type your message or ask a question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              if (inputValue.trim()) {
                // Handle custom input
                setInputValue('')
              }
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

