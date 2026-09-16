# Atlas AC Supabase backend

This backend supplies real email/password authentication, admin invitation keys, database-backed device limits, Ed25519-signed application keys and 60-second private download links.

## Required project setup

1. Create a Supabase project and link it with the Supabase CLI.
2. Run `supabase db push` to apply the migration.
3. Add Edge Function secrets:
   - `APP_ORIGIN=https://zeninkaanx.github.io`
   - `ADMIN_TOKEN=<long random administrator secret>`
   - `LICENSE_PRIVATE_KEY_PKCS8_B64=<existing Atlas Ed25519 private key as PKCS8 DER base64>`
   - `LICENSE_DAYS=30`
4. Deploy `register`, `admin-invite`, and `portal` functions.
5. Upload `dist/AtlasAC.exe` to the private `atlas-downloads` bucket as `AtlasAC.exe`.
6. Put the project URL and **publishable/anon** browser key in `docs/assets/config.js`. Never put a service-role key there.

The public registration function consumes an expiring invitation before creating an Auth user. The authenticated portal function verifies the user token server-side before creating a signed device key or a 60-second download URL.
