// The error envelope from contracts/openapi.yaml: {"error": {code, message, details?}}.
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

const CODES: Record<number, string> = {
  400: "validation_error",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "validation_error",
  429: "rate_limited",
};

type Detail = { field: string; message: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string = CODES[status] ?? "internal_error",
    public details?: Detail[],
  ) {
    super(message);
  }
}

export function errorBody(code: string, message: string, details?: Detail[]) {
  return { error: details ? { code, message, details } : { code, message } };
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json(errorBody("not_found", "Not found"));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json(errorBody(err.code, err.message, err.details));
    return;
  }
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ field: i.path.join("."), message: i.message }));
    res.status(422).json(errorBody("validation_error", "Invalid input", details));
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(422).json(errorBody("validation_error", "Malformed JSON body"));
    return;
  }
  console.error(err);
  res.status(500).send("Internal Server Error");
};
