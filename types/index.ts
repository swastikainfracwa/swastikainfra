// User types
export type UserRole = 'visitor' | 'owner' | 'agent' | 'manager' | 'admin' | 'business_partner';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  employeeId?: string; // Auto-generated for agents and managers (format: SWI001, SWI002, etc.)
  address?: string;
  created_by?: string;
  created_by_name?: string;
  enable_2fa?: boolean;
  reset_token?: string;
  reset_token_expires?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Supabase database types (snake_case from database)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string;
          role: UserRole;
          address: string | null;
          created_by: string | null;
          enable_2fa: boolean;
          reset_token: string | null;
          reset_token_expires: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          phone: string;
          email: string;
          role: UserRole;
          address?: string;
          created_by?: string;
          enable_2fa?: boolean;
          reset_token?: string;
          reset_token_expires?: string;
        };
        Update: {
          name?: string;
          phone?: string;
          role?: UserRole;
          address?: string;
          created_by?: string;
          enable_2fa?: boolean;
          reset_token?: string;
          reset_token_expires?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          location: string;
          city: string;
          state: string;
          plot_size: number;
          plot_size_unit: 'sqft' | 'acre';
          property_type: PropertyType;
          images: string[];
          owner_id: string;
          owner_name: string;
          owner_phone: string;
          verification_status: VerificationStatus;
          verification_badge: VerificationBadgeType;
          is_featured: boolean;
          seo_slug: string;
          views: number;
          created_at: string;
          updated_at: string;
        };
      };
      leads: {
        Row: {
          id: string;
          property_id: string;
          property_title: string;
          name: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          property_id: string;
          property_title: string;
          name: string;
          phone: string;
        };
      };
    };
  };
}

// Property types
export type PropertyType = 'residential' | 'commercial' | 'agricultural' | 'industrial';
export type VerificationStatus = 'pending' | 'assigned' | 'submitted' | 'verified' | 'rejected';
export type VerificationBadgeType = 'verified-staff' | 'verified-manager' | 'verified-agent' | 'verified-admin' | null;
export type DocumentType = 'owner_national_id' | 'property_registration' | 'property_photo';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  city: string;
  state: string;
  plotSize: number; // in sq yards
  plotSizeUnit: 'sqft' | 'acre';
  propertyType: PropertyType;
  images: string[];
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  verificationStatus: VerificationStatus;
  verificationBadge: VerificationBadgeType;
  isFeatured: boolean;
  isStaffCreated?: boolean;
  documentUploadCompleted?: boolean;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedAgentPhone?: string;
  assignedAt?: Date;
  submittedAt?: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
  latitude?: number;
  longitude?: number;
  youtubeVideoUrl?: string;
  seoSlug: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

// Lead types
export interface Lead {
  id: string;
  propertyId: string;
  propertyTitle: string;
  name: string;
  phone: string;
  createdAt: Date;
}

// Filter types
export interface PropertyFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minPlotSize?: number;
  maxPlotSize?: number;
  propertyType?: PropertyType;
  verifiedOnly?: boolean;
}

// Auth context types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'owner' | 'agent';
}

// 2FA types
export interface TwoFactorEnrollment {
  secret: string;
  qrCode: string;
}

export interface TwoFactorVerification {
  code: string;
}

// Property Document types
export interface PropertyDocument {
  id: string;
  propertyId: string;
  documentType: DocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: Date;
}

// Form data types
export interface OwnerPropertyFormData {
  title: string;
  description: string;
  price: number;
  location: string;
  city: string;
  state: string;
  plotSize: number;
  plotSizeUnit: 'sqft' | 'acre';
  propertyType: PropertyType;
  ownerContactNumber: string;
  images?: string[];
}

export interface StaffPropertyFormData extends OwnerPropertyFormData {
  documents?: File[];
  ownerNationalId?: File;
  propertyRegistration?: File[];
}

// Agent assignment
export interface AgentAssignment {
  propertyId: string;
  agentId: string;
  agentName: string;
  assignedAt: Date;
}

// Property verification
export interface PropertyVerification {
  propertyId: string;
  status: 'verified' | 'rejected';
  verifiedBy: string;
  verificationBadge: VerificationBadgeType;
  rejectionReason?: string;
  verifiedAt: Date;
}
