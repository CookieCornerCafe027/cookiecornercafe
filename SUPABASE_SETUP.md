# Supabase Setup Guide

This guide will help you initialize Supabase for the Cookie Corner Cafe project.

## Option 1: Using Supabase Cloud (Recommended for Production)

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in your project details:
   - **Name**: cookie-corner-cafe (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to be ready (2-3 minutes)

### Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll find:
   - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### Step 3: Set Up Environment Variables

1. Create a `.env.local` file in the project root (this file should not be committed).

2. Open `.env.local` and fill in your Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Add your Supabase Service Role key (server-only, used for Stripe webhook order updates):

   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

4. Add Stripe credentials (server-only):

   ```
   STRIPE_SECRET_KEY=sk_live_or_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. Add Resend credentials (server-only, used by Stripe webhook to email the customer after successful payment):
   ```
   RESEND_API_KEY=re_...
   # Used as the Resend sender address (and also used to BCC confirmations to your internal inbox)
   ORDER_NOTIFICATION_EMAIL=orders@yourdomain.com
   ```

### Step 4: Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Run the SQL scripts in order:
   - First, run `supabase/migrations/001_create_products_table.sql`
   - Then, run `supabase/migrations/002_create_orders_table.sql`
   - Then, run `supabase/migrations/006_add_order_email_and_stripe_fields.sql` (adds email + Stripe reconciliation fields)
   - Next, run `supabase/migrations/004_create_product_images_bucket.sql` (for image uploads)
   - Then, run `supabase/migrations/005_convert_to_multiple_images.sql` (converts to multiple images support)
   - Finally, run `supabase/migrations/003_seed_sample_products.sql` (optional, for sample data)

Alternatively, you can use the Supabase CLI (see Option 2 below).

### Step 5: Verify Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Check that your app loads without errors
3. Visit `/admin` to test authentication (you'll need to set up auth first)

---

## Stripe Checkout Setup

### Step 1: Install Stripe SDK

```bash
npm install stripe
```

### Step 2: Configure Stripe Webhook

1. In the Stripe Dashboard, create a webhook endpoint pointing to:
   - `https://your-site.com/api/stripe/webhook` (production)
   - `http://localhost:3000/api/stripe/webhook` (local dev)
2. Subscribe to this event:
   - `checkout.session.completed`
3. Copy the webhook signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

---

## Option 2: Using Supabase CLI (Recommended for Local Development)

### Step 1: Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### Step 2: Initialize Supabase Locally

```bash
# Login to Supabase (for linking to cloud project)
supabase login

# Initialize Supabase in your project
supabase init

# Start local Supabase instance
supabase start
```

This will:

- Create a `supabase/config.toml` file
- Start local Supabase services (PostgreSQL, Auth, Storage, etc.)
- Provide you with local credentials

### Step 3: Link to Cloud Project (Optional)

If you want to link your local project to a cloud project:

```bash
supabase link --project-ref your-project-ref
```

### Step 4: Run Migrations

Create migration files from your SQL scripts:

```bash
# Create migration for products table
supabase migration new create_products_table
# Copy content from scripts/001_create_products_table.sql to the new migration file

# Create migration for orders table
supabase migration new create_orders_table
# Copy content from scripts/002_create_orders_table.sql to the new migration file

# Create migration for seed data
supabase migration new seed_sample_products
# Copy content from scripts/003_seed_sample_products.sql to the new migration file
```

Or apply migrations directly:

```bash
supabase db reset  # This will run all migrations
```

### Step 5: Set Up Environment Variables

After running `supabase start`, you'll see output with local credentials. Update your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

---

## Setting Up Authentication

To enable authentication in your app:

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Enable the providers you want (Email, Google, etc.)
3. Configure email templates if needed
4. Set up redirect URLs in **URL Configuration**

For local development, authentication works automatically with the local Supabase instance.

---

## Database Schema

The project uses two main tables:

- **products**: Stores product information (crepe cakes, cookies, etc.)
- **orders**: Stores customer orders

Both tables have Row Level Security (RLS) enabled with appropriate policies:

- Products: Public can view active products, authenticated users can manage
- Orders: Anyone can create orders, authenticated users can view/manage all orders

---

## Troubleshooting

### Environment Variables Not Loading

- Make sure your `.env.local` file is in the project root
- Restart your Next.js dev server after changing `.env.local`
- Check that variable names start with `NEXT_PUBLIC_` for client-side access

### Connection Issues

- Verify your Supabase URL and keys are correct
- Check that your Supabase project is active
- For local development, ensure `supabase start` is running

### RLS Policy Errors

- Make sure you've run the migration scripts that create the RLS policies
- Check the Supabase dashboard → **Authentication** → **Policies** to verify policies exist
- Double-check you're pointing at the **same Supabase project** you ran the migrations against (compare `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` with the project URL in Supabase Settings → API)

If you see an error like:

> `new row violates row-level security policy for table "orders"`

Run this in Supabase **SQL Editor** to verify the `orders` policies actually exist in that database:

```sql
select policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'orders'
order by cmd, policyname;
```

If there is **no** `INSERT` policy for `anon`/`authenticated`, recreate it:

```sql
drop policy if exists "orders_insert_public" on public.orders;
create policy "orders_insert_public"
  on public.orders
  as permissive
  for insert
  to anon, authenticated
  with check (true);
```

---

## Setting Up Storage for Product Images

The admin panel includes image upload functionality. To enable this:

### Using Supabase Cloud

1. In your Supabase dashboard, go to **Storage**
2. The migration script `004_create_product_images_bucket.sql` should have created the `product-images` bucket
3. If not, manually create a bucket:
   - Click "New bucket"
   - Name: `product-images`
   - Make it **Public** (so images can be viewed by everyone)
4. The RLS policies will automatically allow:
   - Public users to view images
   - Authenticated users to upload/update/delete images

### Using Supabase CLI

The storage bucket is created automatically when you run:

```bash
supabase db reset
```

This will apply the `004_create_product_images_bucket.sql` migration.

### Image Upload Features

In the admin panel, you can now:

- **Upload multiple product images** (PNG, JPG, WebP up to 5MB each)
- Preview all images before saving
- Remove individual images (existing or newly added)
- **First image is automatically set as the primary image** shown in product listings
- Images are automatically stored in Supabase Storage with unique filenames
- **Image gallery** with navigation arrows and thumbnails on product detail pages
- Product cards show image count badge when multiple images exist

---

## Next Steps

After setting up Supabase:

1. Set up authentication providers (Email, OAuth, etc.)
2. Create admin users for managing products/orders
3. Test the product and order flows
4. Upload product images through the admin panel
