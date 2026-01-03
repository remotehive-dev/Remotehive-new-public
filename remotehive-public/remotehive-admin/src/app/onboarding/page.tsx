"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createCompany, createUser } from "../../lib/api";
import { Building2, ArrowRight, Loader2, ShieldCheck, RotateCw } from "lucide-react";
import { sendOtp } from "../../lib/fast2sms";
import clsx from "clsx";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phone Verification
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("IN");
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    setPhoneVerified(false);
    setOtpSent(false);
    setEnteredOtp("");
    setResendTimer(0);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPhoneCountryCode(e.target.value);
    setPhoneVerified(false);
    setOtpSent(false);
    setEnteredOtp("");
    setResendTimer(0);
  };

  const validatePhone = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (phoneCountryCode === 'IN') {
       return cleanPhone.length >= 10;
    }
    return cleanPhone.length >= 8;
  };

  const handleVerifyPhone = async () => {
    if (!phone) return;

    if (!validatePhone(phone)) {
      alert("Please enter a valid phone number");
      return;
    }

    setIsVerifyingPhone(true);
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    
    // Format phone number
    const phoneNumber = phone.replace(/\D/g, '');
    const finalNumber = phoneCountryCode === 'IN' ? phoneNumber.slice(-10) : phoneNumber;
    
    const sent = await sendOtp(finalNumber, otp);
    
    if (sent) {
      setOtpSent(true);
      setResendTimer(30);
      alert(`OTP sent to ${finalNumber}`);
    } else {
      alert("Failed to send OTP. Please try again.");
    }
    
    setIsVerifyingPhone(false);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    await handleVerifyPhone();
  };

  const handleConfirmOtp = () => {
    if (enteredOtp === generatedOtp) {
      setPhoneVerified(true);
      setOtpSent(false);
      setGeneratedOtp(null);
      setEnteredOtp("");
    } else {
      alert("Invalid OTP.");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError("You must be logged in to continue.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const companyName = formData.get('name') as string;
    
    try {
      // 1. Create Company
      const companyData = {
        name: companyName,
        website_url: formData.get('website_url') as string,
        logo_url: "", // Can add later
        description: "",
        type: "Startup",
        locations: [],
        tags: [],
      };

      const newCompany = await createCompany(companyData);

      // 2. Create User linked to Company
      await createUser(
        user.id,
        user.primaryEmailAddress?.emailAddress || "",
        user.fullName || "",
        'employer',
        (newCompany as any).id,
        phone,
        phoneVerified
      );

      // 3. Redirect to Dashboard
      router.push('/');
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create company profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Create your Company Profile</h2>
          <p className="mt-2 text-sm text-slate-500">
            To start posting jobs, tell us a bit about your company.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Company Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="Acme Inc."
              />
            </div>

            <div>
              <label htmlFor="website_url" className="block text-sm font-medium text-slate-700">
                Website URL
              </label>
              <input
                id="website_url"
                name="website_url"
                type="url"
                required
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                placeholder="https://acme.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  value={phoneCountryCode}
                  onChange={handleCountryChange}
                  className="mt-1 block w-24 rounded-md border border-slate-300 px-2 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-white"
                >
                  <option value="IN">+91</option>
                  <option value="US">+1</option>
                  <option value="UK">+44</option>
                </select>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder="9876543210"
                />
              </div>
              {phone && (
                <div className="mt-2 flex items-center gap-3">
                  {phoneVerified ? (
                    <div className="flex items-center text-green-600 gap-1 text-sm font-medium px-3 py-1 rounded-full bg-green-50 border border-green-200">
                      <ShieldCheck className="h-4 w-4" /> Verified
                    </div>
                  ) : otpSent ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="OTP"
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value)}
                        className="block w-24 rounded-md border border-slate-300 px-3 py-1 text-center shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleConfirmOtp}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Verify
                      </button>
                      {resendTimer > 0 ? (
                         <span className="text-xs text-gray-500 font-medium ml-2">
                           Resend in {resendTimer}s
                         </span>
                       ) : (
                         <button
                           type="button"
                           onClick={handleResendOtp}
                           className="ml-2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                           title="Resend OTP"
                         >
                           <RotateCw className="h-4 w-4" />
                         </button>
                       )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleVerifyPhone}
                      disabled={isVerifyingPhone}
                      className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isVerifyingPhone ? <Loader2 className="h-3 w-3 animate-spin" /> : "Verify Number"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
          >
            {isLoading ? "Creating..." : (
              <>
                Continue to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
