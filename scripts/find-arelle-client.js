// Find which client user manages Arelle
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const companyId = 'd31e6a60-9b0c-4aaf-a8be-6308c4f7afc4'
  
  console.log('🔍 Finding Arelle\'s client...')
  console.log('   Company ID:', companyId)
  console.log('')
  
  // Find the company
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  })
  
  if (!company) {
    console.log('❌ Company not found!')
    return
  }
  
  console.log('✅ Company:', company.companyName)
  console.log('')
  
  // Find client users for this company
  const clients = await prisma.client_users.findMany({
    where: { companyId }
  })
  
  if (clients.length === 0) {
    console.log('❌ No client users found for this company!')
    return
  }
  
  console.log(`✅ Found ${clients.length} client user(s):`)
  console.log('')
  
  clients.forEach((client, i) => {
    console.log(`Client ${i + 1}:`)
    console.log(`   Name: ${client.name}`)
    console.log(`   Email: ${client.email}`)
    console.log(`   Role: ${client.role}`)
    console.log('')
  })
  
  console.log('🎯 To test Performance Reviews:')
  console.log('   1. Login as:', clients[0].email)
  console.log('   2. Go to: /client/performance-reviews')
  console.log('   3. Click "Auto-Create Reviews" button')
  console.log('   4. This will create a Month 1 review for Arelle!')
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

