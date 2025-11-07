import { supabaseAdmin } from '@/lib/supabase'

export async function uploadCompanyFile(
  file: File,
  companyId: string,
  type: 'logo' | 'cover' | 'asset'
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const fileName = `company_${timestamp}.${fileExt}`
  
  let folder: string
  if (type === 'logo') {
    folder = `company_logo/${companyId}`
  } else if (type === 'cover') {
    folder = `company_cover/${companyId}`
  } else {
    folder = `company_asset/${companyId}`
  }
  
  const filePath = `${folder}/${fileName}`

  const { data, error } = await supabaseAdmin.storage
    .from('company')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('company')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function deleteCompanyFile(fileUrl: string): Promise<void> {
  try {
    // Extract path from URL
    const urlParts = fileUrl.split('/storage/v1/object/public/company/')
    if (urlParts.length < 2) {
      console.warn('Invalid file URL format:', fileUrl)
      return
    }

    const filePath = urlParts[1]
    console.log('Attempting to delete file:', filePath)

    const { error } = await supabase.storage
      .from('company')
      .remove([filePath])

    if (error) {
      console.error('Failed to delete file:', error)
      throw error
    } else {
      console.log('File deleted successfully:', filePath)
    }
  } catch (error) {
    console.error('Error in deleteCompanyFile:', error)
    throw error
  }
}

export async function uploadClientFile(
  file: File,
  clientUserId: string,
  type: 'avatar' | 'cover'
): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const folder = type === 'avatar' ? 'client_avatar' : 'client_cover'
  const fileName = type === 'avatar' ? `avatar_${timestamp}.${fileExt}` : `cover_${timestamp}.${fileExt}`
  const filePath = `${folder}/${clientUserId}/${fileName}`

  const { data, error } = await supabaseAdmin.storage
    .from('client')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('client')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function deleteClientFile(fileUrl: string): Promise<void> {
  // Extract path from URL
  const urlParts = fileUrl.split('/storage/v1/object/public/client/')
  if (urlParts.length < 2) return

  const filePath = urlParts[1]

  const { error } = await supabase.storage
    .from('client')
    .remove([filePath])

  if (error) {
    console.error('Failed to delete file:', error)
  }
}

