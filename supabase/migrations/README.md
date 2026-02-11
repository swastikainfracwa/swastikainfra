# Database Migrations

This directory contains SQL migration files for setting up the Supabase database schema.

## Running Migrations

### Option 1: Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `20260207_initial_schema.sql`
5. Paste and run the query
6. Verify tables are created in **Table Editor**

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Schema Overview

### Tables

#### `profiles`
Extends `auth.users` with additional user information:
- `id` (UUID, FK to auth.users)
- `name` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `role` (TEXT: visitor, owner, agent, manager, admin)
- `enable_2fa` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `properties`
Stores property listings:
- `id` (UUID, Primary Key)
- `title`, `description` (TEXT)
- `price` (DECIMAL)
- `location`, `city`, `state` (TEXT)
- `plot_size`, `plot_size_unit` (DECIMAL, TEXT)
- `property_type` (TEXT: residential, commercial, agricultural, industrial)
- `images` (TEXT[])
- `owner_id` (UUID, FK to profiles)
- `owner_name`, `owner_phone` (TEXT, denormalized)
- `verification_status` (TEXT: pending, verified, rejected)
- `verification_badge` (TEXT: verified-agent, verified-manager, null)
- `is_featured` (BOOLEAN)
- `seo_slug` (TEXT, UNIQUE)
- `views` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `leads`
Stores buyer inquiries:
- `id` (UUID, Primary Key)
- `property_id` (UUID, FK to properties)
- `property_title` (TEXT)
- `name`, `phone` (TEXT)
- `created_at` (TIMESTAMPTZ)

### Row Level Security (RLS)

All tables have RLS enabled with policies:

**Profiles:**
- Users can view/update own profile
- Admins/managers can view all profiles

**Properties:**
- Anyone can view verified properties
- Owners can CRUD own properties
- Managers/admins can update verification status

**Leads:**
- Anyone can create leads
- Property owners can view leads for their properties
- Managers/admins can view all leads

### Functions

- `handle_updated_at()` - Auto-updates `updated_at` timestamp
- `sync_property_owner_data()` - Syncs owner name/phone from profiles
- `increment_property_views()` - Safely increments view count
- `handle_new_user()` - Creates profile on user signup

### Triggers

- `profiles_updated_at` - Updates timestamp on profile changes
- `properties_updated_at` - Updates timestamp on property changes
- `properties_sync_owner_data` - Syncs owner data on insert/update
- `on_auth_user_created` - Creates profile when user signs up

## Verification

After running migrations, verify in Supabase dashboard:

1. **Table Editor** - Check that 3 tables exist (profiles, properties, leads)
2. **Table Structure** - Verify columns match the schema
3. **Authentication > Policies** - Confirm RLS policies are active
4. **SQL Editor** - Run sanity check:
   ```sql
   SELECT 
     table_name,
     (SELECT COUNT(*) FROM information_schema.table_constraints 
      WHERE constraint_type = 'PRIMARY KEY' 
      AND table_constraints.table_name = tables.table_name) as pk_count
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('profiles', 'properties', 'leads');
   ```

## Next Steps

After migrations are applied:
1. Configure authentication providers (Google OAuth) in **Authentication > Providers**
2. Run data migration script: `npm run migrate:data` (populates demo data)
3. Test RLS policies by querying as different users
4. Update `.env.local` with your Supabase credentials
