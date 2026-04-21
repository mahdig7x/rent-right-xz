import { Item, Report, AdminAction, ItemModerationStatus, ReportStatus } from '@/types';
import { mockItems, mockReports, mockAdminActions, mockUsers } from '@/data/mockData';

// Simulated async delay
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// --- Listing Moderation ---

export async function moderateListing(
  itemId: string,
  newStatus: ItemModerationStatus,
  adminId: string,
  note?: string
): Promise<{ success: boolean; item?: Item }> {
  await delay();
  const item = mockItems.find(i => i.id === itemId);
  if (!item) return { success: false };

  item.moderationStatus = newStatus;
  item.moderationNote = note;
  item.updatedAt = new Date().toISOString();

  // If suspended, also mark unavailable
  if (newStatus === 'suspended') {
    item.status = 'unavailable';
  }

  const admin = mockUsers.find(u => u.id === adminId);
  const actionMap: Record<string, AdminAction['actionType']> = {
    approved: 'listing_approved',
    flagged: 'listing_flagged',
    suspended: 'listing_suspended',
  };

  if (actionMap[newStatus]) {
    mockAdminActions.unshift({
      id: 'aa' + Date.now(),
      actionType: actionMap[newStatus],
      targetId: itemId,
      targetLabel: item.title,
      adminId,
      adminName: admin?.name || 'Admin',
      note,
      timestamp: new Date().toISOString(),
    });
  }

  return { success: true, item };
}

// --- Report / Dispute Resolution ---

export async function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  adminId: string,
  adminNote?: string,
  resolution?: Report['resolution']
): Promise<{ success: boolean; report?: Report }> {
  await delay();
  const report = mockReports.find(r => r.id === reportId);
  if (!report) return { success: false };

  const admin = mockUsers.find(u => u.id === adminId);
  report.status = newStatus;
  if (adminNote) report.adminNote = adminNote;
  if (resolution) report.resolution = resolution;
  if (newStatus === 'resolved' || newStatus === 'rejected') {
    report.resolvedAt = new Date().toISOString();
    report.resolvedBy = admin?.name || 'Admin';
  }

  const actionTypeMap: Record<string, AdminAction['actionType']> = {
    resolved: 'report_resolved',
    rejected: 'report_rejected',
    escalated: 'report_escalated',
  };

  if (actionTypeMap[newStatus]) {
    mockAdminActions.unshift({
      id: 'aa' + Date.now(),
      actionType: actionTypeMap[newStatus],
      targetId: reportId,
      targetLabel: `Report #${reportId} — ${report.userName}`,
      adminId,
      adminName: admin?.name || 'Admin',
      note: adminNote,
      timestamp: new Date().toISOString(),
    });
  }

  return { success: true, report };
}

// --- Insurance Transfer ---

export async function transferInsurance(
  reportId: string,
  bookingId: string,
  adminId: string
): Promise<{ success: boolean }> {
  await delay();
  const admin = mockUsers.find(u => u.id === adminId);
  mockAdminActions.unshift({
    id: 'aa' + Date.now(),
    actionType: 'insurance_transferred',
    targetId: bookingId,
    targetLabel: `Insurance for Booking #${bookingId} via Report #${reportId}`,
    adminId,
    adminName: admin?.name || 'Admin',
    note: 'Insurance amount transferred to lessor for confirmed damage.',
    timestamp: new Date().toISOString(),
  });
  return { success: true };
}

// --- Get admin stats ---

export function getAdminStats() {
  return {
    totalUsers: mockUsers.length,
    totalListings: mockItems.length,
    pendingReviewListings: mockItems.filter(i => i.moderationStatus === 'pending_review').length,
    flaggedListings: mockItems.filter(i => i.moderationStatus === 'flagged').length,
    openReports: mockReports.filter(r => r.status === 'submitted' || r.status === 'under_review').length,
    resolvedReports: mockReports.filter(r => r.status === 'resolved').length,
  };
}
