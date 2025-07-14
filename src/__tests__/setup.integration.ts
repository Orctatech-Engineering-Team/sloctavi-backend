import { beforeAll, afterAll, vi } from 'vitest';

// Mock environment variables first
vi.mock('../env.ts', () => ({
  default: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-jwt-secret-key-very-long-and-secure',
    BETTER_AUTH_SECRET: 'test-better-auth-secret-key-very-long-and-secure',
    BETTER_AUTH_URL: 'http://localhost:3000',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-supabase-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-supabase-service-key',
    RESEND_API_KEY: 'test-resend-key',
    FROM_EMAIL: 'test@example.com',
    PORT: 3000,
  },
}));

// Mock Redis before any imports
vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => ({
    disconnect: vi.fn().mockResolvedValue(undefined),
    ping: vi.fn().mockResolvedValue('PONG'),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    expire: vi.fn().mockResolvedValue(1),
    flushall: vi.fn().mockResolvedValue('OK'),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    status: 'ready',
  })),
}));

// Mock BullMQ and Bull Board
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
    close: vi.fn().mockResolvedValue(undefined),
    obliterate: vi.fn().mockResolvedValue(undefined),
    getJobs: vi.fn().mockResolvedValue([]),
    getJob: vi.fn().mockResolvedValue(null),
    getJobCounts: vi.fn().mockResolvedValue({}),
    clean: vi.fn().mockResolvedValue([]),
    drain: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    name: 'test-queue',
    opts: {},
  })),
  Worker: vi.fn().mockImplementation(() => ({
    run: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

// Mock Bull Board
vi.mock('@bull-board/api', () => ({
  createBullBoard: vi.fn().mockReturnValue({
    addQueue: vi.fn(),
    removeQueue: vi.fn(),
    setQueues: vi.fn(),
    replaceQueues: vi.fn(),
    getQueues: vi.fn().mockReturnValue([]),
  }),
  BullMQAdapter: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@bull-board/hono', () => ({
  HonoAdapter: vi.fn().mockImplementation(() => ({
    setBasePath: vi.fn(),
    getRouter: vi.fn().mockReturnValue({
      all: vi.fn(),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
    }),
  })),
}));

// Mock the database
vi.mock('../db/index.ts', () => ({
  default: {
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: 'test-user-id' }),
        update: vi.fn().mockResolvedValue({ id: 'test-user-id' }),
        delete: vi.fn().mockResolvedValue({ id: 'test-user-id' }),
      },
      profiles: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: 'test-profile-id' }),
        update: vi.fn().mockResolvedValue({ id: 'test-profile-id' }),
        delete: vi.fn().mockResolvedValue({ id: 'test-profile-id' }),
      },
      bookings: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: 'test-booking-id' }),
        update: vi.fn().mockResolvedValue({ id: 'test-booking-id' }),
        delete: vi.fn().mockResolvedValue({ id: 'test-booking-id' }),
      },
    },
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
  },
}));

// Mock the email queue directly
vi.mock('../shared/services/mailer/queue.ts', () => ({
  emailQueue: {
    add: vi.fn().mockResolvedValue({ id: 'test-job-id' }),
    close: vi.fn().mockResolvedValue(undefined),
    obliterate: vi.fn().mockResolvedValue(undefined),
    getJobs: vi.fn().mockResolvedValue([]),
    getJob: vi.fn().mockResolvedValue(null),
    getJobCounts: vi.fn().mockResolvedValue({}),
    clean: vi.fn().mockResolvedValue([]),
    drain: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    name: 'emailQueue',
    opts: {},
  },
}));

beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.JWT_SECRET = 'test-jwt-secret-key-very-long-and-secure';
  process.env.BETTER_AUTH_SECRET = 'test-better-auth-secret-key-very-long-and-secure';
  process.env.BETTER_AUTH_URL = 'http://localhost:3000';
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-supabase-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-supabase-service-key';
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.FROM_EMAIL = 'test@example.com';
});

afterAll(async () => {
  // Clean up if needed
});
