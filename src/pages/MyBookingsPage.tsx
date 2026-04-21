import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import ReviewDialog from '@/components/ReviewDialog';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export default function MyBookingsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

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

  return (
    <div className="container py-8">
      <h1 className="font-display text-2xl font-bold mb-6">{t('myBookings.title')}</h1>
      {bookings.length === 0 ? (
        <Card className="p-12 text-center"><p className="text-muted-foreground">{t('myBookings.noBookings')}</p></Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b: any) => (
            <Card key={b.id} className="flex items-center gap-4 p-4 flex-wrap">
              <img src={b.items?.images?.[0] || ''} alt={b.items?.title} className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{b.items?.title}</p>
                <p className="text-xs text-muted-foreground">{b.start_date} → {b.end_date} · ${b.total_price}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={b.status === 'confirmed' ? 'default' : b.status === 'pending' ? 'secondary' : 'outline'}>{t(`bookingStatus.${b.status}`)}</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/messages?booking=${b.id}&user=${b.lessor_id}`}>
                    <MessageSquare className="me-1 h-3.5 w-3.5" />{t('messages.chat')}
                  </Link>
                </Button>
                {b.status === 'pending' && (
                  <Button variant="outline" size="sm" onClick={async () => {
                    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', b.id);
                    setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'cancelled' } : x));
                    toast({ title: t('myBookings.cancelled') });
                  }}>{t('addListing.cancel')}</Button>
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
