import { faker } from "@faker-js/faker";
import { vi } from "vitest";
import type { 
  CustomerProfile, 
  ProfessionalProfile, 
  NewCustomerProfile, 
  NewProfessionalProfile 
} from "@/db/schema/schema";

export const createMockCustomerProfile = (overrides?: Partial<CustomerProfile>): CustomerProfile => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  otherNames: faker.helpers.maybe(() => faker.person.middleName()) ?? null,
  phoneNumber: faker.phone.number(),
  profileImage: faker.helpers.maybe(() => faker.image.avatar()) ?? null,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

export const createMockProfessionalProfile = (overrides?: Partial<ProfessionalProfile>): ProfessionalProfile => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  name: faker.company.name(),
  location: faker.location.city(),
  description: faker.company.catchPhrase(),
  rating: faker.number.int({ min: 1, max: 5 }),
  status: faker.helpers.arrayElement(["available", "busy", "offline"]),
  profileImage: faker.helpers.maybe(() => faker.image.avatar()) ?? null,
  businessName: faker.company.name(),
  yearsOfExperience: faker.number.int({ min: 1, max: 20 }),
  businessType: faker.helpers.arrayElement(["individual", "agency"]),
  professionId: faker.number.int({ min: 1, max: 10 }),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  isActive: true,
  ...overrides,
});

export const createMockNewCustomerProfile = (overrides?: Partial<NewCustomerProfile>): NewCustomerProfile => ({
  userId: faker.string.uuid(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  phoneNumber: faker.phone.number(),
  otherNames: faker.helpers.maybe(() => faker.person.middleName()),
  profileImage: faker.helpers.maybe(() => faker.image.avatar()),
  ...overrides,
});

export const createMockNewProfessionalProfile = (overrides?: Partial<NewProfessionalProfile>): NewProfessionalProfile => ({
  userId: faker.string.uuid(),
  name: faker.company.name(),
  professionId: faker.number.int({ min: 1, max: 10 }),
  businessType: faker.helpers.arrayElement(["individual", "agency"]),
  location: faker.helpers.maybe(() => faker.location.city()),
  description: faker.helpers.maybe(() => faker.company.catchPhrase()),
  rating: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 })),
  status: faker.helpers.maybe(() => faker.helpers.arrayElement(["available", "busy", "offline"])),
  profileImage: faker.helpers.maybe(() => faker.image.avatar()),
  businessName: faker.helpers.maybe(() => faker.company.name()),
  yearsOfExperience: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 20 })),
  isActive: faker.helpers.maybe(() => true),
  ...overrides,
});

export const createMockUploadResult = (overrides?: any) => ({
  url: faker.image.avatar(),
  metadata: {
    userId: faker.string.uuid(),
    uploadedAt: faker.date.recent().toISOString(),
    ...overrides?.metadata,
  },
  ...overrides,
});

export const createMockFile = (
  filename: string = "test.jpg",
  content: string = "test content",
  type: string = "image/jpeg"
): File => {
  return new File([content], filename, { type });
};

export const createMockFormData = (file?: File) => ({
  file: file || createMockFile(),
});

export const createMockDeleteRequest = (overrides?: any) => ({
  userId: faker.string.uuid(),
  imagePath: faker.system.filePath(),
  ...overrides,
});

export const createMockJwtPayload = (overrides?: any) => ({
  userId: faker.string.uuid(),
  email: faker.internet.email(),
  type: faker.helpers.arrayElement(["customer", "professional"]),
  ...overrides,
});

export const createMockHonoContext = (overrides?: any) => ({
  req: {
    valid: vi.fn(),
    ...overrides?.req,
  },
  get: vi.fn(),
  json: vi.fn().mockImplementation((data: any, status: number) => 
    new Response(JSON.stringify(data), { status })
  ),
  ...overrides,
});

// Common test data
export const validCustomerProfileData = {
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+1234567890",
  otherNames: "Michael",
};

export const validProfessionalProfileData = {
  name: "John's Services",
  professionId: 1,
  businessType: "individual" as const,
  location: "New York",
  description: "Professional services provider",
  businessName: "John's Business",
  yearsOfExperience: 5,
};

export const invalidCustomerProfileData = {
  firstName: "",
  lastName: "",
  phoneNumber: "invalid-phone",
};

export const invalidProfessionalProfileData = {
  name: "",
  professionId: "invalid-id",
  businessType: "invalid-type",
};

// Error scenarios
export const databaseErrors = {
  connectionError: new Error("Database connection failed"),
  constraintError: new Error("Unique constraint violation"),
  timeoutError: new Error("Query timeout"),
  notFoundError: new Error("Record not found"),
};

export const imageUploadErrors = {
  fileTooLarge: new Error("File size exceeds limit"),
  invalidFormat: new Error("Invalid file format"),
  uploadFailed: new Error("Upload to storage failed"),
  networkError: new Error("Network connection failed"),
};

// Mock responses
export const mockSuccessResponses = {
  created: { status: 201, message: "Created successfully" },
  updated: { status: 200, message: "Updated successfully" },
  deleted: { status: 200, message: "Deleted successfully" },
  found: { status: 200, message: "Found successfully" },
};

export const mockErrorResponses = {
  unauthorized: { status: 401, message: "Unauthorized" },
  forbidden: { status: 403, message: "Forbidden" },
  notFound: { status: 404, message: "Not found" },
  badRequest: { status: 400, message: "Bad request" },
  internalError: { status: 500, message: "Internal server error" },
};

// Test utilities
export const createTestUserId = () => faker.string.uuid();
export const createTestProfileId = () => faker.string.uuid();
export const createTestImageUrl = () => faker.image.avatar();
export const createTestImagePath = () => faker.system.filePath();
export const createTestPhoneNumber = () => faker.phone.number();
export const createTestEmail = () => faker.internet.email();
export const createTestName = () => faker.person.fullName();
export const createTestCompanyName = () => faker.company.name();
export const createTestDescription = () => faker.lorem.sentence();
export const createTestLocation = () => faker.location.city();
export const createTestBusinessType = () => faker.helpers.arrayElement(["individual", "agency"]);
