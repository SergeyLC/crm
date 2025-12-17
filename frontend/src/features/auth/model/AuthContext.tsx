"use client";
import { createContext } from "react";
import { AuthState, LoginCredentials } from "./types";

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false, // Changed to false to prevent form blocking on initial render
  error: null,
};

const defaultContextValue: AuthContextType = {
  ...initialState,
  login: async () => {
    throw new Error('AuthContext not initialized');
  },
  logout: async () => {
    throw new Error('AuthContext not initialized');
  },
  checkAuth: async () => {
    throw new Error('AuthContext not initialized');
  },
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);
