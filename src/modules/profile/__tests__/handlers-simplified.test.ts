import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as HttpStatusCodes from "stoker/http-status-codes";

// Create mock instance that will be shared
const mockImageUploaderInstance = {
  upload: vi.fn(),
  delete: vi.fn(),
};

// Mock the ImageUploader module completely
vi.mock("@/utils/imageUpload", () => ({
  ImageUploader: vi.fn().mockImplementation(() => mockImageUploaderInstance),
}));

// Mock dependencies using vi.mock with factory functions
vi.mock("../services", () => ({
  default: {
    createCustomerProfile: vi.fn(),
    getCustomerProfile: vi.fn(),
    createProfessionalProfile: vi.fn(),
    getProfessionalProfile: vi.fn(),
    updateCustomerProfile: vi.fn(),
    updateProfessionalProfile: vi.fn(),
    removeProfilePhoto: vi.fn(),
  },
}));

vi.mock("@/env", () => ({
  default: {
    SUPABASE_URL: "test-url",
    SUPABASE_ANON_KEY: "test-key",
  },
}));

// Import after mocking
import * as handlers from "../handlers";
import profileService from "../services";

const mockProfileService = vi.mocked(profileService);

describe("Profile Handlers Unit Tests", () => {
  let mockContext: any;
  let mockEnv: any;

  beforeEach(() => {
    // Mock Hono context
    mockContext = {
      req: {
        valid: vi.fn(),
      },
      get: vi.fn(),
      json: vi.fn(),
    };

    // Mock environment
    mockEnv = {};

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createCustomerProfile", () => {
    it("should create a customer profile successfully", async () => {
      const mockProfileData = {
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
      };

      const mockCreatedProfile = {
        id: "profile-123",
        userId: "user-123",
        ...mockProfileData,
        profileImage: null,
        otherNames: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.valid.mockReturnValue(mockProfileData);
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue(new Response());
      mockProfileService.createCustomerProfile.mockResolvedValue(mockCreatedProfile);

      await handlers.createCustomerProfile(mockContext, mockEnv);

      expect(mockProfileService.createCustomerProfile).toHaveBeenCalledWith({
        ...mockProfileData,
        userId: "user-123",
      });
      expect(mockContext.json).toHaveBeenCalledWith(mockCreatedProfile, HttpStatusCodes.CREATED);
    });

    it("should return unauthorized when no userId in JWT", async () => {
      mockContext.req.valid.mockReturnValue({});
      mockContext.get.mockReturnValue(null);
      mockContext.json.mockReturnValue(new Response());

      await handlers.createCustomerProfile(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { message: "Unauthorized" },
        HttpStatusCodes.UNAUTHORIZED
      );
    });

    it("should return bad request when profile creation fails", async () => {
      mockContext.req.valid.mockReturnValue({
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
      });
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue(new Response());
      mockProfileService.createCustomerProfile.mockResolvedValue(null as any);

      await handlers.createCustomerProfile(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { message: "Failed to create customer profile" },
        HttpStatusCodes.BAD_REQUEST
      );
    });
  });

  describe("getCustomerProfile", () => {
    it("should get customer profile successfully", async () => {
      const mockProfile = {
        id: "profile-123",
        userId: "user-123",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
        profileImage: null,
        otherNames: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue(new Response());
      mockProfileService.getCustomerProfile.mockResolvedValue(mockProfile);

      await handlers.getCustomerProfile(mockContext, mockEnv);

      expect(mockProfileService.getCustomerProfile).toHaveBeenCalledWith("user-123");
      expect(mockContext.json).toHaveBeenCalledWith(mockProfile, HttpStatusCodes.OK);
    });

    it("should return unauthorized when no userId in JWT", async () => {
      mockContext.get.mockReturnValue(null);
      mockContext.json.mockReturnValue(new Response());

      await handlers.getCustomerProfile(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { message: "Unauthorized" },
        HttpStatusCodes.UNAUTHORIZED
      );
    });

    it("should return not found when profile doesn't exist", async () => {
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue(new Response());
      mockProfileService.getCustomerProfile.mockResolvedValue(null);

      await handlers.getCustomerProfile(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { message: "Customer profile not found" },
        HttpStatusCodes.NOT_FOUND
      );
    });
  });

  describe("uploadProfilePhoto", () => {
    it("should upload profile photo successfully", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockFormData = { file: mockFile };
      
      const mockProfile = {
        id: "profile-123",
        userId: "user-123",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
        profileImage: null,
        otherNames: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUploadResult = {
        url: "https://example.com/photo.jpg",
        metadata: {
          userId: "user-123",
          uploadedAt: new Date().toISOString(),
        },
      };

      mockContext.req.valid.mockReturnValue(mockFormData);
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue(new Response());
      mockProfileService.getCustomerProfile.mockResolvedValue(mockProfile);
      mockImageUploaderInstance.upload.mockResolvedValue(mockUploadResult);

      await handlers.uploadProfilePhoto(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        {
          url: mockUploadResult.url,
          metadata: {
            userId: "user-123",
            uploadedAt: mockUploadResult.metadata.uploadedAt,
          },
        },
        HttpStatusCodes.CREATED
      );
    });

    it("should return unauthorized when no userId", async () => {
      mockContext.req.valid.mockReturnValue({});
      mockContext.get.mockReturnValue(null);
      mockContext.json.mockReturnValue(new Response());

      await handlers.uploadProfilePhoto(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Unauthorized", message: "User not authenticated" },
        HttpStatusCodes.UNAUTHORIZED
      );
    });

    it("should return not found when profile doesn't exist", async () => {
      mockContext.req.valid.mockReturnValue({ file: new File(["test"], "test.jpg") });
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue(new Response());
      mockProfileService.getCustomerProfile.mockResolvedValue(null);
      mockProfileService.getProfessionalProfile.mockResolvedValue(null);

      await handlers.uploadProfilePhoto(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "NotFound", message: "User profile not found" },
        HttpStatusCodes.NOT_FOUND
      );
    });

    it("should handle upload failure", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockProfile = { 
        id: "profile-123", 
        userId: "user-123",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
        profileImage: null,
        otherNames: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.valid.mockReturnValue({ file: mockFile });
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue(new Response());
      mockProfileService.getCustomerProfile.mockResolvedValue(mockProfile);
      mockImageUploaderInstance.upload.mockResolvedValue(null);

      await handlers.uploadProfilePhoto(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "UploadFailed", message: "Failed to upload image" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    });

    it("should handle upload errors", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockProfile = { 
        id: "profile-123", 
        userId: "user-123",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
        profileImage: null,
        otherNames: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.valid.mockReturnValue({ file: mockFile });
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue(new Response());
      mockProfileService.getCustomerProfile.mockResolvedValue(mockProfile);
      mockImageUploaderInstance.upload.mockRejectedValue(new Error("Upload failed"));

      await handlers.uploadProfilePhoto(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Error", message: "Upload failed" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    });
  });

  describe("deleteProfilePhoto", () => {
    it("should delete profile photo successfully", async () => {
      const mockDeleteData = {
        userId: "user-123",
        imagePath: "path/to/image.jpg",
      };

      mockContext.req.valid.mockReturnValue(mockDeleteData);
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue(new Response());
      mockImageUploaderInstance.delete.mockResolvedValue(true);
      mockProfileService.removeProfilePhoto.mockResolvedValue(undefined);

      await handlers.deleteProfilePhoto(mockContext, mockEnv);

      expect(mockImageUploaderInstance.delete).toHaveBeenCalledWith("path/to/image.jpg");
      expect(mockProfileService.removeProfilePhoto).toHaveBeenCalledWith("user-123");
      expect(mockContext.json).toHaveBeenCalledWith(
        { message: "Photo deleted successfully" },
        HttpStatusCodes.OK
      );
    });

    it("should return unauthorized when no userId", async () => {
      mockContext.req.valid.mockReturnValue({});
      mockContext.get.mockReturnValue(null);
      mockContext.json.mockReturnValue(new Response());

      await handlers.deleteProfilePhoto(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Unauthorized", message: "User not authenticated" },
        HttpStatusCodes.UNAUTHORIZED
      );
    });

    it("should return unauthorized when trying to delete another user's photo", async () => {
      const mockDeleteData = {
        userId: "other-user-123",
        imagePath: "path/to/image.jpg",
      };

      mockContext.req.valid.mockReturnValue(mockDeleteData);
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue(new Response());

      await handlers.deleteProfilePhoto(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Unauthorized", message: "Cannot delete photo for another user" },
        HttpStatusCodes.UNAUTHORIZED
      );
    });

    it("should handle photo not found error", async () => {
      const mockDeleteData = {
        userId: "user-123",
        imagePath: "path/to/image.jpg",
      };

      mockContext.req.valid.mockReturnValue(mockDeleteData);
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue(new Response());
      mockImageUploaderInstance.delete.mockRejectedValue(new Error("Photo not found"));

      await handlers.deleteProfilePhoto(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Not Found", message: "Photo not found" },
        HttpStatusCodes.NOT_FOUND
      );
    });

    it("should handle general deletion errors", async () => {
      const mockDeleteData = {
        userId: "user-123",
        imagePath: "path/to/image.jpg",
      };

      mockContext.req.valid.mockReturnValue(mockDeleteData);
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue(new Response());
      mockImageUploaderInstance.delete.mockRejectedValue(new Error("Deletion failed"));

      await handlers.deleteProfilePhoto(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { error: "Error", message: "Deletion failed" },
        HttpStatusCodes.INTERNAL_SERVER_ERROR
      );
    });
  });
});
