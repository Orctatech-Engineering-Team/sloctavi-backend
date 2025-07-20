import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { AppError } from "@/utils/error";

import { rolesService } from "./services";
import type { 
  GetRolesRoute, 
  GetRoleByIdRoute,
  CreateRoleRoute, 
  UpdateRoleRoute, 
  DeleteRoleRoute,
  GetUserRolesRoute,
  AssignRoleToUserRoute,
  RevokeRoleFromUserRoute,
  GetUsersByRoleRoute,
  GetRolesByUserRoute
} from "./routes";

export const getRoles: AppRouteHandler<GetRolesRoute> = async (c) => {
  const { limit, offset } = c.req.valid("query");
  const result = await rolesService.getRoles(limit, offset);
  return c.json(result, HttpStatusCodes.OK);
};

export const getRoleById: AppRouteHandler<GetRoleByIdRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const role = await rolesService.getRoleById(id);
  
  if (!role) {
    throw new AppError("Role not found", HttpStatusCodes.NOT_FOUND);
  }
  
  return c.json(role, HttpStatusCodes.OK);
};

export const createRole: AppRouteHandler<CreateRoleRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const role = await rolesService.createRole(data);
  return c.json(role, HttpStatusCodes.CREATED);
};

export const updateRole: AppRouteHandler<UpdateRoleRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const role = await rolesService.updateRole(id, data);
  return c.json(role, HttpStatusCodes.OK);
};

export const deleteRole: AppRouteHandler<DeleteRoleRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  await rolesService.deleteRole(id);
  return c.json({ message: "Role deleted successfully" }, HttpStatusCodes.OK);
};

// User Role Management Handlers
export const getUserRoles: AppRouteHandler<GetUserRolesRoute> = async (c) => {
  const { userId, roleId } = c.req.valid("query");
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const userRoles = await rolesService.getUserRoles(userId, roleId);
  return c.json(userRoles, HttpStatusCodes.OK);
};

export const assignRoleToUser: AppRouteHandler<AssignRoleToUserRoute> = async (c) => {
  const data = c.req.valid("json");
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const userRole = await rolesService.assignRoleToUser(
    data.userId,
    data.roleId,
    currentUserId
  );
  return c.json(userRole, HttpStatusCodes.CREATED);
};

export const revokeRoleFromUser: AppRouteHandler<RevokeRoleFromUserRoute> = async (c) => {
  const data = c.req.valid("json");
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  await rolesService.revokeRoleFromUser(data.userId, data.roleId);
  return c.json({ message: "Role revoked successfully" }, HttpStatusCodes.OK);
};

export const getUsersByRole: AppRouteHandler<GetUsersByRoleRoute> = async (c) => {
  const { roleId } = c.req.valid("param");
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const users = await rolesService.getUsersByRole(roleId);
  return c.json(users, HttpStatusCodes.OK);
};

export const getRolesByUser: AppRouteHandler<GetRolesByUserRoute> = async (c) => {
  const { userId } = c.req.valid("param");
  const currentUserId = c.get("jwtPayload")?.userId;

  if (!currentUserId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const roles = await rolesService.getRolesByUser(userId);
  return c.json(roles, HttpStatusCodes.OK);
};