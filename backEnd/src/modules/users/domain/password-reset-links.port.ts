// Port: where the links to reset a password come from. Firebase Auth is an
// adapter in infrastructure/ implementing it.
export interface PasswordResetLinks {
    // null when no active account has that email (unknown or disabled).
    generate(email: string): Promise<string | null>
}
