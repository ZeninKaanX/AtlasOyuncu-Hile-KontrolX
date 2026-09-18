# Atlas AC Supabase backend

This backend supplies staff authentication, invitation-only registration,
single-use scan PINs, authenticated telemetry and short-lived private download
links.

## Player flow

1. Staff creates an eight-character PIN in the dashboard. It expires after 20 minutes.
2. The player uses that PIN to receive a 90-second signed download URL.
3. The desktop client exchanges the PIN for a random 256-bit client token bound to that installation.
4. Progress and results require the client token; the PIN cannot write telemetry.
5. Only the staff member who created the PIN can read its report.

## Required project setup

1. Create a Supabase project and link it with the Supabase CLI.
2. Run `supabase db push` to apply the migration.
3. Add Edge Function secrets:
   - `APP_ORIGIN=https://zeninkaanx.github.io`
   - `ADMIN_TOKEN=<long random administrator secret>`
4. Deploy `register`, `admin-invite`, `portal`, and `scan-sync` functions.
5. Upload `dist/AtlasAC-Windows.zip` and `dist/AtlasAC-Linux.zip` to the private `atlas-downloads` bucket with the same object names.
6. Put the project URL and **publishable/anon** browser key in `docs/assets/config.js`. Never put a service-role key there.

The public registration function consumes an expiring invitation before creating
an Auth user. The authenticated portal function verifies ownership on every
report read. The public scan endpoint stores only hashed IP/client/token values
and rate-limits PIN attempts.
