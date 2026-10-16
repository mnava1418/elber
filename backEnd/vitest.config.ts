import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // Tests live in test/, mirroring the folder structure of src/.
        include: ['test/**/*.test.ts'],
    },
})
