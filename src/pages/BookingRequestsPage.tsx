import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function BookingRequestsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('bookings').select('*, items(title, images), renter:profiles!bookings_renter_id_fkey(name)')
      .eq('lessor_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setRequests(data); });
  }, [user]);

  const handleAction = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status: status as any }).eq('id', id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast({ title: status === 'confirmed' ? 'تم قبول الطلب' : 'تم رفض الطلب' });
  };

  return (
    <div className="container py-8">
      <h1 className="font-display text-2xl font-bold mb-6">{t('bookingRequests.title')}</h1>
      {requests.length === 0 ? (
        <Card className="p-12 text-center"><p className="text-muted-foreground">{t('bookingRequests.noRequests')}</p></Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r: any) => (
            <Card key={r.id} className="flex items-center gap-4 p-4">
              <img src={r.items?.images?.[0] || ''} alt={r.items?.title} className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{r.items?.title}</p>
                <p className="text-xs text-muted-foreground">{r.start_date} → {r.end_date} · ${r.total_price}</p>
                <p className="text-xs text-muted-foreground">من: {r.renter?.name || 'مستخدم'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === 'confirmed' ? 'default' : r.status === 'pending' ? 'secondary' : 'outline'}>{r.status}</Badge>
                {r.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => handleAction(r.id, 'confirmed')}>قبول</Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction(r.id, 'rejected')}>رفض</Button>
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
