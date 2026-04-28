
  # Roomie app ui/ux

  This is a code bundle for Roomie app ui/ux. The original project is available at https://www.figma.com/design/XtrnqdFertVZSnJJNtvk2L/Roomie-app-ui-ux.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Required environment variables

  Create a local `.env.local` file with the Supabase project URL and publishable key before starting the app:

  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`

  If these values are missing, the app now fails fast at startup with a clear configuration error.

  ## Supabase updates

  Apply SQL in this order for a production-like Supabase database:

  1. `supabase_schema.sql`
  2. `add_bill_flag_columns.sql` (existing databases only)
  3. `supabase_rls_policies.sql`
  4. `supabase_atomic_bill_rpc.sql`
  5. `supabase_indexes.sql`
  6. `fix_permissions.sql`
  
