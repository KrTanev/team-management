import { readFileSync } from "node:fs";

import { Router } from "express";

/**
 * API docs: Swagger UI for the shared contract (contracts/openapi.yaml) at
 * GET /docs, and the raw spec at GET /openapi.yaml. The Python backend gets
 * the same from FastAPI's built-in /docs.
 */
const SPEC = readFileSync(new URL("../../contracts/openapi.yaml", import.meta.url), "utf8");

const SWAGGER_UI = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5";

const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Team Management API — docs</title>
    <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_UI}/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/openapi.yaml",
        dom_id: "#swagger-ui",
        persistAuthorization: true,
      });
    </script>
  </body>
</html>`;

export const docsRouter = Router();

docsRouter.get("/openapi.yaml", (_req, res) => {
  res.type("application/yaml").send(SPEC);
});

docsRouter.get("/docs", (_req, res) => {
  res.type("html").send(PAGE);
});
