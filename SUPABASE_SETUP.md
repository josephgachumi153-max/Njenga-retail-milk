# Supabase setup

1. Create a Supabase project.
2. In the Supabase SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql).
   For an existing project, also run [`supabase/migrations/20261106_retail_workflows.sql`](./supabase/migrations/20261106_retail_workflows.sql).
3. Create an Auth user with email `admin@njenga-milk.local` and password `Admin@2026`.
4. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Run `npm run dev` or deploy the Vite app to Vercel with the same environment variables.

When the environment variables are present, the app signs in through Supabase Auth and loads products, customers, sales, payment details, and reorder levels from Supabase. The tables use Row Level Security and only authenticated users can access them. Without Supabase variables, the app keeps the same workflow in browser storage until the database is configured.
