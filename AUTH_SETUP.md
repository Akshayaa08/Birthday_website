# Role-Based Access Setup

## Required Server Environment

Set these variables in the server's `.env` file. Never use a `VITE_` prefix for credentials.

- `OWNER_PASSWORD`: unique System password, at least 12 characters.
- `BOYFRIEND_PASSWORD`: unique My Love password, at least 12 characters.
- `SESSION_SECRET`: random secret of at least 32 bytes.
- `MONGODB_URI`: MongoDB connection string.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: server-only Cloudinary credentials.
- `CLIENT_URL`: exact browser origin, such as `http://localhost:5173`.
- `NODE_ENV`: use `production` for HTTPS deployments so session cookies are Secure.
- `PORT`: optional server port; defaults to `5000`.
- `VITE_API_BASE_URL`: optional frontend API origin for separate hosting (for example, the Render service URL without `/api`); keep it free of secrets. Existing deployments may continue using `VITE_API_URL`.

For separate HTTPS frontend and API deployments, production session cookies use `SameSite=None; Secure` so credentialed requests from the frontend can authenticate. Configure `CLIENT_URL` to the exact frontend origin and enable credentials in the frontend requests.

Generate a session key with Node: `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.

## Existing Reaction Migration

1. Back up MongoDB and the `uploads/` directory.
2. Configure the required server credentials. Cloudinary credentials are required if existing reaction documents contain public Cloudinary URLs.
3. Run `npm run migrate:private-reactions` from the project directory.
4. Confirm the migration reports the expected number of reaction records. Review any Cloudinary invalidation warnings and manually invalidate those old public assets if needed.
5. Deploy the updated server and frontend together. Reaction uploads and activity now require the authenticated server API.

The migration preserves existing reaction records, associates legacy reactions with the boyfriend account, moves Cloudinary videos to authenticated delivery, and removes URLs from MongoDB records. Existing browser-local reaction data is not imported into MongoDB.

## Login Verification

- Sign in as username `RASAGULLA` (case-insensitive) with the `BOYFRIEND_PASSWORD`; the account is displayed as `My Love`. Confirm future days are locked, no System/test controls are present, and daily video playback only becomes available after camera/microphone permission and recorder startup.
- Sign in as username `CAZOMON` (case-insensitive) with the `OWNER_PASSWORD`; the account is displayed as `System`. Open `/admin`, choose any date from October 1–19, then preview the Journey. Clear the selector to return to real IST time.
- As owner, confirm activity timestamps, completion, reaction upload state, and the private reaction gallery load.
- While logged in as boyfriend, direct requests to `/api/admin/activity` and `/api/reactions` must return `403`.
- While logged out, protected APIs and `/api/videos/1` must return `401`. A future boyfriend video endpoint must return `403`.
