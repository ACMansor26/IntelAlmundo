import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname) }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Las pruebas hablan con Neon (latencia de red + creacion del esquema de prueba).
    testTimeout: 60_000,
    hookTimeout: 120_000,
    // Un solo proceso: comparten la base de datos y el esquema temporal.
    fileParallelism: false
  }
});
