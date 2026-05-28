type RecaptchaVerification = {
    success?: boolean;
    score?: number;
    action?: string;
    ['error-codes']?: string[];
};

export async function verifyRecaptcha(token: string | null, expectedAction?: string) {
    if (!token) return false;

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
        return process.env.NODE_ENV !== 'production';
    }

    const params = new URLSearchParams({
        secret,
        response: token,
    });

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) return false;

    const result = await response.json() as RecaptchaVerification;
    if (result.success !== true) return false;

    if (expectedAction && result.action && result.action !== expectedAction) {
        return false;
    }

    const minimumScore = Number(process.env.RECAPTCHA_MIN_SCORE || '0.5');
    if (typeof result.score === 'number' && result.score < minimumScore) {
        return false;
    }

    return true;
}
