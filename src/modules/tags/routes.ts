import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";

import { tags, serviceTags } from "@/db/schema/schema";
import { createSelectSchema } from "drizzle-zod";
import { badRequestSchema, notFoundSchema, unauthorizedSchema } from "@/lib/constants";

const tagsModule = ["Tags"];

const tagSchema = createSelectSchema(tags);
const serviceTagSchema = createSelectSchema(serviceTags);

const tagCreateSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50, "Tag name too long"),
  description: z.string().optional(),
});

const tagUpdateSchema = tagCreateSchema.partial();

const assignTagSchema = z.object({
  serviceId: z.number().min(1, "Service ID is required"),
  tagId: z.number().min(1, "Tag ID is required"),
});

const removeTagSchema = z.object({
  serviceId: z.number().min(1, "Service ID is required"),
  tagId: z.number().min(1, "Tag ID is required"),
});

export const getTags = createRoute({
  path: "/tags",
  method: "get",
  tags: tagsModule,
  request: {
    query: z.object({
      limit: z.string().transform(Number).optional().default("20"),
      offset: z.string().transform(Number).optional().default("0"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        tags: z.array(tagSchema),
        total: z.number(),
      }),
      "Tags retrieved successfully",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getTagById = createRoute({
  path: "/tags/{id}",
  method: "get",
  tags: tagsModule,
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      tagSchema,
      "Tag retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Tag not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const createTag = createRoute({
  path: "/tags",
  method: "post",
  tags: tagsModule,
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      tagCreateSchema,
      "Tag data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      tagSchema,
      "Tag created successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const updateTag = createRoute({
  path: "/tags/{id}",
  method: "put",
  tags: tagsModule,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
    body: jsonContentRequired(
      tagUpdateSchema,
      "Tag update data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      tagSchema,
      "Tag updated successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Tag not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const deleteTag = createRoute({
  path: "/tags/{id}",
  method: "delete",
  tags: tagsModule,
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Tag deleted successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Cannot delete tag that is assigned to services",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Tag not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const searchTags = createRoute({
  path: "/tags/search",
  method: "get",
  tags: tagsModule,
  request: {
    query: z.object({
      q: z.string().min(1, "Search query is required"),
      limit: z.string().transform(Number).optional().default("10"),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(tagSchema),
      "Tags found successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid search query",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

// Service Tag Management Routes
export const getServiceTags = createRoute({
  path: "/service-tags",
  method: "get",
  tags: ["Service Tags"],
  request: {
    query: z.object({
      serviceId: z.string().transform(Number).optional(),
      tagId: z.string().transform(Number).optional(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(serviceTagSchema),
      "Service tags retrieved successfully",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const assignTagToService = createRoute({
  path: "/service-tags/assign",
  method: "post",
  tags: ["Service Tags"],
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      assignTagSchema,
      "Tag assignment data",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      serviceTagSchema,
      "Tag assigned successfully",
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestSchema,
      "Invalid request data or service already has this tag",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service or tag not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const removeTagFromService = createRoute({
  path: "/service-tags/remove",
  method: "post",
  tags: ["Service Tags"],
  security: [{ bearerAuth: [] }],
  request: {
    body: jsonContentRequired(
      removeTagSchema,
      "Tag removal data",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ message: z.string() }),
      "Tag removed successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service tag not found",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      "Unauthorized",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getServicesByTag = createRoute({
  path: "/tags/{tagId}/services",
  method: "get",
  tags: ["Service Tags"],
  request: {
    params: z.object({
      tagId: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().nullable(),
        professionId: z.number(),
        priceRange: z.string().nullable(),
        durationEstimate: z.number().nullable(),
        isActive: z.boolean().nullable(),
        createdAt: z.string().datetime().nullable(),
        updatedAt: z.string().datetime().nullable(),
      })),
      "Services retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Tag not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export const getTagsByService = createRoute({
  path: "/services/{serviceId}/tags",
  method: "get",
  tags: ["Service Tags"],
  request: {
    params: z.object({
      serviceId: z.string().transform(Number),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(tagSchema),
      "Tags retrieved successfully",
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundSchema,
      "Service not found",
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      badRequestSchema,
      "Internal server error",
    ),
  },
});

export type GetTagsRoute = typeof getTags;
export type GetTagByIdRoute = typeof getTagById;
export type CreateTagRoute = typeof createTag;
export type UpdateTagRoute = typeof updateTag;
export type DeleteTagRoute = typeof deleteTag;
export type SearchTagsRoute = typeof searchTags;
export type GetServiceTagsRoute = typeof getServiceTags;
export type AssignTagToServiceRoute = typeof assignTagToService;
export type RemoveTagFromServiceRoute = typeof removeTagFromService;
export type GetServicesByTagRoute = typeof getServicesByTag;
export type GetTagsByServiceRoute = typeof getTagsByService;