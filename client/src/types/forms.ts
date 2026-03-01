/**
 * Form data interfaces for various forms in the application
 */

export interface PropertyFormData {
  title: string;
  type: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  features: string[];
  status: 'draft' | 'available' | 'reserved' | 'under-contract' | 'sold' | 'withdrawn' | 'off-market';
  imageUrl: string;
}

export interface InquiryFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyId: string;
}

export interface EmploymentFormData {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  position: string;
  department: string;
  startDate: string;
  salary?: number;
  benefits?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface UserFormData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'admin' | 'agent' | 'superadmin';
}

export interface CalendarEventFormData {
  title: string;
  description?: string;
  start: string;
  end: string;
  agentId: string;
  inquiryId?: string;
  type: 'viewing' | 'meeting' | 'other';
}
