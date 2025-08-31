"use client";
import { ProtectedRoute } from '@/features/auth';
export function ProtectedShell({ children }: { children: React.ReactNode }) { return <ProtectedRoute>{children}</ProtectedRoute>; }
