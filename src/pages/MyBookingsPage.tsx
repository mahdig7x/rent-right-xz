import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function MyBookingsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('bookings').select('*, items(title, images)').eq('renter_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setBookings(data); });
  }, [user]);

  return (
    <div className="container py-8">
      <h1 className="font-display text-2xl font-bold mb-6">{t('myBookings.title')}</h1>
      {bookings.length === 0 ? (
        <Card className="p-12 text-center"><p className="text-muted-foreground">{t('myBookings.noBookings')}</p></Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b: any) => (
            <Card key={b.id} className="flex items-center gap-4 p-4">
              <img src={b.items?.images?.[0] || ''} alt={b.items?.title} className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{b.items?.title}</p>
                <p className="text-xs text-muted-foreground">{b.start_date} → {b.end_date} · ${b.total_price}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={b.status === 'confirmed' ? 'default' : b.status === 'pending' ? 'secondary' : 'outline'}>{b.status}</Badge>
                {b.status === 'pending' && (
                  <Button variant="outline" size="sm" onClick={async () => {
                    await supabase.from('bookings').update({ status: 'cancelled' as any }).eq('id', b.id);
                    setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: 'cancelled' } : x));
                    toast({ title: t('myBookings.cancelled') });
                  }}>{t('addListing.cancel')}</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
