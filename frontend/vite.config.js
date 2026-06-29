import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { realpathSync } from "node:fs"
import { fileURLToPath } from "node:url"

const projectRoot = realpathSync(fileURLToPath(new URL(".", import.meta.url)))

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  root: projectRoot,
  base: mode === "desktop" ? "./" : "/",
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
}))
