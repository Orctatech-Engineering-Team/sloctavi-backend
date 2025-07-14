import { describe, expect, it, vi, beforeEach } from "vitest";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { CustomerProfile, ProfessionalProfile } from "@/db/schema/schema";

// Mock dependencies
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

vi.mock("@/utils/imageUpload", () => ({
  ImageUploader: vi.fn().mockImplementation(() => ({
    upload: vi.fn(),
    delete: vi.fn(),
  })),
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

describe("Profile Handlers", () => {
  let mockContext: any;
  let mockEnv: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {
      req: {
        valid: vi.fn(),
      },
      get: vi.fn(),
      json: vi.fn(),
    };

    mockEnv = {};
  });

  describe("createCustomerProfile", () => {
    it("should create customer profile successfully", async () => {
      const mockData = {
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
      };

      const mockProfile: CustomerProfile = {
        id: "profile-123",
        userId: "user-123",
        firstName: "John",
        lastName: "Doe",
        otherNames: null,
        phoneNumber: "+1234567890",
        profileImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.valid.mockReturnValue(mockData);
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue({ success: true });
      mockProfileService.createCustomerProfile.mockResolvedValue(mockProfile);

      await handlers.createCustomerProfile(mockContext, mockEnv);

      expect(mockProfileService.createCustomerProfile).toHaveBeenCalledWith({
        ...mockData,
        userId: "user-123",
      });
      expect(mockContext.json).toHaveBeenCalledWith(mockProfile, HttpStatusCodes.CREATED);
    });

    it("should return unauthorized when no user ID", async () => {
      mockContext.get.mockReturnValue(null);
      mockContext.json.mockReturnValue({ error: true });

      await handlers.createCustomerProfile(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { message: "Unauthorized" },
        HttpStatusCodes.UNAUTHORIZED
      );
    });
  });

  describe("getCustomerProfile", () => {
    it("should get customer profile successfully", async () => {
      const mockProfile: CustomerProfile = {
        id: "profile-123",
        userId: "user-123",
        firstName: "John",
        lastName: "Doe",
        otherNames: null,
        phoneNumber: "+1234567890",
        profileImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue({ success: true });
      mockProfileService.getCustomerProfile.mockResolvedValue(mockProfile);

      await handlers.getCustomerProfile(mockContext, mockEnv);

      expect(mockProfileService.getCustomerProfile).toHaveBeenCalledWith("user-123");
      expect(mockContext.json).toHaveBeenCalledWith(mockProfile, HttpStatusCodes.OK);
    });

    it("should return not found when profile does not exist", async () => {
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue({ error: true });
      mockProfileService.getCustomerProfile.mockResolvedValue(null);

      await handlers.getCustomerProfile(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { message: "Customer profile not found" },
        HttpStatusCodes.NOT_FOUND
      );
    });
  });

  describe("createProfessionalProfile", () => {
    it("should create professional profile successfully", async () => {
      const mockData = {
        name: "Jane Smith",
        location: "New York",
        description: "Expert designer",
        professionId: 1,
      };

      const mockProfile: ProfessionalProfile = {
        id: "prof-123",
        userId: "user-123",
        name: "Jane Smith",
        location: "New York",
        description: "Expert designer",
        rating: null,
        status: null,
        profileImage: null,
        businessName: null,
        yearsOfExperience: null,
        businessType: null,
        professionId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockContext.req.valid.mockReturnValue(mockData);
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue({ success: true });
      mockProfileService.createProfessionalProfile.mockResolvedValue(mockProfile);

      await handlers.createProfessionalProfile(mockContext, mockEnv);

      expect(mockProfileService.createProfessionalProfile).toHaveBeenCalledWith({
        ...mockData,
        userId: "user-123",
      });
      expect(mockContext.json).toHaveBeenCalledWith(mockProfile, HttpStatusCodes.CREATED);
    });
  });

  describe("getProfessionalProfile", () => {
    it("should get professional profile successfully", async () => {
      const mockProfile: ProfessionalProfile = {
        id: "prof-123",
        userId: "user-123",
        name: "Jane Smith",
        location: "New York",
        description: "Expert designer",
        rating: null,
        status: null,
        profileImage: null,
        businessName: null,
        yearsOfExperience: null,
        businessType: null,
        professionId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue({ success: true });
      mockProfileService.getProfessionalProfile.mockResolvedValue(mockProfile);

      await handlers.getProfessionalProfile(mockContext, mockEnv);

      expect(mockProfileService.getProfessionalProfile).toHaveBeenCalledWith("user-123");
      expect(mockContext.json).toHaveBeenCalledWith(mockProfile, HttpStatusCodes.OK);
    });
  });
});
