export type Language = 'id' | 'en';

export interface Room {
  id: string;
  name: string;
  price: number; // IDR per night
  description: {
    id: string;
    en: string;
  };
  image: string;
  size: string;
  capacity: number;
  bedType: {
    id: string;
    en: string;
  };
  amenities: string[]; // icon identifiers
  rating: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  roomType: string;
}

export interface CafeItem {
  id: string;
  name: string;
  category: 'coffee' | 'herbal' | 'food' | 'snack';
  price: number; // IDR
  description: {
    id: string;
    en: string;
  };
  image: string;
  isBestSeller?: boolean;
}

export interface AddOn {
  id: string;
  name: {
    id: string;
    en: string;
  };
  price: number;
  perNight: boolean;
  perGuest: boolean;
  icon: string;
  description: {
    id: string;
    en: string;
  };
}

export type BookingStatus = 'Pending' | 'Waiting Verification' | 'Paid' | 'Checked In' | 'CheckedIn' | 'Completed' | 'Cancelled' | 'Expired';
export type PaymentStatus = 'Pending' | 'Waiting Verification' | 'Paid' | 'Expired';
export type UserRole = 'Admin' | 'Receptionist' | 'Owner';

export interface Booking {
  booking_code: string;
  room_id: string;
  room_name?: string;
  room_number?: string;
  check_in: string;
  check_out: string;
  guests: number;
  full_name: string;
  email: string;
  phone: string;
  special_requests?: string;
  total_price: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_proof?: string | null;
  payment_date?: string | null;
  check_out_date?: string | null;
  created_at: string;
  isLocalBackup?: boolean;
  admin_notification_sent?: boolean;
}

export interface QrisSettings {
  imageUrl: string;
  bankName: string;
  accountName: string;
  instructions: string;
}

export interface WhatsappSettings {
  token: string;
  phoneNumber: string;
  templateMessage: string;
}

export interface ActivityLog {
  id: string;
  adminName: string;
  role: UserRole | 'Customer';
  activity: string;
  timestamp: string;
}

export interface ServiceSignal {
  id: string;
  booking_code: string;
  room_number: string;
  guest_name: string;
  type: 'food' | 'message' | 'clean';
  details: string;
  status: 'pending' | 'preparing' | 'delivered' | 'completed';
  created_at: string;
}
