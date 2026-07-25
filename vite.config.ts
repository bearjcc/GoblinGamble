/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: '/GoblinGamble/',
  test: {
    environment: 'node',
  },
})
