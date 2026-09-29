import { Router } from "express";
import { z } from "zod";

import { TEST_MODE } from "../config.js";
import { ApiError } from "../errors.js";
import { reset } from "../seed.js";

export const systemRouter = Router();

systemRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/** Used by BetterDev's hidden checks. Do not remove. */
systemRouter.post("/__test__/reset", (req, res) => {
  if (!TEST_MODE) throw new ApiError(404, "Not found");
  const size = z.enum(["small", "large"]).default("small").parse(req.query.size);
  reset(size);
  res.status(204).end();
});
