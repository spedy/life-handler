# Life Handler

A Next.js application for tracking daily activities and monitoring progress with visual analytics.

## Features

- **User Authentication**: Secure login system with NextAuth.js
- **Activity Management**: Create, edit, and delete activities with customizable weights and categories
- **Daily Tracking**: Visual circular icons for each activity, with color-coded alerts for neglected tasks
- **Progress Analytics**: Charts and graphs showing activity completion by category
- **Priority Algorithm**: Smart prioritization based on activity weight and time since last completion
- **PostgreSQL Database**: Dockerized database for reliable data storage

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: Material-UI (MUI) with custom tricolor theme
- **Authentication**: NextAuth.js with credentials provider
- **Database**: PostgreSQL 16 (Docker)
- **Charts**: Recharts
- **Styling**: MUI Emotion

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

## Setup Instructions

### 1. Clone the repository

```bash
cd life-handler
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the PostgreSQL database

```bash
docker-compose up -d
```

This will:
- Start a PostgreSQL 16 database on port 5432
- Automatically create the database schema
- Insert the default user and activities

### 4. Configure environment variables

The `.env.local` file is already created with:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lifehandler
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
```

**Important**: Change `NEXTAUTH_SECRET` before deploying to production!

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Login

Use the default credentials:
- **Username**: klemen
- **Password**: ks15scss

## Application Structure

```
life-handler/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── activities/   # Activity CRUD operations
│   │   └── stats/        # Analytics and statistics
│   ├── activities/       # Activities management page
│   ├── daily/            # Daily activity tracking page
│   ├── progress/         # Progress and analytics page
│   ├── login/            # Login page
│   └── components/       # Reusable components
├── lib/
│   ├── db.ts            # Database connection
│   ├── theme.ts         # MUI theme configuration
│   └── types.ts         # TypeScript type definitions
├── docker-compose.yml   # Docker configuration
├── init.sql            # Database initialization
└── package.json
```

## Pages

### Daily (/daily)
- View all activities as circular icons grouped by category
- Click icons to log activity completion
- Visual indicators (red borders) for neglected activities (not clicked for 3+ days)
- Icons get progressively redder the longer they're neglected

### Activities (/activities)
- Manage all activities (create, edit, delete)
- Set activity name, category, and weight (1-10)
- View total clicks and last clicked date
- Weight determines priority: 10 = highest, 1 = lowest

### Progress (/progress)
- Bar chart showing activity by category (this week vs. this month)
- Pie chart showing total activity distribution
- Alert list of activities needing attention (prioritized by weight × days since click)
- Most active activities this month

## Categories

The app includes four default categories:
- **work**: Blue (#2196f3)
- **relationships**: Orange (#ff9800)
- **projects**: Green (#4caf50)
- **personal**: Purple (#9c27b0)

## Priority Algorithm

Activities are prioritized based on:
1. **Weight** (1-10): Set in the Activities page
2. **Days since last click**: Automatically tracked
3. **Priority Score**: `weight × days_since_click`

Priority levels:
- **CRITICAL**: Score ≥ 50 (red)
- **HIGH**: Score ≥ 30 (orange)
- **MEDIUM**: Score < 30 (default)

## Database Schema

### users
- id, username, password, created_at

### activities
- id, user_id, name, category, weight, created_at

### activity_logs
- id, activity_id, clicked_at

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Docker Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

## Customization

### Adding New Activities
1. Go to the Activities page
2. Click "Add Activity"
3. Enter name, select category, and set weight (1-10)

### Modifying Categories
Edit `app/daily/page.tsx` and `app/progress/page.tsx` to add/modify the `categoryColors` object.

### Changing Theme Colors
Edit `lib/theme.ts` to customize the MUI theme.

## Production Deployment

1. Update `NEXTAUTH_SECRET` in environment variables
2. Update `NEXTAUTH_URL` to your production URL
3. Configure production database connection
4. Build and deploy:

```bash
npm run build
npm start
```

## License

ISC


TODO:
give me 5 best books titles on managing people
give me 5 best book titleson  business tactics
give me 5 best book titles on raising monez
give me 5 best book titles on finances strategy and tactics
give me 5 best book titles on online marketing
give me 5 best book titles on communication with people and negotiation
give me 5 best book titles on raising reschoolers
give me 5 best book titles on raising junior school kids
give me 5 best book titles on how to handle a large family along with house rules and house cleaning etc.
give me 5 best book titles on logical puzzles
give me 5 best book titles on encyclopedic stuff various things
also the bible
