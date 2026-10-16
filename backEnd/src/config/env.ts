import { readFileSync } from 'node:fs'
import { z } from 'zod'

// Load .env when present (local development). In deployed environments the
// variables come from the platform and there is no file.
try {
    process.loadEnvFile()
} catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
}

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),

    // Path to the Google service account JSON key. Used by Firebase Admin and
    // by Gmail (domain-wide delegation, Workspace only).
    GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1),

    // Workspace user the service account impersonates to send email.
    GMAIL_SENDER: z.email(),
    // Display name shown to users, e.g. "Elber".
    MAIL_FROM_NAME: z.string().min(1),

    // Where Firebase sends the user after they change their password.
    PASSWORD_RESET_CONTINUE_URL: z.url(),
})

// Only the fields the app uses; the key file has more.
const serviceAccountSchema = z.object({
    project_id: z.string().min(1),
    client_email: z.email(),
    client_id: z.string().min(1),
    private_key: z.string().min(1),
})

// A function declaration (not an arrow) so TypeScript narrows after calls.
function fail(message: string): never {
    console.error(message)
    process.exit(1)
}

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
    fail('Invalid environment variables:\n' + z.prettifyError(parsed.error))
}

const credentialsPath = parsed.data.GOOGLE_APPLICATION_CREDENTIALS

const readServiceAccount = () => {
    let raw: string
    try {
        raw = readFileSync(credentialsPath, 'utf8')
    } catch (error) {
        return fail(`Cannot read GOOGLE_APPLICATION_CREDENTIALS (${credentialsPath}): ${(error as Error).message}`)
    }

    let json: unknown
    try {
        json = JSON.parse(raw)
    } catch {
        // Don't print the parse error: it quotes part of the file (the private key).
        return fail(`GOOGLE_APPLICATION_CREDENTIALS (${credentialsPath}) is not valid JSON`)
    }

    const result = serviceAccountSchema.safeParse(json)
    if (!result.success) {
        return fail(`Invalid service account file (${credentialsPath}):\n` + z.prettifyError(result.error))
    }
    return result.data
}

const env = {...parsed.data, GOOGLE_SERVICE_ACCOUNT: readServiceAccount()}

export default env
