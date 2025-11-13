// Update Stephen for Month 5 Regularisation review
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Calculate date 144 days ago (eligible for Month 5 regularisation)
  const newStartDate = new Date()
  newStartDate.setDate(newStartDate.getDate() - 144)
  newStartDate.setHours(0, 0, 0, 0)
  
  console.log('🔄 Updating Stephen for MONTH 5 REGULARISATION...')
  console.log(`   New Start Date: ${newStartDate.toLocaleDateString()} (144 days ago)`)
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
      daysEmployed: 144
    }
  })
  
  if (updated.count === 0) {
    console.log('❌ No profile found')
    return
  }
  
  console.log('✅ Updated staff_profiles!')
  console.log('')
  console.log('📅 REVIEW STATUS:')
  console.log('   Days since start: 144')
  console.log('   Month 1: PASSED (day 30)')
  console.log('   Month 3: PASSED (day 90)')
  console.log('   🎯 Month 5 REGULARISATION: DUE at day 150 (in 6 days)')
  console.log('   🎯 Month 5 REGULARISATION: CREATES at day 143 (ELIGIBLE NOW)')
  console.log('')
  console.log('🎉 Stephen is now eligible for REGULARISATION REVIEW!')
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

