import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/contexts/I18nContext';

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!user) return;

    // New incoming messages
    const msgChan = supabase
      .channel('notif-messages')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload: any) => {
        toast({
          title: t('notif.newMessage'),
          description: (payload.new?.content || '').slice(0, 80),
        });
      })
      .subscribe();

    // New booking requests as lessor
    const lessorChan = supabase
      .channel('notif-lessor-bookings')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'bookings',
        filter: `lessor_id=eq.${user.id}`,
      }, () => {
        toast({ title: t('notif.newBooking'), description: t('notif.newBookingDesc') });
      })
      .subscribe();

    // Booking status updates as renter
    const renterChan = supabase
      .channel('notif-renter-bookings')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'bookings',
        filter: `renter_id=eq.${user.id}`,
      }, (payload: any) => {
        const status = payload.new?.status;
        if (status && status !== payload.old?.status) {
          toast({ title: t('notif.bookingUpdate'), description: t(`bookingStatus.${status}`) });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChan);
      supabase.removeChannel(lessorChan);
      supabase.removeChannel(renterChan);
    };
  }, [user, t]);

  return <>{children}</>;
};
