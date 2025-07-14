import { z } from "zod";

// Professional search filters
export const ProfessionalSearchFiltersSchema = z.object({
  // Location-based filters
  location: z.string().optional(),
  radius: z.number().int().min(1).max(100).default(25), // km
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  
  // Service-based filters
  professionId: z.number().int().positive().optional(),
  serviceId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  tagId: z.number().int().positive().optional(),
  
  // Quality filters
  minRating: z.number().min(0).max(5).optional(),
  minReviews: z.number().int().min(0).optional(),
  
  // Experience filters
  minYearsExperience: z.number().int().min(0).optional(),
  businessType: z.enum(["individual", "agency"]).optional(),
  
  // Availability filters
  availableOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  availableTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:MM
  
  // Price filters
  maxPrice: z.number().optional(),
  priceRange: z.enum(["low", "medium", "high"]).optional(),
  
  // General filters
  search: z.string().optional(), // text search in name, description, services
  isAvailable: z.boolean().default(true), // only show available professionals
  
  // Sorting and pagination
  sortBy: z.enum([
    "relevance", 
    "rating", 
    "distance", 
    "price", 
    "experience", 
    "reviews"
  ]).default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

// Professional search result
export const ProfessionalSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  businessName: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  profileImage: z.string().optional(),
  
  // Professional details
  profession: z.object({
    id: z.number(),
    name: z.string(),
  }),
  rating: z.number().optional(),
  reviewCount: z.number(),
  yearsOfExperience: z.number().optional(),
  businessType: z.string().optional(),
  
  // Services offered
  services: z.array(z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    price: z.string().optional(),
    duration: z.number().optional(), // minutes
    priceRange: z.string().optional(),
  })),
  
  // Availability info
  availability: z.object({
    nextAvailable: z.string().optional(), // next available slot
    availableToday: z.boolean(),
    availableThisWeek: z.boolean(),
  }),
  
  // Distance (if location search)
  distance: z.number().optional(), // km
  
  // Match score for relevance
  relevanceScore: z.number().optional(),
});

// Search results
export const ProfessionalSearchResultsSchema = z.object({
  professionals: z.array(ProfessionalSearchResultSchema),
  total: z.number(),
  hasMore: z.boolean(),
  filters: z.object({
    applied: z.array(z.object({
      type: z.string(),
      value: z.string(),
      label: z.string(),
    })),
    available: z.object({
      professions: z.array(z.object({
        id: z.number(),
        name: z.string(),
        count: z.number(),
      })),
      locations: z.array(z.object({
        name: z.string(),
        count: z.number(),
      })),
      priceRanges: z.array(z.object({
        range: z.string(),
        count: z.number(),
      })),
      ratings: z.array(z.object({
        rating: z.number(),
        count: z.number(),
      })),
    }),
  }),
});

// Service search
export const ServiceSearchFiltersSchema = z.object({
  search: z.string().optional(),
  professionId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  tagId: z.number().int().positive().optional(),
  location: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxPrice: z.number().optional(),
  sortBy: z.enum(["relevance", "rating", "price", "popularity"]).default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

export const ServiceSearchResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  profession: z.object({
    id: z.number(),
    name: z.string(),
  }),
  categories: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })),
  tags: z.array(z.object({
    id: z.number(),
    name: z.string(),
  })),
  priceRange: z.string().optional(),
  durationEstimate: z.number().optional(),
  
  // Aggregated professional data
  professionalCount: z.number(),
  averageRating: z.number().optional(),
  totalReviews: z.number(),
  priceRangeDetails: z.object({
    min: z.string().optional(),
    max: z.string().optional(),
    average: z.string().optional(),
  }),
  
  // Popular professionals offering this service
  topProfessionals: z.array(z.object({
    id: z.string(),
    name: z.string(),
    rating: z.number().optional(),
    reviewCount: z.number(),
    price: z.string().optional(),
    location: z.string().optional(),
  })),
});

export const ServiceSearchResultsSchema = z.object({
  services: z.array(ServiceSearchResultSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

// Quick suggestions
export const QuickSuggestionsSchema = z.object({
  popularProfessions: z.array(z.object({
    id: z.number(),
    name: z.string(),
    professionalCount: z.number(),
    averageRating: z.number().optional(),
  })),
  popularServices: z.array(z.object({
    id: z.number(),
    name: z.string(),
    professionName: z.string(),
    bookingCount: z.number(),
  })),
  nearbyProfessionals: z.array(z.object({
    id: z.string(),
    name: z.string(),
    profession: z.string(),
    distance: z.number(),
    rating: z.number().optional(),
  })),
  recentlyBooked: z.array(z.object({
    id: z.string(),
    name: z.string(),
    profession: z.string(),
    lastBooked: z.string(),
  })),
});

// Autocomplete
export const AutocompleteSchema = z.object({
  query: z.string().min(1),
  type: z.enum(["all", "professionals", "services", "locations"]).default("all"),
  limit: z.number().int().min(1).max(20).default(10),
});

export const AutocompleteResultsSchema = z.object({
  suggestions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    type: z.enum(["professional", "service", "profession", "location"]),
    subtitle: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })),
});

export type ProfessionalSearchFilters = z.infer<typeof ProfessionalSearchFiltersSchema>;
export type ProfessionalSearchResult = z.infer<typeof ProfessionalSearchResultSchema>;
export type ProfessionalSearchResults = z.infer<typeof ProfessionalSearchResultsSchema>;
export type ServiceSearchFilters = z.infer<typeof ServiceSearchFiltersSchema>;
export type ServiceSearchResult = z.infer<typeof ServiceSearchResultSchema>;
export type ServiceSearchResults = z.infer<typeof ServiceSearchResultsSchema>;
export type QuickSuggestions = z.infer<typeof QuickSuggestionsSchema>;
export type AutocompleteQuery = z.infer<typeof AutocompleteSchema>;
export type AutocompleteResults = z.infer<typeof AutocompleteResultsSchema>;
