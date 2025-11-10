# 🎨 STAFF UPLOAD PRELOADER - CONSISTENCY GUIDE

## 📦 Component Location
`/components/uploads/staff-upload-preloader.tsx`

## 🎯 Purpose
**Consistent upload UI for ALL staff image uploads across the platform**

Use this component for:
- ✅ Ticket attachments
- ✅ Onboarding documents
- ✅ Profile pictures
- ✅ Cover photos
- ✅ Any staff file uploads

---

## 🚀 Usage Example

```tsx
import StaffUploadPreloader from "@/components/uploads/staff-upload-preloader"

// In your component
const [uploading, setUploading] = useState(false)
const [files, setFiles] = useState<File[]>([])

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    setFiles(Array.from(e.target.files))
  }
}

const handleRemove = (index: number) => {
  setFiles(files.filter((_, i) => i !== index))
}

// Render
<StaffUploadPreloader
  uploading={uploading}
  files={files}
  maxFiles={5}
  onFileChange={handleFileChange}
  onRemove={handleRemove}
/>
```

---

## 🎨 Visual States

### 1. 📤 EMPTY (Ready to Upload)
- Upload icon
- "Click to upload images"
- File requirements

### 2. ⬆️ UPLOADING (In Progress)
- Spinning loader
- "⬆️ Uploading images..."
- Progress bar animation
- File count display

### 3. ✅ UPLOADED (Complete)
- Image thumbnails (3 columns)
- Remove buttons (hover)
- "Click to add more"
- File count (X/5)

---

## 🎨 Design Tokens

### Colors
- Primary: Indigo/Purple gradient
- Background: `slate-800/30`
- Border: `indigo-400/50`
- Hover: `indigo-400/70`

### Animations
- Fade in: `animate-in fade-in duration-300`
- Spinner: `animate-spin`
- Pulse: `animate-pulse`
- Hover scale: `group-hover:scale-110`

### Spacing
- Container: `p-8`
- Icon size: `h-12 w-12`
- Spinner: `h-16 w-16`

---

## ⚙️ Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `uploading` | `boolean` | - | **Required.** Upload in progress state |
| `files` | `File[]` | - | **Required.** Array of selected files |
| `fileCount` | `number` | `files.length` | Override file count display |
| `maxFiles` | `number` | `5` | Maximum allowed files |
| `onFileChange` | `function` | - | File input change handler |
| `onRemove` | `function` | - | Remove file handler |
| `accept` | `string` | `"image/*"` | File type filter |
| `multiple` | `boolean` | `true` | Allow multiple files |
| `disabled` | `boolean` | `false` | Disable input |

---

## 🔄 Integration Checklist

When adding uploads to a new page:

- [ ] Import `StaffUploadPreloader`
- [ ] Add `uploading` state
- [ ] Add `files` state (File[])
- [ ] Create `handleFileChange` function
- [ ] Create `handleRemove` function
- [ ] Pass all required props
- [ ] Test all 3 states (empty, uploading, uploaded)
- [ ] Ensure consistent indigo/purple theme

---

## 🎯 Consistency Benefits

✅ **Same UX everywhere** - Staff see familiar upload flow  
✅ **Maintainable** - One component to update  
✅ **Accessible** - Proper loading states  
✅ **Beautiful** - Smooth animations & clear feedback  

---

## 📝 Notes

- Always show file count during upload
- Disable during upload to prevent double submission
- Use gradient progress bar for visual feedback
- Keep indigo/purple theme for staff branding

