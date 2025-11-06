# Client Ticketing System - Light Theme & Image Upload Fix

## Issues Fixed

### 1. ✅ **Dark Theme Modal**
**Problem:** The ticket detail modal was using a dark theme (`bg-slate-900`, dark text colors) which made it difficult to read and see images for clients.

**Solution:** 
- Updated `TicketDetailModal` component to conditionally use light theme when `isManagement={false}`
- Changed all text colors, backgrounds, borders, and UI elements to support both dark (management) and light (client) themes
- Modal now uses:
  - **Dark theme** for management users (`isManagement={true}`)
  - **Light theme** for client users (`isManagement={false}`)

**Changes:**
- `components/tickets/ticket-detail-modal.tsx`
  - Added `isDark` variable based on `isManagement` prop
  - Updated all className conditionals to use `isDark ? "dark-class" : "light-class"` pattern
  - Main container: White background with gray border for clients
  - Text: Gray-900 for titles, Gray-700 for body text
  - Inputs: White background with blue focus borders
  - Responses: Color-coded with light backgrounds (purple/green/blue with appropriate text colors)

### 2. ✅ **Image Upload Not Working for Clients**
**Problem:** When clients tried to upload images to ticket responses, the upload failed with 404 error because the API endpoint only supported staff and management users.

**Solution:**
- Updated `/api/tickets/attachments/route.ts` to support client users
- Added client user lookup and authentication check
- Updated bucket and folder logic to use "client" bucket and "client_ticket" folder for client uploads
- Fixed user ID to use `session.user.id` (auth user ID) instead of Prisma user ID to match Supabase storage policies

**Changes:**
- `app/api/tickets/attachments/route.ts`
  - Added `clientUser` lookup from database
  - Updated validation to include `clientUser` in the check
  - Updated bucket logic: `staffUser ? "staff" : managementUser ? "management" : "client"`
  - Updated folder logic: `staffUser ? "staff_ticket" : managementUser ? "management_ticket" : "client_ticket"`
  - Changed `userId` to use `session.user.id` (auth user ID) to match Supabase RLS policies

### 3. ✅ **Image Display in Modal**
**Problem:** Images weren't visible in the dark-themed modal.

**Solution:**
- Updated image borders to have proper contrast in light theme
- Ticket attachments: Use `border-2 border-gray-200` for light theme
- Response attachments: Use `border-2 border-gray-200 hover:border-blue-400` for light theme
- Images now properly visible with clear borders in both themes

## Files Modified

1. **components/tickets/ticket-detail-modal.tsx**
   - Added light/dark theme conditional styling throughout
   - Updated all backgrounds, text colors, borders, and interactive elements
   - ~50 className updates for theme support

2. **app/api/tickets/attachments/route.ts**
   - Added client user support
   - Fixed bucket/folder logic for client uploads
   - Fixed auth user ID usage for storage policies

## Supabase Storage Policies

The existing Supabase storage policies in `supabase-storage-policies-client-tickets.sql` already support:
- ✅ Client users uploading to `client_ticket/{auth_uid}/` folder
- ✅ Client users viewing their own attachments
- ✅ Management viewing all client attachments
- ✅ Proper RLS policies for security

## Testing

To verify the fixes:

1. **Light Theme Modal**
   - ✅ Log in as a client user
   - ✅ Navigate to Client > Tickets
   - ✅ Click on any ticket card
   - ✅ Modal should appear with white background and readable text
   - ✅ All text should be clearly visible
   - ✅ Images in attachments should have proper borders

2. **Image Upload**
   - ✅ Open a ticket modal as a client
   - ✅ Click "Add Image" button in the "Add Response" section
   - ✅ Select an image file (< 5MB)
   - ✅ File should appear in the attachment list
   - ✅ Submit the response
   - ✅ Image should upload successfully and appear in the response

3. **Image Display**
   - ✅ View a ticket with existing image attachments
   - ✅ Images should be clearly visible with proper borders
   - ✅ Clicking on images should open them in a new tab

## Color Scheme

### Client Theme (Light)
- **Background**: White (`bg-white`)
- **Text**: Gray-900 (titles), Gray-700 (body), Gray-500 (meta)
- **Borders**: Gray-200
- **Inputs**: White bg, Gray-300 border, Blue-500 focus
- **Buttons**: Blue-600 with hover states
- **Responses**:
  - Management: Purple-50 bg, Purple-700 text
  - Client: Green-50 bg, Green-700 text
  - Staff: Gray-50 bg, Gray-700 text

### Management Theme (Dark)
- **Background**: Slate-900
- **Text**: White (titles), Slate-300 (body), Slate-500 (meta)
- **Borders**: White/10 (ring)
- **Inputs**: Slate-800 bg, White text, Indigo-400 focus
- **Buttons**: Indigo-600 with hover states
- **Responses**:
  - Management: Indigo-500/10 bg, Indigo-400 text
  - Client: Green-500/10 bg, Green-400 text
  - Staff: Slate-800/50 bg, White text

## Next Steps

- ✅ Test image upload as client user
- ✅ Verify images display correctly in modal
- ✅ Confirm Supabase storage policies are applied
- ✅ Test with both client and management users to verify theme switching works

## Notes

- The modal automatically detects if the current user is management or client based on the `isManagement` prop
- The `TicketKanbanLight` component passes `isManagement={false}` for client view
- File uploads are limited to images only, max 5MB, max 3 files per response
- Storage structure: `{bucket}/{folder}/{auth_user_id}/{timestamp}_{filename}`


