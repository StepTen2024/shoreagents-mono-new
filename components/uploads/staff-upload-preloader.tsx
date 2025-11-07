"use client"

/**
 * STAFF UPLOAD PRELOADER
 * 
 * Consistent upload UI for ALL staff image uploads across the platform
 * Use this component for: Tickets, Onboarding, Profiles, Documents, etc.
 * 
 * States:
 * - Empty (ready to upload)
 * - Uploading (spinner + progress)
 * - Uploaded (show previews)
 */

interface StaffUploadPreloaderProps {
  uploading: boolean
  files: File[]
  fileCount?: number
  maxFiles?: number
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove?: (index: number) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
}

export default function StaffUploadPreloader({
  uploading,
  files,
  fileCount,
  maxFiles = 5,
  onFileChange,
  onRemove,
  accept = "image/*",
  multiple = true,
  disabled = false,
}: StaffUploadPreloaderProps) {
  const count = fileCount || files.length

  return (
    <label className={`group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} block`}>
      <div className="relative rounded-xl border-2 border-dashed border-indigo-400/50 bg-slate-800/30 p-8 text-center transition-all hover:border-indigo-400/70 hover:bg-slate-800/40">
        <input
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={onFileChange}
          className="hidden"
          disabled={disabled || uploading || count >= maxFiles}
        />
        
        {uploading ? (
          // ⬆️ UPLOADING STATE
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Spinner */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-200/20 border-t-indigo-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="h-6 w-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Upload Text */}
            <div className="space-y-2">
              <p className="text-lg font-bold text-indigo-400 animate-pulse">⬆️ Uploading images...</p>
              <p className="text-sm text-slate-400">{count} file{count > 1 ? 's' : ''} • Please wait</p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full max-w-xs mx-auto h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        ) : count === 0 ? (
          // 📤 EMPTY STATE
          <>
            {/* Upload Icon */}
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 transition-all group-hover:bg-indigo-500/30 group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            {/* Upload Text */}
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">Click to upload images</p>
              <p className="text-sm text-slate-400">PNG, JPG up to 5MB (max {maxFiles} files)</p>
            </div>
          </>
        ) : (
          // ✅ UPLOADED STATE (with previews)
          <>
            {/* Image Previews */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {files.map((file, index) => (
                <div key={index} className="relative group/image rounded-lg overflow-hidden bg-slate-700/50">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="h-16 w-full object-cover"
                  />
                  {onRemove && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onRemove(index)
                      }}
                      className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover/image:opacity-100"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Upload More Text */}
            <div className="space-y-1">
              {count < maxFiles && (
                <p className="text-sm font-medium text-indigo-300">Click to add more images</p>
              )}
              <p className="text-xs text-slate-400">{count}/{maxFiles} files selected</p>
            </div>
          </>
        )}
      </div>
    </label>
  )
}

