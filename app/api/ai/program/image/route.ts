import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context, programName } = body

    // For now, return placeholder images
    // In production, this would call DALL-E or similar API
    const businessType = context.businessType?.toLowerCase() || ''
    
    // Generate styled preview data for banner options
    // In production, these would be AI-generated images
    const programNameText = programName || 'Loyalty Program'
    const images = [
      {
        url: null, // Will use CSS gradient instead
        style: 'Professional & Modern',
        prompt: `Professional banner for ${businessType} loyalty program`,
        gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        textColor: '#FFFFFF',
        icon: '💼',
      },
      {
        url: null,
        style: 'Vibrant & Energetic',
        prompt: `Vibrant banner for ${businessType} loyalty program`,
        gradient: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #F59E0B 100%)',
        textColor: '#FFFFFF',
        icon: '✨',
      },
      {
        url: null,
        style: 'Minimalist & Clean',
        prompt: `Minimalist banner for ${businessType} loyalty program`,
        gradient: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
        textColor: '#FFFFFF',
        icon: '🎨',
      },
    ]

    return NextResponse.json({
      images,
    })
  } catch (error) {
    console.error('Error generating image suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate image suggestions' },
      { status: 500 }
    )
  }
}

