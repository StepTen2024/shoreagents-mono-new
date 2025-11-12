// Check if reviews exist for Arelle
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const userId = '3cca4f19-cf5c-4880-817a-67eacf97eff2' // Arelle's ID
  
  console.log('🔍 Checking reviews for Arelle...')
  console.log('')
  
  // Get Arelle's info
  const arelle = await prisma.staff_users.findUnique({
    where: { id: userId },
    include: {
      staff_profiles: true
    }
  })
  
  if (!arelle) {
    console.log('❌ Arelle not found!')
    return
  }
  
  console.log('✅ Staff Member:', arelle.name)
  console.log('   Email:', arelle.email)
  console.log('   Company ID:', arelle.companyId)
  console.log('   Start Date:', arelle.staff_profiles?.startDate || 'NOT SET')
  console.log('')
  
  // Check for reviews
  const reviews = await prisma.reviews.findMany({
    where: { staffUserId: userId },
    orderBy: { createdAt: 'desc' }
  })
  
  console.log(`📋 Found ${reviews.length} review(s):`)
  console.log('')
  
  if (reviews.length === 0) {
    console.log('❌ No reviews found!')
    console.log('')
    console.log('🎯 This means the auto-create hasn\'t run yet.')
    console.log('   The page should auto-create when you load it.')
  } else {
    reviews.forEach((review, i) => {
      console.log(`Review ${i + 1}:`)
      console.log(`   Type: ${review.type}`)
      console.log(`   Status: ${review.status}`)
      console.log(`   Due Date: ${review.dueDate}`)
      console.log(`   Reviewer: ${review.reviewer}`)
      console.log(`   Created: ${review.createdAt}`)
      console.log('')
    })
  }
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
