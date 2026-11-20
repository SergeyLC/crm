"use client";
import { ReactNode, useReducer, useEffect } from "react";
import { AuthContext, initialState } from "../model/AuthContext";
import { LoginCredentials } from "../model/types";
import { authReducer } from "../model/authReducer";
import { authApi } from "../lib";
import {
  installSessionExpiryFetchGuard,
  SESSION_EXPIRED_EVENT,
  setExpectAuthenticatedSession,
} from "@/shared/lib/sessionExpiry";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider — session via HttpOnly `crm_session` cookie.
 * Auth check runs in useEffect so SSR/client trees match (no localStorage token).
 * Mid-session API 401s clear auth so ProtectedRoute redirects to login.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuth = async () => {
    setExpectAuthenticatedSession(false);
    try {
      dispatch({ type: "AUTH_CHECK_START" });
      const user = await authApi.getCurrentUser();
      if (!user) {
        dispatch({ type: "AUTH_CHECK_FAILURE" });
        return;
      }
      dispatch({ type: "AUTH_CHECK_SUCCESS", payload: { user } });
      setExpectAuthenticatedSession(true);
    } catch (error) {
      console.error("Auth check failed:", error);
      dispatch({ type: "AUTH_CHECK_FAILURE" });
      setExpectAuthenticatedSession(false);
    }
  };

  useEffect(() => {
    const uninstallFetchGuard = installSessionExpiryFetchGuard();
    const onSessionExpired = () => {
      dispatch({ type: "LOGOUT" });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    checkAuth();
    return () => {
      uninstallFetchGuard();
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
      setExpectAuthenticatedSession(false);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: "LOGIN_START" });
      const { user } = await authApi.login(credentials);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
      setExpectAuthenticatedSession(true);
    } catch (error) {
      setExpectAuthenticatedSession(false);
      dispatch({
        type: "LOGIN_FAILURE",
        payload: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  };

  const logout = async () => {
    setExpectAuthenticatedSession(false);
    try {
      await authApi.logout();
    } finally {
      dispatch({ type: "LOGOUT" });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
