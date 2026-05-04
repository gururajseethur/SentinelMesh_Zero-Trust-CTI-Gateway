import React, { useCallback, useEffect, useRef, useState } from 'react';
import Keycloak from 'keycloak-js';
import { Shield } from 'lucide-react';
import { AuthContext } from './AuthContext';
import { platformAPI } from '../lib/platformAPI';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM;
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
const IS_LIVE = import.meta.env.VITE_API_MODE === 'live';

const KC_CONFIGURED = Boolean(KEYCLOAK_URL && KEYCLOAK_REALM && KEYCLOAK_CLIENT_ID);

// In live mode, missing KC vars is a deployment error — must not silently bypass auth.
const KC_REQUIRED_BUT_MISSING = IS_LIVE && !KC_CONFIGURED;

function KCMissingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/30 bg-danger/10">
          <Shield size={28} className="text-danger" />
        </div>
        <p className="text-sm font-bold text-on-surface">Configuration Error</p>
        <p className="text-xs text-on-surface-muted leading-relaxed">
          <code className="font-mono">VITE_API_MODE=live</code> requires Keycloak to be
          configured. Set <code className="font-mono">VITE_KEYCLOAK_URL</code>,{' '}
          <code className="font-mono">VITE_KEYCLOAK_REALM</code>, and{' '}
          <code className="font-mono">VITE_KEYCLOAK_CLIENT_ID</code> in your{' '}
          <code className="font-mono">.env</code> file.
        </p>
      </div>
    </div>
  );
}

export function AuthProvider({ children }) {
  // All hooks must be called unconditionally — conditional return is after them.
  const [token, setToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [authenticated, setAuthenticated] = useState(!KC_CONFIGURED);
  const [loading, setLoading] = useState(KC_CONFIGURED);
  const [kcInstance, setKcInstance] = useState(null);
  const kcRef = useRef(null);

  const refreshToken = useCallback(async () => {
    const kc = kcRef.current;
    if (!kc) return;
    try {
      const refreshed = await kc.updateToken(60);
      if (refreshed) {
        setToken(kc.token);
        platformAPI.setToken(kc.token);
      }
    } catch {
      kc.logout();
    }
  }, []);

  useEffect(() => {
    if (!KC_CONFIGURED) return;

    const kc = new Keycloak({
      url: KEYCLOAK_URL,
      realm: KEYCLOAK_REALM,
      clientId: KEYCLOAK_CLIENT_ID,
    });
    kcRef.current = kc;

    let intervalId;

    kc.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    })
      .then((auth) => {
        setAuthenticated(auth);
        const t = kc.token ?? null;
        setToken(t);
        setUserInfo(kc.tokenParsed ?? null);
        platformAPI.setToken(t);
        setKcInstance(kc);
        setLoading(false);
        kc.onTokenExpired = refreshToken;
        intervalId = setInterval(refreshToken, 55_000);
      })
      .catch(() => {
        setLoading(false);
      });

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshToken]);

  // Conditional return is AFTER all hooks — rules-of-hooks compliant.
  if (KC_REQUIRED_BUT_MISSING) return <KCMissingScreen />;

  return (
    <AuthContext.Provider
      value={{
        token,
        userInfo,
        authenticated,
        loading,
        logout: kcInstance ? () => kcInstance.logout() : undefined,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
