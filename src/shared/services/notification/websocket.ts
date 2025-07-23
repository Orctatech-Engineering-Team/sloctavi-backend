/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";
import { WebSocket } from "ws"; // Explicitly import WebSocket from ws


import db from "@/db";
import { users } from "@/db/schema/schema";
import env from "@/env";
import { logError, logInfo } from "@/utils/logger";

interface WebSocketConnection {
  userId: string;
  userType: "customer" | "professional";
  ws: WebSocket; // Use ws.WebSocket
  lastActivity: Date;
  connectionId: string;
}

interface NotificationPayload {
  type: "booking_created" | "booking_updated" | "booking_cancelled" | "status_changed" | "connection_established" | "pong" | "profile_updated";
  bookingId?: string;
  title?: string;
  message: string;
  data?: Record<string, any>;
  timestamp: string;
}

class WebSocketManager {
  private connections = new Map<string, WebSocketConnection>();
  private userConnections = new Map<string, Set<string>>();
  private wsToConnectionId = new Map<WebSocket, string>(); // Use ws.WebSocket
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanupInactiveConnections(), 5 * 60 * 1000);
  }

  addConnection(connectionId: string, userId: string, userType: "customer" | "professional", ws: WebSocket) {
    const connection: WebSocketConnection = {
      userId,
      userType,
      ws,
      lastActivity: new Date(),
      connectionId,
    };

    this.connections.set(connectionId, connection);
    this.wsToConnectionId.set(ws, connectionId);

    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    logInfo("WebSocket connection established", {
      service: "WebSocketManager",
      method: "addConnection",
      userId,
      userType,
      connectionId,
      totalConnections: this.connections.size,
    });
  }

  removeConnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.wsToConnectionId.delete(connection.ws);
      const userConnections = this.userConnections.get(connection.userId);
      if (userConnections) {
        userConnections.delete(connectionId);
        if (userConnections.size === 0) {
          this.userConnections.delete(connection.userId);
        }
      }
      this.connections.delete(connectionId);

      logInfo("WebSocket connection removed", {
        service: "WebSocketManager",
        method: "removeConnection",
        userId: connection.userId,
        connectionId,
        totalConnections: this.connections.size,
      });
    }
  }

  updateActivity(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  findConnectionIdByWebSocket(ws: WebSocket): string | undefined {
    return this.wsToConnectionId.get(ws);
  }

  sendToUser(userId: string, notification: NotificationPayload): boolean {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections || userConnections.size === 0) {
      logInfo("No active connections for user", {
        service: "WebSocketManager",
        method: "sendToUser",
        userId,
      });
      return false;
    }

    let sent = false;
    const connectionsToRemove: string[] = [];

    for (const connectionId of userConnections) {
      const connection = this.connections.get(connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(JSON.stringify(notification));
          this.updateActivity(connectionId);
          sent = true;
        }
        catch (error) {
          logError(error, "Failed to send notification to connection", {
            service: "WebSocketManager",
            method: "sendToUser",
            userId,
            connectionId,
          });
          connectionsToRemove.push(connectionId);
        }
      }
      else {
        connectionsToRemove.push(connectionId);
      }
    }

    connectionsToRemove.forEach(connectionId => this.removeConnection(connectionId));

    return sent;
  }

  broadcast(notification: NotificationPayload, userType?: "customer" | "professional") {
    let count = 0;
    const connectionsToRemove: string[] = [];

    for (const [connectionId, connection] of this.connections.entries()) {
      if (userType && connection.userType !== userType) {
        continue;
      }

      if (connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(JSON.stringify(notification));
          this.updateActivity(connectionId);
          count++;
        }
        catch (error) {
          logError(error, "Failed to broadcast notification", {
            service: "WebSocketManager",
            method: "broadcast",
            connectionId,
          });
          connectionsToRemove.push(connectionId);
        }
      }
      else {
        connectionsToRemove.push(connectionId);
      }
    }

    connectionsToRemove.forEach(connectionId => this.removeConnection(connectionId));

    logInfo(`Broadcasted notification to ${count} connections`, {
      service: "WebSocketManager",
      method: "broadcast",
      userType,
    });
  }

  getActiveConnections(): number {
    return this.connections.size;
  }

  getUserConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }

  private cleanupInactiveConnections() {
    const now = new Date();
    const timeoutMs = 30 * 60 * 1000;
    const connectionsToRemove: string[] = [];

    for (const [connectionId, connection] of this.connections.entries()) {
      if (now.getTime() - connection.lastActivity.getTime() > timeoutMs) {
        if (connection.ws.readyState === WebSocket.OPEN) {
          try {
            connection.ws.close(1000, "Connection timeout");
          }
          catch (error) {
            logError(error, "Error closing WebSocket connection", {
              service: "WebSocketManager",
              method: "cleanupInactiveConnections",
              connectionId,
            });
          }
        }
        connectionsToRemove.push(connectionId);
      }
    }

    connectionsToRemove.forEach(connectionId => this.removeConnection(connectionId));

    if (connectionsToRemove.length > 0) {
      logInfo(`Cleaned up ${connectionsToRemove.length} inactive connections`, {
        service: "WebSocketManager",
        method: "cleanupInactiveConnections",
        totalConnections: this.connections.size,
      });
    }
  }

  async shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    const promises: Promise<void>[] = [];

    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        promises.push(
          new Promise<void>((resolve) => {
            try {
              connection.ws.close(1001, "Server shutdown");
              resolve();
            }
            catch (error) {
              logError(error, "Error closing WebSocket during shutdown", {
                service: "WebSocketManager",
                method: "shutdown",
                connectionId,
              });
              resolve();
            }
          }),
        );
      }
    }

    await Promise.all(promises);
    this.connections.clear();
    this.userConnections.clear();
    this.wsToConnectionId.clear();

    logInfo("WebSocket manager shutdown completed", {
      service: "WebSocketManager",
      method: "shutdown",
    });
  }
}

export const wsManager = new WebSocketManager();

async function getUserById(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true, email: true },
    });
    if (!user) {
      logInfo("User not found in database", {
        service: "WebSocketService",
        method: "getUserById",
        userId,
      });
      return null;
    }
    return user;
  }
  catch (error) {
    logError(error, "Database error in getUserById", {
      service: "WebSocketService",
      method: "getUserById",
      userId,
    });
    throw error;
  }
}

export function createWebSocketHandler(upgradeWebSocket: any) {
  return upgradeWebSocket(async (c: any) => {
    const token = c.req.query("token") || c.req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      logInfo("WebSocket connection rejected: No token provided", {
        service: "WebSocketHandler",
        method: "createWebSocketHandler",
        ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      });
      return {
        onMessage(_event: any, ws: any) {
          logInfo("WebSocket connection rejected: No token provided", {
            service: "WebSocketHandler",
            method: "onMessage",
            ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
          });
          ws.close(1008, "Unauthorized: No token provided");
        },
      };
    }

    if (!env.JWT_SECRET) {
      logError(new Error("JWT_SECRET not set"), "Missing JWT_SECRET environment variable", {
        service: "WebSocketHandler",
        method: "createWebSocketHandler",
      });
      return {
        onMessage(_event: any, ws: any) {
          ws.close(1011, "Internal error: Server configuration missing");
        },
      };
    }

    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET));
      const userId = payload.userId as string;

      if (!userId) {
        logInfo("WebSocket connection rejected: Invalid token payload", {
          service: "WebSocketHandler",
          method: "createWebSocketHandler",
        });
        return {
          onMessage(_event: any, ws: any) {
            logInfo("WebSocket connection rejected: Invalid token payload", {
              service: "WebSocketHandler",
              method: "onMessage",
            });
            ws.close(1008, "Unauthorized: Invalid token payload");
          },
        };
      }

      const user = await getUserById(userId);
      const validUserTypes = ["customer", "professional"] as const;
      if (!user || !validUserTypes.includes(user.type)) {
        logInfo("WebSocket connection rejected: Invalid user or user type", {
          service: "WebSocketHandler",
          method: "createWebSocketHandler",
          userId,
          userType: user?.type,
        });
        return {
          onMessage(_event: any, ws: any) {
            ws.close(1008, "Unauthorized: Invalid user or user type");
          },
        };
      }

      return {
        onOpen(_evt: any, ws: any) {
          if (!ws.raw) {
            logError(new Error("WebSocket raw instance is undefined"), "Failed to add connection: ws.raw is undefined", {
              service: "WebSocketHandler",
              method: "onOpen",
              userId,
            });
            return;
          }

          const connectionId = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          wsManager.addConnection(connectionId, userId, user.type, ws.raw);

          const welcomeMessage: NotificationPayload = {
            type: "connection_established",
            message: "WebSocket connection established",
            timestamp: new Date().toISOString(),
          };

          try {
            ws.send(JSON.stringify(welcomeMessage));
          }
          catch (error) {
            logError(error, "Failed to send welcome message", {
              service: "WebSocketHandler",
              method: "onOpen",
              connectionId,
            });
          }
        },

        onMessage(evt: any, ws: any) {
          try {
            const data = JSON.parse(evt.data.toString());

            if (data.type === "ping") {
              const pongMessage: NotificationPayload = {
                type: "pong",
                message: "pong",
                timestamp: new Date().toISOString(),
              };
              ws.send(JSON.stringify(pongMessage));
              if (!ws.raw) {
                console.error("WebSocket raw instance is undefined");
                return; // Avoid proceeding without ws.raw
              }

              const connectionId = wsManager.findConnectionIdByWebSocket(ws.raw);
              if (connectionId) {
                wsManager.updateActivity(connectionId);
              }
              return;
            }

            if (!ws.raw) {
              console.error("WebSocket raw instance is undefined");
              return; // Avoid proceeding without ws.raw
            }

            const connectionId = wsManager.findConnectionIdByWebSocket(ws.raw);
            if (connectionId) {
              wsManager.updateActivity(connectionId);
            }
            else {
              logError(new Error("Connection ID not found"), "WebSocket connection not found in manager", {
                service: "WebSocketHandler",
                method: "onMessage",
                userId,
              });
            }

            logInfo("WebSocket message received", {
              service: "WebSocketHandler",
              method: "onMessage",
              messageType: data.type,
              userId,
            });
          }
          catch (error) {
            logError(error, "Failed to parse WebSocket message", {
              service: "WebSocketHandler",
              method: "onMessage",
              userId,
              rawMessage: evt.data.toString(),
            });
          }
        },

        onClose(evt: any, ws: any) {
          if (!ws.raw) {
            console.error("WebSocket raw instance is undefined");
            return; // Avoid proceeding without ws.raw
          }
          const connectionId = wsManager.findConnectionIdByWebSocket(ws.raw);
          if (connectionId) {
            wsManager.removeConnection(connectionId);
          }
          else {
            logInfo("WebSocket closed but connection ID not found", {
              service: "WebSocketHandler",
              method: "onClose",
              userId,
              code: evt.code,
              reason: evt.reason,
            });
          }
        },

        onError(evt: any, ws: any) {
          if (!ws.raw) {
            console.error("WebSocket raw instance is undefined");
            return; // Avoid proceeding without ws.raw
          }
          const connectionId = wsManager.findConnectionIdByWebSocket(ws.raw);
          logError(evt, "WebSocket error occurred", {
            service: "WebSocketHandler",
            method: "onError",
            userId,
            connectionId,
          });

          if (connectionId) {
            wsManager.removeConnection(connectionId);
          }
        },
      };
    }
    catch (error) {
      logError(error, "Failed to authenticate WebSocket connection", {
        service: "WebSocketHandler",
        method: "createWebSocketHandler",
      });
      return {
        onMessage(_event: any, ws: any) {
          logInfo("WebSocket connection rejected: Authentication failed", {
            service: "WebSocketHandler",
            method: "onMessage",
          });
          ws.close(1008, "Unauthorized: Authentication failed");
        },
      };
    }
  });
}

export async function wsHealthCheck(): Promise<{
  healthy: boolean;
  activeConnections: number;
  details: any;
}> {
  try {
    const activeConnections = wsManager.getActiveConnections();

    return {
      healthy: true,
      activeConnections,
      details: {
        status: "operational",
        activeConnections,
      },
    };
  }
  catch (error) {
    logError(error, "WebSocket health check failed", {
      service: "WebSocketService",
      method: "wsHealthCheck",
    });

    return {
      healthy: false,
      activeConnections: 0,
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

export function setupWebSocketShutdown() {
  const shutdown = async (signal: string) => {
    logInfo(`Shutting down WebSocket manager due to ${signal}`, {
      service: "WebSocketService",
      method: "setupWebSocketShutdown",
      signal,
    });

    await wsManager.shutdown();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return shutdown;
}

export { NotificationPayload, WebSocketConnection };
