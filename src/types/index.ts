export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  profileImage?: string;
  isAdmin: boolean;
  createdAt: string;
}

export type ItemModerationStatus = 'approved' | 'pending_review' | 'flagged' | 'suspended';

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  pricePerDay: number;
  location: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  status: 'available' | 'booked' | 'unavailable';
  moderationStatus: ItemModerationStatus;
  moderationNote?: string;
  images: string[];
  ownerId: string;
  ownerName: string;
  ownerImage?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'failed';

export interface Booking {
  id: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  renterId: string;
  renterName: string;
  lessorId: string;
  lessorName: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  totalPrice: number;
  insuranceAmount: number;
  createdAt: string;
}

export type PaymentType = 'rental' | 'insurance' | 'refund' | 'compensation';
export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  paymentType: PaymentType;
  paymentDate: string;
  paymentStatus: PaymentStatus;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  receiverId: string;
  receiverName: string;
  content: string;
  sentDate: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserImage?: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerImage?: string;
  reviewedUserId: string;
  rating: number;
  comment: string;
  reviewDate: string;
}

export type ReportStatus = 'submitted' | 'under_review' | 'resolved' | 'rejected' | 'escalated';

export interface Report {
  id: string;
  bookingId?: string;
  itemId?: string;
  userId: string;
  userName: string;
  description: string;
  reportDate: string;
  status: ReportStatus;
  evidence?: string[];
  adminNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: 'warning_issued' | 'listing_suspended' | 'user_suspended' | 'insurance_transferred' | 'no_action' | 'escalated';
}

export interface AdminAction {
  id: string;
  actionType: 'listing_approved' | 'listing_flagged' | 'listing_suspended' | 'report_resolved' | 'report_rejected' | 'report_escalated' | 'user_suspended' | 'user_activated' | 'insurance_transferred';
  targetId: string;
  targetLabel: string;
  adminId: string;
  adminName: string;
  note?: string;
  timestamp: string;
}

export const CATEGORIES = [
  'Electronics', 'Outdoor & Garden', 'Tools & Equipment', 'Sports & Fitness',
  'Home & Kitchen', 'Party & Events', 'Vehicles', 'Cameras & Photography',
  'Music & Instruments', 'Other'
] as const;

export const CONDITIONS: Record<Item['condition'], string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
};
