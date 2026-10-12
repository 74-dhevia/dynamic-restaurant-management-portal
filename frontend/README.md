# ZESTRO — Your Food. Your Table. Your Moments.

A regional food-delivery + table-reservation web app for Kovilpatti, Tirunelveli & nearby areas,
built with React, React Router, Redux Toolkit, the Web Speech API and localStorage — no backend.

## Run it locally

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

To build a production bundle:

```bash
npm run build
npm run preview
```

## Demo logins

- Customer: register your own account (Demo OTP for verification is always `123456`).
- Admin: `admin@zestro.com` / `admin123`
- Restaurant Owner: `owner@zestro.com` / `owner123`

## What's implemented

- **25+ pages**: Home, Restaurants, Restaurant Details (with full Menu), Food Details, Search,
  Categories, Offers, Wishlist, Recently Viewed, Cart, Checkout, Payment, Order Success, Orders,
  Track Order, E-Bill (view/print/download), Notifications, Profile, Settings, Rewards, Book a Table,
  Booking Success, My Bookings, Live Table Journey, Help/FAQ, Feedback, Login, Register,
  Forgot Password (Demo OTP), Admin Dashboard (incl. Digital Twin floor map), Restaurant Owner Dashboard.
- **Redux Toolkit** slices: auth, cart, order, booking, wishlist, recentlyViewed, review,
  notification, reward, voucher, chatbot, user — all persisted to `localStorage`.
- **Hooks**: useState/useEffect/useMemo/useRef/useCallback/useReducer/useContext used throughout,
  plus custom hooks `useLocalStorage`, `useDebounce`, `useCountdown`, `useOnlineStatus`, `useAuth`,
  `useOtp`, `useSpeechRecognition`, `useSpinWheel`, `useChatbot`.
- **6-box PIN OTP** component (`<OtpInput />`) with auto-focus, paste-splitting, shake-on-error,
  resend cooldown — reused across Register and Forgot Password.
- **Voice search** (Web Speech API) in the navbar search bar, with a graceful "not supported" fallback.
- **DineBot**: a rule-based chat widget that parses budget/mood keywords from free text and builds a
  matching meal from the mock catalog — clearly labeled as simulated, not a real LLM.
- **Surprise Me roulette**, **Spin the Wheel** (with 24h cooldown), and **Mystery Rewards** on order
  completion — all feeding the same DinePoints ledger.
- **Table booking** flow with time-slot availability, seating choice, optional pre-order, modify/cancel,
  a Beat-the-Queue estimate, and a Live Table Journey step tracker.
- **Settings**: Theme (light/dark/system), 6 visual Moods, 5 languages with live in-app translation
  (English/Tamil/Hindi/French/Spanish covering navigation, key actions and forms), font size/family,
  accessibility toggles (high contrast, reduced motion) — all applied instantly via CSS variables.
- **Order flow**: cart → checkout (address/instructions/scheduling via a `useReducer` state machine)
  → simulated payment (UPI/Card/COD, with retry-on-failure) → live-updating order tracking → printable
  E-Bill → cancellation with simulated refund.

## Notes on scope

This build focuses on making every core system genuinely work end-to-end rather than stubbing
features. A few of the finer details in the original spec (a complete word-for-word translation of
every single string in all 5 languages, and full CRUD screens for every admin entity) are implemented
at a representative, functional level rather than exhaustively, to keep the codebase real and testable
rather than a wall of placeholder text. Everything else — cart math, coupons, DinePoints, booking
lifecycle, OTP, voice search, the chatbot, the spin wheel, order tracking, and the digital twin floor
map — is fully wired up and persists across reloads via localStorage.

## Tech stack

React 18 · React Router DOM 6 · Redux Toolkit · Web Speech API · plain CSS (no Tailwind/UI kits) · Vite.
