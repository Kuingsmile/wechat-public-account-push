/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // 作为 Node 应用打包：第三方依赖保持 external，运行时从 node_modules 加载
    ssr: 'src/main.ts',
    target: 'node22',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  test: {
    include: ['__tests__/**/*.spec.ts'],
    setupFiles: ['__tests__/setup.ts'],
    // 与 GitHub Actions 运行环境保持一致
    env: { TZ: 'UTC' },
    restoreMocks: true,
    unstubEnvs: true,
  },
})
