import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    resolve: {
        alias: {
            "@/Components": path.resolve(__dirname, "src/components/Components"),
            "@/Layouts": path.resolve(__dirname, "src/layouts"),
            "@": path.resolve(__dirname, "src"),
        },
    },
    plugins: [react(), cloudflare(), tailwindcss()],
});
