import { User, Item, Booking, Message, Conversation, Review, Report, Payment, AdminAction } from '@/types';

// --- USERS ---
export const mockUsers: User[] = [
  { id: 'u1', name: 'Alex Rivera', email: 'alex@rentright.com', phone: '+1 555-0101', location: 'San Francisco, CA', profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', isAdmin: true, createdAt: '2024-01-15' },
  { id: 'u2', name: 'Sarah Chen', email: 'sarah@email.com', phone: '+1 555-0102', location: 'Oakland, CA', profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', isAdmin: false, createdAt: '2024-02-20' },
  { id: 'u3', name: 'Marcus Johnson', email: 'marcus@email.com', phone: '+1 555-0103', location: 'Berkeley, CA', profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', isAdmin: false, createdAt: '2024-03-10' },
  { id: 'u4', name: 'Emily Park', email: 'emily@email.com', phone: '+1 555-0104', location: 'San Jose, CA', isAdmin: false, createdAt: '2024-04-05' },
];

// --- ITEMS ---
export const mockItems: Item[] = [
  { id: 'i1', title: 'Professional DSLR Camera Kit', description: 'Canon EOS R5 with 24-70mm f/2.8 lens, tripod, and carrying case. Perfect for events, travel photography, or content creation.', category: 'Cameras & Photography', pricePerDay: 45, location: 'San Francisco, CA', condition: 'like_new', status: 'available', moderationStatus: 'approved', images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=400&fit=crop'], ownerId: 'u2', ownerName: 'Sarah Chen', ownerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', createdAt: '2024-06-01', updatedAt: '2024-06-01' },
  { id: 'i2', title: 'Weber Genesis Gas Grill', description: 'Full-size 3-burner gas grill, great for backyard BBQs and gatherings. Includes propane tank and grilling tools.', category: 'Outdoor & Garden', pricePerDay: 35, location: 'Oakland, CA', condition: 'good', status: 'available', moderationStatus: 'approved', images: ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop'], ownerId: 'u3', ownerName: 'Marcus Johnson', ownerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', createdAt: '2024-05-15', updatedAt: '2024-05-15' },
  { id: 'i3', title: 'DeWalt Power Drill Set', description: '20V cordless drill/driver kit with 2 batteries, charger, and 68-piece accessory set. Perfect for home projects.', category: 'Tools & Equipment', pricePerDay: 15, location: 'San Francisco, CA', condition: 'good', status: 'available', moderationStatus: 'approved', images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=400&fit=crop'], ownerId: 'u1', ownerName: 'Alex Rivera', ownerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', createdAt: '2024-04-20', updatedAt: '2024-04-20' },
  { id: 'i4', title: 'Camping Tent (4-Person)', description: 'REI Co-op Half Dome 4 Plus tent. Easy setup, weatherproof, includes footprint and rainfly.', category: 'Outdoor & Garden', pricePerDay: 25, location: 'Berkeley, CA', condition: 'like_new', status: 'available', moderationStatus: 'approved', images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=400&fit=crop'], ownerId: 'u2', ownerName: 'Sarah Chen', ownerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', createdAt: '2024-06-10', updatedAt: '2024-06-10' },
  { id: 'i5', title: 'Portable Bluetooth Speaker', description: 'JBL Charge 5 waterproof speaker with 20-hour battery life. Great for parties and outdoor events.', category: 'Electronics', pricePerDay: 10, location: 'San Jose, CA', condition: 'new', status: 'available', moderationStatus: 'pending_review', images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=400&fit=crop'], ownerId: 'u4', ownerName: 'Emily Park', createdAt: '2024-07-01', updatedAt: '2024-07-01' },
  { id: 'i6', title: 'Stand-Up Paddleboard', description: 'Inflatable SUP board with paddle, pump, and carrying bag. Great for lakes and calm ocean waters.', category: 'Sports & Fitness', pricePerDay: 30, location: 'San Francisco, CA', condition: 'good', status: 'available', moderationStatus: 'flagged', moderationNote: 'Reported misleading description by user', images: ['https://images.unsplash.com/photo-1526290645837-52a3e869f397?w=600&h=400&fit=crop'], ownerId: 'u3', ownerName: 'Marcus Johnson', ownerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', createdAt: '2024-06-20', updatedAt: '2024-06-20' },
  { id: 'i7', title: 'KitchenAid Stand Mixer', description: 'Artisan series 5-quart stand mixer with multiple attachments. Perfect for baking projects.', category: 'Home & Kitchen', pricePerDay: 18, location: 'Oakland, CA', condition: 'like_new', status: 'available', moderationStatus: 'approved', images: ['https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=600&h=400&fit=crop'], ownerId: 'u4', ownerName: 'Emily Park', createdAt: '2024-05-25', updatedAt: '2024-05-25' },
  { id: 'i8', title: 'Party Lighting Kit', description: 'Professional DJ lighting setup with LED par cans, disco ball, and controller. Transform any space into a party venue.', category: 'Party & Events', pricePerDay: 40, location: 'San Francisco, CA', condition: 'good', status: 'booked', moderationStatus: 'approved', images: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop'], ownerId: 'u1', ownerName: 'Alex Rivera', ownerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', createdAt: '2024-03-15', updatedAt: '2024-07-10' },
];

// --- BOOKINGS ---
export const mockBookings: Booking[] = [
  { id: 'b1', itemId: 'i1', itemTitle: 'Professional DSLR Camera Kit', itemImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop', renterId: 'u3', renterName: 'Marcus Johnson', lessorId: 'u2', lessorName: 'Sarah Chen', startDate: '2024-07-15', endDate: '2024-07-18', status: 'completed', totalPrice: 135, insuranceAmount: 20, createdAt: '2024-07-10' },
  { id: 'b2', itemId: 'i8', itemTitle: 'Party Lighting Kit', itemImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop', renterId: 'u2', renterName: 'Sarah Chen', lessorId: 'u1', lessorName: 'Alex Rivera', startDate: '2024-08-01', endDate: '2024-08-03', status: 'confirmed', totalPrice: 80, insuranceAmount: 15, createdAt: '2024-07-25' },
  { id: 'b3', itemId: 'i4', itemTitle: 'Camping Tent (4-Person)', itemImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=400&fit=crop', renterId: 'u1', renterName: 'Alex Rivera', lessorId: 'u2', lessorName: 'Sarah Chen', startDate: '2024-08-10', endDate: '2024-08-14', status: 'pending', totalPrice: 100, insuranceAmount: 15, createdAt: '2024-07-30' },
];

// --- MESSAGES ---
export const mockMessages: Message[] = [
  { id: 'm1', senderId: 'u3', senderName: 'Marcus Johnson', senderImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', receiverId: 'u2', receiverName: 'Sarah Chen', content: 'Hi! Is the camera kit still available for next weekend?', sentDate: '2024-07-08T10:30:00', read: true },
  { id: 'm2', senderId: 'u2', senderName: 'Sarah Chen', senderImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', receiverId: 'u3', receiverName: 'Marcus Johnson', content: 'Yes, it is! Would you like to book it?', sentDate: '2024-07-08T11:15:00', read: true },
  { id: 'm3', senderId: 'u1', senderName: 'Alex Rivera', senderImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', receiverId: 'u2', receiverName: 'Sarah Chen', content: 'Hey Sarah, I\'d love to rent the camping tent for a trip next month!', sentDate: '2024-07-28T14:00:00', read: false },
];

export const mockConversations: Conversation[] = [
  { id: 'c1', otherUserId: 'u3', otherUserName: 'Marcus Johnson', otherUserImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', lastMessage: 'Yes, it is! Would you like to book it?', lastMessageDate: '2024-07-08T11:15:00', unreadCount: 0 },
  { id: 'c2', otherUserId: 'u1', otherUserName: 'Alex Rivera', otherUserImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', lastMessage: 'Hey Sarah, I\'d love to rent the camping tent for a trip next month!', lastMessageDate: '2024-07-28T14:00:00', unreadCount: 1 },
];

// --- REVIEWS ---
export const mockReviews: Review[] = [
  { id: 'r1', bookingId: 'b1', reviewerId: 'u3', reviewerName: 'Marcus Johnson', reviewerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', reviewedUserId: 'u2', rating: 5, comment: 'Amazing camera kit! Sarah was super helpful and the equipment was in perfect condition.', reviewDate: '2024-07-19' },
];

// --- REPORTS ---
export const mockReports: Report[] = [
  { id: 'rp1', bookingId: 'b1', itemId: 'i1', userId: 'u3', userName: 'Marcus Johnson', description: 'Minor scratch on lens cap, was already present before rental.', reportDate: '2024-07-19', status: 'resolved', adminNote: 'Confirmed pre-existing damage via photos. No action needed.', resolvedAt: '2024-07-20', resolvedBy: 'Alex Rivera', resolution: 'no_action' },
  { id: 'rp2', bookingId: 'b2', itemId: 'i8', userId: 'u2', userName: 'Sarah Chen', description: 'Party lighting kit was missing the controller unit when I received it. Had to rent one separately for $40.', reportDate: '2024-08-02', status: 'submitted' },
  { id: 'rp3', itemId: 'i6', userId: 'u4', userName: 'Emily Park', description: 'The paddleboard description says "like new" but it has visible patches and a slow air leak. Misleading listing.', reportDate: '2024-07-28', status: 'under_review' },
  { id: 'rp4', bookingId: 'b3', itemId: 'i4', userId: 'u1', userName: 'Alex Rivera', description: 'Tent was not cleaned before delivery — had dirt and sand inside. Health concern.', reportDate: '2024-08-11', status: 'submitted' },
];

// --- PAYMENTS ---
export const mockPayments: Payment[] = [
  { id: 'p1', bookingId: 'b1', amount: 135, paymentType: 'rental', paymentDate: '2024-07-10', paymentStatus: 'successful' },
  { id: 'p2', bookingId: 'b1', amount: 20, paymentType: 'insurance', paymentDate: '2024-07-10', paymentStatus: 'successful' },
  { id: 'p3', bookingId: 'b2', amount: 80, paymentType: 'rental', paymentDate: '2024-07-25', paymentStatus: 'successful' },
  { id: 'p4', bookingId: 'b2', amount: 15, paymentType: 'insurance', paymentDate: '2024-07-25', paymentStatus: 'successful' },
];

// --- ADMIN ACTIONS LOG ---
export const mockAdminActions: AdminAction[] = [
  { id: 'aa1', actionType: 'report_resolved', targetId: 'rp1', targetLabel: 'Report #rp1 — Lens scratch', adminId: 'u1', adminName: 'Alex Rivera', note: 'Pre-existing damage confirmed.', timestamp: '2024-07-20T09:30:00' },
  { id: 'aa2', actionType: 'listing_approved', targetId: 'i7', targetLabel: 'KitchenAid Stand Mixer', adminId: 'u1', adminName: 'Alex Rivera', timestamp: '2024-05-26T14:00:00' },
];
