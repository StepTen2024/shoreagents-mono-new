/**
 * SUPABASE STORAGE UPLOAD HELPERS
 * Upload files to Supabase Storage buckets
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create Supabase client with service role key for server-side uploads
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Upload a task image (from AI chat) to Supabase Storage
 * Path: staff/staff_task/{staffUserId}/{timestamp}_{filename}
 */
export async function uploadTaskImage(
  base64Data: string,
  mimeType: string,
  staffUserId: string,
  originalFilename?: string
): Promise<{ url: string; path: string } | null> {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Generate filename
    const timestamp = Date.now()
    const extension = mimeType.split('/')[1] || 'png'
    const filename = originalFilename 
      ? `${timestamp}_${originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      : `${timestamp}_task_image.${extension}`
    
    // Upload path: staff/staff_task/{staffUserId}/{filename}
    const filePath = `staff_task/${staffUserId}/${filename}`
    
    console.log(`📤 [UPLOAD] Uploading to: staff/${filePath}`)
    console.log(`📤 [UPLOAD] Size: ${(buffer.length / 1024).toFixed(2)} KB`)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('staff')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false, // Don't overwrite existing files
      })
    
    if (error) {
      console.error('❌ [UPLOAD] Supabase error:', error)
      return null
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('staff')
      .getPublicUrl(filePath)
    
    console.log(`✅ [UPLOAD] Success! URL: ${urlData.publicUrl}`)
    
    return {
      url: urlData.publicUrl,
      path: filePath,
    }
  } catch (error) {
    console.error('❌ [UPLOAD] Failed to upload image:', error)
    return null
  }
}

/**
 * Delete a task image from Supabase Storage
 */
export async function deleteTaskImage(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('staff')
      .remove([filePath])
    
    if (error) {
      console.error('❌ [DELETE] Failed to delete image:', error)
      return false
    }
    
    console.log(`✅ [DELETE] Deleted: ${filePath}`)
    return true
  } catch (error) {
    console.error('❌ [DELETE] Error:', error)
    return false
  }
}

/**
 * Get signed URL for a private file (if needed in future)
 */
export async function getSignedUrl(filePath: string, expiresIn = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('staff')
      .createSignedUrl(filePath, expiresIn)
    
    if (error) {
      console.error('❌ [SIGNED-URL] Failed:', error)
      return null
    }
    
    return data.signedUrl
  } catch (error) {
    console.error('❌ [SIGNED-URL] Error:', error)
    return null
  }
}
