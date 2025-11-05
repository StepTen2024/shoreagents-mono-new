# 🎨 Shore Agents UI Style Guide

**The Complete Design System for All Three Portals**  
**Last Updated:** October 30, 2025

---

## 🎯 **DESIGN PHILOSOPHY BY PORTAL**

Each portal has a **distinct personality** that matches its user needs:

| Portal | Personality | Goal |
|--------|-------------|------|
| **Staff** 🟦 | Fun, Engaging, Gamified | Make work feel fun, not like spyware |
| **Client** 🟢 | Sleek, Professional, Trustworthy | Feel big, established, reliable |
| **Management** 🟣 | Dark, Techy, Futuristic | Modern, powerful, data-driven |

---

## 🟦 **STAFF PORTAL STYLING**

### **Core Concept:** "Make Work Fun - Not Spyware!"

**Target Feeling:**
- ✨ Exciting and engaging
- 🎮 Game-like and rewarding
- 🎉 Celebrates achievements
- 🌈 Colorful and energetic
- 💪 Motivating and empowering

---

### **Color Palette:**

```css
/* Primary Colors - Vibrant & Energetic */
--staff-primary: #6366f1        /* Indigo - Main brand */
--staff-primary-dark: #4f46e5   /* Darker indigo */
--staff-secondary: #8b5cf6      /* Purple - Accent */
--staff-tertiary: #ec4899       /* Pink - Highlights */

/* Success & Positive */
--staff-success: #10b981        /* Emerald green */
--staff-celebrate: #f59e0b      /* Amber/gold */
--staff-fire: #ef4444           /* Red/fire */

/* Gradients - Everywhere! */
--staff-gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
--staff-gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%)
--staff-gradient-celebrate: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)
--staff-gradient-background: linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)

/* Background */
--staff-bg-primary: #0f172a      /* Slate 950 - Dark but not black */
--staff-bg-secondary: #1e293b    /* Slate 900 */
--staff-bg-card: #1e293b         /* Slate 900 with blur */

/* Text */
--staff-text-primary: #f8fafc    /* Almost white */
--staff-text-secondary: #cbd5e1  /* Slate 300 */
--staff-text-muted: #94a3b8      /* Slate 400 */
```

---

### **Typography:**

```css
/* Headings - Bold & Exciting */
h1 {
  font-size: 2.25rem;      /* 36px */
  font-weight: 800;        /* Extra bold */
  letter-spacing: -0.025em;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

h2 {
  font-size: 1.875rem;     /* 30px */
  font-weight: 700;
  color: #f8fafc;
}

h3 {
  font-size: 1.5rem;       /* 24px */
  font-weight: 600;
  color: #f8fafc;
}

/* Body Text */
body {
  font-size: 1rem;         /* 16px */
  font-weight: 400;
  color: #cbd5e1;
  line-height: 1.6;
}

/* Small Text */
.text-sm {
  font-size: 0.875rem;     /* 14px */
  color: #94a3b8;
}
```

---

### **Components - Staff Portal:**

#### **Cards:**
```css
.staff-card {
  background: rgba(30, 41, 59, 0.8);  /* Slate 900 with transparency */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 1.5rem;              /* 24px - Extra rounded */
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.staff-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 40px rgba(100, 116, 139, 0.4);
  border-color: rgba(139, 92, 246, 0.5);
}
```

#### **Stat Cards (With Icons):**
```css
.staff-stat-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 1.5rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.staff-stat-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
  animation: pulse 3s ease-in-out infinite;
}

.staff-stat-card .icon {
  font-size: 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: transform 0.3s ease;
}

.staff-stat-card:hover .icon {
  transform: rotate(12deg) scale(1.2);
}
```

#### **Buttons:**
```css
.staff-button-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.staff-button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.staff-button-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  /* Same styling as primary */
}
```

#### **Badges (Achievements, Stats):**
```css
.staff-badge-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 9999px;  /* Full rounded */
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

.staff-badge-fire {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  /* Same structure */
}

.staff-badge-celebrate {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  /* Same structure */
}
```

#### **Tabs:**
```css
.staff-tab-container {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 1rem;
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

.staff-tab {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  transition: all 0.3s ease;
  cursor: pointer;
}

.staff-tab-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
}

.staff-tab:hover:not(.staff-tab-active) {
  background: rgba(139, 92, 246, 0.1);
  color: #cbd5e1;
}
```

#### **Profile Header (Cover + Avatar):**
```css
.staff-cover {
  height: 16rem;  /* 256px */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.staff-cover::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 50%);
  animation: pulse 4s ease-in-out infinite;
}

.staff-avatar {
  width: 8rem;    /* 128px */
  height: 8rem;
  border: 4px solid #0f172a;
  border-radius: 9999px;
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.5);
  transition: all 0.3s ease;
}

.staff-avatar:hover {
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 0 40px rgba(139, 92, 246, 0.7);
}
```

---

### **Animations - Staff Portal:**

```css
/* Pulse (for badges, stats) */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.02);
  }
}

/* Glow (for buttons, success states) */
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.7);
  }
}

/* Bounce (for achievements) */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Confetti (for celebrations) */
@keyframes confetti {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
```

---

### **Emojis - Use Everywhere!**

```typescript
// Staff portal should use emojis liberally
const staffEmojis = {
  success: '🎉',
  fire: '🔥',
  celebrate: '⭐',
  rocket: '🚀',
  clock: '⏰',
  calendar: '📅',
  trophy: '🏆',
  medal: '🥇',
  star: '⭐',
  lightning: '⚡',
  heart: '❤️',
  thumbsUp: '👍',
  wave: '👋',
  coffee: '☕',
  party: '🎊'
}
```

---

## 🟢 **CLIENT PORTAL STYLING**

### **Core Concept:** "Sleek, Professional, Trustworthy - Feel BIG!"

**Target Feeling:**
- 💼 Professional and polished
- 🏢 Enterprise-grade
- 🛡️ Secure and trustworthy
- 📊 Data-focused
- ✨ Clean and modern

---

### **Color Palette:**

```css
/* Primary Colors - Professional Blues */
--client-primary: #3b82f6        /* Blue 500 - Trust */
--client-primary-dark: #2563eb   /* Blue 600 */
--client-secondary: #06b6d4      /* Cyan 500 - Modern */
--client-accent: #8b5cf6         /* Purple 500 - Premium */

/* Success & Status */
--client-success: #10b981        /* Emerald 500 */
--client-warning: #f59e0b        /* Amber 500 */
--client-danger: #ef4444         /* Red 500 */

/* Gradients - Subtle & Professional */
--client-gradient-primary: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)
--client-gradient-header: linear-gradient(135deg, #2563eb 0%, #0891b2 100%)
--client-gradient-card: linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)

/* Background - Clean White */
--client-bg-primary: #ffffff     /* Pure white */
--client-bg-secondary: #f9fafb   /* Gray 50 */
--client-bg-tertiary: #f3f4f6    /* Gray 100 */

/* Text - Professional Grays */
--client-text-primary: #111827   /* Gray 900 */
--client-text-secondary: #4b5563 /* Gray 600 */
--client-text-muted: #9ca3af     /* Gray 400 */

/* Borders */
--client-border: #e5e7eb         /* Gray 200 */
--client-border-focus: #3b82f6   /* Blue 500 */
```

---

### **Typography:**

```css
/* Headings - Professional & Clear */
h1 {
  font-size: 2.25rem;      /* 36px */
  font-weight: 700;        /* Bold */
  color: #111827;
  letter-spacing: -0.025em;
}

h2 {
  font-size: 1.875rem;     /* 30px */
  font-weight: 700;
  color: #111827;
}

h3 {
  font-size: 1.5rem;       /* 24px */
  font-weight: 600;
  color: #111827;
}

/* Body Text - Readable */
body {
  font-size: 1rem;         /* 16px */
  font-weight: 400;
  color: #4b5563;
  line-height: 1.6;
}

/* Small Text */
.text-sm {
  font-size: 0.875rem;     /* 14px */
  color: #6b7280;
}
```

---

### **Components - Client Portal:**

#### **Cards:**
```css
.client-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;              /* 16px - Rounded but not excessive */
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.client-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  border-color: #3b82f6;
}

.client-card-highlight {
  border-left: 4px solid #3b82f6;  /* Left accent border */
}
```

#### **Stat Cards:**
```css
.client-stat-card {
  background: linear-gradient(to bottom, white 0%, #f9fafb 100%);
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.client-stat-card .icon {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  color: white;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.client-stat-card .value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

.client-stat-card .label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}
```

#### **Buttons:**
```css
.client-button-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;  /* 8px - Professional rounding */
  border: none;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  transition: all 0.2s ease;
}

.client-button-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.client-button-secondary {
  background: white;
  color: #3b82f6;
  border: 1px solid #e5e7eb;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.client-button-secondary:hover {
  background: #f9fafb;
  border-color: #3b82f6;
}
```

#### **Badges:**
```css
.client-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.client-badge-primary {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.client-badge-success {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}
```

#### **Tabs:**
```css
.client-tab-container {
  border-bottom: 2px solid #e5e7eb;
  display: flex;
  gap: 2rem;
}

.client-tab {
  padding: 1rem 0;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.client-tab-active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.client-tab:hover:not(.client-tab-active) {
  color: #111827;
}
```

#### **Profile Header (Cover + Avatar):**
```css
.client-cover {
  height: 13rem;  /* 208px */
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  position: relative;
}

.client-avatar {
  width: 8rem;    /* 128px */
  height: 8rem;
  border: 4px solid white;
  border-radius: 9999px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
}
```

---

### **Animations - Client Portal (Subtle!):**

```css
/* Fade In (for cards) */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide In (for modals) */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## 🟣 **MANAGEMENT/ADMIN PORTAL STYLING**

### **Core Concept:** "Dark, Techy, Futuristic - Command Center!"

**Target Feeling:**
- 🌙 Dark theme (easy on eyes for long sessions)
- 💻 Tech-forward and modern
- 🚀 Futuristic and cutting-edge
- 🎮 Control panel aesthetic
- ⚡ Fast and powerful

---

### **Color Palette:**

```css
/* Primary Colors - Tech Purple/Indigo */
--admin-primary: #6366f1        /* Indigo 500 - Power */
--admin-primary-dark: #4f46e5   /* Indigo 600 */
--admin-secondary: #8b5cf6      /* Purple 500 - Tech */
--admin-accent: #a855f7         /* Purple 600 - Highlight */

/* Neon Accents */
--admin-neon-blue: #3b82f6      /* Electric blue */
--admin-neon-purple: #a855f7    /* Neon purple */
--admin-neon-pink: #ec4899      /* Hot pink */
--admin-neon-cyan: #06b6d4      /* Cyber cyan */

/* Gradients - Futuristic */
--admin-gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)
--admin-gradient-accent: linear-gradient(135deg, #a855f7 0%, #ec4899 100%)
--admin-gradient-header: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)
--admin-gradient-glow: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)

/* Background - Dark */
--admin-bg-primary: #0f172a      /* Slate 950 - Almost black */
--admin-bg-secondary: #1e293b    /* Slate 900 */
--admin-bg-card: #1e293b         /* Slate 900 */
--admin-bg-elevated: #334155     /* Slate 700 */

/* Text - Light on Dark */
--admin-text-primary: #f8fafc    /* Slate 50 - Almost white */
--admin-text-secondary: #cbd5e1  /* Slate 300 */
--admin-text-muted: #64748b      /* Slate 500 */

/* Borders - Subtle Glows */
--admin-border: rgba(100, 116, 139, 0.2)
--admin-border-glow: rgba(139, 92, 246, 0.5)
```

---

### **Typography:**

```css
/* Headings - Tech-Forward */
h1 {
  font-size: 2.25rem;      /* 36px */
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.025em;
  text-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
}

h2 {
  font-size: 1.875rem;     /* 30px */
  font-weight: 700;
  color: #f8fafc;
}

h3 {
  font-size: 1.5rem;       /* 24px */
  font-weight: 600;
  color: #cbd5e1;
}

/* Body Text */
body {
  font-size: 1rem;         /* 16px */
  font-weight: 400;
  color: #cbd5e1;
  line-height: 1.6;
}

/* Small Text */
.text-sm {
  font-size: 0.875rem;     /* 14px */
  color: #94a3b8;
}

/* Monospace (for IDs, codes) */
.mono {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.875rem;
  color: #a855f7;
  background: rgba(139, 92, 246, 0.1);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
}
```

---

### **Components - Management Portal:**

#### **Cards:**
```css
.admin-card {
  background: rgba(30, 41, 59, 0.8);  /* Slate 900 with transparency */
  backdrop-filter: blur(12px);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
}

.admin-card::before {
  content: '';
  position: absolute;
  inset: -1px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, transparent 50%);
  border-radius: inherit;
  pointer-events: none;
}

.admin-card:hover {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 40px rgba(139, 92, 246, 0.3);
}
```

#### **Stat Cards (Command Center Style):**
```css
.admin-stat-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 1rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.admin-stat-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.2) 0%, transparent 50%);
  pointer-events: none;
}

.admin-stat-card .icon {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
  animation: glow 3s ease-in-out infinite;
}
```

#### **Buttons:**
```css
.admin-button-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
  transition: all 0.3s ease;
}

.admin-button-primary:hover {
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
  transform: translateY(-2px);
}

.admin-button-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  /* Same styling */
}
```

#### **Badges (With Glow):**
```css
.admin-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 0 15px currentColor;
}

.admin-badge-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.admin-badge-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.admin-badge-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}
```

#### **Tabs (Tech Style):**
```css
.admin-tab-container {
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 0.75rem;
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
}

.admin-tab {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  color: #64748b;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.admin-tab-active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}

.admin-tab-active::before {
  content: '';
  position: absolute;
  inset: -1px;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  border-radius: inherit;
  opacity: 0.3;
  filter: blur(8px);
  z-index: -1;
}
```

#### **Profile Header (Futuristic Cover):**
```css
.admin-cover {
  height: 12rem;  /* 192px */
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  position: relative;
  overflow: hidden;
}

.admin-cover::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.4) 0%, transparent 50%),
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px);
  animation: scan 8s linear infinite;
}

@keyframes scan {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

.admin-avatar {
  width: 8rem;    /* 128px */
  height: 8rem;
  border: 4px solid #0f172a;
  border-radius: 9999px;
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.6);
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  position: relative;
}

.admin-avatar::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  padding: 4px;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: rotate 4s linear infinite;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}
```

---

### **Animations - Management Portal (High-Tech):**

```css
/* Glow Pulse */
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(139, 92, 246, 0.7);
  }
}

/* Scan Line */
@keyframes scan {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

/* Data Stream */
@keyframes dataStream {
  0% {
    opacity: 0;
    transform: translateY(-100%);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(100%);
  }
}

/* Hologram Flicker */
@keyframes flicker {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
```

---

## 📱 **RESPONSIVE DESIGN (All Portals)**

### **Breakpoints:**

```css
/* Mobile First Approach */
--mobile: 0px       /* Default */
--tablet: 768px     /* md: */
--laptop: 1024px    /* lg: */
--desktop: 1280px   /* xl: */
--wide: 1536px      /* 2xl: */
```

### **Grid Patterns:**

```css
/* Cards Grid (Responsive) */
.grid-responsive {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;                    /* Mobile: 1 column */
}

@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);       /* Tablet: 2 columns */
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);       /* Laptop: 3 columns */
  }
}

@media (min-width: 1280px) {
  .grid-responsive {
    grid-template-columns: repeat(4, 1fr);       /* Desktop: 4 columns */
  }
}
```

---

## 🎯 **CONSISTENCY RULES**

### **Spacing Scale:**

```css
--space-xs: 0.25rem    /* 4px */
--space-sm: 0.5rem     /* 8px */
--space-md: 1rem       /* 16px */
--space-lg: 1.5rem     /* 24px */
--space-xl: 2rem       /* 32px */
--space-2xl: 3rem      /* 48px */
```

### **Border Radius Scale:**

```css
--radius-sm: 0.375rem  /* 6px */
--radius-md: 0.5rem    /* 8px */
--radius-lg: 0.75rem   /* 12px */
--radius-xl: 1rem      /* 16px */
--radius-2xl: 1.5rem   /* 24px */
--radius-full: 9999px  /* Full circle */
```

### **Shadow Scale:**

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

---

## 📊 **SUMMARY COMPARISON**

| Aspect | Staff 🟦 | Client 🟢 | Management 🟣 |
|--------|----------|-----------|---------------|
| **Theme** | Dark + Vibrant | Light + Professional | Dark + Futuristic |
| **Primary Color** | Indigo/Purple | Blue/Cyan | Indigo/Purple |
| **Background** | Slate 950 | White | Slate 950 |
| **Border Radius** | 1.5rem (Extra rounded) | 1rem (Rounded) | 1rem (Sharp) |
| **Shadows** | Large + Colorful | Subtle + Gray | Large + Glowing |
| **Animations** | Bounce, Pulse, Confetti | Fade, Slide (subtle) | Glow, Scan, Data |
| **Emojis** | Everywhere! 🎉 | Rarely | Rarely |
| **Font Weight** | 600-800 (Bold) | 400-700 (Medium) | 600-700 (Bold) |
| **Gradients** | Vibrant | Professional | Neon/Tech |
| **Feeling** | Fun, Gamified | Trust, Professional | Power, Control |

---

## 🎨 **IMPLEMENTATION CHECKLIST**

### **For Each Page:**

- [ ] Apply correct color palette for portal
- [ ] Use appropriate typography scale
- [ ] Implement correct card styling
- [ ] Add portal-specific animations
- [ ] Use correct button styles
- [ ] Apply proper spacing (use scale)
- [ ] Implement responsive grid
- [ ] Test on mobile/tablet/desktop
- [ ] Add loading states (match theme)
- [ ] Add error states (match theme)
- [ ] Add empty states (match theme)

---

## 🚀 **NEXT STEPS**

1. ✅ **Style Guide Complete** - This document!
2. ⏭️ **Apply to All Pages** - Use this guide for consistency
3. ⏭️ **Create Component Library** - Build reusable components per portal
4. ⏭️ **Document Components** - Create component examples
5. ⏭️ **Test Across Portals** - Ensure each feels distinct

---

**Last Updated:** October 30, 2025  
**Version:** 1.0  
**Status:** ✅ **COMPLETE STYLE GUIDE - READY TO IMPLEMENT!**

