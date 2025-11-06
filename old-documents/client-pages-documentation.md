# Client Pages Documentation

## Overview

This documentation covers the client profile page and company page implementations, including all features, error handling, loading states, and technical details.

## Table of Contents

1. [Client Profile Page](#client-profile-page)
2. [Company Page](#company-page)
3. [Shared Features](#shared-features)
4. [Error Handling](#error-handling)
5. [Loading States](#loading-states)
6. [File Upload System](#file-upload-system)
7. [API Endpoints](#api-endpoints)
8. [Technical Implementation](#technical-implementation)

---

## Client Profile Page

### Location
`app/client/profile/page.tsx`

### Features

#### 1. Profile Information Management
- **Personal Information**: Name, email, role (read-only)
- **Professional Information**: Position, department, direct phone, mobile phone, timezone, bio
- **Contact Information**: Direct phone, mobile phone
- **Notification Preferences**: Task creation, task completion, reviews, weekly reports

#### 2. Avatar and Cover Photo Upload
- **Avatar Upload**: Click to upload profile picture
- **Cover Photo Upload**: Click to upload cover photo
- **File Validation**: JPEG, PNG, WebP only, 5MB max
- **Automatic Deletion**: Old files are deleted when replaced
- **Loading States**: Upload progress indicators

#### 3. Independent Notification Toggles
- **Real-time Updates**: Toggle notifications without entering edit mode
- **Individual Loading**: Each toggle has its own loading state
- **Toast Notifications**: Success/error feedback for each toggle

#### 4. Professional Display
- **Icon Integration**: Each field has relevant icons
- **Visual Hierarchy**: Clear information organization
- **Empty States**: Helpful messages when no data is available

### UI Components

#### Header Section
```typescript
// Profile header with avatar, cover photo, and basic info
<div className="flex items-center justify-between">
  <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
  <Button onClick={startEditing}>Edit Profile</Button>
</div>
```

#### Information Cards
- **Account Information**: Name, email, role
- **Professional Information**: Position, department, contact details
- **Contact Information**: Phone numbers, timezone
- **Notification Preferences**: Toggle switches for each preference

---

## Company Page

### Location
`app/client/company/page.tsx`

### Features

#### 1. Company Information Management
- **Company Details**: Company name, trading name, industry, location
- **Contract Information**: Start date, account status (read-only)
- **Company Bio**: Detailed description
- **Contact Information**: Website, phone, billing email

#### 2. Logo and Cover Photo Upload
- **Company Logo**: Click to upload company logo
- **Cover Photo**: Click to upload company cover photo
- **File Validation**: JPEG, PNG, WebP only, 5MB max
- **Automatic Deletion**: Old files are deleted when replaced
- **Loading States**: Upload progress indicators

#### 3. Staff Management
- **Assigned Staff Display**: Shows all assigned staff members
- **Professional Information**: Role, location, employment status, start date
- **Status Indicators**: Active/inactive status with visual indicators
- **Empty State**: Helpful message when no staff are assigned

#### 4. Account Manager
- **Manager Information**: Name, email, avatar
- **Contact Details**: Direct contact information
- **Visual Design**: Professional card layout

### UI Components

#### Company Overview Card
```typescript
// Company header with cover photo, logo, and basic info
<Card className="overflow-hidden border-blue-200 bg-white py-0 gap-0">
  {/* Cover Photo Banner */}
  <div className="relative h-48 bg-gradient-to-br from-blue-500 to-cyan-500">
    {/* Cover photo content */}
  </div>
  
  {/* Profile Content */}
  <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
    {/* Company logo and details */}
  </div>
</Card>
```

#### Information Cards
- **Company Information**: All company details with blue theme
- **Contact Information**: Contact details with green theme
- **Account Manager**: Manager information (conditional)
- **Assigned Staff**: Staff members with purple theme

---

## Shared Features

### 1. Skeleton Loading States

#### Client Profile Skeleton
- **Header Skeleton**: Title and edit button placeholders
- **Profile Card Skeleton**: Cover photo, avatar, and details
- **Information Cards**: All sections with proper spacing
- **Professional Layout**: Matches actual content structure

#### Company Page Skeleton
- **Header Skeleton**: Title and edit button placeholders
- **Company Overview**: Cover photo, logo, and company details
- **Information Cards**: Company info and contact info
- **Account Manager**: Manager card skeleton
- **Staff Section**: Empty state skeleton

### 2. Form Validation
- **File Type Validation**: Only image files allowed
- **File Size Validation**: 5MB maximum size
- **Required Field Validation**: Proper error messages
- **Real-time Feedback**: Immediate validation feedback

### 3. Toast Notifications
- **Success Messages**: Confirmation of successful operations
- **Error Messages**: Clear error descriptions
- **Loading Messages**: Progress indicators
- **Auto-dismiss**: Automatic dismissal after 3-5 seconds

---

## Error Handling

### 1. File Upload Errors
```typescript
// File validation
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
if (!allowedTypes.includes(file.type)) {
  toast({
    title: "Invalid File Type",
    description: "Please select a JPEG, PNG, or WebP image file.",
    variant: "destructive",
    duration: 5000
  })
  return
}
```

### 2. API Error Handling
```typescript
// API response handling
if (!response.ok) {
  const errorData = await response.json()
  throw new Error(errorData.error || 'Failed to update profile')
}
```

### 3. Network Error Handling
```typescript
// Network error handling
catch (error) {
  console.error('Error updating profile:', error)
  toast({
    title: "Update Failed",
    description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
    variant: "destructive",
    duration: 5000
  })
}
```

### 4. File Deletion Errors
```typescript
// Non-blocking file deletion
try {
  await deleteClientFile(oldFileUrl)
  console.log('Old file deleted successfully')
} catch (deleteError) {
  console.warn('Failed to delete old file, proceeding with upload:', deleteError)
  // Continue with upload even if delete fails
}
```

---

## Loading States

### 1. Page Loading
- **Skeleton UI**: Comprehensive skeleton matching actual content
- **Smooth Transitions**: Fade-in animations when content loads
- **Progressive Loading**: Content appears as it becomes available

### 2. Form Loading
- **Button States**: Disabled buttons with loading spinners
- **Input States**: Disabled inputs during saving
- **Visual Feedback**: Clear loading indicators

### 3. Upload Loading
- **Upload Progress**: Real-time upload progress
- **File Validation**: Immediate validation feedback
- **Success States**: Confirmation of successful uploads

### 4. Notification Loading
- **Individual Loading**: Each toggle has its own loading state
- **Non-blocking**: Other toggles remain functional
- **Quick Feedback**: Fast response times

---

## File Upload System

### 1. Client-Side Upload
- **File Selection**: Click to select files
- **Validation**: Type and size validation
- **Progress Indicators**: Upload progress display
- **Error Handling**: Comprehensive error management

### 2. Server-Side Processing
- **Authentication**: Proper user authentication
- **File Storage**: Secure Supabase storage
- **Database Updates**: Automatic database updates
- **Old File Cleanup**: Automatic deletion of old files

### 3. File Organization
```
client/
├── client_avatar/[userId]/avatar_[timestamp].ext
└── client_cover/[userId]/cover_[timestamp].ext

company/
├── company_logo/[companyId]/company_[timestamp].ext
└── company_cover/[companyId]/company_[timestamp].ext
```

### 4. Security Features
- **Service Role Key**: Server-side operations use service role
- **File Type Validation**: Only allowed image types
- **Size Limits**: 5MB maximum file size
- **User Authentication**: Proper user verification

---

## API Endpoints

### Client Profile APIs

#### GET `/api/client/profile`
- **Purpose**: Fetch client profile data
- **Response**: Client user and profile information
- **Authentication**: Required

#### PUT `/api/client/profile`
- **Purpose**: Update client profile
- **Body**: Profile and client user data
- **Response**: Updated profile data
- **Authentication**: Required

#### POST `/api/client/upload`
- **Purpose**: Upload client files (avatar/cover)
- **Body**: FormData with file and type
- **Response**: File URL and success status
- **Authentication**: Required

#### DELETE `/api/client/delete`
- **Purpose**: Delete client files
- **Body**: File URL
- **Response**: Success status
- **Authentication**: Required

### Company APIs

#### GET `/api/client/company`
- **Purpose**: Fetch company data
- **Response**: Company information and staff
- **Authentication**: Required

#### PUT `/api/client/company`
- **Purpose**: Update company information
- **Body**: Company data
- **Response**: Updated company data
- **Authentication**: Required

#### POST `/api/client/company/upload`
- **Purpose**: Upload company files (logo/cover)
- **Body**: FormData with file and type
- **Response**: File URL and success status
- **Authentication**: Required

#### DELETE `/api/client/company/delete`
- **Purpose**: Delete company files
- **Body**: File URL
- **Response**: Success status
- **Authentication**: Required

---

## Technical Implementation

### 1. State Management
```typescript
// Profile page state
const [data, setData] = useState<ProfileData | null>(null)
const [loading, setLoading] = useState(true)
const [editing, setEditing] = useState(false)
const [editedProfile, setEditedProfile] = useState<Partial<ClientProfile>>({})
const [editedClientUser, setEditedClientUser] = useState<Partial<ClientUser>>({})
const [uploadingAvatar, setUploadingAvatar] = useState(false)
const [uploadingCover, setUploadingCover] = useState(false)
const [notificationLoading, setNotificationLoading] = useState<string | null>(null)
const [savingProfile, setSavingProfile] = useState(false)
```

### 2. File Upload Functions
```typescript
const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // File validation
  // Delete old file
  // Upload new file
  // Update database
  // Show success/error feedback
}
```

### 3. Error Handling Patterns
```typescript
try {
  // Operation
  const response = await fetch('/api/endpoint', options)
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Operation failed')
  }
  // Success handling
} catch (error) {
  console.error('Error:', error)
  toast({
    title: "Operation Failed",
    description: error instanceof Error ? error.message : "Please try again.",
    variant: "destructive",
    duration: 5000
  })
}
```

### 4. Loading State Patterns
```typescript
// Button loading state
<Button disabled={savingProfile}>
  {savingProfile ? (
    <>
      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
      Saving...
    </>
  ) : (
    <>
      <Save className="h-4 w-4 mr-2" />
      Save Changes
    </>
  )}
</Button>
```

---

## Best Practices

### 1. User Experience
- **Immediate Feedback**: Always provide visual feedback
- **Non-blocking Operations**: Don't block the UI unnecessarily
- **Clear Error Messages**: Helpful error descriptions
- **Progressive Enhancement**: Graceful degradation

### 2. Performance
- **Optimistic Updates**: Update UI before API confirmation
- **Debounced Operations**: Prevent excessive API calls
- **Efficient Re-renders**: Minimize unnecessary re-renders
- **Lazy Loading**: Load content as needed

### 3. Security
- **Input Validation**: Validate all user inputs
- **File Type Restrictions**: Only allow safe file types
- **Size Limits**: Prevent large file uploads
- **Authentication**: Verify user permissions

### 4. Maintainability
- **Consistent Patterns**: Use consistent error handling
- **Reusable Components**: Extract common functionality
- **Clear Naming**: Use descriptive variable names
- **Documentation**: Keep documentation updated

---

## Troubleshooting

### Common Issues

#### 1. File Upload Failures
- **Check file type**: Ensure file is JPEG, PNG, or WebP
- **Check file size**: Ensure file is under 5MB
- **Check network**: Verify internet connection
- **Check permissions**: Ensure user has upload permissions

#### 2. Loading State Issues
- **Check state updates**: Ensure loading states are properly updated
- **Check error handling**: Verify error states reset loading
- **Check async operations**: Ensure proper async/await usage

#### 3. Skeleton Display Issues
- **Check content structure**: Ensure skeleton matches actual content
- **Check responsive design**: Verify skeleton works on all screen sizes
- **Check animations**: Ensure smooth pulse animations

### Debug Tips

1. **Console Logging**: Check browser console for errors
2. **Network Tab**: Monitor API requests and responses
3. **React DevTools**: Inspect component state and props
4. **Toast Messages**: Check for user feedback messages

---

## Future Enhancements

### Planned Features
1. **Bulk Operations**: Batch update multiple fields
2. **Advanced Validation**: More sophisticated validation rules
3. **Image Optimization**: Automatic image compression
4. **Offline Support**: Basic offline functionality
5. **Accessibility**: Enhanced accessibility features

### Technical Improvements
1. **Caching**: Implement client-side caching
2. **Optimistic Updates**: More sophisticated optimistic updates
3. **Error Recovery**: Automatic retry mechanisms
4. **Performance Monitoring**: Add performance tracking
5. **Testing**: Comprehensive test coverage

---

## Conclusion

The client profile and company pages provide a comprehensive solution for managing user and company information with robust error handling, excellent loading states, and a professional user experience. The implementation follows modern React patterns and provides a solid foundation for future enhancements.

