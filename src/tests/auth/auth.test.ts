import { eq } from "drizzle-orm";
import { fetch } from "undici"; // or use a supertest-style wrapper
import { beforeEach, describe, expect, it } from "vitest";

import db from "@/db";
import { refreshTokens } from "@/db/schema/auth";
import { users } from "@/db/schema/schema";

const BASE_URL = "http://localhost:9999";

beforeEach(async () => {
  await db.delete(refreshTokens).execute();
  await db.delete(users).where(eq(users.email, "test@example.com")).execute();
});

describe("auth Flow", () => {
  const testUser = {
    email: "test@example.com",
    password: "strongpass123",
  };

  it("should register + login and receive refresh token", async () => {
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.token).toBeDefined();
    expect(body.user.email).toBe(testUser.email);

    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toMatch(/refreshToken=/);
  });
  let refreshCookie = "";

  it("should refresh access token using refresh token", async () => {
    // First login to get refresh cookie
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });

    refreshCookie = loginRes.headers.get("set-cookie") || "";

    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: refreshCookie,
      },
    });

    const body = await refreshRes.json();

    expect(refreshRes.status).toBe(200);
    expect(body.token).toBeDefined();
    expect(body.message).toBe("Token refreshed");
  });
  it("should return 401 for invalid refresh token", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: "refreshToken=invalid-token",
      },
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error?.message || body.message).toMatch(/expired|invalid/i);
  });
  it("should logout and revoke refresh token", async () => {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: refreshCookie,
      },
    });

    expect(logoutRes.status).toBe(200);

    // Try refreshing again — should fail
    const postLogoutRefresh = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: refreshCookie,
      },
    });

    expect(postLogoutRefresh.status).toBe(401);
  });
});
