export async function verifyRecaptcha(token: string | null) {
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

    const result = await response.json() as { success?: boolean };
    return result.success === true;
}
