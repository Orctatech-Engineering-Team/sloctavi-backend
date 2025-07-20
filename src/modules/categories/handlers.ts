import * as HttpStatusCodes from "stoker/http-status-codes";

import type { AppRouteHandler } from "@/lib/types";
import { AppError } from "@/utils/error";

import { categoriesService } from "./services";
import type { 
  GetCategoriesRoute, 
  GetCategoryByIdRoute,
  CreateCategoryRoute, 
  UpdateCategoryRoute, 
  DeleteCategoryRoute,
  GetServiceCategoriesRoute,
  AssignCategoryToServiceRoute,
  RemoveCategoryFromServiceRoute,
  GetServicesByCategoryRoute,
  GetCategoriesByServiceRoute
} from "./routes";

export const getCategories: AppRouteHandler<GetCategoriesRoute> = async (c) => {
  const { limit, offset } = c.req.valid("query");
  const result = await categoriesService.getCategories(limit, offset);
  return c.json(result, HttpStatusCodes.OK);
};

export const getCategoryById: AppRouteHandler<GetCategoryByIdRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const category = await categoriesService.getCategoryById(id);
  
  if (!category) {
    throw new AppError("Category not found", HttpStatusCodes.NOT_FOUND);
  }
  
  return c.json(category, HttpStatusCodes.OK);
};

export const createCategory: AppRouteHandler<CreateCategoryRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const category = await categoriesService.createCategory(data);
  return c.json(category, HttpStatusCodes.CREATED);
};

export const updateCategory: AppRouteHandler<UpdateCategoryRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const category = await categoriesService.updateCategory(id, data);
  return c.json(category, HttpStatusCodes.OK);
};

export const deleteCategory: AppRouteHandler<DeleteCategoryRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  await categoriesService.deleteCategory(id);
  return c.json({ message: "Category deleted successfully" }, HttpStatusCodes.OK);
};

// Service Category Management Handlers
export const getServiceCategories: AppRouteHandler<GetServiceCategoriesRoute> = async (c) => {
  const { serviceId, categoryId } = c.req.valid("query");
  const serviceCategories = await categoriesService.getServiceCategories(serviceId, categoryId);
  return c.json(serviceCategories, HttpStatusCodes.OK);
};

export const assignCategoryToService: AppRouteHandler<AssignCategoryToServiceRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  const serviceCategory = await categoriesService.assignCategoryToService(
    data.serviceId,
    data.categoryId
  );
  return c.json(serviceCategory, HttpStatusCodes.CREATED);
};

export const removeCategoryFromService: AppRouteHandler<RemoveCategoryFromServiceRoute> = async (c) => {
  const data = c.req.valid("json");
  const userId = c.get("jwtPayload")?.userId;

  if (!userId) {
    throw new AppError("Unauthorized", HttpStatusCodes.UNAUTHORIZED);
  }

  await categoriesService.removeCategoryFromService(data.serviceId, data.categoryId);
  return c.json({ message: "Category removed from service successfully" }, HttpStatusCodes.OK);
};

export const getServicesByCategory: AppRouteHandler<GetServicesByCategoryRoute> = async (c) => {
  const { categoryId } = c.req.valid("param");
  const services = await categoriesService.getServicesByCategory(categoryId);
  return c.json(services, HttpStatusCodes.OK);
};

export const getCategoriesByService: AppRouteHandler<GetCategoriesByServiceRoute> = async (c) => {
  const { serviceId } = c.req.valid("param");
  const categories = await categoriesService.getCategoriesByService(serviceId);
  return c.json(categories, HttpStatusCodes.OK);
};