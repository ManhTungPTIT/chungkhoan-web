# Admin Auth — Access Token + Refresh Token Design

**Date:** 2026-05-20  
**Scope:** Full rebuild of admin login feature with access/refresh token mechanism  
**Approach:** Option A — plain service layer, no React context

---

## 1. Token Storage Contract

Two keys stored in `localStorage`:

| Key | Description |
|-----|-------------|
| `accessToken` | Short-lived JWT, attached to every API request as `Authorization: Bearer` |
| `refreshToken` | Long-lived token, used only to obtain a new `accessToken` |

A single `tokenStorage.js` helper centralises all reads/writes. No other file touches `localStorage` directly.

```js
getAccessToken()
setAccessToken(token)
getRefreshToken()
setTokens({ accessToken, refreshToken })
clearTokens()
```

---

## 2. Axios Instance & Interceptors (`axiosAdmin.js`)

A single configured axios instance used by all admin API calls.

**Request interceptor**  
Reads `accessToken` from localStorage and attaches `Authorization: Bearer <token>` to every outgoing request.

**Response interceptor — on 401**  
1. Queue any concurrent requests that also receive a 401 while refresh is in flight (prevents multiple simultaneous refresh calls)
2. Call `POST /api/auth/refresh` with `{ refreshToken }`
3. **If refresh succeeds:** save new `accessToken` via `tokenStorage`, replay the original request, drain the queue
4. **If refresh fails:** call `clearTokens()`, redirect to `/admin/login`, reject all queued requests

---

## 3. Service Layer & Hooks

### `loginAdminHook.js`
Thin axios call using `axiosAdmin` instance:
```
POST /api/auth/setup  →  { accessToken, refreshToken }
```

### `loginAdminService.js`
Two exported functions:
- `login({ username, password })` — calls hook, stores both tokens via `tokenStorage`
- `logout()` — calls `clearTokens()`, redirects to `/admin/login`

### `login.jsx`
No changes to UI or validation logic. Only change: the component no longer handles tokens — it calls `login()` and navigates on success.

---

## 4. Route Protection

### `PrivateRoute.jsx`
New component that guards protected routes:
- If `accessToken` present in localStorage → renders `<Outlet />`
- If missing → `<Navigate to="/admin/login" replace />`

> Note: PrivateRoute only checks for token *presence*, not validity. An expired token will pass through — the axios interceptor handles expiry silently on the first real API call.

### `AppRoute.jsx` — updated route tree
```
/                       → TradingView
/admin                  → AdminLogin
/admin/login            → AdminLogin
/admin  (PrivateRoute)
  ├── /admin/user       → Admin layout + ManagerUser
  └── /admin/kyc        → Admin layout + KycAdmin
```

### `Admin/index.jsx`
Logout button calls `logout()` from `loginAdminService` (clears tokens + navigates) instead of navigating directly.

---

## 5. File Changelist

| File | Action |
|------|--------|
| `src/feature/auth/admin/untils/tokenStorage.js` | **New** — localStorage helpers |
| `src/feature/auth/admin/untils/axiosAdmin.js` | **New** — axios instance + interceptors |
| `src/feature/auth/admin/hooks/loginAdminHook.js` | **Rewrite** — use axiosAdmin, return `{ accessToken, refreshToken }` |
| `src/feature/auth/admin/services/loginAdminService.js` | **Rewrite** — `login()` + `logout()` using tokenStorage |
| `src/feature/auth/admin/layouts/login.jsx` | **Minor update** — no token logic in component |
| `src/feature/auth/admin/index.jsx` | **Minor update** — logout calls service |
| `src/routes/PrivateRoute.jsx` | **New** — route guard |
| `src/routes/AppRoute.jsx` | **Update** — wrap protected routes with PrivateRoute |

---

## 6. Backend Contract (assumed)

```
POST /api/auth/setup
  Body: { username, password }
  Response: { accessToken: string, refreshToken: string }

POST /api/auth/refresh
  Body: { refreshToken: string }
  Response: { accessToken: string }
```

Errors return HTTP `401`. No changes to backend are in scope for this design.
