
const API_KEY = process.env.NEXT_PUBLIC_FAST2SMS_API_KEY;
// Use local proxy to avoid CORS
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

  if (!phoneNumber) return false;

  let cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
    cleanNumber = cleanNumber.substring(2);
  }

  try {
    const params = new URLSearchParams({
      authorization: API_KEY,
      route: "q",
      message: `Your RemoteHive verification code is: ${otp}`,
      flash: "0",
      numbers: cleanNumber,
    });

    const response = await fetch(`${BASE_URL}?${params.toString()}`, {
      method: "GET",
    });

    if (!response.ok) {
      console.error("Fast2SMS API Error:", response.statusText);
      return false;
    }

    const result: SendSmsResponse = await response.json();
    console.log("Fast2SMS Response:", result);
    
    return result.return;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}
