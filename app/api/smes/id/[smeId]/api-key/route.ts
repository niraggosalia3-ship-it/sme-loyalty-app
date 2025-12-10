import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAPIKey } from '@/lib/api-key'

// Generate or regenerate API key for SME
export async function POST(
  request: NextRequest,
  { params }: { params: { smeId: string } }
) {
  try {
    const sme = await prisma.sME.findUnique({
      where: { id: params.smeId },
    })

    if (!sme) {
      return NextResponse.json({ error: 'SME not found' }, { status: 404 })
    }

    // Generate new API key
    const newApiKey = generateAPIKey()

    // Update SME with new API key
    const updatedSME = await prisma.sME.update({
      where: { id: params.smeId },
      data: { apiKey: newApiKey },
    })

    return NextResponse.json({
      success: true,
      apiKey: updatedSME.apiKey,
      message: 'API key generated successfully',
    })
  } catch (error) {
    console.error('Error generating API key:', error)
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    )
  }
}

// Get current API key (without exposing it fully)
export async function GET(
  request: NextRequest,
  { params }: { params: { smeId: string } }
) {
  try {
    const sme = await prisma.sME.findUnique({
      where: { id: params.smeId },
      select: {
        id: true,
        apiKey: true,
      },
    })

    if (!sme) {
      return NextResponse.json({ error: 'SME not found' }, { status: 404 })
    }

    if (!sme.apiKey) {
      return NextResponse.json({
        hasApiKey: false,
        apiKey: null,
        message: 'No API key generated yet',
      })
    }

    // Return full API key (for internal use, user will see it when they generate/show it)
    return NextResponse.json({
      hasApiKey: true,
      apiKey: sme.apiKey,
      apiKeyMasked: sme.apiKey.substring(0, 12) + '...' + sme.apiKey.substring(sme.apiKey.length - 4),
      message: 'API key exists. Use POST to regenerate.',
    })
  } catch (error) {
    console.error('Error fetching API key:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    )
  }
}

