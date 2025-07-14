import { describe, expect, it, vi, beforeEach } from "vitest";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { BookingWithDetails } from "../schema";

// Mock dependencies
vi.mock("../services", () => ({
  default: {
    createBooking: vi.fn(),
    getBookingById: vi.fn(),
    getUserBookings: vi.fn(),
    updateBookingStatus: vi.fn(),
    cancelBooking: vi.fn(),
    getAvailableSlots: vi.fn(),
  },
}));

vi.mock("@/db", () => ({
  default: {
    query: {
      customerProfiles: { findFirst: vi.fn() },
      users: { findFirst: vi.fn() },
    },
  },
}));

// Import after mocking
import * as handlers from "../handlers";
import bookingService from "../services";
import db from "@/db";

const mockBookingService = vi.mocked(bookingService);
const mockDb = vi.mocked(db);

describe("Booking Handlers", () => {
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

  describe("createBooking", () => {
    it("should create booking successfully", async () => {
      const mockBookingData = {
        professionalId: "prof-123",
        serviceId: 1,
        date: "2024-01-15",
        time: "10:00",
        duration: 60,
        notes: "Test booking",
      };

      const mockBooking: BookingWithDetails = {
        id: "booking-123",
        customerId: "customer-123",
        professionalId: "prof-123",
        serviceId: 1,
        date: "2024-01-15",
        time: "10:00",
        duration: 60,
        status: 1,
        notes: "Test booking",
        availabilityId: null,
        createdAt: new Date(),
        customer: {
          firstName: "John",
          lastName: "Doe",
          phoneNumber: "+1234567890",
          profileImage: null,
        },
        professional: {
          name: "Jane Smith",
          businessName: "Jane's Services",
          location: "New York",
          profileImage: null,
          rating: null,
        },
        service: {
          name: "Consultation",
          description: "Business consultation",
          durationEstimate: 60,
        },
        bookingStatus: {
          name: "pending",
          description: "Booking is pending confirmation",
        },
      };

      const mockCustomerProfile = {
        id: "customer-123",
        userId: "user-123",
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "+1234567890",
        otherNames: null,
        profileImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.req.valid.mockReturnValue(mockBookingData);
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue({ success: true });
      mockDb.query.customerProfiles.findFirst.mockResolvedValue(mockCustomerProfile);
      mockBookingService.createBooking.mockResolvedValue(mockBooking);

      await handlers.createBooking(mockContext, mockEnv);

      expect(mockBookingService.createBooking).toHaveBeenCalledWith(
        "customer-123",
        mockBookingData
      );
      expect(mockContext.json).toHaveBeenCalledWith(mockBooking, HttpStatusCodes.CREATED);
    });

    it("should return unauthorized when no user ID", async () => {
      mockContext.get.mockReturnValue(null);
      mockContext.json.mockReturnValue({ error: true });

      await handlers.createBooking(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { message: "Unauthorized" },
        HttpStatusCodes.UNAUTHORIZED
      );
    });

    it("should return bad request when customer profile not found", async () => {
      mockContext.req.valid.mockReturnValue({});
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue({ error: true });
      mockDb.query.customerProfiles.findFirst.mockResolvedValue(null);

      await handlers.createBooking(mockContext, mockEnv);

      expect(mockContext.json).toHaveBeenCalledWith(
        { message: "Customer profile not found" },
        HttpStatusCodes.BAD_REQUEST
      );
    });
  });

  describe("getBooking", () => {
    it("should get booking successfully", async () => {
      const mockBooking: BookingWithDetails = {
        id: "booking-123",
        customerId: "customer-123",
        professionalId: "prof-123",
        serviceId: 1,
        date: "2024-01-15",
        time: "10:00",
        duration: 60,
        status: 1,
        notes: "Test booking",
        availabilityId: null,
        createdAt: new Date(),
        customer: {
          firstName: "John",
          lastName: "Doe",
          phoneNumber: "+1234567890",
          profileImage: null,
        },
        professional: {
          name: "Jane Smith",
          businessName: "Jane's Services",
          location: "New York",
          profileImage: null,
          rating: null,
        },
        service: {
          name: "Consultation",
          description: "Business consultation",
          durationEstimate: 60,
        },
        bookingStatus: {
          name: "pending",
          description: "Booking is pending confirmation",
        },
      };

      mockContext.req.valid.mockReturnValue({ id: "booking-123" });
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue({ success: true });
      mockBookingService.getBookingById.mockResolvedValue(mockBooking);

      await handlers.getBooking(mockContext, mockEnv);

      expect(mockBookingService.getBookingById).toHaveBeenCalledWith("booking-123", "user-123");
      expect(mockContext.json).toHaveBeenCalledWith(mockBooking, HttpStatusCodes.OK);
    });
  });

  describe("getUserBookings", () => {
    it("should get user bookings successfully", async () => {
      const mockResult = {
        bookings: [],
        total: 0,
        hasMore: false,
      };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        type: "customer" as const,
        password: "hashed",
        isVerified: true,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      mockContext.req.valid.mockReturnValue({
        limit: 20,
        offset: 0,
      });
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue({ success: true });
      mockDb.query.users.findFirst.mockResolvedValue(mockUser);
      mockBookingService.getUserBookings.mockResolvedValue(mockResult);

      await handlers.getUserBookings(mockContext, mockEnv);

      expect(mockBookingService.getUserBookings).toHaveBeenCalledWith(
        "user-123",
        "customer",
        {
          status: undefined,
          limit: 20,
          offset: 0,
        }
      );
      expect(mockContext.json).toHaveBeenCalledWith(mockResult, HttpStatusCodes.OK);
    });
  });

  describe("updateBookingStatus", () => {
    it("should update booking status successfully", async () => {
      const mockBooking: BookingWithDetails = {
        id: "booking-123",
        customerId: "customer-123",
        professionalId: "prof-123",
        serviceId: 1,
        date: "2024-01-15",
        time: "10:00",
        duration: 60,
        status: 2, // confirmed
        notes: "Test booking",
        availabilityId: null,
        createdAt: new Date(),
      };

      mockContext.req.valid
        .mockReturnValueOnce({ id: "booking-123" }) // param
        .mockReturnValueOnce({ status: 2, notes: "Confirmed" }); // json
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue({ success: true });
      mockBookingService.updateBookingStatus.mockResolvedValue(mockBooking);

      await handlers.updateBookingStatus(mockContext, mockEnv);

      expect(mockBookingService.updateBookingStatus).toHaveBeenCalledWith(
        "booking-123",
        2,
        "user-123",
        "Confirmed"
      );
      expect(mockContext.json).toHaveBeenCalledWith(mockBooking, HttpStatusCodes.OK);
    });
  });

  describe("cancelBooking", () => {
    it("should cancel booking successfully", async () => {
      const mockBooking = {
        id: "booking-123",
        customerId: "customer-123",
        professionalId: "prof-123",
        serviceId: 1,
        date: "2024-01-15",
        time: "10:00",
        duration: 60,
        status: 4, // cancelled
        notes: "Test booking\nCancellation reason: Change of plans",
        availabilityId: null,
        createdAt: new Date(),
      };

      mockContext.req.valid
        .mockReturnValueOnce({ id: "booking-123" }) // param
        .mockReturnValueOnce({ reason: "Change of plans" }); // json
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue({ success: true });
      mockBookingService.cancelBooking.mockResolvedValue(mockBooking);

      await handlers.cancelBooking(mockContext, mockEnv);

      expect(mockBookingService.cancelBooking).toHaveBeenCalledWith(
        "booking-123",
        "user-123",
        "Change of plans"
      );
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          message: "Booking cancelled successfully",
          booking: mockBooking,
        },
        HttpStatusCodes.OK
      );
    });
  });

  describe("getAvailableSlots", () => {
    it("should get available slots successfully", async () => {
      const mockSlots = [
        {
          startTime: "09:00",
          endTime: "10:00",
          available: true,
          availabilityId: 1,
        },
        {
          startTime: "10:00",
          endTime: "11:00",
          available: false,
          availabilityId: 1,
        },
      ];

      mockContext.req.valid
        .mockReturnValueOnce({ professionalId: "prof-123" }) // param
        .mockReturnValueOnce({ date: "2024-01-15", serviceId: "1" }); // query
      mockContext.get.mockReturnValue({ userId: "user-123" });
      mockContext.json.mockReturnValue({ success: true });
      mockBookingService.getAvailableSlots.mockResolvedValue(mockSlots);

      await handlers.getAvailableSlots(mockContext, mockEnv);

      expect(mockBookingService.getAvailableSlots).toHaveBeenCalledWith(
        "prof-123",
        "2024-01-15",
        "1"
      );
      expect(mockContext.json).toHaveBeenCalledWith(
        {
          date: "2024-01-15",
          availableSlots: mockSlots,
        },
        HttpStatusCodes.OK
      );
    });
  });
});
