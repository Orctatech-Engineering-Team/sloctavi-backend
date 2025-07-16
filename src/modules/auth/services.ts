import * as bcrypt from "bcrypt";
import { eq, lt } from "drizzle-orm";
import { randomBytes } from "node:crypto";

import db from "@/db";
import { refreshTokens } from "@/db/schema/auth";
import { users, user_type, UserType, passwordResets } from "@/db/schema/schema";
import { isValid } from "zod";

const Auth = {
  async register(email: string, password: string, type: UserType) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        type,
      })
      .returning({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt,
        lastLogin: users.lastLogin,
        type: users.type,
        isVerified: users.isVerified,
      });

    return user;
  },

  async login(email: string, password: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return null;
    }
    // Update last login time
    const newUser = await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    const { password: _, ...userWithoutPassword } = newUser[0];

    return userWithoutPassword;
  },

  async getUser(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  },

  async storeRefreshToken(userId: string, token: string, expiresAt: Date) {
    const [refreshToken] = await db
      .insert(refreshTokens)
      .values({
        userId,
        token,
        expiresAt,
      })
      .returning({
        id: refreshTokens.id,
        userId: refreshTokens.userId,
        token: refreshTokens.token,
        expiresAt: refreshTokens.expiresAt,
      });

    return refreshToken;
  },
  async getRefreshToken(token: string) {
    return db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.token, token),
    });
  },

  async rotateToken(token: string, newToken: string, newExpires: Date) {
    const existing = await this.getRefreshToken(token);
    if (!existing) {
      throw new Error("Refresh token not found");
    }
    await db.transaction(async (trx) => {
      await trx.delete(refreshTokens).where(eq(refreshTokens.token, token));
      await trx.insert(refreshTokens).values({
        userId: existing.userId,
        token: newToken,
        expiresAt: newExpires,
      });
    });
  },
  async deleteRefreshToken(token: string) {
    return db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  },
  async updateLastLogin(userId: string) {
    return db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        lastLogin: users.lastLogin,
      });
  },

  // Password Reset functionality
  async createPasswordResetToken(email: string) {
    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return null;
    }

    // Generate secure random token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    // Clean up any existing password reset tokens for this user
    await db.delete(passwordResets).where(eq(passwordResets.userId, user.id));

    // Create new password reset token
    const [passwordReset] = await db
      .insert(passwordResets)
      .values({
        userId: user.id,
        token,
        expiresAt,
      })
      .returning();

    return { passwordReset, user };
  },

  async validatePasswordResetToken(token: string) {
    const passwordReset = await db.query.passwordResets.findFirst({
      where: eq(passwordResets.token, token),
    });

    if (!passwordReset) {
      return null;
    }

    // Check if token is expired
    if (passwordReset.expiresAt < new Date()) {
      return null;
    }

    // Check if token is already used
    if (passwordReset.isUsed) {
      return null;
    }

    // Get user data separately
    const user = await db.query.users.findFirst({
      where: eq(users.id, passwordReset.userId),
    });

    return { ...passwordReset, user };
  },

  async resetPassword(token: string, newPassword: string) {
    const passwordReset = await this.validatePasswordResetToken(token);

    if (!passwordReset) {
      return null;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark token as used in a transaction
    await db.transaction(async (trx) => {
      // Update user password
      await trx
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, passwordReset.userId));

      // Mark reset token as used
      await trx
        .update(passwordResets)
        .set({ isUsed: true })
        .where(eq(passwordResets.token, token));
    });

    return passwordReset.user;
  },

  async cleanupExpiredPasswordResets() {
    return db.delete(passwordResets).where(
      lt(passwordResets.expiresAt, new Date())
    );
  },
};

export default Auth;
