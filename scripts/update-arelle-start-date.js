// Quick script to update Arelle's start date for Performance Review testing
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const userId = '3cca4f19-cf5c-4880-817a-67eacf97eff2'
  
  // Calculate date 23 days ago (eligible for Month 1 review)
  const date = new Date()
  date.setDate(date.getDate() - 23)
  
  console.log('🔄 Updating Arelle Basco start date...')
  console.log('   User ID:', userId)
  console.log('   New Start Date:', date.toISOString().split('T')[0])
  console.log('')
  
  // Check if profile exists
  const existingProfile = await prisma.staff_profiles.findUnique({
    where: { staffUserId: userId }
  })
  
  if (existingProfile) {
    // Update existing profile
    const updated = await prisma.staff_profiles.update({
      where: { staffUserId: userId },
      data: { startDate: date }
    })
    console.log('✅ Updated existing staff_profiles record!')
    console.log('   Start Date:', updated.startDate)
  } else {
    // Create new profile
    const created = await prisma.staff_profiles.create({
      data: {
        id: require('crypto').randomUUID(),
        staffUserId: userId,
        startDate: date,
        personalityType: 'NOT_SET',
        updatedAt: new Date()
      }
    })
    console.log('✅ Created new staff_profiles record!')
    console.log('   Start Date:', created.startDate)
  }
  
  console.log('')
  console.log('🎯 Arelle is now eligible for a Month 1 review!')
  console.log('   Days since start:', 23)
  console.log('   Review should be created 7 days before day 30')
  console.log('   Today is day 23, so review should be auto-created!')
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

