/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/GoblinGamble/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
  },
})
