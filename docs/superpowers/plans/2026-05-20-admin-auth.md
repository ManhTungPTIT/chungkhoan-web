# Admin Auth — Access Token + Refresh Token Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-token admin login with a proper access token + refresh token flow, including silent refresh via axios interceptor and route protection.

**Architecture:** Plain service layer (no React context). A `tokenStorage.js` helper owns all localStorage access. An `axiosAdmin.js` instance handles auth headers and silent token refresh on 401. A `PrivateRoute` component guards the nested admin routes.

**Tech Stack:** React 19, React Router v7, axios 1.x, Vite 8, Vitest (to be added)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/feature/auth/admin/untils/tokenStorage.js` | **Create** | localStorage read/write for accessToken + refreshToken |
| `src/feature/auth/admin/untils/axiosAdmin.js` | **Create** | Configured axios instance with auth + silent refresh interceptors |
| `src/feature/auth/admin/hooks/loginAdminHook.js` | **Rewrite** | POST /api/auth/setup via axiosAdmin |
| `src/feature/auth/admin/services/loginAdminService.js` | **Rewrite** | `login()` + `logout()` using tokenStorage |
| `src/routes/PrivateRoute.jsx` | **Create** | Checks accessToken presence, renders Outlet or redirects |
| `src/routes/AppRoute.jsx` | **Update** | Wrap /admin/user and /admin/kyc with PrivateRoute |
| `src/feature/auth/admin/index.jsx` | **Update** | Logout button calls service logout() |
| `src/feature/auth/admin/layouts/login.jsx` | **No change** | Interface unchanged — login() signature stays the same |
| `vite.config.ts` | **Update** | Add Vitest test config |
| `src/test/setup.js` | **Create** | Vitest global setup |

---

## Task 1: Set up Vitest

**Files:**
- Modify: `vite.config.ts`
- Create: `src/test/setup.js`

- [ ] **Step 1: Install Vitest and jsdom**

```bash
npm install --save-dev vitest jsdom @vitest/ui
```

Expected: packages added to `devDependencies` in `package.json`.

- [ ] **Step 2: Add test config to `vite.config.ts`**

Replace the entire file with:

```ts
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
})
```

- [ ] **Step 3: Create test setup file**

Create `src/test/setup.js`:

```js
// intentionally empty — extend here if @testing-library/jest-dom is added later
```

- [ ] **Step 4: Add test script to `package.json`**

In the `"scripts"` section, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify Vitest runs**

```bash
npm test
```

Expected output: `No test files found` (zero failures — no tests exist yet).

- [ ] **Step 6: Commit**

```bash
git add vite.config.ts src/test/setup.js package.json package-lock.json
git commit -m "chore: add Vitest with jsdom environment"
```

---

## Task 2: tokenStorage.js

**Files:**
- Create: `src/feature/auth/admin/untils/tokenStorage.js`
- Create: `src/feature/auth/admin/untils/tokenStorage.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/feature/auth/admin/untils/tokenStorage.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setTokens,
  clearTokens,
} from './tokenStorage';

beforeEach(() => localStorage.clear());

describe('tokenStorage', () => {
  it('getAccessToken returns null when nothing stored', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('setAccessToken stores accessToken', () => {
    setAccessToken('abc');
    expect(localStorage.getItem('accessToken')).toBe('abc');
  });

  it('getAccessToken reads stored accessToken', () => {
    localStorage.setItem('accessToken', 'abc');
    expect(getAccessToken()).toBe('abc');
  });

  it('getRefreshToken reads stored refreshToken', () => {
    localStorage.setItem('refreshToken', 'xyz');
    expect(getRefreshToken()).toBe('xyz');
  });

  it('setTokens stores both tokens', () => {
    setTokens({ accessToken: 'at', refreshToken: 'rt' });
    expect(localStorage.getItem('accessToken')).toBe('at');
    expect(localStorage.getItem('refreshToken')).toBe('rt');
  });

  it('clearTokens removes both tokens', () => {
    setTokens({ accessToken: 'at', refreshToken: 'rt' });
    clearTokens();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: 6 failures — `tokenStorage` module not found.

- [ ] **Step 3: Implement tokenStorage.js**

Create `src/feature/auth/admin/untils/tokenStorage.js`:

```js
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
export const setAccessToken = (token) => localStorage.setItem(ACCESS_KEY, token);
export const setTokens = ({ accessToken, refreshToken }) => {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
};
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/feature/auth/admin/untils/tokenStorage.js src/feature/auth/admin/untils/tokenStorage.test.js
git commit -m "feat: add tokenStorage helper for accessToken + refreshToken"
```

---

## Task 3: axiosAdmin.js (axios instance + interceptors)

**Files:**
- Create: `src/feature/auth/admin/untils/axiosAdmin.js`

No unit test for the interceptors — they require deep axios internals mocking. Manual verification in Task 9 covers this.

- [ ] **Step 1: Create axiosAdmin.js**

Create `src/feature/auth/admin/untils/axiosAdmin.js`:

```js
import axios from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from './tokenStorage';

const axiosAdmin = axios.create({
  baseURL: import.meta.env.VITE_BACK_API_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

axiosAdmin.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosAdmin.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return axiosAdmin(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACK_API_URL}/api/auth/refresh`,
        { refreshToken: getRefreshToken() },
      );
      setAccessToken(data.accessToken);
      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return axiosAdmin(original);
    } catch (err) {
      processQueue(err, null);
      clearTokens();
      window.location.href = '/admin/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosAdmin;
```

- [ ] **Step 2: Commit**

```bash
git add src/feature/auth/admin/untils/axiosAdmin.js
git commit -m "feat: add axiosAdmin instance with silent refresh interceptor"
```

---

## Task 4: Rewrite loginAdminHook.js

**Files:**
- Modify: `src/feature/auth/admin/hooks/loginAdminHook.js`

- [ ] **Step 1: Rewrite loginAdminHook.js**

Replace the entire file with:

```js
import axiosAdmin from '../untils/axiosAdmin';

export default async function loginAdminHook(data) {
  const response = await axiosAdmin.post('/api/auth/setup', data);
  return response;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/feature/auth/admin/hooks/loginAdminHook.js
git commit -m "feat: update loginAdminHook to use axiosAdmin instance"
```

---

## Task 5: Rewrite loginAdminService.js

**Files:**
- Modify: `src/feature/auth/admin/services/loginAdminService.js`

- [ ] **Step 1: Rewrite loginAdminService.js**

Replace the entire file with:

```js
import loginAdminHook from '../hooks/loginAdminHook';
import { setTokens, clearTokens } from '../untils/tokenStorage';

export function LoginAdminService() {
  const login = async (data) => {
    const response = await loginAdminHook(data);
    setTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });
  };

  const logout = () => {
    clearTokens();
    window.location.href = '/admin/login';
  };

  return { login, logout };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/feature/auth/admin/services/loginAdminService.js
git commit -m "feat: update loginAdminService to store accessToken + refreshToken, add logout"
```

---

## Task 6: PrivateRoute.jsx

**Files:**
- Create: `src/routes/PrivateRoute.jsx`
- Create: `src/routes/PrivateRoute.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/routes/PrivateRoute.test.jsx`:

```jsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

// Install: npm install --save-dev @testing-library/react
// Then add `import '@testing-library/jest-dom'` to src/test/setup.js

beforeEach(() => localStorage.clear());

function renderWithRouter(initialEntry = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/protected" element={<div>secret</div>} />
        </Route>
        <Route path="/admin/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PrivateRoute', () => {
  it('renders children when accessToken is present', () => {
    localStorage.setItem('accessToken', 'valid-token');
    renderWithRouter();
    expect(screen.getByText('secret')).toBeDefined();
  });

  it('redirects to /admin/login when accessToken is absent', () => {
    renderWithRouter();
    expect(screen.getByText('login page')).toBeDefined();
  });
});
```

- [ ] **Step 2: Install @testing-library/react**

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Update `src/test/setup.js` to import jest-dom matchers**

Replace the file with:

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Run tests to confirm they fail**

```bash
npm test
```

Expected: 2 failures — `PrivateRoute` not found.

- [ ] **Step 5: Implement PrivateRoute.jsx**

Create `src/routes/PrivateRoute.jsx`:

```jsx
import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken } from '../feature/auth/admin/untils/tokenStorage';

export default function PrivateRoute() {
  return getAccessToken() ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
npm test
```

Expected: all tests pass (6 tokenStorage + 2 PrivateRoute = 8 total).

- [ ] **Step 7: Commit**

```bash
git add src/routes/PrivateRoute.jsx src/routes/PrivateRoute.test.jsx src/test/setup.js package.json package-lock.json
git commit -m "feat: add PrivateRoute guard; redirect to /admin/login when no accessToken"
```

---

## Task 7: Update AppRoute.jsx

**Files:**
- Modify: `src/routes/AppRoute.jsx`

- [ ] **Step 1: Update AppRoute.jsx**

Replace the entire file with:

```jsx
import { Routes, Route } from 'react-router-dom';
import Admin from '../feature/auth/admin/index';
import ManagerUser from '../feature/auth/admin/layouts/managerUser';
import KycAdmin from '../feature/auth/admin/layouts/KycAdmin_1';
import TradingView from '../feature/chart/index';
import AdminLogin from '../feature/auth/admin/layouts/login';
import PrivateRoute from './PrivateRoute';

function AppRoute() {
  return (
    <Routes>
      <Route path="/" element={<TradingView />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<PrivateRoute />}>
        <Route path="/admin" element={<Admin />}>
          <Route path="user" element={<ManagerUser />} />
          <Route path="kyc" element={<KycAdmin />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoute;
```

> Note: React Router v6 ranking means the flat `/admin` route (AdminLogin) wins for an exact `/admin` match. The nested `/admin` inside PrivateRoute only activates for `/admin/user` and `/admin/kyc`.

- [ ] **Step 2: Commit**

```bash
git add src/routes/AppRoute.jsx
git commit -m "feat: protect /admin/user and /admin/kyc with PrivateRoute"
```

---

## Task 8: Update Admin/index.jsx logout

**Files:**
- Modify: `src/feature/auth/admin/index.jsx`

- [ ] **Step 1: Update Admin/index.jsx**

Replace the entire file with:

```jsx
import { Outlet, Link } from 'react-router-dom';
import './admin.scss';
import { LoginAdminService } from './services/loginAdminService';

function Admin() {
  const { logout } = LoginAdminService();

  return (
    <div className="admin_container">
      <div className="admin_header">
        <img
          src="https://images.pexels.com/photos/18101841/pexels-photo-18101841.jpeg"
          alt="Anh"
        />
        <button onClick={logout}>Logout</button>
      </div>
      <div className="admin_body">
        <div className="sidebar">
          <Link className="sidebar_item" to="/admin/user">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              style={{ width: '1.5rem', height: '1.5rem' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
            Quản lý người dùng
          </Link>
        </div>
        <div className="container">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Admin;
```

- [ ] **Step 2: Commit**

```bash
git add src/feature/auth/admin/index.jsx
git commit -m "feat: wire Admin logout button to LoginAdminService.logout()"
```

---

## Task 9: Manual smoke test

No automated test for end-to-end flow — requires a running backend.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify unauthenticated redirect**

Navigate to `http://localhost:5173/admin/user` in the browser.  
Expected: redirected to `/admin/login`.

- [ ] **Step 3: Verify login stores both tokens**

Open DevTools → Application → Local Storage.  
Submit the login form with valid credentials.  
Expected: `accessToken` and `refreshToken` both appear in localStorage.  
Expected: navigated to `/admin/user`.

- [ ] **Step 4: Verify protected route access after login**

Navigate to `http://localhost:5173/admin/user` while tokens are present.  
Expected: admin dashboard renders (no redirect).

- [ ] **Step 5: Verify logout clears tokens**

Click the Logout button.  
Expected: both `accessToken` and `refreshToken` removed from localStorage.  
Expected: navigated to `/admin/login`.

- [ ] **Step 6: Verify 401 silent refresh (requires backend support)**

With a valid session, manually expire the `accessToken` in localStorage (replace it with a tampered string).  
Make any admin API call (e.g., navigate to a page that fetches data).  
Expected: axios interceptor calls `/api/auth/refresh` automatically, updates `accessToken`, and retries the original request without a visible error.

- [ ] **Step 7: Verify refresh failure redirects to login**

With tokens present, replace both `accessToken` and `refreshToken` with invalid strings.  
Trigger an API call.  
Expected: redirected to `/admin/login`, both tokens cleared from localStorage.
