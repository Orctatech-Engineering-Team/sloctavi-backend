import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { AppError } from "@/utils/error";

import { tagsService } from "./services";
import type { 
  GetTagsRoute, 
  GetTagByIdRoute,
  CreateTagRoute, 
  UpdateTagRoute, 
  DeleteTagRoute,
  GetServiceTagsRoute,
  AssignTagToServiceRoute,
  RemoveTagFromServiceRoute,
  GetServicesByTagRoute,
  GetTagsByServiceRoute,
  SearchTagsRoute
} from "./routes";

export const getTags: AppRouteHandler<GetTagsRoute> = async (c) => {
  const { limit, offset } = c.req.valid("query");
  const result = await tagsService.getTags(limit, offset);
  return c.json(result, HttpStatusCodes.OK);
};

export const getTagById: AppRouteHandler<GetTagByIdRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const tag = await tagsService.getTagById(id);
  
  if (!tag) {
    throw new AppError("Tag not found", HttpStatusCodes.NOT_FOUND);
  }
  
  return c.json(tag, HttpStatusCodes.OK);
};

export const createTag: AppRouteHandler<CreateTagRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const tag = await tagsService.createTag(data);
  return c.json(tag, HttpStatusCodes.CREATED);
};

export const updateTag: AppRouteHandler<UpdateTagRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const tag = await tagsService.updateTag(id, data);
  return c.json(tag, HttpStatusCodes.OK);
};

export const deleteTag: AppRouteHandler<DeleteTagRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  await tagsService.deleteTag(id);
  return c.json({ message: "Tag deleted successfully" }, HttpStatusCodes.OK);
};

// Service Tag Management Handlers
export const getServiceTags: AppRouteHandler<GetServiceTagsRoute> = async (c) => {
  const { serviceId, tagId } = c.req.valid("query");
  const serviceTags = await tagsService.getServiceTags(serviceId, tagId);
  return c.json(serviceTags, HttpStatusCodes.OK);
};

export const assignTagToService: AppRouteHandler<AssignTagToServiceRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const serviceTag = await tagsService.assignTagToService(
    data.serviceId,
    data.tagId
  );
  return c.json(serviceTag, HttpStatusCodes.CREATED);
};

export const removeTagFromService: AppRouteHandler<RemoveTagFromServiceRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  await tagsService.removeTagFromService(data.serviceId, data.tagId);
  return c.json({ message: "Tag removed from service successfully" }, HttpStatusCodes.OK);
};

export const getServicesByTag: AppRouteHandler<GetServicesByTagRoute> = async (c) => {
  const { tagId } = c.req.valid("param");
  const services = await tagsService.getServicesByTag(tagId);
  return c.json(services, HttpStatusCodes.OK);
};

export const getTagsByService: AppRouteHandler<GetTagsByServiceRoute> = async (c) => {
  const { serviceId } = c.req.valid("param");
  const tags = await tagsService.getTagsByService(serviceId);
  return c.json(tags, HttpStatusCodes.OK);
};

export const searchTags: AppRouteHandler<SearchTagsRoute> = async (c) => {
  const { q, limit } = c.req.valid("query");
  const tags = await tagsService.searchTags(q, limit);
  return c.json(tags, HttpStatusCodes.OK);
};