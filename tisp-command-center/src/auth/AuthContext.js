import { createContext } from 'react';

export const AuthContext = createContext({
  token: null,
  authenticated: false,
  loading: false,
  userInfo: null,
  logout: undefined,
});
