/**
 * API endpoint to check and mark expired reward instances
 * Can be called periodically (cron job) or on-demand
 */
import { NextRequest, NextResponse } from 'next/server'
import { checkAndMarkExpired } from '@/lib/reward-instance'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add admin authentication here
    const count = await checkAndMarkExpired()
    
    return NextResponse.json({
      success: true,
      expiredCount: count,
      message: `Marked ${count} reward instance(s) as expired`,
    })
  } catch (error) {
    console.error('Error checking expiration:', error)
    return NextResponse.json(
      { error: 'Failed to check expiration' },
      { status: 500 }
    )
  }
}

// Also allow GET for easy cron job calls
export async function GET(request: NextRequest) {
  return POST(request)
}

