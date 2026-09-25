import cors from "cors";
import express from "express";

import { CORS_ORIGINS, DEBUG_QUERIES } from "./config.js";
import { createTables, db, queryCounter } from "./db/client.js";
import { errorHandler, notFoundHandler } from "./errors.js";
import { authRouter } from "./routes/auth.js";
import { systemRouter } from "./routes/system.js";
import { teamsRouter } from "./routes/teams.js";
import { usersRouter } from "./routes/users.js";
import { reset } from "./seed.js";

export function createApp() {
  createTables();
  if (!db.get("SELECT id FROM users LIMIT 1")) reset("small");

  const app = express();
  app.use(cors({ origin: CORS_ORIGINS, exposedHeaders: ["X-Query-Count"] }));
  app.use(express.json());

  app.use((_req, res, next) => {
    const store = { count: 0 };
    if (DEBUG_QUERIES) {
      // Set the header right before the response goes out.
      const writeHead = res.writeHead.bind(res);
      res.writeHead = ((...args: Parameters<typeof res.writeHead>) => {
        if (!res.headersSent) res.setHeader("X-Query-Count", String(store.count));
        return writeHead(...args);
      }) as typeof res.writeHead;
    }
    queryCounter.run(store, next);
  });

  app.use(systemRouter);
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/teams", teamsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
