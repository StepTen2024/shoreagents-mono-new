// Update Stephen for Month 3 review testing
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Calculate date 84 days ago (eligible for Month 3 review)
  const newStartDate = new Date()
  newStartDate.setDate(newStartDate.getDate() - 84)
  newStartDate.setHours(0, 0, 0, 0)
  
  console.log('🔄 Updating Stephen for Month 3 review...')
  console.log(`   New Start Date: ${newStartDate.toLocaleDateString()} (84 days ago)`)
  console.log('')
  
  // First, delete any existing reviews
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
      daysEmployed: 84
    }
  })
  
  if (updated.count === 0) {
    console.log('❌ No profile found to update')
    return
  }
  
  console.log('✅ Updated staff_profiles!')
  console.log('')
  console.log('📅 REVIEW STATUS:')
  console.log('   Days since start: 84')
  console.log('   Month 1 review: PASSED (was due at day 30)')
  console.log('   Month 3 review: DUE at day 90 (in 6 days)')
  console.log('   Month 3 review: CREATES at day 83 (ELIGIBLE NOW)')
  console.log('')
  console.log('✅ Stephen is now eligible for Month 3 review!')
  console.log('')
  console.log('🎯 Refresh /client/performance-reviews to auto-create!')
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

