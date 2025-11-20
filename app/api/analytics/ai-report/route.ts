import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { calculateEnhancedProductivityScore, getProductivityRating, formatTime } from '@/lib/productivity-score'
import { analyzeWorkFocus } from '@/lib/productivity-categories'

// Get API key
function getApiKey() {
  return (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY)?.trim()
}

/**
 * POST /api/analytics/ai-report
 * Generate AI-powered productivity report for a staff member
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = getApiKey()
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'AI service not configured',
        details: 'API key is missing'
      }, { status: 500 })
    }

    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { staffId, days = 7 } = await request.json()

    if (!staffId) {
      return NextResponse.json({ error: 'staffId is required' }, { status: 400 })
    }

    console.log('🤖 [AI Report] Generating productivity report...')
    console.log(`   Staff ID: ${staffId}`)
    console.log(`   Period: ${days} days`)

    // Verify access (client can only see their own staff)
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: { company: true }
    })

    if (!clientUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get staff user and verify they belong to this client's company
    const staffUser = await prisma.staff_users.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true,
        staff_profiles: {
          select: {
            currentRole: true,
            daysEmployed: true,
            timezone: true
          }
        }
      }
    })

    if (!staffUser || staffUser.companyId !== clientUser.companyId) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Get performance metrics for the period
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const metrics = await prisma.performance_metrics.findMany({
      where: {
        staffUserId: staffId,
        shiftDate: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        shiftDate: 'desc'
      }
    })

    console.log(`📊 [AI Report] Found ${metrics.length} metrics records`)

    if (metrics.length === 0) {
      console.log(`❌ [AI Report] No metrics found for ${staffUser.name} (${staffId})`)
      console.log(`   Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`)
      return NextResponse.json({ 
        error: 'No data available',
        message: `No performance data found for ${staffUser.name} in the last ${days} days.`
      }, { status: 404 })
    }

    // Aggregate metrics
    const aggregated = {
      mouseMovements: metrics.reduce((sum, m) => sum + m.mouseMovements, 0),
      mouseClicks: metrics.reduce((sum, m) => sum + m.mouseClicks, 0),
      keystrokes: metrics.reduce((sum, m) => sum + m.keystrokes, 0),
      activeTime: metrics.reduce((sum, m) => sum + m.activeTime, 0),
      idleTime: metrics.reduce((sum, m) => sum + m.idleTime, 0),
      screenTime: metrics.reduce((sum, m) => sum + m.screenTime, 0),
      downloads: metrics.reduce((sum, m) => sum + m.downloads, 0),
      uploads: metrics.reduce((sum, m) => sum + m.uploads, 0),
      bandwidth: metrics.reduce((sum, m) => sum + m.bandwidth, 0),
      clipboardActions: metrics.reduce((sum, m) => sum + m.clipboardActions, 0),
      urlsVisited: metrics.reduce((sum, m) => sum + m.urlsVisited, 0),
      tabsSwitched: metrics.reduce((sum, m) => sum + m.tabsSwitched, 0),
      applicationsUsed: [] as string[],
      visitedUrls: [] as string[]
    }

    // Collect all applications and URLs
    const allApps = new Set<string>()
    const allUrls = new Set<string>()
    
    metrics.forEach(metric => {
      if (metric.applicationsused && Array.isArray(metric.applicationsused)) {
        metric.applicationsused.forEach((app: any) => {
          if (typeof app === 'string') {
            allApps.add(app)
          } else if (app && typeof app.name === 'string') {
            allApps.add(app.name)
          }
        })
      }
      
      if (metric.visitedurls && Array.isArray(metric.visitedurls)) {
        metric.visitedurls.forEach((urlData: any) => {
          if (typeof urlData === 'string') {
            allUrls.add(urlData)
          } else if (urlData && typeof urlData.url === 'string') {
            allUrls.add(urlData.url)
          }
        })
      }
    })

    aggregated.applicationsUsed = Array.from(allApps)
    aggregated.visitedUrls = Array.from(allUrls)

    // Calculate enhanced productivity score
    const productivityAnalysis = calculateEnhancedProductivityScore(aggregated)
    const rating = getProductivityRating(productivityAnalysis.overallScore)
    const workFocus = analyzeWorkFocus(aggregated.applicationsUsed, aggregated.visitedUrls)

    console.log(`📊 [AI Report] Productivity Score: ${productivityAnalysis.overallScore}/100`)
    console.log(`📊 [AI Report] Apps: ${aggregated.applicationsUsed.length}, URLs: ${aggregated.visitedUrls.length}`)

    // Prepare data summary for Claude
    const dataSummary = `
STAFF MEMBER: ${staffUser.name}
ROLE: ${staffUser.staff_profiles?.currentRole || 'Not specified'}
ANALYSIS PERIOD: ${days} days (${metrics.length} shift records)

📊 PRODUCTIVITY SCORE: ${productivityAnalysis.overallScore}/100 (${rating.rating})

TIME EFFICIENCY (${productivityAnalysis.timeEfficiencyScore}/30 points):
- Active Time: ${formatTime(aggregated.activeTime)} (${productivityAnalysis.timeEfficiency.activePercentage}%)
- Idle Time: ${formatTime(aggregated.idleTime)} (${productivityAnalysis.timeEfficiency.idlePercentage}%)
- Screen Time: ${formatTime(aggregated.screenTime)}
- Rating: ${productivityAnalysis.timeEfficiency.rating.toUpperCase()}

ACTIVITY LEVEL (${productivityAnalysis.activityLevelScore}/20 points):
- Mouse Movements: ${aggregated.mouseMovements.toLocaleString()}
- Mouse Clicks: ${aggregated.mouseClicks.toLocaleString()}
- Keystrokes: ${aggregated.keystrokes.toLocaleString()}
- Total Interactions: ${productivityAnalysis.activityLevel.totalInteractions.toLocaleString()}
- Rating: ${productivityAnalysis.activityLevel.rating.toUpperCase()}

WORK FOCUS (${productivityAnalysis.workFocusScore}/25 points):
- Productive Apps: ${workFocus.productiveApps.length} (${workFocus.productivePercentage}% of all apps)
- Distraction Apps: ${workFocus.distractionApps.length} (${workFocus.distractionPercentage}% of all apps)
- Productive URLs: ${workFocus.productiveUrls.length} 
- Distraction URLs: ${workFocus.distractionUrls.length}

TASK COMPLETION (${productivityAnalysis.taskCompletionScore}/15 points):
- Downloads: ${aggregated.downloads}
- Uploads: ${aggregated.uploads}
- Clipboard Actions: ${aggregated.clipboardActions}
- Rating: ${productivityAnalysis.taskCompletion.rating.toUpperCase()}

DISTRACTIONS (Penalty: -${productivityAnalysis.distractionPenalty} points):
- Social Media Detected: ${productivityAnalysis.distractions.socialMediaDetected ? 'YES' : 'NO'}
- Entertainment Detected: ${productivityAnalysis.distractions.entertainmentDetected ? 'YES' : 'NO'}
- Excessive Tab Switching: ${productivityAnalysis.distractions.excessiveTabSwitching ? 'YES' : 'NO'}
- Total Distractions: ${productivityAnalysis.distractions.distractionCount}

TOP PRODUCTIVE APPLICATIONS:
${workFocus.productiveApps.slice(0, 10).map(app => `- ${app}`).join('\n') || 'None detected'}

TOP DISTRACTION SOURCES:
${workFocus.distractionApps.concat(workFocus.distractionUrls).slice(0, 10).map(item => `- ${item}`).join('\n') || 'None detected'}
`.trim()

    // System prompt for productivity analyst
    const systemPrompt = `You are an expert productivity analyst for a BPO (Business Process Outsourcing) company. Your role is to analyze staff performance data and provide actionable insights to clients (business owners who have hired remote staff).

ANALYSIS GOALS:
- Provide clear, honest assessment of productivity
- Identify strengths and areas for improvement
- Give specific, actionable recommendations
- Highlight patterns and trends
- Be professional but conversational

TONE:
- Professional yet friendly
- Data-driven but human
- Constructive, not punitive
- Focused on improvement and growth

FORMAT YOUR RESPONSE AS:
1. PERFORMANCE OVERVIEW (2-3 sentences summarizing overall performance)
2. STRENGTHS (bullet points of what's working well)
3. AREAS FOR IMPROVEMENT (bullet points with specific issues)
4. PATTERNS & TRENDS (insights from the data)
5. PERSONALIZED RECOMMENDATIONS (3-5 specific, actionable suggestions)
6. OUTLOOK (positive forward-looking statement)

Keep the report concise (300-500 words), scannable, and actionable.`

    const userPrompt = `Please analyze this staff member's productivity data and provide a comprehensive report:

${dataSummary}

Generate a professional productivity analysis report that the client can use to understand their staff member's performance and make informed decisions.`

    console.log('🤖 [AI Report] Calling Claude for analysis...')

    // Call Claude API
    const anthropic = new Anthropic({ apiKey })
    
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    })

    const aiReport = response.content[0].type === 'text' 
      ? response.content[0].text 
      : 'Unable to generate report'

    console.log('✅ [AI Report] Report generated successfully')

    return NextResponse.json({
      success: true,
      report: aiReport,
      data: {
        staffName: staffUser.name,
        period: `${days} days`,
        recordCount: metrics.length,
        productivityScore: productivityAnalysis.overallScore,
        rating: rating.rating,
        breakdown: productivityAnalysis
      }
    })

  } catch (error) {
    console.error('❌ [AI Report] Error:', error)
    console.error('❌ [AI Report] Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json(
      { 
        error: 'Failed to generate AI report',
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

