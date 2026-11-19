"use client";
import { ReactNode, useReducer, useEffect } from "react";
import { AuthContext, initialState } from "../model/AuthContext";
import { LoginCredentials } from "../model/types";
import { authReducer } from "../model/authReducer";
import { authApi } from "../lib";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider — session via HttpOnly `crm_session` cookie.
 * Auth check runs in useEffect so SSR/client trees match (no localStorage token).
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuth = async () => {
    try {
      dispatch({ type: "AUTH_CHECK_START" });
      const user = await authApi.getCurrentUser();
      if (!user) {
        dispatch({ type: "AUTH_CHECK_FAILURE" });
        return;
      }
      dispatch({ type: "AUTH_CHECK_SUCCESS", payload: { user } });
    } catch (error) {
      console.error("Auth check failed:", error);
      dispatch({ type: "AUTH_CHECK_FAILURE" });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: "LOGIN_START" });
      const { user } = await authApi.login(credentials);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
    } catch (error) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  };

  const logout = async () => {
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
