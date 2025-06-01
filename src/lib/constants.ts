import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { createMessageObjectSchema } from "stoker/openapi/schemas";

export const ZOD_ERROR_MESSAGES = {
  REQUIRED: "Required",
  EXPECTED_NUMBER: "Expected number, received nan",
  NO_UPDATES: "No updates provided",
  INVALID_UUID: "Invalid UUID",
  INVALID_PASSWORD: "Invalid password",
  INVALID_EMAIL: "Invalid email",
  INVALID_CREDENTIALS: "Invalid credentials",
  INVALID_ACCESS_TOKEN: "Invalid access token",
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  INVALID_DATE: "Invalid date",
  INVALID_URL: "Invalid URL",
  INVALID_STRING: "Invalid string",
};

export const ZOD_ERROR_CODES = {
  INVALID_UPDATES: "invalid_updates",
  INVALID_TYPE: "invalid_type",
  TOO_BIG: "too_big",
  TOO_SMALL: "too_small",
  INVALID_STRING: "invalid_string",
  INVALID_DATE: "invalid_date",
  INVALID_EMAIL: "invalid_email",
  INVALID_URL: "invalid_url",
  INVALID_CREDENTIALS: "invalid_credentials",
  INVALID_UUID: "invalid_uuid",
  INVALID_ENUM_VALUE: "invalid_enum_value",
  INVALID_ACCESS_TOKEN: "invalid_access_token",
  INVALID_REFRESH_TOKEN: "invalid_refresh_token",
  INVALID_PASSWORD: "invalid_password",
};

export const notFoundSchema = createMessageObjectSchema(HttpStatusPhrases.NOT_FOUND);
export const badRequestSchema = createMessageObjectSchema(HttpStatusPhrases.BAD_REQUEST);
export const internalServerErrorSchema = createMessageObjectSchema(HttpStatusPhrases.INTERNAL_SERVER_ERROR);
export const unauthorizedSchema = createMessageObjectSchema(HttpStatusPhrases.UNAUTHORIZED);
export const forbiddenSchema = createMessageObjectSchema(HttpStatusPhrases.FORBIDDEN);
