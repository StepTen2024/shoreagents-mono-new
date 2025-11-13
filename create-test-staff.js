// Create test staff user for regularization testing
const { PrismaClient } = require('@prisma/client')
const { randomUUID } = require('crypto')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Creating test staff user: stephen@stepten.ai')
  console.log('')

  // Get StepTen Inc company
  const company = await prisma.company.findFirst({
    where: { companyName: { contains: 'StepTen', mode: 'insensitive' } }
  })

  if (!company) {
    console.error('❌ StepTen Inc company not found!')
    process.exit(1)
  }

  console.log(`✅ Found company: ${company.companyName} (${company.id})`)

  // Calculate start date (5 months ago)
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 5)
  startDate.setHours(0, 0, 0, 0)

  console.log(`📅 Start date: ${startDate.toLocaleDateString()} (5 months ago)`)
  console.log('')

  // Check if user already exists
  const existingUser = await prisma.staff_users.findUnique({
    where: { email: 'stephen@stepten.ai' }
  })

  if (existingUser) {
    console.log('⚠️  User already exists, deleting and recreating...')
    await prisma.staff_users.delete({
      where: { id: existingUser.id }
    })
  }

  // Create staff user
  const staffUser = await prisma.staff_users.create({
    data: {
      id: randomUUID(),
      authUserId: randomUUID(), // Mock auth ID
      name: 'Stephen Test User',
      email: 'stephen@stepten.ai',
      role: 'STAFF',
      companyId: company.id,
      active: true,
      avatar: null,
      coverPhoto: null,
      updatedAt: new Date()
    }
  })

  console.log(`✅ Staff user created: ${staffUser.name}`)

  // Create staff profile
  const staffProfile = await prisma.staff_profiles.create({
    data: {
      id: randomUUID(),
      staffUserId: staffUser.id,
      currentRole: 'Full Stack Developer',
      startDate: startDate,
      salary: 45000,
      employmentStatus: 'PROBATION', // Still in probation (5 months), ready for regularization
      hmo: true,
      totalLeave: 15,
      usedLeave: 3,
      vacationUsed: 2,
      sickUsed: 1,
      timezone: 'Asia/Manila',
      phone: '+63 912 345 6789',
      location: 'Manila, Philippines',
      civilStatus: 'SINGLE',
      dateOfBirth: new Date('1995-03-15'),
      gender: 'MALE',
      daysEmployed: 150,
      lastPayIncrease: null,
      lastIncreaseAmount: null,
      updatedAt: new Date()
    }
  })

  console.log(`✅ Staff profile created`)

  // Create work schedule (6pm Philippines time = 18:00)
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  
  for (const day of daysOfWeek) {
    await prisma.work_schedules.create({
      data: {
        id: randomUUID(),
        profileId: staffProfile.id,
        dayOfWeek: day,
        startTime: '18:00', // 6pm Philippines time
        endTime: '02:00',   // 2am next day (8 hour shift)
        isWorkday: true,
        shiftType: 'NIGHT_SHIFT',
        timezone: 'Asia/Manila',
        updatedAt: new Date()
      }
    })
  }

  console.log(`✅ Work schedules created (6pm - 2am, Mon-Fri)`)

  // Create staff interests (for AI personalization)
  await prisma.staff_interests.create({
    data: {
      id: randomUUID(),
      staffUserId: staffUser.id,
      name: staffUser.name,
      favoriteFastFood: 'Jollibee - Chickenjoy',
      favoriteMovie: 'The Matrix',
      favoriteBook: 'Clean Code by Robert Martin',
      favoriteColor: 'Blue',
      favoriteMusic: 'Lo-fi beats, Electronic',
      favoriteGame: 'Portal 2',
      favoriteSeason: 'Cool dry season',
      hobby: 'Coding side projects, Gaming, Coffee brewing',
      dreamDestination: 'Japan - Tokyo',
      favoriteQuote: 'Code is poetry',
      funFact: 'Can solve a Rubiks cube in under 2 minutes',
      petName: 'Luna (cat)',
      startDate: startDate.toISOString().split('T')[0],
      client: company.companyName,
      completed: true,
      additionalInfo: 'Night owl, prefers deep work blocks. INTJ personality type.',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  console.log(`✅ Staff interests created`)

  // Create onboarding record (completed)
  await prisma.staff_onboarding.create({
    data: {
      id: randomUUID(),
      staffUserId: staffUser.id,
      personalInfoStatus: 'APPROVED',
      govIdStatus: 'APPROVED',
      documentsStatus: 'APPROVED',
      signatureStatus: 'APPROVED',
      emergencyContactStatus: 'APPROVED',
      resumeStatus: 'APPROVED',
      educationStatus: 'APPROVED',
      medicalStatus: 'APPROVED',
      dataPrivacyStatus: 'APPROVED',
      isComplete: true,
      updatedAt: new Date()
    }
  })

  console.log(`✅ Onboarding completed`)

  console.log('')
  console.log('🎉 TEST USER CREATED SUCCESSFULLY!')
  console.log('')
  console.log('📋 User Details:')
  console.log(`   Email: stephen@stepten.ai`)
  console.log(`   Name: Stephen Test User`)
  console.log(`   Position: Full Stack Developer`)
  console.log(`   Company: ${company.companyName}`)
  console.log(`   Start Date: ${startDate.toLocaleDateString()} (5 months ago)`)
  console.log(`   Status: PROBATION (eligible for Month 5 regularization review)`)
  console.log(`   Shift: 6:00 PM - 2:00 AM Manila time (Night shift)`)
  console.log(`   Days: Monday - Friday`)
  console.log('')
  console.log('✅ Ready for testing:')
  console.log('   - Month 5 performance review (regularization)')
  console.log('   - Time tracking (6pm shift)')
  console.log('   - Clock in/out')
  console.log('   - Activity tracking')
  console.log('   - AI Assistant (personalized)')
  console.log('')
  console.log('🔑 To login, you need to create this user in Supabase Auth first!')
  console.log('   Or use an existing auth user and link this staff record to it.')
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

