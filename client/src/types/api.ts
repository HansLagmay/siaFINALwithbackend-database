import { AxiosResponse } from 'axios';
import type { Property } from './index';

// Generic API function type with proper typing
export interface ApiFunction<TArgs extends any[], TResponse> {
  (...args: TArgs): Promise<AxiosResponse<TResponse>>;
}

// Property update data with proper types (compatible with Partial<Property>)
export interface PropertyUpdateData extends Partial<Property> {
  statusHistory?: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  status: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  reason?: string;
}

// Table row type for generic data tables
export interface TableRow {
  [key: string]: string | number | boolean | object | null | undefined;
}

// Validation types
export interface PropertyValidationData {
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
}

export interface InquiryValidationData {
  phone: string;
  email: string;
  message: string;
}

export interface ValidationErrors {
  [key: string]: string;
}
