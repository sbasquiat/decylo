/**
 * Script to send test emails for all stickiness email types
 * Usage: npx tsx scripts/send-test-emails.ts <email>
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { sendEmail, generateWelcomeEmail, generateOutcomeDueTodayEmail, generateOutcomeOverdueEmail, generateWeeklyReviewEmail, generateStreakSaveEmail, generateFirstOutcomeEmail, generateProMomentEmail } from '../lib/emails'

const email = process.argv[2] || 'pane_velar_3h@icloud.com'

async function main() {
  console.log(`Sending test emails to: ${email}\n`)

  const emails = [
    {
      name: 'Welcome Email',
      generator: () => generateWelcomeEmail('Test User'),
    },
    {
      name: 'Outcome Due Today',
      generator: () => generateOutcomeDueTodayEmail([
        { title: 'Test Decision 1', chosen_option: 'Option A', confidence: 75, id: 'test-1' },
        { title: 'Test Decision 2', chosen_option: 'Option B', confidence: 60, id: 'test-2' },
      ], 'Test User'),
    },
    {
      name: 'Outcome Overdue',
      generator: () => generateOutcomeOverdueEmail('Test Decision Title', 'test-decision-id', 'Test User'),
    },
    {
      name: 'Weekly Review',
      generator: () => generateWeeklyReviewEmail('Test User', {
        decisionsMade: 5,
        trajectory: 'up',
        dhi: 72,
        cal_gap: 12,
        lcr: 85,
        challenge_text: 'Keep closing loops. Your calibration is improving.',
      }),
    },
    {
      name: 'Streak Save',
      generator: () => generateStreakSaveEmail('Test User'),
    },
    {
      name: 'First Outcome',
      generator: () => generateFirstOutcomeEmail('Test User'),
    },
    {
      name: 'Pro Moment',
      generator: () => generateProMomentEmail('Test User'),
    },
  ]

  for (const emailType of emails) {
    console.log(`Sending ${emailType.name}...`)
    
    try {
      const emailData = emailType.generator()
      const emailToSend = {
        ...emailData,
        to: email,
      }

      const sent = await sendEmail(emailToSend)

      if (sent) {
        console.log(`✅ ${emailType.name} sent successfully!\n`)
      } else {
        console.error(`❌ ${emailType.name} failed to send\n`)
      }
    } catch (error) {
      console.error(`❌ Error sending ${emailType.name}:`, error, '\n')
    }

    // Wait 1 second between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('All test emails sent!')
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})

