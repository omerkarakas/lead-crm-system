# Moka CRM

Lead-to-Customer dönüşümünü otomatize eden tek platform.

## Tech Stack

- **Frontend:** Vue 3 + TypeScript + Vite
- **State Management:** Pinia
- **Routing:** Vue Router
- **Backend:** PocketBase
- **Authentication:** Email/Password + OAuth (Google/GitHub)

## Development Setup

### Prerequisites

- Node.js 18+
- PocketBase installed locally or a running PocketBase instance

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PocketBase

#### Option A: Local Development

1. Download PocketBase from https://pocketbase.io/docs/
2. Extract and run: `./pocketbase serve`
3. PocketBase will start on `http://127.0.0.1:8090`

#### Option B: Import Schema

The PocketBase schema is defined in `pb_schema.json`. To import it:

1. Go to PocketBase Admin UI at `http://127.0.0.1:8090/_/`
2. Create an admin account
3. Go to Settings > Import Collections
4. Upload or paste the contents of `pb_schema.json`

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `VITE_POCKETBASE_URL` - Your PocketBase server URL (default: `http://127.0.0.1:8090`)

Optional OAuth variables:
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (server-side)
- `VITE_GOOGLE_REDIRECT_URI` - OAuth redirect URI (e.g., `http://localhost:5173`)
- `VITE_GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret (server-side)
- `VITE_GITHUB_REDIRECT_URI` - OAuth redirect URI (e.g., `http://localhost:5173`)

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new OAuth 2.0 client ID
3. Add `http://localhost:5173` to authorized JavaScript origins
4. Add `http://localhost:5173/oauth/callback` to authorized redirect URIs
5. Copy Client ID and Client Secret to `.env`

### GitHub OAuth

1. Go to GitHub Developer Settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to `http://localhost:5173/oauth/callback`
4. Copy Client ID and generate Client Secret to `.env`

## PocketBase Collections

The app uses the following collections:

- **users** (auth collection) - User accounts with roles (admin, sales, marketing)
- **leads** - Lead information with qualification status
- **notes** - Notes attached to leads
- **tags** - Reusable tags for categorizing leads

## License

MIT

