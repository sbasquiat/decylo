/**
 * Script to manually send welcome email to a specific address
 * Usage: npx tsx scripts/send-welcome-email.ts <email>
 * 
 * Make sure RESEND_API_KEY is set in environment or .env.local
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { sendEmail, generateWelcomeEmail } from '../lib/emails'

const email = process.argv[2] || 'pane_velar_3h@icloud.com'

async function main() {
  console.log(`Sending welcome email to: ${email}`)
  
  const emailData = generateWelcomeEmail()
  const emailToSend = {
    ...emailData,
    to: email,
  }

  const sent = await sendEmail(emailToSend)

  if (sent) {
    console.log('✅ Welcome email sent successfully!')
  } else {
    console.error('❌ Failed to send welcome email')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})

