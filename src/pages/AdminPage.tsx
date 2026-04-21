import { useI18n } from '@/contexts/I18nContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Navigate, Link } from 'react-router-dom';
import {
  Users, Package, AlertTriangle, Shield,
  Eye, CheckCircle2, Flag, Ban, X
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, totalListings: 0, pendingListings: 0, openReports: 0 });
  const [items, setItems] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data }) => {
      setIsAdmin(data && data.length > 0);
    });
  }, [user]);

  const loadData = useCallback(async () => {
    if (!isAdmin) return;
    const [usersRes, itemsRes, reportsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('items').select('id, title, moderation_status, created_at, owner_id').order('created_at', { ascending: false }),
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
    ]);
    const allItems = itemsRes.data || [];
    const allReports = reportsRes.data || [];

    const reporterIds = [...new Set(allReports.map((r: any) => r.user_id))];
    let profilesMap: Record<string, string> = {};
    if (reporterIds.length > 0) {
      const { data: profs } = await (supabase as any)
        .from('profiles_public')
        .select('user_id, name')
        .in('user_id', reporterIds);
      if (profs) {
        profilesMap = profs.reduce((acc: any, p: any) => { acc[p.user_id] = p.name; return acc; }, {} as Record<string, string>);
      }
    }

    setItems(allItems);
    setReports(allReports.map((r: any) => ({ ...r, reporter_name: profilesMap[r.user_id] || 'مستخدم' })));
    setStats({
      totalUsers: usersRes.count || 0,
      totalListings: allItems.length,
      pendingListings: allItems.filter((i: any) => i.moderation_status === 'pending_review').length,
      openReports: allReports.filter((r: any) => r.status === 'submitted' || r.status === 'under_review').length,
    });
  }, [isAdmin]);

  useEffect(() => { loadData(); }, [loadData]);

  if (isAdmin === null) return <div className="container py-32 text-center text-muted-foreground">{t('admin.loading')}</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const logAction = async (actionType: any, targetId: string, targetLabel: string, note?: string) => {
    if (!user) return;
    await supabase.from('admin_actions').insert({
      action_type: actionType,
      admin_id: user.id,
      target_id: targetId,
      target_label: targetLabel,
      note: note || null,
    });
  };

  const handleItemAction = async (item: any, status: 'approved' | 'flagged' | 'suspended') => {
    const { error } = await supabase.from('items').update({ moderation_status: status }).eq('id', item.id);
    if (error) { toast({ title: t('admin.failed'), variant: 'destructive' }); return; }
    const actionType = status === 'approved' ? 'listing_approved' : status === 'flagged' ? 'listing_flagged' : 'listing_suspended';
    await logAction(actionType, item.id, item.title);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, moderation_status: status } : i));
    toast({ title: t(`admin.item_${status}`) });
  };

  const handleReport = async (report: any, action: 'resolved' | 'rejected') => {
    const { error } = await supabase.from('reports').update({
      status: action,
      resolved_at: new Date().toISOString(),
      resolved_by: user!.id,
    }).eq('id', report.id);
    if (error) { toast({ title: t('admin.failed'), variant: 'destructive' }); return; }
    await logAction(action === 'resolved' ? 'report_resolved' : 'report_rejected', report.id, report.description.slice(0, 60));
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: action } : r));
    toast({ title: t(`admin.report_${action}`) });
  };

  const statCards = [
    { icon: Users, label: t('admin.users'), value: stats.totalUsers, color: 'text-blue-500' },
    { icon: Package, label: t('admin.listings'), value: stats.totalListings, color: 'text-green-500' },
    { icon: Eye, label: t('admin.pending'), value: stats.pendingListings, color: 'text-yellow-500' },
    { icon: AlertTriangle, label: t('admin.openReports'), value: stats.openReports, color: 'text-red-500' },
  ];

  const pendingItems = items.filter(i => i.moderation_status === 'pending_review' || i.moderation_status === 'flagged');

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="font-display text-2xl font-bold">{t('admin.title')}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map(s => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between mb-2">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <span className="font-display text-2xl font-bold">{s.value}</span>
            </div>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 mb-6">
        <h2 className="font-display text-lg font-semibold mb-4">{t('admin.itemsToReview')}</h2>
        {pendingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t('admin.noItems')}</p>
        ) : (
          <div className="space-y-3">
            {pendingItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-4 flex-wrap gap-3">
                <div className="min-w-0">
                  <Link to={`/items/${item.id}`} className="font-semibold text-sm hover:underline">{item.title}</Link>
                  <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{item.moderation_status}</Badge>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => handleItemAction(item, 'approved')}>
                    <CheckCircle2 className="me-1 h-4 w-4" />{t('admin.approve')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleItemAction(item, 'flagged')}>
                    <Flag className="me-1 h-4 w-4" />{t('admin.flag')}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleItemAction(item, 'suspended')}>
                    <Ban className="me-1 h-4 w-4" />{t('admin.suspend')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold mb-4">{t('admin.reports')}</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t('admin.noReports')}</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report: any) => (
              <div key={report.id} className="flex items-center justify-between rounded-lg border p-4 flex-wrap gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm break-words">{report.description?.substring(0, 120)}{report.description?.length > 120 ? '...' : ''}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('bookingRequests.renter')} {report.reporter_name}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={report.status === 'resolved' ? 'default' : report.status === 'submitted' ? 'destructive' : 'secondary'}>
                    {report.status}
                  </Badge>
                  {(report.status === 'submitted' || report.status === 'under_review') && (
                    <>
                      <Button size="sm" onClick={() => handleReport(report, 'resolved')}>
                        <CheckCircle2 className="me-1 h-4 w-4" />{t('admin.resolve')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReport(report, 'rejected')}>
                        <X className="me-1 h-4 w-4" />{t('admin.reject')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
