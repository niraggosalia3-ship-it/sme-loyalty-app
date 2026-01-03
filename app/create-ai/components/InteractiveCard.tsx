'use client'

interface InteractiveCardProps {
  title: string
  description?: string
  isSelected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  editable?: boolean
  children?: React.ReactNode
}

export default function InteractiveCard({
  title,
  description,
  isSelected = false,
  onSelect,
  onEdit,
  editable = false,
  children,
}: InteractiveCardProps) {
  return (
    <div
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          {description && <p className="text-sm text-gray-600">{description}</p>}
          {children}
        </div>
        {isSelected && (
          <div className="ml-2 text-blue-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      {editable && onEdit && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

