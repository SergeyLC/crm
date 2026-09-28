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
 * AuthProvider — always mounts the same tree on server and client.
 * Token / localStorage are read only in useEffect to avoid hydration mismatches.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      dispatch({ type: "AUTH_CHECK_FAILURE" });
      return;
    }

    try {
      dispatch({ type: "AUTH_CHECK_START" });
      const user = await authApi.getCurrentUser(token);
      dispatch({ type: "AUTH_CHECK_SUCCESS", payload: { user, token } });
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
      dispatch({ type: "AUTH_CHECK_FAILURE" });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: "LOGIN_START" });
      const { user, token } = await authApi.login(credentials);
      localStorage.setItem("token", token);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user, token } });
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
      if (state.token) {
        await authApi.logout(state.token);
      }
    } finally {
      localStorage.removeItem("token");
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
