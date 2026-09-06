# SG Migrant Worker App (Web)

Next.js web app for Myanmar workers in Singapore.

## Tech Stack

- Next.js (App Router)
- TypeScript (strict)
- next-intl (EN + Myanmar)
- Supabase (auth + data)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).  
Root path redirects to `/en` by default.

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill values:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADSENSE_HOME_SLOT_ID=1234567890
NEXT_PUBLIC_GOOGLE_ADSENSE_GUIDE_SLOT_ID=0987654321
```

## Main Pages

- `/[locale]` - home
- `/[locale]/passport/checklist` - free checklist
- `/[locale]/guide` - free guide
- `/[locale]/emergency-contacts` - free contacts
- `/[locale]/passport/wizard` - premium flow placeholder
- `/[locale]/login` - sign in
- `/[locale]/register` - sign up
- `/[locale]/forgot-password` - request password reset link
- `/[locale]/reset-password` - set a new password from reset session
- `/[locale]/account` - protected sample page
- `/[locale]/payment/manual` - manual payment proof submission
- `/[locale]/admin/payments` - admin review page (pending -> completed/failed)
- `/[locale]/admin/analytics` - owner/admin analytics dashboard
- `/[locale]/help` - FAQ/help page
- `/[locale]/contact` - support/sponsor contact form
- `/[locale]/cookies` - cookie disclosure page

Locales: `en`, `my`

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run lint` - ESLint check
- `npm run typecheck` - TypeScript check
- `npm run test` - unit tests (rate-limit + entitlement summary)

## Migration Run Order (SQL Editor)

1. `20260905_create_form_drafts.sql`
2. `20260905_create_payments.sql`
3. `20260905_rename_receipt_url_to_receipt_path.sql`
4. `20260905_create_payment_receipts_bucket.sql`
5. `20260905_create_ads_and_sponsor_tables.sql`
6. `20260905_create_export_entitlements.sql`
7. `20260905_create_profiles_table.sql`
8. `20260905_add_is_admin_function.sql`
9. `20260905_update_admin_policies_to_use_profiles.sql`
10. `20260905224500_harden_profiles_and_entitlements_policies.sql`

## Post-Migration Admin Promotion

```sql
update public.profiles
set role = 'admin'
where email = 'your-admin-email@example.com';
```

## Release Quality Gate

Run before each deploy:

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```
