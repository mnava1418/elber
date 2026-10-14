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
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
    console.error('Invalid environment variables:\n' + z.prettifyError(parsed.error))
    process.exit(1)
}

const env = parsed.data

export default env
