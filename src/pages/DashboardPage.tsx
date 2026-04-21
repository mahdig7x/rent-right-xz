import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useListings } from '@/contexts/ListingsContext';
import { useChat } from '@/contexts/ChatContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingBag, ClipboardList, MessageSquare, Plus, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const { t, isRtl } = useI18n();
  const { items } = useListings();
  const { totalUnread } = useChat();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('bookings')
      .select('*, items(title, images)')
      .or(`renter_id.eq.${user.id},lessor_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setBookings(data); });
  }, [user]);

  if (loading) return <div className="container py-16 text-center text-muted-foreground">{t('common.loading') || 'جارٍ التحميل...'}</div>;
  if (!user) return <Navigate to="/login" replace />;

  const displayName =
    profile?.name ||
    (user.user_metadata?.name as string) ||
    (user.user_metadata?.full_name as string) ||
    (user.email ? user.email.split('@')[0] : 'User');

  const myListings = items.filter(i => i.owner_id === user.id);
  const myBookings = bookings.filter(b => b.renter_id === user.id);
  const bookingRequests = bookings.filter(b => b.lessor_id === user.id && b.status === 'pending');

  const stats = [
    { icon: Package, label: t('dash.myListings'), value: myListings.length, to: '/my-listings', color: 'text-primary' },
    { icon: ShoppingBag, label: t('dash.myBookings'), value: myBookings.length, to: '/my-bookings', color: 'text-blue-500' },
    { icon: ClipboardList, label: t('dash.requests'), value: bookingRequests.length, to: '/booking-requests', color: 'text-yellow-500' },
    { icon: MessageSquare, label: t('nav.messages'), value: totalUnread, to: '/messages', color: 'text-green-500' },
  ];

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t('dash.welcome')} {displayName.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground">{t('dash.subtitle')}</p>
        </div>
        <Link to="/listings/new"><Button><Plus className="me-1.5 h-4 w-4" />{t('nav.listItem')}</Button></Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map(s => (
          <Link key={s.label} to={s.to}>
            <Card className="p-5 hover:shadow-card-hover transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
                <span className="font-display text-2xl font-bold">{s.value}</span>
              </div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">{t('dash.recentBookings')}</h3>
            <Link to="/my-bookings"><Button variant="ghost" size="sm">{t('home.viewAll')}<ArrowRight className={`ms-1 h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} /></Button></Link>
          </div>
          {myBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('dash.noBookings')}</p>
          ) : (
            <div className="space-y-3">
              {myBookings.slice(0, 3).map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <img src={b.items?.images?.[0] || ''} alt={b.items?.title} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.items?.title}</p>
                    <p className="text-xs text-muted-foreground">{b.start_date} → {b.end_date}</p>
                  </div>
                  <Badge variant={b.status === 'confirmed' ? 'default' : b.status === 'pending' ? 'secondary' : 'outline'}>{b.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold">{t('dash.myListings')}</h3>
            <Link to="/my-listings"><Button variant="ghost" size="sm">{t('home.viewAll')}<ArrowRight className={`ms-1 h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} /></Button></Link>
          </div>
          {myListings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">{t('dash.noListings')}</p>
              <Link to="/listings/new"><Button size="sm"><Plus className="me-1 h-4 w-4" />{t('dash.addListing')}</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myListings.slice(0, 3).map(item => (
                <Link key={item.id} to={`/items/${item.id}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <img src={item.images[0]} alt={item.title} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">${item.price_per_day}{t('item.perDay')}</p>
                  </div>
                  <Badge variant={item.status === 'available' ? 'default' : 'secondary'}>{item.status === 'available' ? t('item.available') : t('item.booked')}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
