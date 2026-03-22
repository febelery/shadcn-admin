import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import fs from 'node:fs'

// 校验环境变量文件是否存在
function requireEnvFile(): Plugin {
  return {
    name: 'require-env-file',
    config(_, { mode }) {
      const envFile = `.env.${mode}`
      if (!fs.existsSync(envFile)) {
        throw new Error(
          `Missing required env file: ${envFile}\n` +
            `Please copy ${envFile}.example to ${envFile} and fill in the values.`
        )
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    requireEnvFile(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
    },
  },
  base: './',
})
