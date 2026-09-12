export type Category = 
  | 'All'
  | 'Malaria & Fevers'
  | 'Infections & Antibiotics'
  | 'Hypertension & Cardiac'
  | 'Diabetes & Metabolic'
  | 'Pain & Anti-inflammatory'
  | 'Sickle Cell & Blood Support'
  | 'Maternal & Child Health'
  | 'Vitamins & Immunity'
  | 'Gastrointestinal & Ulcer';

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: Category;
  price: number; // in Naira (₦)
  unit: string;
  inStock: boolean;
  stockCount: number;
  prescriptionRequired: boolean;
  image: string;
  description: string;
  dosage: string;
  sideEffects: string[];
  manufacturer: string;
  nafdacNo: string;
  popular?: boolean;
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export interface QuotedItem {
  id: string;
  name: string;
  dosage?: string;
  qty: number;
  unitPrice: number;
  available: boolean;
  isPrescription: boolean;
}

export type QuoteStatus = 
  | 'submitted'
  | 'reviewing'
  | 'quote_ready'
  | 'consultation_pending'
  | 'pharmacist_approved'
  | 'paid'
  | 'dispatched'
  | 'delivered';

export interface QuoteRequest {
  id: string;
  referenceNo: string;
  createdAt: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  deliveryState: string;
  deliveryCity: string;
  deliveryAddress: string;
  notes?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'pdf' | 'text';
  rawText?: string;
  itemsQuoted: QuotedItem[];
  subtotal: number;
  teleconferenceFee: number; // ₦500 if prescription present
  deliveryFee: number;
  total: number;
  status: QuoteStatus;
  containsPrescription: boolean;
  pharmacistTeleconferenceRequired: boolean;
  teleconferencePaid: boolean;
  teleconferenceCompleted: boolean;
  assignedPharmacist?: {
    name: string;
    pcnNo: string;
    avatar: string;
    phone: string;
  };
  scheduledConsultationTime?: string;
  estimatedQuoteTimeMinutes: number; // 30 mins to 2 hrs
}

export interface ConsultationSpecialist {
  id: string;
  name: string;
  title: string;
  specialty: string;
  qualification: string;
  experienceYears: number;
  avatar: string;
  rating: number;
  reviewsCount: number;
  sessionPrice: number; // in ₦
  availableSlots: string[];
  bio: string;
  languages: string[];
  pcnOrMdcNo: string;
  type: 'Pharmacist' | 'General Physician' | 'Pediatrician' | 'Cardiologist';
}

export interface CareNurse {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  qualification: string; // e.g., RN, RM, B.NSc
  yearsExperience: number;
  verified: boolean;
  pcnLicenseNo: string;
  rating: number;
  reviewsCount: number;
  avatar: string;
  location: string;
  hourlyRate: number;
  dailyRate: number;
  liveInRate: number;
  specialties: string[];
  bio: string;
  availability: 'Immediate' | 'Within 24 Hours' | 'Scheduled Only';
}

export interface Order {
  id: string;
  orderNumber: string;
  items: {
    name: string;
    price: number;
    quantity: number;
    image?: string;
    isPrescription?: boolean;
  }[];
  subtotal: number;
  teleconferenceFee: number;
  deliveryFee: number;
  discount: number;
  total: number;
  patientName: string;
  patientPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  paymentMethod: 'paystack_card' | 'bank_transfer' | 'ussd';
  paymentReference: string;
  createdAt: string;
  status: 'confirmed' | 'pharmacist_check' | 'dispensed' | 'out_for_delivery' | 'delivered';
  estimatedDelivery: string;
  rider?: {
    name: string;
    phone: string;
    bikeModel: string;
    plateNo: string;
  };
  pharmacistVerificationNote?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'patient' | 'pharmacist' | 'admin';
  address?: string;
  city?: string;
  state?: string;
  createdAt?: string;
  pcnNumber?: string;
}
