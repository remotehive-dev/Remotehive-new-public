import { 
  SignedIn as ClerkSignedIn, 
  SignedOut as ClerkSignedOut, 
  UserButton as ClerkUserButton,
  ClerkProvider as RealClerkProvider,
  AuthenticateWithRedirectCallback as ClerkAuthenticateWithRedirectCallback
} from '@clerk/clerk-react';
import React, { ReactNode } from 'react';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const IS_CLERK_CONFIGURED = CLERK_KEY && CLERK_KEY !== 'pk_test_placeholder';

// Mock Components
const MockSignedIn = ({ children }: { children: ReactNode }) => null;
const MockSignedOut = ({ children }: { children: ReactNode }) => <>{children}</>;
const MockUserButton = () => <div className="h-8 w-8 rounded-full bg-slate-200" />;
const MockClerkProvider = ({ children }: { children: ReactNode; publishableKey: string }) => <>{children}</>;
const MockAuthenticateWithRedirectCallback = () => <div>Processing...</div>;

// Export conditional components
export const SignedIn = IS_CLERK_CONFIGURED ? ClerkSignedIn : MockSignedIn;
export const SignedOut = IS_CLERK_CONFIGURED ? ClerkSignedOut : MockSignedOut;
export const UserButton = IS_CLERK_CONFIGURED ? ClerkUserButton : MockUserButton;
export const ClerkProvider = IS_CLERK_CONFIGURED ? RealClerkProvider : MockClerkProvider;
export const AuthenticateWithRedirectCallback = IS_CLERK_CONFIGURED ? ClerkAuthenticateWithRedirectCallback : MockAuthenticateWithRedirectCallback;

export const isAuthEnabled = IS_CLERK_CONFIGURED;
