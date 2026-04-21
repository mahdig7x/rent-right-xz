import { useI18n } from '@/contexts/I18nContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import {
  Users, Package, AlertTriangle, Activity, Shield,
  Eye, CheckCircle2
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
    // Check admin role
    supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data }) => {
      setIsAdmin(data && data.length > 0);
    });
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [usersRes, itemsRes, reportsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('items').select('id, title, moderation_status, created_at').order('created_at', { ascending: false }),
        supabase.from('reports').select('*').order('created_at', { ascending: false }),
      ]);
      const allItems = itemsRes.data || [];
      const allReports = reportsRes.data || [];

      // Fetch reporter profiles
      const reporterIds = [...new Set(allReports.map((r: any) => r.user_id))];
      let profilesMap: Record<string, string> = {};
      if (reporterIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', reporterIds);
        if (profs) {
          profilesMap = profs.reduce((acc, p) => { acc[p.user_id] = p.name; return acc; }, {} as Record<string, string>);
        }
      }

      setItems(allItems);
      setReports(allReports.map((r: any) => ({ ...r, profiles: { name: profilesMap[r.user_id] || 'مستخدم' } })));
      setStats({
        totalUsers: usersRes.count || 0,
        totalListings: allItems.length,
        pendingListings: allItems.filter((i: any) => i.moderation_status === 'pending_review').length,
        openReports: allReports.filter((r: any) => r.status === 'submitted' || r.status === 'under_review').length,
      });
    })();
  }, [isAdmin]);

  if (isAdmin === null) return <div className="container py-32 text-center">{t('login.signing')}...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleApprove = async (itemId: string) => {
    await supabase.from('items').update({ moderation_status: 'approved' as any }).eq('id', itemId);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, moderation_status: 'approved' } : i));
    toast({ title: 'تمت الموافقة على الإعلان' });
  };

  const handleResolveReport = async (reportId: string) => {
    await supabase.from('reports').update({ status: 'resolved' as any, resolved_at: new Date().toISOString() }).eq('id', reportId);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    toast({ title: 'تم حل البلاغ' });
  };

  const statCards = [
    { icon: Users, label: 'المستخدمون', value: stats.totalUsers, color: 'text-blue-500' },
    { icon: Package, label: 'الإعلانات', value: stats.totalListings, color: 'text-green-500' },
    { icon: Eye, label: 'بانتظار المراجعة', value: stats.pendingListings, color: 'text-yellow-500' },
    { icon: AlertTriangle, label: 'بلاغات مفتوحة', value: stats.openReports, color: 'text-red-500' },
  ];

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="font-display text-2xl font-bold">{t('nav.admin') || 'لوحة الإدارة'}</h1>
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

      {/* Pending Items */}
      <Card className="p-6 mb-6">
        <h2 className="font-display text-lg font-semibold mb-4">إعلانات بانتظار المراجعة</h2>
        {items.filter(i => i.moderation_status === 'pending_review').length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد إعلانات بانتظار المراجعة</p>
        ) : (
          <div className="space-y-3">
            {items.filter(i => i.moderation_status === 'pending_review').map((item: any) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(item.id)}>
                    <CheckCircle2 className="me-1 h-4 w-4" />موافقة
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reports */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold mb-4">البلاغات</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد بلاغات</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report: any) => (
              <div key={report.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold text-sm">{report.description?.substring(0, 80)}...</p>
                  <p className="text-xs text-muted-foreground">من: {report.profiles?.name || 'مستخدم'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={report.status === 'resolved' ? 'default' : report.status === 'submitted' ? 'destructive' : 'secondary'}>
                    {report.status}
                  </Badge>
                  {(report.status === 'submitted' || report.status === 'under_review') && (
                    <Button size="sm" variant="outline" onClick={() => handleResolveReport(report.id)}>حل</Button>
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
