// Check reviews for Stephen Test User
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking Stephen Test User reviews...\n')
  
  // Get Stephen's user
  const stephen = await prisma.staff_users.findUnique({
    where: { email: 'stephen@stepten.ai' },
    include: {
      staff_profiles: true,
      company: true
    }
  })
  
  if (!stephen) {
    console.log('❌ Stephen Test User not found!')
    return
  }
  
  console.log(`✅ Found: ${stephen.name}`)
  console.log(`   Email: ${stephen.email}`)
  console.log(`   Company: ${stephen.company?.companyName}`)
  console.log(`   Start Date: ${stephen.staff_profiles?.startDate?.toLocaleDateString()}`)
  
  if (stephen.staff_profiles?.startDate) {
    const startDate = stephen.staff_profiles.startDate
    const now = new Date()
    const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24))
    console.log(`   Days Since Start: ${daysSinceStart}`)
  }
  
  console.log('')
  
  // Get reviews
  const reviews = await prisma.reviews.findMany({
    where: { staffUserId: stephen.id }
  })
  
  console.log(`📋 Reviews Found: ${reviews.length}`)
  
  if (reviews.length === 0) {
    console.log('')
    console.log('⚠️  NO REVIEWS EXIST!')
    console.log('')
    console.log('💡 REVIEWS SHOULD BE AUTO-CREATED WHEN:')
    console.log('   1. Client visits /client/performance-reviews')
    console.log('   2. Page calls /api/client/performance-reviews/auto-create')
    console.log('   3. Auto-create checks staff start dates')
    console.log('   4. Creates reviews 7 days before due date')
    console.log('')
    console.log('📅 REVIEW TIMELINE:')
    console.log('   - Month 1: Due at day 30 (create at day 23)')
    console.log('   - Month 3: Due at day 90 (create at day 83)')
    console.log('   - Month 5: Due at day 150 (create at day 143)')
    console.log('   - Recurring: Every 180 days after regularization')
    console.log('')
    console.log(`   Stephen is at day ${Math.floor((new Date() - stephen.staff_profiles?.startDate) / (1000 * 60 * 60 * 24))}`)
    console.log(`   Month 5 review should create at day 143`)
    console.log(`   Month 5 review should be due at day 150`)
  } else {
    reviews.forEach(review => {
      console.log(`\n   📄 ${review.type}`)
      console.log(`      Status: ${review.status}`)
      console.log(`      Due: ${review.dueDate?.toLocaleDateString()}`)
      console.log(`      Client: ${review.client}`)
    })
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

