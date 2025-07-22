import { eq, and, count } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";

import db from "@/db";
import { 
  roles, 
  userRoles,
  users
} from "@/db/schema/schema";
import { AppError } from "@/utils/error";

type Role = typeof roles.$inferSelect;
type UserRole = typeof userRoles.$inferSelect;
type NewRole = typeof roles.$inferInsert;
type NewUserRole = typeof userRoles.$inferInsert;
type User = typeof users.$inferSelect;

export const rolesService = {
  // Role Management
  async getRoles(limit = 20, offset = 0): Promise<{ roles: Role[], total: number }> {
    try {
      const [rolesList, totalCount] = await Promise.all([
        db.query.roles.findMany({
          limit,
          offset,
          orderBy: (roles, { asc }) => [asc(roles.name)],
        }),
        db.select({ count: count() }).from(roles),
      ]);

      return {
        roles: rolesList,
        total: totalCount[0].count,
      };
    } catch (error) {
      throw new AppError(
        "Failed to retrieve roles",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getRoleById(id: number): Promise<Role | null> {
    try {
      const role = await db.query.roles.findFirst({
        where: eq(roles.id, id),
      });

      return role || null;
    } catch (error) {
      throw new AppError(
        "Failed to retrieve role",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async createRole(data: Omit<NewRole, "id" | "createdAt" | "updatedAt">): Promise<Role> {
    try {
      // Check if role name already exists
      const existingRole = await db.query.roles.findFirst({
        where: eq(roles.name, data.name),
      });

      if (existingRole) {
        throw new AppError(
          "Role name already exists",
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      const [role] = await db
        .insert(roles)
        .values(data)
        .returning();

      return role;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to create role",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async updateRole(id: number, data: Partial<Omit<NewRole, "id" | "createdAt" | "updatedAt">>): Promise<Role> {
    try {
      // Check if role exists
      const existing = await db.query.roles.findFirst({
        where: eq(roles.id, id),
      });

      if (!existing) {
        throw new AppError(
          "Role not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if name is being updated and if it already exists
      if (data.name && data.name !== existing.name) {
        const existingRole = await db.query.roles.findFirst({
          where: eq(roles.name, data.name),
        });

        if (existingRole) {
          throw new AppError(
            "Role name already exists",
            HttpStatusCodes.BAD_REQUEST,
          );
        }
      }

      const [updated] = await db
        .update(roles)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(roles.id, id))
        .returning();

      return updated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to update role",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async deleteRole(id: number): Promise<void> {
    try {
      // Check if role exists
      const existing = await db.query.roles.findFirst({
        where: eq(roles.id, id),
      });

      if (!existing) {
        throw new AppError(
          "Role not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if role is assigned to any users
      const assignedUsers = await db.query.userRoles.findMany({
        where: and(eq(userRoles.roleId, id), eq(userRoles.isActive, true)),
      });

      if (assignedUsers.length > 0) {
        throw new AppError(
          "Cannot delete role that is assigned to users",
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      await db.delete(roles).where(eq(roles.id, id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to delete role",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  // User Role Management
  async getUserRoles(userId?: string, roleId?: number): Promise<UserRole[]> {
    try {
      const whereConditions = [eq(userRoles.isActive, true)];
      
      if (userId) {
        whereConditions.push(eq(userRoles.userId, userId));
      }
      
      if (roleId) {
        whereConditions.push(eq(userRoles.roleId, roleId));
      }

      const whereClause = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

      return await db.query.userRoles.findMany({
        where: whereClause,
        orderBy: (userRoles, { desc }) => [desc(userRoles.grantedAt)],
      });
    } catch (error) {
      throw new AppError(
        "Failed to retrieve user roles",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async assignRoleToUser(
    userId: string,
    roleId: number,
    grantedBy?: string
  ): Promise<UserRole> {
    try {
      // Check if user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new AppError(
          "User not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if role exists
      const role = await db.query.roles.findFirst({
        where: eq(roles.id, roleId),
      });

      if (!role) {
        throw new AppError(
          "Role not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Check if user already has this role
      const existingUserRole = await db.query.userRoles.findFirst({
        where: and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId)
        ),
      });

      if (existingUserRole) {
        if (existingUserRole.isActive) {
          throw new AppError(
            "User already has this role",
            HttpStatusCodes.BAD_REQUEST,
          );
        } else {
          // Reactivate the existing role
          const [reactivated] = await db
            .update(userRoles)
            .set({
              isActive: true,
              grantedAt: new Date(),
              grantedBy,
            })
            .where(and(
              eq(userRoles.userId, userId),
              eq(userRoles.roleId, roleId)
            ))
            .returning();

          return reactivated;
        }
      }

      const [userRole] = await db
        .insert(userRoles)
        .values({
          userId,
          roleId,
          grantedBy,
        })
        .returning();

      return userRole;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to assign role to user",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async revokeRoleFromUser(
    userId: string,
    roleId: number
  ): Promise<void> {
    try {
      // Check if user role exists and is active
      const existingUserRole = await db.query.userRoles.findFirst({
        where: and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId),
          eq(userRoles.isActive, true)
        ),
      });

      if (!existingUserRole) {
        throw new AppError(
          "User role not found or already inactive",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Soft delete by setting isActive to false
      await db
        .update(userRoles)
        .set({
          isActive: false,
        })
        .where(and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId)
        ));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to revoke role from user",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getUsersByRole(roleId: number): Promise<User[]> {
    try {
      // Check if role exists
      const role = await db.query.roles.findFirst({
        where: eq(roles.id, roleId),
      });

      if (!role) {
        throw new AppError(
          "Role not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Get user IDs for this role
      const userRolesList = await db.query.userRoles.findMany({
        where: and(eq(userRoles.roleId, roleId), eq(userRoles.isActive, true)),
        orderBy: (userRoles, { desc }) => [desc(userRoles.grantedAt)],
      });

      if (userRolesList.length === 0) {
        return [];
      }

      // Get users by their IDs
      const userIds = userRolesList.map(ur => ur.userId);
      const usersList = await db.query.users.findMany({
        orderBy: (users, { asc }) => [asc(users.email)],
      });

      // Filter users that are in the userIds array
      return usersList.filter(user => userIds.includes(user.id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to retrieve users by role",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },

  async getRolesByUser(userId: string): Promise<Role[]> {
    try {
      // Check if user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        throw new AppError(
          "User not found",
          HttpStatusCodes.NOT_FOUND,
        );
      }

      // Get role IDs for this user
      const userRolesList = await db.query.userRoles.findMany({
        where: and(eq(userRoles.userId, userId), eq(userRoles.isActive, true)),
        orderBy: (userRoles, { desc }) => [desc(userRoles.grantedAt)],
      });

      if (userRolesList.length === 0) {
        return [];
      }

      // Get roles by their IDs
      const roleIds = userRolesList.map(ur => ur.roleId);
      const rolesList = await db.query.roles.findMany({
        orderBy: (roles, { asc }) => [asc(roles.name)],
      });

      // Filter roles that are in the roleIds array
      return rolesList.filter(role => roleIds.includes(role.id));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        "Failed to retrieve roles by user",
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  },
};