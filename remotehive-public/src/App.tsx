import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider, isAuthEnabled } from './components/AuthComponents';
import OnboardingCheck from './components/OnboardingCheck';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './pages/HomePage';
import { JobsPage } from './pages/JobsPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { CompanyDetailPage } from './pages/CompanyDetailPage';
import { AboutPage } from './pages/AboutPage';
import { PricingPage } from './pages/PricingPage';
import { ContactPage } from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { FAQPage } from './pages/FAQPage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { SSOCallbackPage } from './pages/SSOCallbackPage';
import { OnboardingPage } from './pages/OnboardingPage';

import { ResumeBuilder } from './components/resume/ResumeBuilder';
import { BuilderLayout } from '@/client/pages/builder/layout';
import { ResumeLoader } from './components/resume/ResumeLoader';
import { ResumeProviders } from './components/resume/ResumeProviders';
import { ResumeArtboardLayout } from './components/resume/ResumeArtboard';
import { BuilderLayout as ArtboardBuilderPage } from '@/artboard/pages/builder';
import { PreviewLayout as ArtboardPreviewPage } from '@/artboard/pages/preview';

import { DashboardLayout } from './layouts/DashboardLayout';
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { ApplicationsPage } from './pages/dashboard/ApplicationsPage';
import { SavedJobsPage } from './pages/dashboard/SavedJobsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';

// Placeholder key - user must replace this in .env
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder';

export default function App() {
  return (
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      {!isAuthEnabled && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-800">
          ⚠️ Authentication is disabled. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file.
        </div>
      )}
      <BrowserRouter>
        <OnboardingCheck>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            
            {/* Public Routes */}
            <Route path="/" element={<RootLayout />}>
              <Route index element={<HomePage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="jobs/:id" element={<JobDetailPage />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="companies/:id" element={<CompanyDetailPage />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="faq" element={<FAQPage />} />
              <Route path="sign-in/*" element={<SignInPage />} />
              <Route path="sign-up/*" element={<SignUpPage />} />
              <Route path="sso-callback" element={<SSOCallbackPage />} />
            </Route>

            {/* Job Seeker Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="resume-builder" element={<ResumeBuilder />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="saved-jobs" element={<SavedJobsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Resume Editor Routes */}
            <Route path="/builder" element={
              <ResumeProviders>
                <BuilderLayout />
              </ResumeProviders>
            }>
              <Route path=":id" element={<ResumeLoader />} />
            </Route>

            {/* Resume Artboard Routes */}
            <Route path="/artboard" element={<ResumeArtboardLayout />}>
              <Route path="builder" element={<ArtboardBuilderPage />} />
              <Route path="preview" element={<ArtboardPreviewPage />} />
            </Route>
          </Routes>
        </OnboardingCheck>
      </BrowserRouter>
    </ClerkProvider>
  );
}


