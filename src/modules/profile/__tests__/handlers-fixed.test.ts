import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as HttpStatusCodes from "stoker/http-status-codes";

// Mock the ImageUploader module completely
const mockImageUploaderInstance = {
  upload: vi.fn(),
  delete: vi.fn(),
};

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
import { profile } from "console";

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
      mockProfileService.getCustomerProfile.mockResolvedValue(mockProfile);

      const result = await handlers.getCustomerProfile(mockContext, mockEnv);

      expect(mockProfileService.getCustomerProfile).toHaveBeenCalledWith("user-123");
      expect(result._status).toBe(HttpStatusCodes.OK);
      expect(result._data).toEqual(mockProfile);
    });

    it("should return unauthorized when no userId in JWT", async () => {
      mockContext.get.mockReturnValue(null);

      const result = await handlers.getCustomerProfile(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.UNAUTHORIZED);
      expect(result._data).toEqual({ message: "Unauthorized" });
    });

    it("should return not found when profile doesn't exist", async () => {
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockProfileService.getCustomerProfile.mockResolvedValue(null);

      const result = await handlers.getCustomerProfile(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(result._data).toEqual({ message: "Customer profile not found" });
    });
  });

  describe("createProfessionalProfile", () => {
    it("should create a professional profile successfully", async () => {
      const mockProfileData = {
        name: "John's Services",
        professionId: 1,
        businessType: "individual",
      };

      const mockCreatedProfile = {
        id: "profile-123",
        userId: "user-123",
        ...mockProfileData,
        location: null,
        description: null,
        rating: null,
        status: null,
        profileImage: null,
        businessName: null,
        yearsOfExperience: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockContext.req.valid.mockReturnValue(mockProfileData);
      mockContext.get.mockReturnValue({ jwtPayload: { userId: "user-123" } });
      mockProfileService.createProfessionalProfile.mockResolvedValue(mockCreatedProfile);

      const result = await handlers.createProfessionalProfile(mockContext, mockEnv);

      expect(mockProfileService.createProfessionalProfile).toHaveBeenCalledWith({
        ...mockProfileData,
        userId: "user-123",
      });
      expect(result._status).toBe(HttpStatusCodes.CREATED);
      expect(result._data).toEqual(mockCreatedProfile);
    });

    it("should return unauthorized when no userId in JWT", async () => {
      mockContext.req.valid.mockReturnValue({});
      mockContext.get.mockReturnValue({ jwtPayload: null });

      const result = await handlers.createProfessionalProfile(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.UNAUTHORIZED);
      expect(result._data).toEqual({ message: "Unauthorized" });
    });
  });

  describe("updateCustomerProfile", () => {
    it("should update customer profile successfully", async () => {
      const mockUpdateData = {
        firstName: "Jane",
        lastName: "Smith",
      };

      const mockUpdatedProfile = {
        id: "profile-123",
        userId: "user-123",
        ...mockUpdateData,
        phoneNumber: "+1234567890",
        profileImage: null,
        otherNames: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.valid.mockReturnValue(mockUpdateData);
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockProfileService.updateCustomerProfile.mockResolvedValue(mockUpdatedProfile);

      const result = await handlers.updateCustomerProfile(mockContext, mockEnv);

      expect(mockProfileService.updateCustomerProfile).toHaveBeenCalledWith("user-123", {
        ...mockUpdateData,
        userId: "user-123",
      });
      expect(result._status).toBe(HttpStatusCodes.OK);
      expect(result._data).toEqual(mockUpdatedProfile);
    });

    it("should return bad request when update fails", async () => {
      mockContext.req.valid.mockReturnValue({});
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockProfileService.updateCustomerProfile.mockRejectedValue(new Error("Update failed"));

      const result = await handlers.updateCustomerProfile(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
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
        otherNames: null,
        phoneNumber: "+1234567890",
        profileImage: null,
        createdAt: new Date(),
        updatedAt: new Date()
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
      mockProfileService.getCustomerProfile.mockResolvedValue(mockProfile);
      mockImageUploaderInstance.upload.mockResolvedValue(mockUploadResult);

      const result = await handlers.uploadProfilePhoto(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.CREATED);
      expect(result._data).toEqual({
        url: mockUploadResult.url,
        metadata: {
          userId: "user-123",
          uploadedAt: mockUploadResult.metadata.uploadedAt,
        },
      });
    });

    it("should return unauthorized when no userId", async () => {
      mockContext.req.valid.mockReturnValue({});
      mockContext.get.mockReturnValue(null);

      const result = await handlers.uploadProfilePhoto(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.UNAUTHORIZED);
      expect(result._data).toEqual({ error: "Unauthorized", message: "User not authenticated" });
    });

    it("should return not found when profile doesn't exist", async () => {
      mockContext.req.valid.mockReturnValue({ file: new File(["test"], "test.jpg") });
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockProfileService.getCustomerProfile.mockResolvedValue(null);
      mockProfileService.getProfessionalProfile.mockResolvedValue(null);

      const result = await handlers.uploadProfilePhoto(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(result._data).toEqual({ error: "NotFound", message: "User profile not found" });
    });

    it("should handle upload failure", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockProfile = { 
        id: "profile-123", 
        userId: "user-123",
        firstName: "John",
        lastName: "Doe",
        otherNames: null,
        phoneNumber: "+1234567890",
        profileImage: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockContext.req.valid.mockReturnValue({ file: mockFile });
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockProfileService.getCustomerProfile.mockResolvedValue(mockProfile);
      mockImageUploaderInstance.upload.mockResolvedValue(null);

      const result = await handlers.uploadProfilePhoto(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(result._data).toEqual({ error: "UploadFailed", message: "Failed to upload image" });
    });

    it("should handle upload errors", async () => {
      const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
      const mockProfile = { id: "profile-123", userId: "user-123",firstName: "John", lastName: "Doe" , phoneNumber: "+1234567890" ,otherNames: "Michael",profileImage: null,updatedAt: new Date() ,createdAt: new Date() };

      mockContext.req.valid.mockReturnValue({ file: mockFile });
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockProfileService.getCustomerProfile.mockResolvedValue(mockProfile);
      mockImageUploaderInstance.upload.mockRejectedValue(new Error("Upload failed"));

      const result = await handlers.uploadProfilePhoto(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(result._data).toEqual({ error: "Error", message: "Upload failed" });
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
      mockImageUploaderInstance.delete.mockResolvedValue(true);
      mockProfileService.removeProfilePhoto.mockResolvedValue(undefined);

      const result = await handlers.deleteProfilePhoto(mockContext, mockEnv);

      expect(mockImageUploaderInstance.delete).toHaveBeenCalledWith("path/to/image.jpg");
      expect(mockProfileService.removeProfilePhoto).toHaveBeenCalledWith("user-123");
      expect(result._status).toBe(HttpStatusCodes.OK);
      expect(result._data).toEqual({ message: "Photo deleted successfully" });
    });

    it("should return unauthorized when no userId", async () => {
      mockContext.req.valid.mockReturnValue({});
      mockContext.get.mockReturnValue(null);

      const result = await handlers.deleteProfilePhoto(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.UNAUTHORIZED);
      expect(result._data).toEqual({ error: "Unauthorized", message: "User not authenticated" });
    });

    it("should return unauthorized when trying to delete another user's photo", async () => {
      const mockDeleteData = {
        userId: "other-user-123",
        imagePath: "path/to/image.jpg",
      };

      mockContext.req.valid.mockReturnValue(mockDeleteData);
      mockContext.get.mockReturnValue({ userId: "user-123" });

      const result = await handlers.deleteProfilePhoto(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.UNAUTHORIZED);
      expect(result._data).toEqual({ error: "Unauthorized", message: "Cannot delete photo for another user" });
    });

    it("should handle photo not found error", async () => {
      const mockDeleteData = {
        userId: "user-123",
        imagePath: "path/to/image.jpg",
      };

      mockContext.req.valid.mockReturnValue(mockDeleteData);
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockImageUploaderInstance.delete.mockRejectedValue(new Error("Photo not found"));

      const result = await handlers.deleteProfilePhoto(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(result._data).toEqual({ error: "Not Found", message: "Photo not found" });
    });

    it("should handle general deletion errors", async () => {
      const mockDeleteData = {
        userId: "user-123",
        imagePath: "path/to/image.jpg",
      };

      mockContext.req.valid.mockReturnValue(mockDeleteData);
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockImageUploaderInstance.delete.mockRejectedValue(new Error("Deletion failed"));

      const result = await handlers.deleteProfilePhoto(mockContext, mockEnv);

      expect(result._status).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(result._data).toEqual({ error: "Error", message: "Deletion failed" });
    });
  });
});
