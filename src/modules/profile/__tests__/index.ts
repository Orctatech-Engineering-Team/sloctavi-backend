/**
 * Profile Module Test Suite
 * 
 * This directory contains comprehensive unit and integration tests for the profile module.
 * 
 * Test Structure:
 * - handlers.test.ts: Tests for profile route handlers
 * - services.test.ts: Tests for profile service layer
 * - schema.test.ts: Tests for validation schemas
 * - integration.test.ts: End-to-end integration tests
 * - fixtures.ts: Test data factories and utilities
 * 
 * Running Tests:
 * - Run all profile tests: `npm test src/modules/profile`
 * - Run specific test file: `npm test src/modules/profile/__tests__/handlers.test.ts`
 * - Run tests in watch mode: `npm test -- --watch src/modules/profile`
 * 
 * Test Coverage:
 * The test suite covers:
 * ✅ Customer profile CRUD operations
 * ✅ Professional profile CRUD operations
 * ✅ Profile photo upload/delete functionality
 * ✅ Authentication and authorization
 * ✅ Input validation and sanitization
 * ✅ Error handling scenarios
 * ✅ Database operations and transactions
 * ✅ Image upload service integration
 * ✅ Schema validation
 * 
 * Mocking Strategy:
 * - Database operations are mocked to avoid dependency on actual database
 * - External services (image upload) are mocked for isolation
 * - JWT authentication is mocked for testing authorization logic
 * - HTTP context is mocked for handler testing
 * 
 * Test Data:
 * - Uses Faker.js for generating realistic test data
 * - Provides fixtures for common test scenarios
 * - Includes both valid and invalid data for comprehensive testing
 */

export * from "./fixtures";

// Re-export test utilities for easy access
export { describe, expect, it, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
