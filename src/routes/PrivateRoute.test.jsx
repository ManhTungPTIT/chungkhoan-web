import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

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
