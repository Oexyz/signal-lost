import react from "@vitejs/plugin-react";
import { defineConfig, type Connect, type Plugin } from "vite";

const localService = "http://127.0.0.1:8787";
const legalRoutes = new Set(["/impressum", "/datenschutz"]);

function legalRouteMiddleware(): Connect.NextHandleFunction {
  return (request, _response, next) => {
    if (request.method === "GET" || request.method === "HEAD") {
      const url = new URL(request.url ?? "/", "http://localhost");
      if (legalRoutes.has(url.pathname)) {
        request.url = `${url.pathname}/index.html${url.search}`;
      }
    }
    next();
  };
}

function cleanLegalRoutes(): Plugin {
  return {
    name: "signal-lost-clean-legal-routes",
    configureServer(server) {
      server.middlewares.use(legalRouteMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(legalRouteMiddleware());
    },
  };
}

export default defineConfig({
  plugins: [cleanLegalRoutes(), react()],
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: localService,
        changeOrigin: false,
      },
      "/ws": {
        target: localService.replace("http", "ws"),
        changeOrigin: false,
        ws: true,
      },
    },
  },
  preview: {
    host: "127.0.0.1",
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
