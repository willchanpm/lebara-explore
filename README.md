# L Street Explorer

A lunch discovery app for the L Street area, built with Next.js, TypeScript, and Supabase.

## Features

- **Lunch Roulette**: Random restaurant selection with filters
- **AI Suggestions**: AI-powered lunch recommendations based on mood and constraints
- **Discover**: Browse and explore local dining options
- **User Profiles**: Save preferences and dining history

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project
- OpenAI API key (for AI suggestions)

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API key (required for AI suggestions)
OPENAI_API_KEY=your_openai_api_key
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```

## AI Lunch Suggestions

The AI suggestion feature uses OpenAI's GPT-4o-mini model to provide personalized restaurant recommendations based on:

- **Mood chips**: Quick, Cozy, Cheap, Close, Impress, Outdoor
- **User input**: Free-form text describing preferences
- **Filters**: Price range and vegetarian-friendly options

The AI analyzes your request against the available places in the database and returns 3 relevant suggestions with explanations.

## Database Schema

The app expects a `places` table in Supabase with the following structure:

```sql
CREATE TABLE places (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_band TEXT NOT NULL,
  url TEXT,
  maps_url TEXT,
  notes TEXT,
  lat DECIMAL,
  lon DECIMAL,
  veg_friendly BOOLEAN DEFAULT FALSE
);
```

## Development

- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Start**: `npm start`

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **Authentication**: Supabase Auth
