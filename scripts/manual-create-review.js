// Manually create a Month 1 review for Arelle
const { PrismaClient } = require('@prisma/client')
const { randomUUID } = require('crypto')
const prisma = new PrismaClient()

async function main() {
  const staffUserId = '3cca4f19-cf5c-4880-817a-67eacf97eff2' // Arelle
  const clientEmail = 'b@b.com' // Ben Jackson
  
  console.log('🔄 Creating Month 1 review for Arelle...')
  console.log('')
  
  // Get staff info
  const staff = await prisma.staff_users.findUnique({
    where: { id: staffUserId },
    include: {
      staff_profiles: true
    }
  })
  
  if (!staff) {
    console.log('❌ Staff not found!')
    return
  }
  
  if (!staff.staff_profiles?.startDate) {
    console.log('❌ Staff has no start date!')
    return
  }
  
  // Calculate days employed
  const startDate = staff.staff_profiles.startDate
  const now = new Date()
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  console.log('✅ Staff:', staff.name)
  console.log('   Start Date:', startDate.toISOString().split('T')[0])
  console.log('   Days Employed:', daysSinceStart)
  console.log('')
  
  // Check if review already exists
  const existing = await prisma.reviews.findFirst({
    where: {
      staffUserId,
      type: 'MONTH_1',
      reviewer: clientEmail
    }
  })
  
  if (existing) {
    console.log('⚠️  Month 1 review already exists!')
    console.log('   Review ID:', existing.id)
    console.log('   Status:', existing.status)
    return
  }
  
  // Calculate due date (30 days after start)
  const dueDate = new Date(startDate)
  dueDate.setDate(dueDate.getDate() + 30)
  
  // Create review
  const review = await prisma.reviews.create({
    data: {
      id: randomUUID(),
      staffUserId,
      type: 'MONTH_1',
      status: 'PENDING',
      client: 'Metrocity Realty',
      reviewer: clientEmail,
      reviewerTitle: 'MANAGER',
      dueDate,
      evaluationPeriod: `Day 1 to Day ${daysSinceStart}`,
      updatedAt: new Date()
    }
  })
  
  console.log('✅ Created Month 1 review!')
  console.log('   Review ID:', review.id)
  console.log('   Type:', review.type)
  console.log('   Status:', review.status)
  console.log('   Due Date:', review.dueDate.toISOString().split('T')[0])
  console.log('')
  console.log('🎯 Refresh the page and you should see the review!')
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
