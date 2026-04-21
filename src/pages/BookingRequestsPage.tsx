import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Check, X, Loader2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BookingRequestsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, items(title, images)')
        .eq('lessor_id', user.id)
        .order('created_at', { ascending: false });
      if (!bookingsData) return;
      const renterIds = [...new Set(bookingsData.map((b: any) => b.renter_id))];
      let profilesMap: Record<string, string> = {};
      if (renterIds.length > 0) {
        const { data: profs } = await (supabase as any)
          .from('profiles_public')
          .select('user_id, name')
          .in('user_id', renterIds);
        if (profs) {
          profilesMap = profs.reduce((acc: any, p: any) => { acc[p.user_id] = p.name; return acc; }, {} as Record<string, string>);
        }
      }
      setRequests(bookingsData.map((b: any) => ({ ...b, renter: { name: profilesMap[b.renter_id] || 'مستخدم' } })));
    })();
  }, [user]);

  const handleAction = async (id: string, status: 'confirmed' | 'rejected') => {
    setBusyId(id);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    setBusyId(null);
    if (error) {
      toast({ title: t('bookingRequests.failed'), variant: 'destructive' });
      return;
    }
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast({ title: status === 'confirmed' ? t('bookingRequests.accepted') : t('bookingRequests.rejected') });
  };

  return (
    <div className="container py-8">
      <h1 className="font-display text-2xl font-bold mb-6">{t('bookingRequests.title')}</h1>
      {requests.length === 0 ? (
        <Card className="p-12 text-center"><p className="text-muted-foreground">{t('bookingRequests.noRequests')}</p></Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r: any) => (
            <Card key={r.id} className="flex items-center gap-4 p-4 flex-wrap">
              <img src={r.items?.images?.[0] || ''} alt={r.items?.title} className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{r.items?.title}</p>
                <p className="text-xs text-muted-foreground">{r.start_date} → {r.end_date} · ${r.total_price}</p>
                <p className="text-xs text-muted-foreground">{t('bookingRequests.renter')} {r.renter?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === 'confirmed' ? 'default' : r.status === 'pending' ? 'secondary' : 'outline'}>
                  {t(`bookingStatus.${r.status}`)}
                </Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/messages?booking=${r.id}&user=${r.renter_id}`}>
                    <MessageSquare className="me-1 h-3.5 w-3.5" />{t('messages.chat')}
                  </Link>
                </Button>
                {r.status === 'pending' && (
                  <>
                    <Button size="sm" disabled={busyId === r.id} onClick={() => handleAction(r.id, 'confirmed')}>
                      {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="me-1 h-4 w-4" />}
                      {t('bookingRequests.accept')}
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => handleAction(r.id, 'rejected')}>
                      <X className="me-1 h-4 w-4" />{t('bookingRequests.reject')}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
