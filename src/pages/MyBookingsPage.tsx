import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import ReviewDialog from '@/components/ReviewDialog';
import BookingTracker from '@/components/BookingTracker';
import { Link } from 'react-router-dom';
import { MessageSquare, PackageCheck, Eye } from 'lucide-react';
import { SaudiRiyal } from '@/components/SaudiRiyal';

export default function MyBookingsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bookings')
      .select('*, items(title, images)')
      .eq('renter_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setBookings(data);
    const { data: rs } = await supabase.from('reviews').select('booking_id').eq('reviewer_id', user.id);
    if (rs) setReviewedIds(new Set(rs.map((r: any) => r.booking_id)));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('my-bookings-realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings',
        filter: `renter_id=eq.${user.id}`,
      }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);

  const confirmReturn = async (bookingId: string) => {
    setBusyId(bookingId);
    const { error } = await (supabase as any)
      .from('bookings')
      .update({ renter_returned_at: new Date().toISOString() })
      .eq('id', bookingId);
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
      <h1 className="font-display text-xl md:text-2xl font-bold mb-6">{t('myBookings.title')}</h1>
      {bookings.length === 0 ? (
        <Card className="p-12 text-center"><p className="text-muted-foreground">{t('myBookings.noBookings')}</p></Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((b: any) => (
            <Card key={b.id} className="p-4 space-y-4">
              <div className="flex items-start gap-3 flex-wrap">
                <img src={b.items?.images?.[0] || ''} alt={b.items?.title} className="h-16 w-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{b.items?.title}</p>
                  <p className="text-xs text-muted-foreground">{b.start_date} → {b.end_date}</p>
                  <p className="text-xs font-medium text-primary mt-0.5 inline-flex items-baseline gap-1">{b.total_price}<SaudiRiyal className="h-[0.85em] w-[0.85em] translate-y-[1px]" /></p>
                </div>
              </div>

              <BookingTracker
                status={b.status}
                startDate={b.start_date}
                endDate={b.end_date}
                renterReturnedAt={b.renter_returned_at}
                lessorReturnedAt={b.lessor_returned_at}
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/messages?booking=${b.id}&user=${b.lessor_id}`}>
                    <MessageSquare className="me-1 h-3.5 w-3.5" />{t('messages.chat')}
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/bookings/${b.id}`}>
                    <Eye className="me-1 h-3.5 w-3.5" />{t('myBookings.viewDetails')}
                  </Link>
                </Button>
                {b.status === 'pending' && (
                  <Button variant="outline" size="sm" onClick={async () => {
                    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', b.id);
                    setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'cancelled' } : x));
                    toast({ title: t('myBookings.cancelled') });
                  }}>{t('addListing.cancel')}</Button>
                )}
                {b.status === 'confirmed' && !b.renter_returned_at && (
                  <Button size="sm" disabled={busyId === b.id} onClick={() => confirmReturn(b.id)}>
                    <PackageCheck className="me-1 h-3.5 w-3.5" />{t('myBookings.confirmReturn')}
                  </Button>
                )}
                {b.status === 'confirmed' && b.renter_returned_at && !b.lessor_returned_at && (
                  <span className="text-xs text-muted-foreground">{t('tracker.waitingOther')}</span>
                )}
                {(b.status === 'confirmed' || b.status === 'completed') && !reviewedIds.has(b.id) && (
                  <ReviewDialog
                    bookingId={b.id}
                    reviewerId={user!.id}
                    reviewedUserId={b.lessor_id}
                    onSubmitted={load}
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
