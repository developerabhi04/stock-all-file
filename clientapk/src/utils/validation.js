export const OTP_LENGTH = 4;

export const validatePhoneNumber = (phoneNumber) => {
    const cleaned = String(phoneNumber || '').replace(/\D/g, '');

    if (!cleaned) {
        return { isValid: false, message: 'Phone number is required' };
    }

    if (cleaned.length !== 10) {
        return { isValid: false, message: 'Phone number must be exactly 10 digits' };
    }

    if (!/^[6-9]\d{9}$/.test(cleaned)) {
        return { isValid: false, message: 'Enter a valid Indian mobile number' };
    }

    return { isValid: true, message: '' };
};

export const validateOTP = (otp) => {
    const cleaned = String(otp || '').replace(/\D/g, '');

    if (!cleaned) {
        return { isValid: false, message: 'OTP is required' };
    }

    if (cleaned.length !== OTP_LENGTH) {
        return { isValid: false, message: `OTP must be ${OTP_LENGTH} digits` };
    }

    if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(cleaned)) {
        return { isValid: false, message: 'OTP must contain only numbers' };
    }

    return { isValid: true, message: '' };
};

export const formatPhoneNumber = (phoneNumber) => {
    const cleaned = String(phoneNumber || '').replace(/\D/g, '').slice(0, 10);

    if (cleaned.length <= 5) {
        return cleaned;
    }

    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
};

export const sanitizePhoneNumber = (phoneNumber) => {
    return String(phoneNumber || '').replace(/\D/g, '').slice(0, 10);
};

export const sanitizeOTP = (otp) => {
    return String(otp || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
};