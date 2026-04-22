import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquare, PackageCheck, Calendar } from 'lucide-react';
import { SaudiRiyal } from '@/components/SaudiRiyal';
import BookingTracker from '@/components/BookingTracker';

export default function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { t, isRtl } = useI18n();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*, items(title, images, location)')
      .eq('id', id)
      .maybeSingle();
    setBooking(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (authLoading || loading) {
    return <div className="container py-16 text-center text-muted-foreground">{t('common.loading') || 'جارٍ التحميل...'}</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!booking) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground mb-4">{t('myBookings.noBookings')}</p>
        <Link to="/my-bookings"><Button variant="outline" size="sm">{t('myBookings.title')}</Button></Link>
      </div>
    );
  }

  const isRenter = booking.renter_id === user.id;
  const isLessor = booking.lessor_id === user.id;
  if (!isRenter && !isLessor) return <Navigate to="/" replace />;

  const otherUserId = isRenter ? booking.lessor_id : booking.renter_id;

  const handleConfirmReturn = async () => {
    setBusy(true);
    const field = isRenter ? 'renter_returned_at' : 'lessor_returned_at';
    const { error } = await (supabase as any)
      .from('bookings')
      .update({ [field]: new Date().toISOString() })
      .eq('id', booking.id);
    setBusy(false);
    if (error) {
      toast({ title: t('bookingRequests.failed'), variant: 'destructive' });
      return;
    }
    toast({ title: t('myBookings.returnConfirmed') });
    load();
  };

  const myReturnConfirmed = isRenter ? booking.renter_returned_at : booking.lessor_returned_at;

  return (
    <div className="container px-3 sm:px-4 py-6 md:py-8 max-w-3xl">
      <Link to={isRenter ? '/my-bookings' : '/booking-requests'} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
        {isRenter ? t('myBookings.title') : t('bookingRequests.title')}
      </Link>

      <Card className="p-5 md:p-6 space-y-6">
        <div className="flex items-start gap-4 flex-wrap">
          <img src={booking.items?.images?.[0] || ''} alt={booking.items?.title} className="h-24 w-24 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl md:text-2xl font-bold truncate">{booking.items?.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{booking.items?.location}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-4 w-4" />{booking.start_date} → {booking.end_date}</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-primary">{booking.total_price}<SaudiRiyal className="h-4 w-4" /></span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">{t('tracker.title')}</h2>
          <BookingTracker
            status={booking.status}
            startDate={booking.start_date}
            endDate={booking.end_date}
            renterReturnedAt={booking.renter_returned_at}
            lessorReturnedAt={booking.lessor_returned_at}
          />
        </div>

        {booking.status === 'completed' && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2.5 text-sm text-primary font-medium text-center">
            {t('tracker.bothConfirmed')}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/messages?booking=${booking.id}&user=${otherUserId}`}>
              <MessageSquare className="me-1 h-3.5 w-3.5" />{t('messages.chat')}
            </Link>
          </Button>
          {booking.status === 'confirmed' && !myReturnConfirmed && (
            <Button size="sm" disabled={busy} onClick={handleConfirmReturn}>
              <PackageCheck className="me-1 h-3.5 w-3.5" />
              {isRenter ? t('myBookings.confirmReturn') : t('tracker.confirmReturnLessor')}
            </Button>
          )}
          {booking.status === 'confirmed' && myReturnConfirmed && (
            <span className="text-xs text-muted-foreground self-center">{t('tracker.waitingOther')}</span>
          )}
        </div>
      </Card>
    </div>
  );
}
