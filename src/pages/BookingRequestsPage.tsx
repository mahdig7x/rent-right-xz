import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Check, X, Loader2, MessageSquare, PackageCheck, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookingTracker from '@/components/BookingTracker';

export default function BookingRequestsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
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
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('booking-requests-realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings',
        filter: `lessor_id=eq.${user.id}`,
      }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

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

  const confirmReturn = async (id: string) => {
    setBusyId(id);
    const { error } = await (supabase as any)
      .from('bookings')
      .update({ lessor_returned_at: new Date().toISOString() })
      .eq('id', id);
    setBusyId(null);
    if (error) {
      toast({ title: t('bookingRequests.failed'), variant: 'destructive' });
      return;
    }
    toast({ title: t('myBookings.returnConfirmed') });
    load();
  };

  return (
    <div className="container px-3 sm:px-4 py-6 md:py-8">
      <h1 className="font-display text-xl md:text-2xl font-bold mb-6">{t('bookingRequests.title')}</h1>
      {requests.length === 0 ? (
        <Card className="p-12 text-center"><p className="text-muted-foreground">{t('bookingRequests.noRequests')}</p></Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r: any) => (
            <Card key={r.id} className="p-4 space-y-4">
              <div className="flex items-start gap-3 flex-wrap">
                <img src={r.items?.images?.[0] || ''} alt={r.items?.title} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.items?.title}</p>
                  <p className="text-xs text-muted-foreground">{r.start_date} → {r.end_date}</p>
                  <p className="text-xs font-medium text-primary mt-0.5">${r.total_price}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('bookingRequests.renter')} {r.renter?.name}</p>
                </div>
              </div>

              <BookingTracker
                status={r.status}
                startDate={r.start_date}
                endDate={r.end_date}
                renterReturnedAt={r.renter_returned_at}
                lessorReturnedAt={r.lessor_returned_at}
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/messages?booking=${r.id}&user=${r.renter_id}`}>
                    <MessageSquare className="me-1 h-3.5 w-3.5" />{t('messages.chat')}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/bookings/${r.id}`}>
                    <Eye className="me-1 h-3.5 w-3.5" />{t('myBookings.viewDetails')}
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
                {r.status === 'confirmed' && !r.lessor_returned_at && (
                  <Button size="sm" disabled={busyId === r.id} onClick={() => confirmReturn(r.id)}>
                    <PackageCheck className="me-1 h-3.5 w-3.5" />{t('tracker.confirmReturnLessor')}
                  </Button>
                )}
                {r.status === 'confirmed' && r.lessor_returned_at && !r.renter_returned_at && (
                  <span className="text-xs text-muted-foreground">{t('tracker.waitingOther')}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
