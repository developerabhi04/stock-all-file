import { ApiError } from "../../shared/utils/apiError.js";

export const sanitizePhoneNumber = (phoneNumber) => {
  let cleaned = String(phoneNumber || "").replace(/\D/g, "");

  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    cleaned = cleaned.slice(2);
  }

  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  return cleaned.slice(0, 10);
};

export const sanitizeOTP = (otp) => {
  return String(otp || "")
    .replace(/\D/g, "")
    .slice(0, 4);
};

export const validatePhoneNumber = (phoneNumber) => {
  const cleaned = sanitizePhoneNumber(phoneNumber);

  if (!cleaned) {
    throw new ApiError(400, "Phone number is required");
  }

  if (!/^[6-9]\d{9}$/.test(cleaned)) {
    throw new ApiError(400, "Invalid Indian phone number");
  }

  return cleaned;
};

export const validateSignupPayload = ({
  fullName,
  phoneNumber,
  otpRequired = false,
  otp,
}) => {
  if (!fullName || !phoneNumber) {
    throw new ApiError(400, "Full name and phone number are required");
  }

  if (String(fullName).trim().length < 3) {
    throw new ApiError(400, "Full name must be at least 3 characters");
  }

  validatePhoneNumber(phoneNumber);

  if (otpRequired) {
    const cleanOtp = sanitizeOTP(otp);

    if (!cleanOtp) {
      throw new ApiError(400, "OTP is required");
    }

    if (!/^\d{4}$/.test(cleanOtp)) {
      throw new ApiError(400, "OTP must be 4 digits");
    }
  }
};

export const validateLoginPayload = ({
  phoneNumber,
  otpRequired = false,
  otp,
}) => {
  validatePhoneNumber(phoneNumber);

  if (otpRequired) {
    const cleanOtp = sanitizeOTP(otp);

    if (!cleanOtp) {
      throw new ApiError(400, "Phone number and OTP are required");
    }

    if (!/^\d{4}$/.test(cleanOtp)) {
      throw new ApiError(400, "OTP must be 4 digits");
    }
  }
};
