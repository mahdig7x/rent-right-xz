import { useI18n } from '@/contexts/I18nContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import {
  Users, AlertTriangle, Shield,
  CheckCircle2, X, ShieldCheck, ShieldOff, Crown, Trash2
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type UserRow = {
  user_id: string;
  name: string;
  email: string;
  profile_image: string | null;
  is_admin: boolean;
  is_super: boolean;
};

export default function AdminPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, openReports: 0 });
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data }) => {
      setIsAdmin(data && data.length > 0);
    });
  }, [user]);

  const loadUsers = useCallback(async () => {
    const [profilesRes, rolesRes, superRes] = await Promise.all([
      (supabase as any).from('profiles_public').select('user_id, name, profile_image').order('name'),
      supabase.from('user_roles').select('user_id, role').eq('role', 'admin'),
      (supabase as any).from('super_admins').select('user_id'),
    ]);
    const profiles = profilesRes.data || [];
    const adminIds = new Set((rolesRes.data || []).map((r: any) => r.user_id));
    const superIds = new Set((superRes.data || []).map((s: any) => s.user_id));

    // Fetch emails from full profiles (only visible to admins via RLS)
    const { data: emails } = await supabase.from('profiles').select('user_id, email');
    const emailMap: Record<string, string> = {};
    (emails || []).forEach((e: any) => { emailMap[e.user_id] = e.email; });

    setUsers(profiles.map((p: any) => ({
      user_id: p.user_id,
      name: p.name || '—',
      email: emailMap[p.user_id] || '',
      profile_image: p.profile_image,
      is_admin: adminIds.has(p.user_id),
      is_super: superIds.has(p.user_id),
    })));
  }, []);

  const loadData = useCallback(async () => {
    if (!isAdmin) return;
    const [usersRes, reportsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
    ]);
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

    setReports(allReports.map((r: any) => ({ ...r, reporter_name: profilesMap[r.user_id] || 'مستخدم' })));
    setStats({
      totalUsers: usersRes.count || 0,
      openReports: allReports.filter((r: any) => r.status === 'submitted' || r.status === 'under_review').length,
    });
    await loadUsers();
  }, [isAdmin, loadUsers]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

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

  const promoteToAdmin = async (target: UserRow) => {
    const { error } = await supabase.from('user_roles').insert({ user_id: target.user_id, role: 'admin' });
    if (error) { toast({ title: t('admin.failed'), description: error.message, variant: 'destructive' }); return; }
    await logAction('user_activated', target.user_id, target.name, 'Promoted to admin');
    toast({ title: t('admin.user_promoted') });
    loadUsers();
  };

  const removeAdmin = async (target: UserRow) => {
    if (target.is_super) { toast({ title: t('admin.cannotRemoveSuper'), variant: 'destructive' }); return; }
    if (target.user_id === user?.id) { toast({ title: t('admin.cannotRemoveSelf'), variant: 'destructive' }); return; }
    const { error } = await supabase.from('user_roles').delete().eq('user_id', target.user_id).eq('role', 'admin');
    if (error) { toast({ title: t('admin.failed'), description: error.message, variant: 'destructive' }); return; }
    await logAction('user_suspended', target.user_id, target.name, 'Admin role removed');
    toast({ title: t('admin.user_demoted') });
    loadUsers();
  };

  const deleteUser = async (target: UserRow) => {
    if (target.is_super) { toast({ title: t('admin.cannotRemoveSuper'), variant: 'destructive' }); return; }
    if (target.user_id === user?.id) { toast({ title: t('admin.cannotRemoveSelf'), variant: 'destructive' }); return; }
    const { data, error } = await supabase.functions.invoke('admin-delete-user', {
      body: { target_user_id: target.user_id },
    });
    if (error || (data as any)?.error) {
      toast({ title: t('admin.failed'), description: error?.message || (data as any)?.error, variant: 'destructive' });
      return;
    }
    await logAction('user_suspended', target.user_id, target.name, 'User account deleted');
    toast({ title: t('admin.user_deleted') });
    loadData();
  };

  const deleteReport = async (report: any) => {
    const { error } = await supabase.from('reports').delete().eq('id', report.id);
    if (error) { toast({ title: t('admin.failed'), description: error.message, variant: 'destructive' }); return; }
    setReports(prev => prev.filter(r => r.id !== report.id));
    toast({ title: t('admin.report_deleted') });
  };


  const statCards = [
    { icon: Users, label: t('admin.users'), value: stats.totalUsers, color: 'text-blue-500' },
    { icon: AlertTriangle, label: t('admin.openReports'), value: stats.openReports, color: 'text-red-500' },
  ];

  

  return (
    <div className="container py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="font-display text-2xl font-bold">{t('admin.title')}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
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

      {/* Manage Users */}
      <Card className="p-6 mb-6">
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {t('admin.manageUsers')}
        </h2>
        <Input
          placeholder={t('admin.searchUsers')}
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="mb-4"
        />
        {filteredUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t('admin.noUsers')}</p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {filteredUsers.map((u) => (
              <div key={u.user_id} className="flex items-center justify-between gap-3 rounded-lg border p-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {u.profile_image ? (
                    <img src={u.profile_image} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {u.is_super && (
                    <Badge className="gap-1 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/20">
                      <Crown className="h-3 w-3" />
                      {t('admin.superAdmin')}
                    </Badge>
                  )}
                  {u.is_admin && !u.is_super && (
                    <Badge variant="secondary" className="gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      {t('admin.adminBadge')}
                    </Badge>
                  )}
                  {!u.is_admin ? (
                    <Button size="sm" onClick={() => promoteToAdmin(u)}>
                      <ShieldCheck className="me-1 h-4 w-4" />
                      {t('admin.makeAdmin')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={u.is_super || u.user_id === user?.id}
                      onClick={() => removeAdmin(u)}
                    >
                      <ShieldOff className="me-1 h-4 w-4" />
                      {t('admin.removeAdmin')}
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={u.is_super || u.user_id === user?.id}
                      >
                        <Trash2 className="me-1 h-4 w-4" />
                        {t('admin.deleteUser')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('admin.deleteUser')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('admin.deleteUserConfirm')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('admin.reject')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteUser(u)}>{t('admin.deleteUser')}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
