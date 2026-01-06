/**
 * Email utilities for sending magic links
 * Uses Resend API (free tier: 3,000 emails/month)
 */

interface SendMagicLinkEmailParams {
  to: string
  smeName: string
  magicLinkUrl: string
}

/**
 * Send magic link email to SME owner
 */
export async function sendMagicLinkEmail({ to, smeName, magicLinkUrl }: SendMagicLinkEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.error('RESEND_API_KEY not set. Skipping email send.')
    // In development, log the link instead
    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Magic Link (dev mode):', magicLinkUrl)
    }
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Loyalty Program <onboarding@resend.dev>',
        to: [to],
        subject: `Access Your ${smeName} Loyalty Program Dashboard`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Your Loyalty Program!</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Hello,
                </p>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Your loyalty program dashboard for <strong>${smeName}</strong> is ready!
                </p>
                
                <p style="font-size: 16px; margin-bottom: 30px;">
                  Click the button below to access your dashboard. No password needed - just click and you're in!
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${magicLinkUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                    Access Dashboard
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <strong>Note:</strong> This link expires in 24 hours. If you need a new link, you can request one from the dashboard.
                </p>
                
                <p style="font-size: 12px; color: #999; margin-top: 20px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${magicLinkUrl}" style="color: #667eea; word-break: break-all;">${magicLinkUrl}</a>
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 12px; color: #999;">
                  This is an automated email. Please do not reply.
                </p>
              </div>
            </body>
          </html>
        `,
        text: `
Welcome to Your Loyalty Program!

Your loyalty program dashboard for ${smeName} is ready!

Click this link to access your dashboard (no password needed):
${magicLinkUrl}

Note: This link expires in 24 hours. If you need a new link, you can request one from the dashboard.

This is an automated email. Please do not reply.
        `.trim(),
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error('Failed to send email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

