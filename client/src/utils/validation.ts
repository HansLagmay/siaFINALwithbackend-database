import type { PropertyValidationData, InquiryValidationData, ValidationErrors } from '../types/api';

export const validateProperty = (property: PropertyValidationData): ValidationErrors => {
  const errors: Record<string, string> = {};
  
  if (!property.title || property.title.length < 10) {
    errors.title = 'Title must be at least 10 characters';
  }
  
  if (!property.price || property.price < 100000 || property.price > 1000000000) {
    errors.price = 'Price must be between ₱100,000 and ₱1,000,000,000';
  }
  
  if (property.bedrooms !== undefined && (property.bedrooms < 0 || property.bedrooms > 10)) {
    errors.bedrooms = 'Bedrooms must be between 0 and 10';
  }
  
  if (!property.bathrooms || property.bathrooms < 1 || property.bathrooms > 10) {
    errors.bathrooms = 'Bathrooms must be between 1 and 10';
  }
  
  if (!property.area || property.area < 10 || property.area > 10000) {
    errors.area = 'Area must be between 10 and 10,000 sqm';
  }
  
  return errors;
};

export const validateInquiry = (inquiry: InquiryValidationData): ValidationErrors => {
  const errors: Record<string, string> = {};
  
  const phoneRegex = /^(09|\+639)\d{9}$/;
  if (inquiry.phone && !phoneRegex.test(inquiry.phone.replace(/-/g, ''))) {
    errors.phone = 'Invalid Philippine phone number';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (inquiry.email && !emailRegex.test(inquiry.email)) {
    errors.email = 'Invalid email address';
  }
  
  if (!inquiry.message || inquiry.message.length < 20) {
    errors.message = 'Message must be at least 20 characters';
  }
  
  return errors;
};
