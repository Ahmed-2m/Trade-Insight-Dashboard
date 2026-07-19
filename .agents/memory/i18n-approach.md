---
name: i18n approach for Trading Journal
description: How Arabic/English translations are implemented in the Expo app
---

## Approach: Custom LanguageContext (no i18next)

Used a simple custom context with a TypeScript translation dictionary instead of i18next, for reliability and simplicity in React Native.

## Files
- `i18n/translations.ts` — Full translation dictionary for `ar` and `en`
- `context/LanguageContext.tsx` — React context with `language`, `setLanguage`, `t` (translations), `isRTL`

## Usage in components
```tsx
const { t, isRTL } = useLanguage();
// t.tabs.dashboard → 'الرئيسية' (ar) or 'Dashboard' (en)
// isRTL → true for Arabic
```

## RTL handling
- `I18nManager.forceRTL(true/false)` called when language changes
- Full RTL layout change requires app restart (user is informed)
- Individual components handle RTL inline with `isRTL && styles.rtl` (textAlign: 'right')

## Default language
Arabic (ar) is the default. Stored in `@trading_journal_language` AsyncStorage key.

## What is translated
- Auth screens (fully): sign-in, sign-up, verify
- Profile screen (fully): language selector, sign-in/out
- Tab names: Dashboard → الرئيسية, etc.
- Dashboard strings are still hardcoded English — partial i18n
