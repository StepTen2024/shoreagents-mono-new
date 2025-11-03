# 🚀 QUICK START GUIDE

## Prerequisites
- Node.js 18+ 
- pnpm installed
- Supabase account

## Installation

```bash
# Navigate to project
cd "/Users/stephenatcheler/Desktop/Electron - Staff/gamified-dashboard (1)"

# Install dependencies
pnpm install

# Set up environment variables
cp ENV_TEMPLATE.txt .env
# Edit .env with your Supabase credentials

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Seed database with test data
pnpm prisma db seed
```

## Development

```bash
# Start dev server
pnpm dev

# Open browser
http://localhost:3000
```

## Login

**Test User Credentials:**
```
Email: maria.santos@techcorp.com
Password: password123
```

## Project Structure

```
app/
├── api/           # 12 API routes (all working ✅)
├── (pages)/       # 11 frontend pages (all working ✅)
└── layout.tsx     # Root layout

components/        # 71 components
lib/              # Utilities, Prisma, Auth
prisma/           # Database schema & migrations
```

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - Login/logout

### User & Profile  
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Breaks
- `GET /api/breaks?date=YYYY-MM-DD` - Get breaks
- `POST /api/breaks` - Start break
- `PUT /api/breaks/[id]` - End break

### Performance
- `GET /api/performance` - Get metrics
- `POST /api/performance` - Log metric

### Reviews
- `GET /api/reviews` - Get reviews
- `POST /api/reviews/[id]/acknowledge` - Acknowledge

### Tickets
- `GET /api/tickets` - Get tickets
- `POST /api/tickets` - Create ticket

### Activity
- `GET /api/posts` - Get posts
- `POST /api/posts` - Create post
- `GET /api/activity` - Activity feed

### Team & Leaderboard
- `GET /api/team` - Get team members
- `GET /api/leaderboard` - Get rankings

## Useful Commands

```bash
# View database in Prisma Studio
pnpm prisma studio

# Reset database (⚠️ Deletes all data)
pnpm prisma migrate reset

# Generate Prisma client after schema changes
pnpm prisma generate

# Create new migration
pnpm prisma migrate dev --name migration_name

# Build for production
pnpm build

# Start production server
pnpm start
```

## Troubleshooting

### Port 3000 already in use
```bash
lsof -ti:3000 | xargs kill -9
```

### Database connection issues
- Check `.env` file has correct Supabase credentials
- Ensure DATABASE_URL and DIRECT_URL are set

### Prisma errors
```bash
pnpm prisma generate
pnpm prisma migrate dev
```

### Cache issues
```bash
rm -rf .next
pnpm dev
```

## Documentation

- **[BACKEND_COMPLETE.md](./BACKEND_COMPLETE.md)** - Full completion report
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Detailed project status
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history
- **[ENV_TEMPLATE.txt](./ENV_TEMPLATE.txt)** - Environment variables template

## Support

**Project Location:**
```
/Users/stephenatcheler/Desktop/Electron - Staff/gamified-dashboard (1)
```

**Status:** ✅ 100% Complete - Production Ready  
**Version:** 1.0.0  
**Date:** January 10, 2025

