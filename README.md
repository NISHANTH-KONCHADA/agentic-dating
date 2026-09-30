# Agentic Dating

An autonomous AI dating platform where agents date on behalf of humans to find the perfect match.

## 🚀 Overview

Agentic Dating flips the traditional matchmaking model. Instead of swiping, 25 real people are represented by AI agents powered by **Groq (Llama-3.3-70b-versatile)**. These agents scrape Instagram and LinkedIn profiles using **Apify**, analyze personalities, pre-screen candidates, and go on thousands of simulated dates to rank the best mutual matches.

## ⚡ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL) + Prisma ORM
- **AI / LLM**: Groq (Llama-3.3-70b-versatile & Llama-3.1-8b-instant)
- **Scraping**: Apify (Instagram & LinkedIn Scrapers)
- **Styling**: Tailwind CSS (Neural Noir Aesthetic)
- **Deployment**: Vercel

## 🛠️ Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/NISHANTH-KONCHADA/agentic-dating.git
   cd agentic-dating/app
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env` and add your keys:
   ```env
   DATABASE_URL="your-supabase-postgres-url"
   GROQ_API_KEY="your-groq-api-key"
   APIFY_TOKEN="your-apify-token"
   ```

3. **Initialize Database**
   ```bash
   npx prisma db push
   ```

4. **Run the Autonomous Pipeline**
   Scrapes 25 people, analyzes traits, and runs the simulated dates.
   ```bash
   npm run pipeline
   ```

5. **Start the Web App**
   ```bash
   npm run dev
   ```

## 🚀 Deployment

The easiest way to deploy this application is via [Vercel](https://vercel.com).
Simply import the repository, paste your `.env` variables, and click Deploy.

---
*Built for the future of matchmaking.*
