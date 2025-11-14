/**
 * Migration Script: Convert Time Fields from Minutes to Seconds
 * 
 * This script converts activeTime, idleTime, and screenTime fields
 * from minutes to seconds in the performance_metrics table.
 * 
 * Usage: node scripts/migrate-time-to-seconds.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrate() {
  console.log('🔄 Starting migration: Converting time fields from minutes to seconds...\n')
  
  try {
    // Get all metrics with time values
    const metrics = await prisma.performance_metrics.findMany({
      where: {
        OR: [
          { activeTime: { gt: 0 } },
          { idleTime: { gt: 0 } },
          { screenTime: { gt: 0 } }
        ]
      },
      select: {
        id: true,
        activeTime: true,
        idleTime: true,
        screenTime: true
      }
    })

    console.log(`📊 Found ${metrics.length} records with time data to convert\n`)

    if (metrics.length === 0) {
      console.log('✅ No data to migrate. Database is clean!')
      return
    }

    // Convert each record
    let converted = 0
    for (const metric of metrics) {
      await prisma.performance_metrics.update({
        where: { id: metric.id },
        data: {
          activeTime: metric.activeTime * 60,  // minutes → seconds
          idleTime: metric.idleTime * 60,      // minutes → seconds
          screenTime: metric.screenTime * 60   // minutes → seconds
        }
      })
      converted++
      
      if (converted % 100 === 0) {
        console.log(`   Converted ${converted}/${metrics.length} records...`)
      }
    }

    console.log(`\n✅ Successfully converted ${converted} records!`)
    console.log('\n📈 Sample of converted data:')
    
    // Show a few converted records
    const sample = await prisma.performance_metrics.findMany({
      take: 3,
      orderBy: { date: 'desc' },
      select: {
        date: true,
        activeTime: true,
        idleTime: true,
        screenTime: true
      }
    })

    sample.forEach(record => {
      console.log(`   ${record.date.toISOString().split('T')[0]}: ` +
                  `Active: ${Math.floor(record.activeTime / 60)}min, ` +
                  `Idle: ${Math.floor(record.idleTime / 60)}min, ` +
                  `Screen: ${Math.floor(record.screenTime / 60)}min`)
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n🎉 Migration complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  })

