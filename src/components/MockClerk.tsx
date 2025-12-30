import { ReactNode } from 'react';

export const SignedIn = ({ children }: { children: ReactNode }) => {
  // Mock: Always signed out for now
  return null;
};

export const SignedOut = ({ children }: { children: ReactNode }) => {
  // Mock: Always signed out for now
  return <>{children}</>;
};

export const UserButton = () => {
  return <div className="h-8 w-8 rounded-full bg-slate-200" />;
};

export const ClerkProvider = ({ children }: { children: ReactNode; publishableKey: string }) => {
  return <>{children}</>;
};
