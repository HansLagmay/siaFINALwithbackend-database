// User types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'superadmin';
  name: string;
  phone?: string;
  createdAt: string;
  employmentData?: EmploymentData;
}

// Property types
export interface PropertyStatusHistory {
  status: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  reason?: string;
}

export interface PropertyViewHistory {
  viewedAt: string;
  ipAddress?: string; // Optional for analytics
}

export interface Property {
  id: string;
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
  createdBy?: string;
  
  // Status History
  statusHistory: PropertyStatusHistory[];
  
  // Sale information
  soldBy?: string; // agent name
  soldByAgentId?: string; // agent ID
  soldAt?: string; // timestamp
  salePrice?: number; // final closing price
  
  // Commission tracking
  commission?: {
    rate: number; // percentage (e.g., 3 for 3%)
    amount: number; // calculated commission amount
    status: 'pending' | 'paid';
    paidAt?: string;
    paidBy?: string; // admin who marked as paid
  };
  
  // Reservation info
  reservedBy?: string; // agent name
  reservedAt?: string;
  reservedUntil?: string;
  
  // View tracking
  viewCount: number;
  lastViewedAt?: string;
  viewHistory: PropertyViewHistory[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Inquiry types
export interface InquiryNote {
  id: string;
  agentId: string;
  agentName: string;
  note: string;
  createdAt: string;
}

export interface FollowUpReminder {
  id: string;
  dueAt: string;
  completed: boolean;
  completedAt?: string;
  note?: string;
}

export interface Inquiry {
  id: string;
  ticketNumber: string; // "INQ-2026-001" format
  
  // Customer Info
  name: string;
  email: string;
  phone: string;
  message: string;
  
  // Property Info
  propertyId: string;
  propertyTitle?: string;
  propertyPrice?: number;
  propertyLocation?: string;
  
  // Assignment Status
  status: 'new' | 'claimed' | 'assigned' | 'contacted' | 'in-progress' | 
          'viewing-scheduled' | 'negotiating' | 
          'viewed-interested' | 'viewed-not-interested' |
          'deal-successful' | 'deal-cancelled' | 'no-response';
  
  assignedTo: string | null; // agent ID
  claimedBy: string | null; // agent ID (if self-claimed)
  assignedBy: string | null; // admin ID (if manually assigned)
  claimedAt: string | null;
  assignedAt: string | null;
  
  // Communication History
  notes: InquiryNote[];
  
  // Follow-up System
  lastFollowUpAt: string | null;
  nextFollowUpAt: string | null;
  followUpReminders: FollowUpReminder[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

// Calendar Event types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  agentId: string;
  inquiryId?: string;
  type: 'viewing' | 'meeting' | 'other';
  createdAt: string;
  updatedAt?: string;
}

// Activity Log types
export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  message: string;
}

// Agent creation types
export interface NewAgent {
  email: string;
  password: string;
  name: string;
  phone: string;
  employmentData: EmploymentData;
  createdBy?: string;
}

export interface EmploymentData {
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

// Database types
export interface DatabaseOverview {
  properties: {
    total: number;
    new: number;
  };
  inquiries: {
    total: number;
    new: number;
    byStatus: Record<string, number>;
  };
  users: {
    total: number;
    admins: number;
    agents: number;
    new: number;
  };
  calendar: {
    total: number;
  };
  activityLog: {
    total: number;
    last24Hours: number;
  };
  lastActivity: ActivityLog | null;
}

export interface FileMetadata {
  filename: string;
  size?: number;
  sizeFormatted?: string;
  lastModified: string;
  recordCount: number;
}
