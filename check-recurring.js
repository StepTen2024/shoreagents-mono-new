// Check if Stephen should have a recurring review
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking recurring review eligibility...\n')
  
  const stephen = await prisma.staff_users.findUnique({
    where: { email: 'stephen@stepten.ai' },
    include: { staff_profiles: true, company: true }
  })
  
  if (!stephen?.staff_profiles?.startDate) {
    console.log('❌ No start date found')
    return
  }
  
  const startDate = stephen.staff_profiles.startDate
  const now = new Date()
  const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24))
  
  console.log(`📋 Stephen's Info:`)
  console.log(`   Start Date: ${startDate.toLocaleDateString()}`)
  console.log(`   Days Since Start: ${daysSinceStart}`)
  console.log('')
  
  // Calculate review dates
  const month1Due = new Date(startDate)
  month1Due.setDate(month1Due.getDate() + 30)
  
  const month3Due = new Date(startDate)
  month3Due.setDate(month3Due.getDate() + 90)
  
  const month5Due = new Date(startDate)
  month5Due.setDate(month5Due.getDate() + 150)
  
  const recurringDue = new Date(startDate)
  recurringDue.setDate(recurringDue.getDate() + 330) // 150 + 180
  
  const recurringCreate = new Date(recurringDue)
  recurringCreate.setDate(recurringCreate.getDate() - 7)
  
  console.log(`📅 Review Timeline:`)
  console.log(`   Month 1: Due at day 30 (${month1Due.toLocaleDateString()})`)
  console.log(`   Month 3: Due at day 90 (${month3Due.toLocaleDateString()})`)
  console.log(`   Month 5: Due at day 150 (${month5Due.toLocaleDateString()})`)
  console.log(`   RECURRING: Due at day 330 (${recurringDue.toLocaleDateString()})`)
  console.log(`   RECURRING: Creates at day 323 (${recurringCreate.toLocaleDateString()})`)
  console.log(`   Today: ${now.toLocaleDateString()}`)
  console.log('')
  
  const shouldCreate = now >= recurringCreate && now < recurringDue
  console.log(`✅ Should Create RECURRING Review: ${shouldCreate}`)
  console.log('')
  
  // Check existing reviews
  const reviews = await prisma.reviews.findMany({
    where: { staffUserId: stephen.id },
    orderBy: { type: 'asc' }
  })
  
  console.log(`📋 Existing Reviews: ${reviews.length}`)
  reviews.forEach(r => {
    console.log(`   - ${r.type}: ${r.status} (due ${r.dueDate.toLocaleDateString()})`)
  })
  
  if (reviews.length === 0) {
    console.log('')
    console.log('⚠️  NO REVIEWS EXIST - Auto-create should create one!')
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

