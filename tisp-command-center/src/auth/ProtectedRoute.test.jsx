import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

afterEach(() => cleanup());

const makeAuth = (overrides = {}) => ({
  authenticated: true,
  loading: false,
  userInfo: null,
  token: null,
  logout: undefined,
  ...overrides,
});

const wrap = (authValue, element, { initialEntries = ['/protected'] } = {}) =>
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/protected" element={element} />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('ProtectedRoute — critical auth paths', () => {
  it('shows loading screen while Keycloak is initializing', () => {
    wrap(
      makeAuth({ loading: true, authenticated: false }),
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
    );
    expect(screen.queryByText('Authenticating')).not.toBeNull();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('shows auth-required screen when not authenticated', () => {
    wrap(
      makeAuth({ authenticated: false }),
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
    );
    expect(screen.queryByText('Authentication required')).not.toBeNull();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('renders children when authenticated with no role requirement', () => {
    wrap(
      makeAuth({ authenticated: true }),
      <ProtectedRoute><div>Protected Content</div></ProtectedRoute>
    );
    expect(screen.queryByText('Protected Content')).not.toBeNull();
  });

  it('passes through when authenticated user has the required role', () => {
    wrap(
      makeAuth({
        authenticated: true,
        userInfo: { realm_access: { roles: ['analyst', 'admin'] } },
      }),
      <ProtectedRoute requiredRole="admin"><div>Admin Area</div></ProtectedRoute>
    );
    expect(screen.queryByText('Admin Area')).not.toBeNull();
  });

  it('redirects to / when authenticated user lacks the required role', () => {
    wrap(
      makeAuth({
        authenticated: true,
        userInfo: { realm_access: { roles: ['analyst'] } },
      }),
      <ProtectedRoute requiredRole="admin"><div>Admin Area</div></ProtectedRoute>
    );
    expect(screen.queryByText('Home Page')).not.toBeNull();
    expect(screen.queryByText('Admin Area')).toBeNull();
  });

  it('allows access when KC is unconfigured (simulation mode — no userInfo)', () => {
    wrap(
      makeAuth({ authenticated: true, userInfo: null }),
      <ProtectedRoute requiredRole="admin"><div>Admin Area</div></ProtectedRoute>
    );
    // No userInfo means KC is unconfigured; role check is skipped entirely
    expect(screen.queryByText('Admin Area')).not.toBeNull();
  });
});
