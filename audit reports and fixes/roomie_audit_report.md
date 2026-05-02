
╔══════════════════════════════════════════════════════════════════════════════╗
║                        ROOMIE APP — COMPREHENSIVE AUDIT REPORT               ║
║                              Tech Stack: Expo + React + Supabase + Vercel    ║
║                              Generated: 2026-05-02                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

⚠️  NOTE: Your package.json shows a Vite web app, NOT an Expo app. There are NO
    Expo packages in dependencies. If you intended this to be a mobile app, you
    need to restructure the project or create a separate Expo workspace.

═══════════════════════════════════════════════════════════════════════════════
                              EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════════════════════

SEVERITY BREAKDOWN:
  🔴 CRITICAL:  18 issues — App-breaking bugs, security vulnerabilities, data loss risks
  🟠 MAJOR:     16 issues — Significant UX/performance problems, missing core features
  🟡 MEDIUM:    14 issues — Moderate impact, should be addressed in sprints
  🟢 MINOR:      5 issues — Polish items, nice-to-have improvements

TOP 5 PRIORITIES (Fix Immediately):
  1. sync.ts has a DUPLICATE VARIABLE DECLARATION (`meUser` declared twice) — 
     This will crash the app on build/start.
  2. NO ERROR HANDLING on any Supabase call — Silent failures, impossible to debug.
  3. HARDCODED FALLBACK USER with real person's UPI ("aarav@okhdfc") — 
     Privacy leak + security risk.
  4. REALTIME CHANNEL MEMORY LEAK — Every fetch creates a new channel, never cleaned up.
  5. MISSING `notifications` TABLE — Referenced in code but not in schema.

═══════════════════════════════════════════════════════════════════════════════
                          1. CRITICAL BUGS (🔴)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.1 sync.ts: Duplicate `meUser` Declaration                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     src/lib/sync.ts                                                   │
│ LINE:     ~90 and ~106                                                      │
│ ISSUE:    `const meUser = users?.find(u => u.is_me);` appears TWICE in the │
│           same function scope. This causes:                                 │
│           • TypeScript compilation error: "Cannot redeclare block-scoped     │
│             variable 'meUser'"                                              │
│           • Runtime error in strict mode                                    │
│ IMPACT:   App will NOT start. Complete blocker.                             │
│ FIX:      Remove the second declaration. Use the first one.                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.2 Zero Error Handling on Supabase Calls                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     src/lib/sync.ts                                                   │
│ ISSUE:    Every `await supabase.from(...).select(...)` ignores the `error` │
│           property. If Supabase is down, RLS blocks, or network fails:     │
│           • `data` is null/undefined                                        │
│           • App proceeds with empty arrays                                  │
│           • User sees blank screen with no explanation                      │
│ IMPACT:   Silent failures, impossible to debug, poor UX.                    │
│ FIX:      Destructure `error` from every call, throw or handle explicitly.  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.3 Hardcoded Fallback User with Real UPI                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     src/lib/sync.ts                                                   │
│ LINE:     ~115                                                              │
│ CODE:     supabase.from("users").insert({ id: "me", name: "You",            │
│           color: "#FFD84D", upi: "aarav@okhdfc", is_me: true })             │
│ ISSUE:    • UPI "aarav@okhdfc" appears to be a REAL person's UPI ID         │
│           • Hardcoded ID "me" is predictable and conflicts across users     │
│           • Fire-and-forget insert with no error handling                   │
│           • No auth check before insert                                     │
│ IMPACT:   Privacy violation, security hole, data corruption.                │
│ FIX:      Remove fallback. Use Supabase Auth UID. Require sign-in.          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.4 Realtime Channel Memory Leak                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     src/lib/sync.ts                                                   │
│ LINE:     ~108                                                              │
│ CODE:     supabase.channel("my_notifications").on(...).subscribe();         │
│ ISSUE:    Channel is created but NEVER unsubscribed. Every time             │
│           `initialFetch()` runs (e.g., on re-auth, refresh):                │
│           • New channel accumulates in memory                               │
│           • Supabase has limits (~100 concurrent channels per client)       │
│           • Eventually hits limit and new subscriptions fail                │
│ IMPACT:   Memory leak, eventual realtime failure.                           │
│ FIX:      Store channel reference, unsubscribe before re-subscribing.       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.5 Missing `notifications` Table in Schema                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     supabase_schema.sql                                               │
│ ISSUE:    `sync.ts` queries `notifications` table and subscribes to it,     │
│           but the table is NOT defined in any schema file.                  │
│ IMPACT:   Query fails, notifications feature completely broken.             │
│ FIX:      Add notifications table + RLS policies (see fix code below).      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.6 RPC Floating Point Tolerance Too Loose                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     supabase_atomic_bill_rpc.sql                                      │
│ LINE:     ~45                                                               │
│ CODE:     IF abs(payer_sum - p_amount) > 0.5 THEN                           │
│ ISSUE:    Allows 50 paise (₹0.50) discrepancy. For financial data, this    │
│           is unacceptable. A ₹100.49 bill could have payers totaling        │
│           ₹100.00 or ₹101.00 and still pass.                                │
│ IMPACT:   Financial inaccuracy, potential disputes.                         │
│ FIX:      Change tolerance to 0.01 (1 paise) or use exact decimal.          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.7 No Database Indexes — Full Table Scans                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     supabase_schema.sql                                               │
│ ISSUE:    NO indexes on: bills.group_id, bill_payers.bill_id,              │
│           bill_splits.bill_id, settlements.group_id, group_members.group_id │
│ IMPACT:   O(n) scans on every query. Slow with >1000 records.               │
│ FIX:      Add indexes (see fix code below).                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.8 React & React-DOM Only in peerDependencies                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     package.json                                                      │
│ ISSUE:    react and react-dom are peerDependencies marked optional.         │
│           With npm (not pnpm), they won't be installed.                     │
│ IMPACT:   Build fails or runtime errors on fresh npm install.               │
│ FIX:      Move react and react-dom to dependencies (not peerDependencies).  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.9 Vite Version Mismatch                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     package.json                                                      │
│ ISSUE:    devDependencies: vite ^6.4.2, but pnpm.overrides: vite 6.3.5     │
│ IMPACT:   Version conflict, potential build inconsistencies.                │
│ FIX:      Align versions or remove override.                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.10 No Authentication System                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     Entire app                                                        │
│ ISSUE:    No Supabase Auth integration. App uses hardcoded "me" user.      │
│           Anyone with the URL can access/modify data.                       │
│ IMPACT:   Zero security. Complete data exposure.                            │
│ FIX:      Integrate supabase.auth with email/password or OAuth.             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.11 Mixed UI Libraries (MUI + Radix + Tailwind)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     package.json                                                      │
│ ISSUE:    Both @mui/material (CSS-in-JS/Emotion) AND @radix-ui primitives  │
│           (CSS variables/Tailwind) are included.                            │
│           • Double CSS injection                                            │
│           • Theme inconsistency                                             │
│           • Z-index wars between portals                                    │
│           • Bundle bloat: ~200KB+ extra                                     │
│ IMPACT:   Unpredictable UI, larger bundle, harder maintenance.              │
│ FIX:      Pick ONE: either MUI-only OR Radix+Tailwind-only.                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.12 No Error Boundaries                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     Entire app                                                        │
│ ISSUE:    No React Error Boundary. Any component throw = white screen.     │
│ IMPACT:   App crashes ungracefully, data loss.                              │
│ FIX:      Add top-level Error Boundary with fallback UI.                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.13 No Code Splitting                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     Entire app                                                        │
│ ISSUE:    Single Vite bundle. Estimated 600KB+ gzipped JS.                  │
│ IMPACT:   Slow initial load, poor mobile performance.                       │
│ FIX:      Use React.lazy() + Suspense for route-based splitting.            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.14 No Input Sanitization                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     Entire app                                                        │
│ ISSUE:    User inputs (bill titles, group names) rendered as raw text.     │
│           Risk of XSS if any component uses dangerouslySetInnerHTML.        │
│ IMPACT:   XSS vulnerability.                                                │
│ FIX:      Sanitize with DOMPurify before rendering.                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.15 RLS Policies: N+1 Query Problem                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     supabase_rls_policies.sql                                         │
│ ISSUE:    `private.check_group_membership()` runs for EVERY row.           │
│           1000 bills = 1000 function calls.                                 │
│ IMPACT:   Query performance degrades linearly with data size.               │
│ FIX:      Add indexes, consider materialized views for membership checks.   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.16 No Settlement Optimization                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     Entire app                                                        │
│ ISSUE:    App tracks debts but doesn't minimize transactions.              │
│           A→B: ₹100, B→C: ₹100 requires 2 payments instead of A→C: ₹100.   │
│ IMPACT:   Users make unnecessary transactions, poor UX.                     │
│ FIX:      Implement greedy settlement optimization algorithm.               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.17 Equal Split Rounding Error                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     Bill creation logic                                               │
│ ISSUE:    ₹100 / 3 people = ₹33.33 each = ₹99.99 total.                   │
│           ₹0.01 is unaccounted for.                                         │
│ IMPACT:   Financial discrepancy, user confusion.                            │
│ FIX:      Use largest remainder method or assign remainder to payer.        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1.18 No Offline Support                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ FILE:     Entire app                                                        │
│ ISSUE:    All data requires live Supabase connection.                       │
│           No caching, no pending actions queue.                             │
│ IMPACT:   App unusable offline. Changes lost on network failure.            │
│ FIX:      Add local-first architecture or at minimum a pending queue.       │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                          2. MAJOR ISSUES (🟠)
═══════════════════════════════════════════════════════════════════════════════

  2.1  No loading states — Users see blank screen during data fetch
  2.2  No responsive design validation — Mobile UX untested
  2.3  Accessibility gaps — No aria-labels, no keyboard nav, no focus mgmt
  2.4  Animation performance — Potential layout thrashing with motion
  2.5  No form validation schema — Zod/Yup missing from dependencies
  2.6  Dark mode inconsistency — MUI + Tailwind may conflict
  2.7  RPC bypasses RLS via SECURITY DEFINER — Any RPC bug = full access
  2.8  No rate limiting — Spam possible on bill/group creation
  2.9  Realtime enabled on ALL tables — Over-exposure of data changes
  2.10 No audit log — No history of who changed what
  2.11 No image optimization — Avatars not lazy-loaded
  2.12 No service worker — Not a PWA, no background sync
  2.13 Unoptimized re-renders — Global store subscribers all re-render
  2.14 No debouncing on search — Every keystroke triggers full filter
  2.15 Recurring bills not automated — Table exists but no generation logic
  2.16 No push notifications — Users only see alerts when app is open

═══════════════════════════════════════════════════════════════════════════════
                          3. MEDIUM ISSUES (🟡)
═══════════════════════════════════════════════════════════════════════════════

  3.1  Date stored as text — Sorting is lexicographic, not chronological
  3.2  No updated_at columns — No audit trail for modifications
  3.3  Users INSERT policy too permissive — Anyone can create any user
  4.4  Groups INSERT doesn't auto-add creator to members
  3.5  No DELETE policy on users table
  3.6  Settlement status transitions not validated
  3.7  Client-side ID generation — Predictable, collision risk
  3.8  No return value from save_bill RPC
  3.9  No created_by tracking on bills
  3.10 react-router vs react-router-dom confusion
  3.11 date-fns v3 + react-day-picker v8 compatibility risk
  3.12 @popperjs/core + react-popper redundancy
  3.13 No testing framework
  3.14 No ESLint/Prettier configuration

═══════════════════════════════════════════════════════════════════════════════
                          4. MINOR ISSUES (🟢)
═══════════════════════════════════════════════════════════════════════════════

  4.1  Missing return type on initialFetch()
  4.2  No environment variable validation at build time
  4.3  No error monitoring (Sentry)
  4.4  No analytics
  4.5  No CI/CD pipeline

═══════════════════════════════════════════════════════════════════════════════
                          5. MISSING FEATURES
═══════════════════════════════════════════════════════════════════════════════

  HIGH PRIORITY:
  ──────────────
  • Proper authentication (email/password, OAuth, magic link)
  • Settlement optimization algorithm
  • Offline support / pending actions queue
  • Push notifications
  • Recurring bill automation (cron job)
  • Group invite system (links, QR codes)
  • Receipt attachments (Supabase Storage)
  • Data export (CSV/PDF)

  MEDIUM PRIORITY:
  ────────────────
  • Multi-currency support
  • Activity/audit log
  • Debt simplification visualization
  • Reminders & scheduled notifications
  • PWA with service worker

  LOW PRIORITY:
  ──────────────
  • A/B testing framework
  • Advanced analytics
  • CI/CD pipeline
  • Automated testing

═══════════════════════════════════════════════════════════════════════════════
                          6. ACTION PLAN
═══════════════════════════════════════════════════════════════════════════════

  PHASE 1: CRITICAL FIXES (This Week)
  ───────────────────────────────────
  1. Fix sync.ts duplicate `meUser` declaration
  2. Add error handling to ALL Supabase calls
  3. Remove hardcoded fallback user ("me", "aarav@okhdfc")
  4. Add proper auth with Supabase Auth
  5. Fix realtime channel memory leak
  6. Add React Error Boundaries
  7. Add loading states / skeleton screens
  8. Fix RPC floating point comparison (0.5 → 0.01)
  9. Add database indexes
  10. Add notifications table schema

  PHASE 2: MAJOR IMPROVEMENTS (This Month)
  ────────────────────────────────────────
  1. Implement settlement optimization algorithm
  2. Add offline support (pending actions queue)
  3. Add TanStack Query for server state management
  4. Add push notifications
  5. Add recurring bill automation (Edge Function cron)
  6. Add group invite system
  7. Add receipt attachments (Supabase Storage)
  8. Fix MUI + Radix UI conflict (pick one)
  9. Add code splitting with React.lazy()
  10. Add Sentry error monitoring

  PHASE 3: NICE TO HAVE (Future Sprints)
  ─────────────────────────────────────
  1. Multi-currency support
  2. Data export (CSV/PDF)
  3. Activity/audit log
  4. Debt simplification visualization
  5. PWA with service worker
  6. A/B testing framework
  7. Advanced analytics
  8. CI/CD pipeline

═══════════════════════════════════════════════════════════════════════════════
                          7. FIXED CODE SNIPPETS
═══════════════════════════════════════════════════════════════════════════════

See the separate code files provided for:
  • Fixed sync.ts (error handling, auth, channel cleanup)
  • Fixed save_bill RPC (strict validation, group membership checks)
  • Database indexes SQL
  • Notifications table schema
  • Settlement optimization algorithm
  • Equal split with remainder handling

═══════════════════════════════════════════════════════════════════════════════
                          8. RECOMMENDED DEPENDENCY CHANGES
═══════════════════════════════════════════════════════════════════════════════

  ADD:
  ───
  • zod + @hookform/resolvers       (form validation)
  • @tanstack/react-query            (server state management)
  • dexie or idb-keyval              (offline storage)
  • @sentry/react                    (error monitoring)
  • react-error-boundary             (error boundaries)
  • use-debounce                     (input debouncing)
  • dompurify                        (XSS prevention)

  REMOVE (redundant):
  ────────────────────
  • @mui/material + @mui/icons-material  (if using Radix+Tailwind)
  • @emotion/react + @emotion/styled      (if removing MUI)
  • @popperjs/core                        (bundled with react-popper)
  • react-popper                         (if using Radix popover)
  • react-dnd + react-dnd-html5-backend  (if not using drag-drop)

  MOVE TO DEPENDENCIES:
  ─────────────────────
  • react (from peerDependencies)
  • react-dom (from peerDependencies)

═══════════════════════════════════════════════════════════════════════════════
                          9. ARCHITECTURE RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════════════════

  CURRENT:  Raw Supabase calls → Global store (one-time hydration)
  ISSUE:    No caching, no invalidation, no offline, no retry

  RECOMMENDED:
  ┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
  │  React UI   │◄──►│ TanStack Query  │◄──►│  Supabase   │
  │  Components │    │ (cache, retry,  │    │   Client    │
  │             │    │  background     │    │             │
  │             │    │  refetch)       │    │             │
  └─────────────┘    └─────────────────┘    └─────────────┘
         │
         ▼
  ┌─────────────┐
  │  Zustand    │  ← Local UI state only (modals, theme, etc.)
  │   Store     │
  └─────────────┘

  FOR OFFLINE:
  Add a sync layer:
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │  UI Action  │───►│ Pending     │───►│ Supabase    │
  │  (add bill) │    │ Queue (IDB) │    │ (when online)
  └─────────────┘    └─────────────┘    └─────────────┘

═══════════════════════════════════════════════════════════════════════════════
                          10. ABOUT THE "EXPO" MENTION
═══════════════════════════════════════════════════════════════════════════════

  You mentioned "expo react supabase vercel" but your codebase is a Vite web
  app with NO Expo packages. This is a significant discrepancy:

  • If you want a MOBILE app: Create a new Expo project and share code via
    a monorepo (Turborepo + pnpm workspaces). The UI components can be shared
    but navigation, storage, and notifications need Expo-specific APIs.

  • If you want WEB ONLY: Remove "expo" from your description. Your current
    setup (Vite + React + Supabase + Vercel) is correct for web.

  • If you want BOTH: Use Expo Router with web output, or maintain separate
    web and mobile apps with shared business logic.

═══════════════════════════════════════════════════════════════════════════════
                              END OF REPORT
═══════════════════════════════════════════════════════════════════════════════
