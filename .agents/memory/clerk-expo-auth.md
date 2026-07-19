---
name: Clerk Expo auth pattern
description: How to correctly integrate Clerk auth into Expo without violating Rules of Hooks
---

## Pattern: ClerkBridge component

Never call `useAuth()` inside a try-catch or conditionally in a context provider — this violates React's Rules of Hooks and causes a silent crash (white screen, no console error).

**Wrong:** Calling `useAuth()` inside `try { const auth = useAuth() } catch {}`

**Right:** Create a `ClerkBridge` component that:
1. Lives inside both `ClerkProvider` AND whatever context needs auth (e.g., `TradesProvider`)
2. Calls `useAuth()` unconditionally at the top level
3. Uses `useEffect` to propagate auth changes to the context via an exposed callback (e.g., `onAuthChange`)
4. Uses `setApiTokenGetter(() => getToken())` to wire bearer tokens for API calls

**Why:** React requires hooks to be called at the top level unconditionally. The `ClerkLoaded` wrapper ensures `useAuth()` has a valid Clerk context when `ClerkBridge` renders.

**How to apply:** Any context that needs Clerk auth state should expose an `onAuthChange(signedIn: boolean)` callback. `ClerkBridge` in `_layout.tsx` calls it. The context handles its own sync logic without importing Clerk.

## Route protection

Avoid forced redirect in `ClerkBridge` on web — it can cause white-screen issues with expo-router's initial render cycle on web. Instead, use modal presentation for auth screens and let the Profile tab handle sign-in/sign-out navigation. The app works in guest mode by default.
