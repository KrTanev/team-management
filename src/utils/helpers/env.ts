type EnvKey = keyof ImportMetaEnv;

interface GetEnvOptionsBase {
  required?: boolean;
}

export function getEnv<T extends EnvKey>(
  key: T,
  options: GetEnvOptionsBase & { type: "string" }
): string;

export function getEnv<T extends EnvKey>(
  key: T,
  options: GetEnvOptionsBase & { type: "number" }
): number;

export function getEnv<T extends EnvKey>(
  key: T,
  options: GetEnvOptionsBase & { type: "boolean" }
): boolean;

export function getEnv<T extends EnvKey>(
  key: T,
  options?: GetEnvOptionsBase
): string;

export function getEnv<T extends EnvKey>(
  key: T,
  options: GetEnvOptionsBase & { type?: "string" | "number" | "boolean" } = {}
): string | number | boolean {
  const value = import.meta.env[key];

  if (options.required && (value === undefined || value === "")) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  switch (options.type) {
    case "number":
      // eslint-disable-next-line no-case-declarations
      const num = Number(value);
      if (isNaN(num))
        throw new Error(`Environment variable ${key} must be a number`);
      return num;
    case "boolean":
      return value === "true";
    case "string":
    default:
      return value ?? "";
  }
}
