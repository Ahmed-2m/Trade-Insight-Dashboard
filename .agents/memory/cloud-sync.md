---
name: Cloud sync architecture
description: How trades/strategies/settings sync between the Expo app and the API server PostgreSQL database
---

## Tables (raw SQL, not Drizzle schema)
- `user_profiles(clerk_user_id, email, initial_balance, language)`
- `user_trades(id, clerk_user_id, pair, direction, date, ...)`
- `user_strategies(clerk_user_id, name)`

Tables created directly via `executeSql()`, not through Drizzle schema files (schema/index.ts is empty).

## API routes
All in `artifacts/api-server/src/routes/userData.ts`, protected by `requireAuth` middleware that calls `getAuth(req)` from `@clerk/express`.

Endpoints:
- GET/PUT `/api/user/profile`
- GET/POST/PUT/DELETE `/api/trades`, `/api/trades/:id`
- GET/POST/DELETE `/api/strategies`, `/api/strategies/:name`
- POST `/api/sync` (bulk replace all user data in a transaction)

## API URL from Expo
`EXPO_PUBLIC_DOMAIN` = Replit dev domain. API is at `https://${domain}/api-server/api`. Set in `lib/api.ts`.

## Auth transport
Mobile uses Bearer tokens (no browser cookie jar). `setApiTokenGetter(() => getToken())` is called in `ClerkBridge` whenever `getToken` changes. All API requests in `lib/api.ts` call this getter and attach `Authorization: Bearer <token>`.

## Sync strategy
- Load local AsyncStorage on mount (always)
- When signed in, fetch cloud data and prefer cloud (cloud wins on initial load)
- Writes go to local immediately + fire-and-forget to API
- If cloud fetch fails, silently fall back to local data
