import { create } from "domain";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const user_type = pgEnum("user_type", [
  "customer",
  "professional",
]);

export type UserType = (typeof user_type.enumValues)[number];

// ------------------ ROLES -----------------
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ----------------- USERS -----------------
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password_hash", { length: 255 }).notNull(),
  type: user_type("type").notNull(),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login").defaultNow(),
});

// ----------------- USER_ROLES (many-to-many) -----------------
export const userRoles = pgTable("user_roles", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: serial("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  grantedAt: timestamp("granted_at").defaultNow(),
  grantedBy: uuid("granted_by").references(() => users.id), // nullable if system granted
  isActive: boolean("is_active").default(true), // to soft-delete roles
}, table => ({
  pk: primaryKey({ columns: [table.userId, table.roleId] }),
}));

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // e.g., 'booking_created'
  entityType: varchar("entity_type", { length: 100 }).notNull(), // e.g., 'booking'
  entityId: uuid("entity_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata").default({}), // additional data about the action
});

// ----------------- EMAIL VERIFICATION -----------------
export const emailVerifications = pgTable("email_verifications", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  otpCode: varchar("otp_code", { length: 4 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ----------------- CUSTOMER PROFILE -----------------
export const customerProfiles = pgTable("customer_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  otherNames: varchar("other_names", { length: 100 }),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  profileImage: varchar("profile_image", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ----------------- PROFESSIONS -----------------
export const professions = pgTable("professions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// ----------------- PROFESSIONAL PROFILE -----------------
export const professionalProfiles = pgTable("professional_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }),
  location: varchar("location", { length: 150 }),
  description: text("description"),
  rating: integer("rating"), // computed elsewhere
  status: varchar("status", { length: 50 }), // e.g. 'available', 'busy'
  profileImage: varchar("profile_image", { length: 255 }),
  businessName: varchar("business_name", { length: 150 }),
  yearsOfExperience: integer("years_of_experience"),
  businessType: varchar("business_type", { length: 100 }), // 'individual', 'agency'
  professionId: integer("profession_id").notNull().references(() => professions.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// ----------------- SERVICES -----------------
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  professionId: integer("profession_id").notNull().references(() => professions.id),
  priceRange: varchar("price_range", { length: 50 }),
  durationEstimate: integer("duration_estimate"), // in minutes
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// ----------------- PROFESSIONAL_SERVICES (many-to-many) -----------------
export const professionalServices = pgTable("professional_services", {
  professionalId: uuid("professional_id").references(() => professionalProfiles.id, { onDelete: "cascade" }),
  serviceId: integer("service_id").references(() => services.id, { onDelete: "cascade" }),
  price: numeric("price"), // professional-set price
  duration: integer("duration"), // professional-set duration in minutes
}, table => ({
  pk: primaryKey({ columns: [table.professionalId, table.serviceId] }),
}));

// ----------------- CATEGORIES -----------------
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// ----------------- SERVICE CATEGORIES -----------------
export const serviceCategories = pgTable("service_categories", {
  serviceId: integer("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, table => ({
  pk: primaryKey({ columns: [table.serviceId, table.categoryId] }),
}));

// ----------------- TAGS -----------------
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// ----------------- SERVICE TAGS (many-to-many) -----------------
export const serviceTags = pgTable("service_tags", {
  serviceId: integer("service_id").references(() => services.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").references(() => tags.id, { onDelete: "cascade" }),
}, table => ({
  pk: primaryKey({ columns: [table.serviceId, table.tagId] }),
}));

// ----------------- AVAILABILITY -----------------
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  professionalId: uuid("professional_id").notNull().references(() => professionalProfiles.id, { onDelete: "cascade" }),
  day: integer("day").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  fromTime: time("from_time").notNull(),
  toTime: time("to_time").notNull(),
  capacity: integer("capacity").default(1),
  detailed: boolean("detailed").default(false), // fine-grained availability enabled for this slot
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ----------------- BOOKING STATUS -----------------
export const bookingStatus = pgTable("booking_status", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // e.g. 'pending', 'confirmed', 'completed', 'canceled'
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ----------------- BOOKINGS -----------------
export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull().references(() => customerProfiles.id, { onDelete: "cascade" }),
  professionalId: uuid("professional_id").notNull().references(() => professionalProfiles.id, { onDelete: "cascade" }),
  serviceId: integer("service_id").notNull().references(() => services.id),
  date: date("date").notNull(),
  time: time("time").notNull(),
  duration: integer("duration").notNull(), // duration in minutes for convenience
  status: integer("status").notNull().references(() => bookingStatus.id, { onDelete: "set null" }),
  notes: text("notes"),
  availabilityId: integer("availability_id").references(() => availability.id), // optional FK to availability slot
  createdAt: timestamp("created_at").defaultNow(),
});

// ----------------- bookingStatusHistory -----------------
export const bookingStatusHistory = pgTable("booking_status_history", {
  id: serial("id").primaryKey(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  oldStatus: varchar("old_status", { length: 50 }).notNull(),
  NewStatus: varchar("New_status", { length: 50 }).notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  changedBy: uuid("changed_by").references(() => users.id), // nullable if system triggered
});

// ----------------- REVIEWS -----------------
export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => customerProfiles.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // e.g., 'booking_update', 'message', 'recommendation'
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  channel: varchar("channel", { length: 20 }).notNull(), // e.g., 'email', 'push', 'in_app'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// export types for the tables
export type User = typeof users.$inferSelect;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type ProfessionalProfile = typeof professionalProfiles.$inferSelect;
export type Profession = typeof professions.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Availability = typeof availability.$inferSelect;
export type BookingStatus = typeof bookingStatus.$inferSelect;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type ServiceTag = typeof serviceTags.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type UserWithProfile = User & (CustomerProfile | ProfessionalProfile);
export type ProfessionalService = typeof professionalServices.$inferSelect;
export type BookingStatusHistory = typeof bookingStatusHistory.$inferSelect;
export type EmailVerificationWithUser = EmailVerification & { user: User };
export type ServiceWithCategories = Service & {
  categories: Category[];
};
export type ServiceWithTags = Service & {
  tags: Tag[];
};

export type NewUser = typeof users.$inferInsert;
export type NewCustomerProfile = typeof customerProfiles.$inferInsert;
export type NewProfessionalProfile = typeof professionalProfiles.$inferInsert;
export type NewProfession = typeof professions.$inferInsert;
export type NewService = typeof services.$inferInsert;
export type NewBooking = typeof bookings.$inferInsert;
export type NewReview = typeof reviews.$inferInsert;
export type NewAvailability = typeof availability.$inferInsert;
export type NewBookingStatus = typeof bookingStatus.$inferInsert;
export type NewEmailVerification = typeof emailVerifications.$inferInsert;
export type NewServiceCategory = typeof serviceCategories.$inferInsert;
export type NewServiceTag = typeof serviceTags.$inferInsert;
export type NewTag = typeof tags.$inferInsert;
export type NewCategory = typeof categories.$inferInsert;
export type NewProfessionalService = typeof professionalServices.$inferInsert;
export type NewBookingStatusHistory = typeof bookingStatusHistory.$inferInsert;
export type NewEmailVerificationWithUser = NewEmailVerification & { user: NewUser };
export type NewServiceWithCategories = NewService & {
  categories: NewCategory[];
};

export const insertCustomerProfileSchema = createInsertSchema(customerProfiles).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfessionalProfileSchema = createInsertSchema(professionalProfiles).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isVerified: true,
  password: true, // password should be hashed before insertion
});

export const insertProfessionSchema = createInsertSchema(professions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const selectCustomerProfileSchema = createSelectSchema(customerProfiles);
export const selectProfessionalProfileSchema = createSelectSchema(professionalProfiles);
export const selectUserSchema = createSelectSchema(users);
export const selectProfessionSchema = createSelectSchema(professions);
export const selectServiceSchema = createSelectSchema(services);
export const selectBookingSchema = createSelectSchema(bookings);
export const selectReviewSchema = createSelectSchema(reviews);
export const selectAvailabilitySchema = createSelectSchema(availability);

export const insertUsersSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isVerified: true,
  lastLogin: true,
});

export const selectUsersSchema = createSelectSchema(users).omit({
  password: true, // omit password from select schema
})