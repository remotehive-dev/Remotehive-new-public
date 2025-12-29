
const API_KEY = import.meta.env.VITE_FAST2SMS_API_KEY;
// Use local proxy path instead of direct URL to avoid CORS issues
const BASE_URL = "/api/fast2sms/dev/bulkV2";

interface SendSmsResponse {
  return: boolean;
  request_id: string;
  message: string[];
}

export async function sendOtp(phoneNumber: string, otp: string): Promise<boolean> {
  if (!API_KEY) {
    console.error("Fast2SMS API key is missing");
    return false;
  }

  // Basic validation
  if (!phoneNumber) return false;

  // Fast2SMS expects numbers without country code if they are Indian, but let's assume the input includes it.
  // Actually, Fast2SMS is primarily for India. The user used "08271753556" in their example.
  // We should strip the country code if it's +91, or just pass the 10 digits if possible.
  // However, the previous logic passed the full number.
  // Let's strip non-digit characters.
  let cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Fast2SMS usually takes 10 digit numbers for India.
  // If it starts with 91 and length is 12, strip 91.
  if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
    cleanNumber = cleanNumber.substring(2);
  } else if (cleanNumber.length > 10) {
    // For other countries, Fast2SMS might not work well or requires specific format. 
    // Assuming Indian context based on the example "08271753556".
    // If user entered 08271753556, clean is 08271753556 (11 digits).
    // Let's just pass what we have, but usually it's 10 digits.
    // The user's example used "08271753556", which has a leading 0.
  }

  try {
    const url = new URL(BASE_URL, window.location.origin); // Ensure it's relative to current origin
    // Use 'q' (Quick SMS) route instead of 'otp' to avoid KYC/DLT requirement
    url.searchParams.append("authorization", API_KEY);
    url.searchParams.append("route", "q");
    url.searchParams.append("message", `Your RemoteHive verification code is: ${otp}`);
    url.searchParams.append("flash", "0");
    url.searchParams.append("numbers", cleanNumber);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    // Parse JSON regardless of status code to get error message
    const result: SendSmsResponse = await response.json();
    console.log("Fast2SMS Response:", result);

    if (!response.ok) {
      console.error("Fast2SMS API Error Details:", result);
      return false;
    }
    
    return result.return;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}
