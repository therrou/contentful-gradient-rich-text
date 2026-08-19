import { defineConfig } from 'vite';
import { defineConfig as defineTestConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default mergeConfig(
  defineConfig({ plugins: [react()] }),
  defineTestConfig({ test: { environment: 'jsdom', globals: true } })
);
