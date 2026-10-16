// Firebase Admin errors carry a stable `code` like "auth/user-not-found".
export const hasFirebaseErrorCode = (error: unknown, ...codes: string[]) =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    codes.includes((error as {code: unknown}).code as string)
