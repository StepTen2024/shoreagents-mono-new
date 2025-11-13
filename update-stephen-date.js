// Update Stephen's start date to 24 days ago for Month 1 review testing
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Calculate date 24 days ago (eligible for Month 1 review)
  const newStartDate = new Date()
  newStartDate.setDate(newStartDate.getDate() - 24)
  newStartDate.setHours(0, 0, 0, 0)
  
  console.log('🔄 Updating Stephen Test User start date...')
  console.log(`   New Start Date: ${newStartDate.toLocaleDateString()} (24 days ago)`)
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
      daysEmployed: 24
    }
  })
  
  if (updated.count === 0) {
    console.log('❌ No profile found to update')
    return
  }
  
  console.log('✅ Updated staff_profiles!')
  console.log('')
  console.log('📅 REVIEW STATUS:')
  console.log('   Days since start: 24')
  console.log('   Month 1 review: DUE at day 30 (in 6 days)')
  console.log('   Month 1 review: CREATES at day 23 (ELIGIBLE NOW)')
  console.log('')
  console.log('✅ Stephen is now eligible for Month 1 review!')
  console.log('')
  console.log('🎯 NEXT STEPS:')
  console.log('   1. Login as client')
  console.log('   2. Go to /client/performance-reviews')
  console.log('   3. Page will auto-create Month 1 review')
  console.log('   4. You will see "1 Pending Review" for Stephen')
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

