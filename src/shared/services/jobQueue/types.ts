// Define job payloads with types
export interface EmailJobPayload {
  to: string;
  subject: string;
  body: string;
}

export interface NotificationJobPayload {
  userId: string;
  notificationType: "booking_update" | "message" | "recommendation";
  content: string;
}

export interface AuditLogJobPayload {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
}
export interface JobQueueJob<T> {
  id: string;
  type: string;
  payload: T;
  createdAt: Date;
  updatedAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  error?: string;
  priority?: number; // Optional priority field
}
