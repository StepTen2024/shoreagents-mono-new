// Update Stephen for RECURRING review testing (post-regularisation)
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Calculate date 324 days ago (eligible for recurring review)
  // Regularisation at day 150, recurring at day 330 (150 + 180), creates at day 323
  const newStartDate = new Date()
  newStartDate.setDate(newStartDate.getDate() - 324)
  newStartDate.setHours(0, 0, 0, 0)
  
  console.log('🔄 Updating Stephen for RECURRING REVIEW...')
  console.log(`   New Start Date: ${newStartDate.toLocaleDateString()} (324 days ago)`)
  console.log('')
  
  // Delete existing reviews
  const deleted = await prisma.reviews.deleteMany({
    where: {
      staff_users: {
        email: 'stephen@stepten.ai'
      }
    }
  })
  
  console.log(`🗑️  Deleted ${deleted.count} existing reviews`)
  console.log('')
  
  // Update staff profile
  const updated = await prisma.staff_profiles.updateMany({
    where: {
      staff_users: {
        email: 'stephen@stepten.ai'
      }
    },
    data: {
      startDate: newStartDate,
      daysEmployed: 324
    }
  })
  
  if (updated.count === 0) {
    console.log('❌ No profile found')
    return
  }
  
  console.log('✅ Updated staff_profiles!')
  console.log('')
  console.log('📅 REVIEW TIMELINE:')
  console.log('   Day 0: Started employment')
  console.log('   Day 30: Month 1 review (PASSED)')
  console.log('   Day 90: Month 3 review (PASSED)')
  console.log('   Day 150: Month 5 REGULARISATION (PASSED) ✅')
  console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('   🎯 Day 330: First RECURRING review (DUE in 6 days)')
  console.log('   🎯 Day 323: Creates (ELIGIBLE NOW)')
  console.log('   Current: Day 324 ✅')
  console.log('')
  console.log('🎉 Stephen is REGULARISED and due for RECURRING REVIEW!')
  console.log('')
  console.log('📊 RECURRING REVIEW INFO:')
  console.log('   - Frequency: Every 180 days after regularisation')
  console.log('   - First recurring: Day 330 (150 + 180)')
  console.log('   - Second recurring: Day 510 (330 + 180)')
  console.log('   - Third recurring: Day 690 (510 + 180)')
  console.log('')
  console.log('🚀 Refresh /client/performance-reviews to auto-create!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('❌ Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

