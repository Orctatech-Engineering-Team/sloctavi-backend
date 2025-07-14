import { describe, expect, it, vi, beforeEach } from "vitest";
import * as HttpStatusCodes from "stoker/http-status-codes";
import db from "@/db";
import { customerProfiles, professionalProfiles } from "@/db/schema/schema";
import { AppError } from "@/utils/error";
import profileService from "../services";

// Mock the database
vi.mock("@/db", () => ({
  default: {
    insert: vi.fn(),
    update: vi.fn(),
    query: {
      customerProfiles: {
        findFirst: vi.fn(),
      },
      professionalProfiles: {
        findFirst: vi.fn(),
      },
    },
  },
}));

const mockDb = vi.mocked(db);

describe("Profile Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCustomerProfile", () => {
    it("should create customer profile successfully", async () => {
      const mockData = {
        userId: "user-123",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
      };

      const mockProfile = {
        id: "profile-123",
        ...mockData,
        otherNames: null,
        profileImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockProfile]),
        }),
      });

      mockDb.insert.mockReturnValue(mockInsert());

      const result = await profileService.createCustomerProfile(mockData);

      expect(mockDb.insert).toHaveBeenCalledWith(customerProfiles);
      expect(result).toEqual(mockProfile);
    });

    it("should throw AppError on database error", async () => {
      const mockData = {
        userId: "user-123",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error("Database error")),
        }),
      });

      mockDb.insert.mockReturnValue(mockInsert());

      await expect(profileService.createCustomerProfile(mockData)).rejects.toThrow(AppError);
    });
  });

  describe("getCustomerProfile", () => {
    it("should get customer profile successfully", async () => {
      const mockProfile = {
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

      mockDb.query.customerProfiles.findFirst.mockResolvedValue(mockProfile);

      const result = await profileService.getCustomerProfile("user-123");

      expect(mockDb.query.customerProfiles.findFirst).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
      expect(result).toEqual(mockProfile);
    });

    it("should return null when profile not found", async () => {
      mockDb.query.customerProfiles.findFirst.mockResolvedValue(undefined);

      const result = await profileService.getCustomerProfile("user-123");

      expect(result).toBeNull();
    });

    it("should throw AppError on database error", async () => {
      mockDb.query.customerProfiles.findFirst.mockRejectedValue(new Error("Database error"));

      await expect(profileService.getCustomerProfile("user-123")).rejects.toThrow(AppError);
    });
  });

  describe("createProfessionalProfile", () => {
    it("should create professional profile successfully", async () => {
      const mockData = {
        userId: "user-123",
        name: "Jane Smith",
        location: "New York",
        description: "Expert designer",
        professionId: 1,
      };

      const mockProfile = {
        id: "prof-123",
        ...mockData,
        rating: null,
        status: null,
        profileImage: null,
        businessName: null,
        yearsOfExperience: null,
        businessType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockProfile]),
        }),
      });

      mockDb.insert.mockReturnValue(mockInsert());

      const result = await profileService.createProfessionalProfile(mockData);

      expect(mockDb.insert).toHaveBeenCalledWith(professionalProfiles);
      expect(result).toEqual(mockProfile);
    });
  });

  describe("getProfessionalProfile", () => {
    it("should get professional profile successfully", async () => {
      const mockProfile = {
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

      mockDb.query.professionalProfiles.findFirst.mockResolvedValue(mockProfile);

      const result = await profileService.getProfessionalProfile("user-123");

      expect(mockDb.query.professionalProfiles.findFirst).toHaveBeenCalledWith({
        where: expect.any(Function),
      });
      expect(result).toEqual(mockProfile);
    });

    it("should return null when profile not found", async () => {
      mockDb.query.professionalProfiles.findFirst.mockResolvedValue(undefined);

      const result = await profileService.getProfessionalProfile("user-123");

      expect(result).toBeNull();
    });
  });

  describe("updateCustomerProfile", () => {
    it("should update customer profile successfully", async () => {
      const mockData = {
        userId: "user-123",
        firstName: "John Updated",
        lastName: "Doe Updated",
        phoneNumber: "+1234567890",
      };

      const mockProfile = {
        id: "profile-123",
        ...mockData,
        otherNames: null,
        profileImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      });

      mockDb.update.mockReturnValue(mockUpdate());

      const result = await profileService.updateCustomerProfile("user-123", mockData);

      expect(mockDb.update).toHaveBeenCalledWith(customerProfiles);
      expect(result).toEqual(mockProfile);
    });
  });

  describe("updateProfessionalProfile", () => {
    it("should update professional profile successfully", async () => {
      const mockData = {
        userId: "user-123",
        name: "Jane Updated",
        location: "Boston",
        description: "Senior designer",
        professionId: 1,
      };

      const mockProfile = {
        id: "prof-123",
        ...mockData,
        rating: null,
        status: null,
        profileImage: null,
        businessName: null,
        yearsOfExperience: null,
        businessType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockProfile]),
          }),
        }),
      });

      mockDb.update.mockReturnValue(mockUpdate());

      const result = await profileService.updateProfessionalProfile("user-123", mockData);

      expect(mockDb.update).toHaveBeenCalledWith(professionalProfiles);
      expect(result).toEqual(mockProfile);
    });
  });
});
