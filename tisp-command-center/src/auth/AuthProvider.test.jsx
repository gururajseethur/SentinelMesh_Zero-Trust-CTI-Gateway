import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { AuthContext } from './AuthContext';
import { useAuth } from './useAuth';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function AuthStateDisplay() {
  const { authenticated, loading, userInfo, token } = useAuth();
  return (
    <div>
      <span data-testid="authenticated">{String(authenticated)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="userinfo">{userInfo ? userInfo.preferred_username : 'null'}</span>
      <span data-testid="token">{token ?? 'null'}</span>
    </div>
  );
}

describe('AuthContext default value', () => {
  it('provides safe defaults when no AuthProvider wraps the tree', () => {
    render(<AuthStateDisplay />);
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('userinfo').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
  });
});

describe('AuthContext.Provider — simulation mode (KC not configured)', () => {
  it('authenticated=true with no userInfo when KC is unconfigured', () => {
    render(
      <AuthContext.Provider value={{ authenticated: true, loading: false, userInfo: null, token: null, logout: undefined }}>
        <AuthStateDisplay />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('userinfo').textContent).toBe('null');
  });
});

describe('AuthContext.Provider — live mode (KC configured)', () => {
  it('exposes parsed userInfo once KC resolves', () => {
    const fakeUser = { preferred_username: 'analyst01', realm_access: { roles: ['analyst'] } };
    render(
      <AuthContext.Provider value={{ authenticated: true, loading: false, userInfo: fakeUser, token: 'tok123', logout: vi.fn() }}>
        <AuthStateDisplay />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('userinfo').textContent).toBe('analyst01');
    expect(screen.getByTestId('token').textContent).toBe('tok123');
  });

  it('loading=true while KC initializes — auth state is indeterminate', () => {
    render(
      <AuthContext.Provider value={{ authenticated: false, loading: true, userInfo: null, token: null, logout: undefined }}>
        <AuthStateDisplay />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it('logout function is provided and callable when KC is live', () => {
    const logoutSpy = vi.fn();

    function LogoutButton() {
      const { logout } = useAuth();
      return <button onClick={logout}>Sign out</button>;
    }

    render(
      <AuthContext.Provider value={{ authenticated: true, loading: false, userInfo: {}, token: 't', logout: logoutSpy }}>
        <LogoutButton />
      </AuthContext.Provider>
    );

    screen.getByText('Sign out').click();
    expect(logoutSpy).toHaveBeenCalledOnce();
  });

  it('logout is undefined in simulation mode — button click is a no-op', () => {
    function LogoutButton() {
      const { logout } = useAuth();
      return <button onClick={logout} data-testid="logout-btn">Sign out</button>;
    }

    render(
      <AuthContext.Provider value={{ authenticated: true, loading: false, userInfo: null, token: null, logout: undefined }}>
        <LogoutButton />
      </AuthContext.Provider>
    );

    // Clicking when logout is undefined must not throw
    expect(() => screen.getByTestId('logout-btn').click()).not.toThrow();
  });
});
