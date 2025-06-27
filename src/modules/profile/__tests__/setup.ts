import { beforeEach, afterEach, vi } from "vitest";

// Global mocks for profile module tests
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

vi.mock("@/utils/imageUpload", () => ({
  ImageUploader: vi.fn(),
}));

vi.mock("@/env", () => ({
  default: {
    SUPABASE_URL: "test-url",
    SUPABASE_ANON_KEY: "test-key",
    NODE_ENV: "test",
  },
}));

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper function to create mock database responses
export const createMockDbResponse = (data: any) => ({
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([data]),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
});

// Helper function to create mock database error
export const createMockDbError = (message: string) => ({
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockRejectedValue(new Error(message)),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockRejectedValue(new Error(message)),
});

// Helper function to create mock image uploader
export const createMockImageUploader = (uploadResult?: any, deleteResult?: any) => ({
  upload: vi.fn().mockResolvedValue(uploadResult),
  delete: vi.fn().mockResolvedValue(deleteResult),
});

// Helper function to create mock Hono context
export const createMockContext = (overrides: any = {}) => ({
  req: {
    valid: vi.fn(),
    ...overrides.req,
  },
  get: vi.fn(),
  json: vi.fn().mockImplementation((data: any, status: number) => 
    new Response(JSON.stringify(data), { status })
  ),
  ...overrides,
});

// Test constants
export const TEST_USER_ID = "test-user-123";
export const TEST_PROFILE_ID = "test-profile-123";
export const TEST_IMAGE_URL = "https://example.com/test-image.jpg";
export const TEST_IMAGE_PATH = "profiles/test-user-123/photo.jpg";

// Mock data templates
export const MOCK_CUSTOMER_PROFILE = {
  id: TEST_PROFILE_ID,
  userId: TEST_USER_ID,
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+1234567890",
  profileImage: null,
  otherNames: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const MOCK_PROFESSIONAL_PROFILE = {
  id: TEST_PROFILE_ID,
  userId: TEST_USER_ID,
  name: "John's Services",
  professionId: 1,
  businessType: "individual",
  location: "New York",
  description: "Professional services",
  rating: null,
  status: null,
  profileImage: null,
  businessName: null,
  yearsOfExperience: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
};

export const MOCK_UPLOAD_RESULT = {
  url: TEST_IMAGE_URL,
  metadata: {
    userId: TEST_USER_ID,
    uploadedAt: new Date().toISOString(),
  },
};

export const MOCK_JWT_PAYLOAD = {
  userId: TEST_USER_ID,
  email: "test@example.com",
  type: "customer",
};
