# Database Schema Analysis: Availability, Services & Booking Relationships

## Core Entity Relationships

### Professional Hierarchy

- `professions` (1) ←→ (M) `professionalProfiles` - Each professional belongs to one profession
- `professions` (1) ←→ (M) `services` - Each service belongs to one profession
- `professionalProfiles` (M) ←→ (M) `services` via `professionalServices` - Professionals can offer multiple services

### Service Organization

- `services` (M) ←→ (M) `categories` via `serviceCategories` - Services can have multiple categories
- `services` (M) ←→ (M) `tags` via `serviceTags` - Services can have multiple tags

### Availability System

- `professionalProfiles` (1) ←→ (M) `availability` - Each professional has multiple availability slots
- `availability.day` (0-6 for Sunday-Saturday) with `fromTime`/`toTime` and `capacity`

### Booking Flow

- `bookings` references `customerProfiles`, `professionalProfiles`, `services`
- `bookings.availabilityId` optionally links to specific availability slots
- `bookings.status` references `bookingStatus` table
- `bookingStatusHistory` tracks status changes over time

## Key Design Patterns

### Professional Services Pricing

- Base service has `priceRange` and `durationEstimate` (schema.ts:131-132)
- Individual professionals set specific `price` and `duration` in `professionalServices` (schema.ts:143-144)

### Availability Flexibility

- Basic weekly recurring slots with optional `detailed` flag (schema.ts:193)
- `capacity` allows multiple bookings per slot (schema.ts:192)

### Booking Constraints

- Bookings must reference valid service offered by the professional
- Optional link to availability slot enables capacity management

## Schema Critique & Recommendations

### Current Design Strengths

- Clean separation of concerns between professions, services, and professionals
- Flexible pricing model (base + professional-specific)
- Good audit trail with booking status history
- Supports both individual and agency business types (`businessType` field)

### Key Issues & Recommendations

#### 1. Organization/Agency Support Gap

```sql
-- Current: professionalProfiles.businessType = 'agency' 
-- But availability is still per individual professional
```

**Issue**: Agencies need multiple staff members per professional profile, but schema treats each as individual.

**Recommendation**: Consider adding a `staff` or `team_members` table for agencies:

```sql
staff_members (id, professional_id, name, specializations[], availability_overrides)
```

#### 2. Service-Specific Availability Analysis

**For individuals**: Current design is correct - one person's availability applies to all their services.

**For organizations**: This becomes problematic:

- Hair salon: different stylists for cuts vs color vs extensions
- Medical clinic: different specialists available different days
- Cleaning service: team size varies by service type

#### 3. Availability Design Issues

```typescript
// Current schema.ts:186-196
availability: {
  capacity: integer("capacity").default(1), // Too simplistic
  detailed: boolean("detailed").default(false), // Unclear purpose
}
```

**Issues**:

- `capacity` doesn't account for service duration overlap
- No service duration constraints in availability slots
- `detailed` flag purpose unclear (schema.ts:193)

### Proposed Improvements

#### Option A: Service-Aware Availability (for organizations)

```sql
availability_slots (
  id,
  professional_id,
  service_id?, -- NULL = available for all services
  day,
  from_time,
  to_time,
  max_concurrent_bookings,
  staff_member_id? -- for agencies
)
```

#### Option B: Keep Current + Add Organization Support

```sql
-- Keep current availability table
-- Add staff assignment
booking_assignments (
  booking_id,
  staff_member_id,
  assigned_at
)
```

### Final Recommendation

**Stick with current design** but add:

1. Proper organization/staff member support
2. Service duration validation in booking logic
3. Remove ambiguous `detailed` flag
4. Add `min_booking_duration` to services table

The complexity of service-specific availability isn't worth it unless you're specifically targeting multi-service organizations as primary users.

## Design Philosophy

The design supports a marketplace where professionals offer specialized services within their profession, with flexible pricing and availability management. The current schema works well for individual professionals and small businesses, with room for enhancement to better support larger organizations.
