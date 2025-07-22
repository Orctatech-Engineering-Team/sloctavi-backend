import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { roles, userRoles } from "@/db/schema/schema";
import { createSelectSchema } from "drizzle-zod";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

const tags = ["Roles"];

const roleSchema = createSelectSchema(roles);
const userRoleSchema = createSelectSchema(userRoles);

const roleCreateSchema = z.object({
  name: z.string().min(1, "Role name is required").max(50, "Role name too long"),
  description: z.string().optional(),
});

const roleUpdateSchema = roleCreateSchema.partial();

const assignRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  roleId: z.number().min(1, "Role ID is required"),
});

const revokeRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  roleId: z.number().min(1, "Role ID is required"),
});

export const getRoles = createRoute({
  path: "/roles",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      limit: z.string().transform(Number).optional().default("20"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        roles: z.array(roleSchema),
        total: z.number(),
      }),
      "Roles retrieved successfully",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getRoleById = createRoute({
  path: "/roles/{id}",
  method: "get",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      roleSchema,
      "Role retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Role not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const createRole = createRoute({
  path: "/roles",
  method: "post",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      roleCreateSchema,
      "Role data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      roleSchema,
      "Role created successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const updateRole = createRoute({
  path: "/roles/{id}",
  method: "put",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
    body: jsonContentRequired(
      roleUpdateSchema,
      "Role update data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      roleSchema,
      "Role updated successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Role not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const deleteRole = createRoute({
  path: "/roles/{id}",
  method: "delete",
  tags,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Role deleted successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Cannot delete role that is assigned to users",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Role not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

// User Role Management Routes
export const getUserRoles = createRoute({
  path: "/user-roles",
  method: "get",
  tags: ["User Roles"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      userId: z.string().uuid().optional(),
      roleId: z.string().transform(Number).optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(userRoleSchema),
      "User roles retrieved successfully",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const assignRoleToUser = createRoute({
  path: "/user-roles/assign",
  method: "post",
  tags: ["User Roles"],
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      assignRoleSchema,
      "Role assignment data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      userRoleSchema,
      "Role assigned successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data or user already has this role",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "User or role not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const revokeRoleFromUser = createRoute({
  path: "/user-roles/revoke",
  method: "post",
  tags: ["User Roles"],
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      revokeRoleSchema,
      "Role revocation data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Role revoked successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "User role not found or already inactive",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getUsersByRole = createRoute({
  path: "/roles/{roleId}/users",
  method: "get",
  tags: ["User Roles"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      roleId: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        type: z.enum(["customer", "professional"]),
        isVerified: z.boolean().nullable(),
        createdAt: z.string().datetime().nullable(),
        lastLogin: z.string().datetime().nullable(),
        password: z.string(),
      })),
      "Users retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Role not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getRolesByUser = createRoute({
  path: "/users/{userId}/roles",
  method: "get",
  tags: ["User Roles"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      userId: z.string().uuid(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(roleSchema),
      "Roles retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "User not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export type GetRolesRoute = typeof getRoles;
export type GetRoleByIdRoute = typeof getRoleById;
export type CreateRoleRoute = typeof createRole;
export type UpdateRoleRoute = typeof updateRole;
export type DeleteRoleRoute = typeof deleteRole;
export type GetUserRolesRoute = typeof getUserRoles;
export type AssignRoleToUserRoute = typeof assignRoleToUser;
export type RevokeRoleFromUserRoute = typeof revokeRoleFromUser;
export type GetUsersByRoleRoute = typeof getUsersByRole;
export type GetRolesByUserRoute = typeof getRolesByUser;