import { describe, expect, it } from "vitest";
import { 
  profilePhotoUploadSchema, 
  uploadErrorSchema, 
  deleteRequestBody, 
  successResponseSchema 
} from "../schema";

describe("Profile Schemas", () => {
  describe("profilePhotoUploadSchema", () => {
    it("should validate correct profile photo upload data", () => {
      const validData = {
        url: "https://example.com/photo.jpg",
        metadata: {
          userId: "user-123",
          uploadedAt: "2023-12-01T10:00:00.000Z",
        },
      };

      const result = profilePhotoUploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should reject invalid URL", () => {
      const invalidData = {
        url: "", // Empty URL
        metadata: {
          userId: "user-123",
          uploadedAt: "2023-12-01T10:00:00.000Z",
        },
      };

      const result = profilePhotoUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid datetime format", () => {
      const invalidData = {
        url: "https://example.com/photo.jpg",
        metadata: {
          userId: "user-123",
          uploadedAt: "invalid-datetime", // Invalid datetime format
        },
      };

      const result = profilePhotoUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing metadata fields", () => {
      const invalidData = {
        url: "https://example.com/photo.jpg",
        metadata: {
          userId: "user-123",
          // Missing uploadedAt
        },
      };

      const result = profilePhotoUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing metadata", () => {
      const invalidData = {
        url: "https://example.com/photo.jpg",
        // Missing metadata
      };

      const result = profilePhotoUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("uploadErrorSchema", () => {
    it("should validate correct error data", () => {
      const validErrorData = {
        error: "ValidationError",
        message: "File size too large",
      };

      const result = uploadErrorSchema.safeParse(validErrorData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validErrorData);
      }
    });

    it("should reject missing error field", () => {
      const invalidData = {
        message: "File size too large",
        // Missing error field
      };

      const result = uploadErrorSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing message field", () => {
      const invalidData = {
        error: "ValidationError",
        // Missing message field
      };

      const result = uploadErrorSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject non-string values", () => {
      const invalidData = {
        error: 123, // Should be string
        message: "File size too large",
      };

      const result = uploadErrorSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("deleteRequestBody", () => {
    it("should validate correct delete request data", () => {
      const validData = {
        userId: "user-123",
        imagePath: "profiles/user-123/photo.jpg",
      };

      const result = deleteRequestBody.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should reject missing userId", () => {
      const invalidData = {
        imagePath: "profiles/user-123/photo.jpg",
        // Missing userId
      };

      const result = deleteRequestBody.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing imagePath", () => {
      const invalidData = {
        userId: "user-123",
        // Missing imagePath
      };

      const result = deleteRequestBody.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty strings", () => {
      const invalidData = {
        userId: "", // Empty string
        imagePath: "profiles/user-123/photo.jpg",
      };

      const result = deleteRequestBody.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject non-string values", () => {
      const invalidData = {
        userId: 123, // Should be string
        imagePath: "profiles/user-123/photo.jpg",
      };

      const result = deleteRequestBody.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("successResponseSchema", () => {
    it("should validate correct success response data", () => {
      const validData = {
        message: "Operation completed successfully",
      };

      const result = successResponseSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should reject missing message", () => {
      const invalidData = {
        // Missing message
      };

      const result = successResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject non-string message", () => {
      const invalidData = {
        message: 123, // Should be string
      };

      const result = successResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty string message", () => {
      const invalidData = {
        message: "", // Empty string
      };

      const result = successResponseSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should allow additional properties", () => {
      const dataWithExtra = {
        message: "Operation completed successfully",
        additionalInfo: "Some extra information",
      };

      const result = successResponseSchema.safeParse(dataWithExtra);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("Operation completed successfully");
      }
    });
  });

  describe("Edge cases and validation boundaries", () => {
    it("should handle very long strings appropriately", () => {
      const longString = "a".repeat(1000);
      
      const dataWithLongUrl = {
        url: longString,
        metadata: {
          userId: "user-123",
          uploadedAt: "2023-12-01T10:00:00.000Z",
        },
      };

      const result = profilePhotoUploadSchema.safeParse(dataWithLongUrl);
      expect(result.success).toBe(true); // URLs can be long
    });

    it("should validate ISO datetime strings correctly", () => {
      const validDatetimes = [
        "2023-12-01T10:00:00.000Z",
        "2023-12-01T10:00:00Z",
        "2023-12-01T10:00:00.123456Z",
        "2023-01-01T00:00:00.000Z",
      ];

      validDatetimes.forEach(datetime => {
        const data = {
          url: "https://example.com/photo.jpg",
          metadata: {
            userId: "user-123",
            uploadedAt: datetime,
          },
        };

        const result = profilePhotoUploadSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid datetime strings", () => {
      const invalidDatetimes = [
        "2023-12-01 10:00:00", // Missing T
        "2023-12-01T10:00:00", // Missing timezone
        "2023-13-01T10:00:00Z", // Invalid month
        "2023-12-32T10:00:00Z", // Invalid day
        "2023-12-01T25:00:00Z", // Invalid hour
        "not-a-date",
        "",
      ];

      invalidDatetimes.forEach(datetime => {
        const data = {
          url: "https://example.com/photo.jpg",
          metadata: {
            userId: "user-123",
            uploadedAt: datetime,
          },
        };

        const result = profilePhotoUploadSchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });
});
