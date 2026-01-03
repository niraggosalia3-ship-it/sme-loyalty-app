'use client'

interface ImageOption {
  url: string | null
  style: string
  prompt: string
  gradient?: string
  textColor?: string
  icon?: string
}

interface ImageSelectorProps {
  suggestions: ImageOption[]
  selected: string | null
  onSelect: (imageUrl: string) => void
  isGenerating: boolean
}

export default function ImageSelector({
  suggestions,
  selected,
  onSelect,
  isGenerating,
}: ImageSelectorProps) {
  if (isGenerating) {
    return (
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
              I've generated banner images for your program. Click to select one, or upload your own.
            </p>
          </div>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No images available. Please try uploading a custom image.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {suggestions.map((image, index) => (
            <div
              key={index}
              className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                selected === (image.url || `gradient-${index}`)
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelect(image.url || `gradient-${index}`)}
            >
              <div 
                className="w-full h-32 overflow-hidden flex items-center justify-center relative"
                style={{
                  background: image.gradient || image.url || '#E5E7EB',
                }}
              >
                {image.url ? (
                  <img
                    src={image.url}
                    alt={`Banner style: ${image.style || 'Banner'}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', image.url)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div 
                    className="w-full h-full flex flex-col items-center justify-center text-white font-semibold px-4 text-center"
                    style={{ color: image.textColor || '#FFFFFF' }}
                  >
                    {image.icon && <span className="text-3xl mb-2">{image.icon}</span>}
                    <span className="text-lg">{image.style}</span>
                    <span className="text-sm opacity-90 mt-1">Preview Style</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{image.style || 'Banner Style'}</span>
                  {selected === (image.url || `gradient-${suggestions.indexOf(image)}`) && (
                    <span className="text-blue-600 text-sm">✓ Selected</span>
                  )}
                </div>
                {image.prompt && (
                  <p className="text-xs text-gray-500 mt-1">{image.prompt}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.onchange = (e: any) => {
              const file = e.target.files[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                  if (event.target?.result) {
                    onSelect(event.target.result as string)
                  }
                }
                reader.readAsDataURL(file)
              }
            }
            input.click()
          }}
          className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 hover:bg-gray-50"
        >
          Upload Custom Image
        </button>
        <button
          onClick={() => {
            // Skip image for now - pass null to indicate no image
            onSelect('')
          }}
          className="ml-3 px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Skip for Now
        </button>
      </div>
    </div>
  )
}

