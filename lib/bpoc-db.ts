/**
 * BPOC Database Connection
 * 
 * Connects to the external BPOC candidate database on Railway
 * Used to fetch candidate profiles, resumes, and assessment results
 */

import { Pool, PoolClient, QueryResult } from 'pg'

// Create connection pool
const pool = new Pool({
  connectionString: process.env.BPOC_DATABASE_URL,
  max: 10, // Maximum number of clients
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 30000, // Timeout after 30 seconds if can't connect
  statement_timeout: 30000, // Query timeout 30 seconds
  query_timeout: 30000, // Query timeout 30 seconds
})

// Log connection status
pool.on('connect', () => {
  console.log('✅ Connected to BPOC database')
})

pool.on('error', (err) => {
  console.error('❌ BPOC database error:', err)
})

/**
 * Execute a query on the BPOC database
 * @param sql SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export async function queryBPOC<T = any>(
  sql: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const client: PoolClient = await pool.connect()
  try {
    const result = await client.query<T>(sql, params)
    return result
  } catch (error) {
    console.error('❌ BPOC query error:', error)
    throw error
  } finally {
    client.release()
  }
}

/**
 * Get all candidates with resumes (anonymized for clients)
 * @param filters Optional filters for skills, location, experience, etc.
 * @returns Array of candidate profiles
 */
export async function getCandidates(filters?: {
  skills?: string[]
  location?: string
  minExperience?: number
  discType?: string
  culturalFitMin?: number
  searchQuery?: string
}) {
  let sql = `
    SELECT 
      u.id,
      u.first_name,
      u.avatar_url,
      u.bio,
      u.position,
      u.location_city,
      u.location_country,
      re.resume_data,
      bcr.result_json as cultural_results,
      dps.latest_primary_type,
      dps.latest_secondary_type,
      dps.latest_d_score,
      dps.latest_i_score,
      dps.latest_s_score,
      dps.latest_c_score,
      dps.latest_ai_assessment,
      ths.latest_wpm as typing_wpm,
      ths.latest_accuracy as typing_accuracy,
      uls.overall_score as leaderboard_score
    FROM users u
    LEFT JOIN resumes_extracted re ON u.id = re.user_id
    LEFT JOIN bpoc_cultural_results bcr ON u.id = bcr.user_id
    LEFT JOIN disc_personality_stats dps ON u.id = dps.user_id
    LEFT JOIN typing_hero_stats ths ON u.id = ths.user_id
    LEFT JOIN user_leaderboard_scores uls ON u.id = uls.user_id
    WHERE re.resume_data IS NOT NULL
  `

  const params: any[] = []
  let paramIndex = 1

  // Filter by skills
  if (filters?.skills && filters.skills.length > 0) {
    sql += ` AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(re.resume_data->'skills') skill
      WHERE skill ILIKE ANY($${paramIndex})
    )`
    params.push(filters.skills.map(s => `%${s}%`))
    paramIndex++
  }

  // Filter by location
  if (filters?.location) {
    sql += ` AND (u.location_city ILIKE $${paramIndex} OR u.location_country ILIKE $${paramIndex})`
    params.push(`%${filters.location}%`)
    paramIndex++
  }

  // Filter by minimum experience (calculated from resume)
  if (filters?.minExperience && filters.minExperience > 0) {
    sql += ` AND (
      SELECT COUNT(*)
      FROM jsonb_array_elements(re.resume_data->'experience')
    ) >= $${paramIndex}`
    params.push(filters.minExperience)
    paramIndex++
  }

  // Filter by DISC type
  if (filters?.discType) {
    sql += ` AND dps.latest_primary_type = $${paramIndex}`
    params.push(filters.discType)
    paramIndex++
  }

  // Filter by cultural fit score
  if (filters?.culturalFitMin && filters.culturalFitMin > 0) {
    sql += ` AND CAST(bcr.result_json->>'overallScore' AS INTEGER) >= $${paramIndex}`
    params.push(filters.culturalFitMin)
    paramIndex++
  }

  // Search query (name, bio, position, skills)
  if (filters?.searchQuery) {
    sql += ` AND (
      u.first_name ILIKE $${paramIndex}
      OR u.bio ILIKE $${paramIndex}
      OR u.position ILIKE $${paramIndex}
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(re.resume_data->'skills') skill
        WHERE skill ILIKE $${paramIndex}
      )
    )`
    params.push(`%${filters.searchQuery}%`)
    paramIndex++
  }

  sql += ` ORDER BY uls.overall_score DESC NULLS LAST, u.created_at DESC LIMIT 100`

  const result = await queryBPOC(sql, params)
  return result.rows
}

/**
 * Get a single candidate by ID with full profile data
 * @param candidateId BPOC user ID
 * @returns Candidate full profile
 */
export async function getCandidateById(candidateId: string) {
  const sql = `
    SELECT 
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.avatar_url,
      u.bio,
      u.position,
      u.location_city,
      u.location_country,
      u.location_province,
      u.created_at,
      re.resume_data,
      re.created_at as resume_created_at,
      bcr.result_json as cultural_results,
      bcr.summary_text as cultural_summary,
      dps.latest_primary_type,
      dps.latest_secondary_type,
      dps.latest_ai_assessment,
      dps.latest_d_score as d_score,
      dps.latest_i_score as i_score,
      dps.latest_s_score as s_score,
      dps.latest_c_score as c_score,
      ths.latest_wpm as typing_wpm,
      ths.latest_accuracy as typing_accuracy,
      ths.best_wpm as typing_best_wpm,
      ths.best_accuracy as typing_best_accuracy,
      uls.overall_score as leaderboard_score,
      uls.profile_completion_score,
      uls.resume_building_score,
      uls.application_activity_score,
      air.overall_score as ai_overall_score,
      air.key_strengths as ai_key_strengths,
      air.strengths_analysis as ai_strengths_analysis,
      air.improved_summary as ai_improved_summary,
      air.salary_analysis as ai_salary_analysis,
      air.career_path as ai_career_path
    FROM users u
    LEFT JOIN resumes_extracted re ON u.id = re.user_id
    LEFT JOIN bpoc_cultural_results bcr ON u.id = bcr.user_id
    LEFT JOIN disc_personality_stats dps ON u.id = dps.user_id
    LEFT JOIN typing_hero_stats ths ON u.id = ths.user_id
    LEFT JOIN user_leaderboard_scores uls ON u.id = uls.user_id
    LEFT JOIN ai_analysis_results air ON u.id = air.user_id
    WHERE u.id = $1
  `

  const result = await queryBPOC(sql, [candidateId])
  return result.rows[0] || null
}

/**
 * Check if candidate is available for interviews
 * @param candidateId BPOC user ID
 * @returns Availability status
 */
export async function checkCandidateAvailability(candidateId: string) {
  const sql = `
    SELECT 
      u.id,
      u.first_name,
      uws.status as work_status,
      uws.available_from,
      uws.notes
    FROM users u
    LEFT JOIN user_work_status uws ON u.id = uws.user_id
    WHERE u.id = $1
  `

  const result = await queryBPOC(sql, [candidateId])
  return result.rows[0] || null
}

/**
 * Get application counts for job requests
 * @param jobRequestIds Array of job request IDs to get counts for
 * @returns Map of job_request_id -> application count
 */
export async function getApplicationCounts(jobRequestIds: string[]): Promise<Map<string, number>> {
  if (jobRequestIds.length === 0) {
    return new Map()
  }

  // BPOC uses job_id (integer) to link applications to job_requests
  const sql = `
    SELECT 
      job_id,
      COUNT(*) as application_count
    FROM applications
    WHERE job_id = ANY($1::int[])
    GROUP BY job_id
  `

  try {
    // Convert string IDs to integers for BPOC
    const jobIds = jobRequestIds.map(id => parseInt(id))
    console.log(`🔍 [BPOC] Fetching application counts for job IDs:`, jobIds)
    
    const result = await queryBPOC(sql, [jobIds])
    const countMap = new Map<string, number>()
    
    result.rows.forEach((row: any) => {
      countMap.set(row.job_id.toString(), parseInt(row.application_count))
    })
    
    console.log(`📊 [BPOC] Application counts:`, Object.fromEntries(countMap))
    return countMap
  } catch (error) {
    console.error('❌ [BPOC] Error fetching application counts:', error)
    return new Map()
  }
}

/**
 * Get applications for a specific job request
 * @param jobRequestId Job request ID
 * @returns Array of applications with candidate info
 */
export async function getApplicationsForJobRequest(jobRequestId: string) {
  console.log(`🔍 [BPOC] Fetching applications for job_id: ${jobRequestId}`)
  
  // BPOC uses job_id (integer) to link applications to job_requests
  const sql = `
    SELECT 
      a.id,
      a.job_id,
      a.user_id as candidate_id,
      a.status,
      a.created_at,
      u.first_name,
      u.last_name,
      u.email,
      u.avatar_url,
      u.position,
      u.location_city,
      u.location_country
    FROM applications a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.job_id = $1
    ORDER BY a.created_at DESC
  `

  try {
    const jobId = parseInt(jobRequestId)
    console.log(`🔍 [BPOC] Querying applications for job_id: ${jobId}`)
    
    const result = await queryBPOC(sql, [jobId])
    console.log(`📋 [BPOC] Found ${result.rows.length} applications`)
    
    if (result.rows.length > 0) {
      console.log(`📋 [BPOC] Sample application:`, {
        candidate: result.rows[0].first_name,
        position: result.rows[0].position,
        status: result.rows[0].status
      })
    }
    
    return result.rows
  } catch (error) {
    console.error(`❌ [BPOC] Error fetching applications:`, error)
    return []
  }
}

// Export pool for cleanup if needed
export { pool as bpocPool }
