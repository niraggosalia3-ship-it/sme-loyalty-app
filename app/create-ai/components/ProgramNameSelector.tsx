'use client'

import { useState } from 'react'
import InteractiveCard from './InteractiveCard'

interface ProgramNameSelectorProps {
  suggestions: Array<{ name: string; explanation: string }>
  selected: string | null
  onSelect: (name: string) => void
  isGenerating: boolean
}

export default function ProgramNameSelector({
  suggestions,
  selected,
  onSelect,
  isGenerating,
}: ProgramNameSelectorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editedNames, setEditedNames] = useState<Record<number, string>>({})

  if (isGenerating) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          🤖
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900">Generating program name suggestions...</p>
          </div>
        </div>
      </div>
    )
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
              I've generated {suggestions.length} program name suggestions for you. Click on one to select it, or click Edit to customize!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion, index) => {
          const displayName = editedNames[index] || suggestion.name
          const isEditing = editingIndex === index

          return (
            <div key={index}>
              {isEditing ? (
                <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setEditedNames({ ...editedNames, [index]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingIndex(null)
                        if (editedNames[index]) {
                          onSelect(editedNames[index])
                        }
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingIndex(null)
                        setEditedNames({ ...editedNames, [index]: suggestion.name })
                      }}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <InteractiveCard
                  title={displayName}
                  description={suggestion.explanation}
                  isSelected={selected === displayName}
                  onSelect={() => onSelect(displayName)}
                  onEdit={() => setEditingIndex(index)}
                  editable
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4">
        <button
          onClick={() => {
            const customName = prompt('Enter your custom program name:')
            if (customName) {
              onSelect(customName)
            }
          }}
          className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 hover:bg-gray-50"
        >
          + Create Custom Name
        </button>
      </div>
    </div>
  )
}


