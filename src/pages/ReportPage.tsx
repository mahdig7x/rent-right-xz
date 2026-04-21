import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ReportPage() {
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    type: '',
    description: '',
    bookingId: searchParams.get('booking') || '',
    itemId: searchParams.get('item') || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }
    if (!form.description.trim()) {
      toast({ title: t('report.descRequired'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
      description: form.description,
      booking_id: form.bookingId || null,
      item_id: form.itemId || null,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'فشل في إرسال البلاغ', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: t('report.submitted'), description: t('report.submittedDesc') });
    navigate('/dashboard');
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="font-display text-2xl font-bold mb-6">{t('report.title')}</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('report.type')}</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger><SelectValue placeholder={t('report.type')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="damage">{t('report.damage')}</SelectItem>
                <SelectItem value="dispute">{t('report.dispute')}</SelectItem>
                <SelectItem value="complaint">{t('report.complaint')}</SelectItem>
                <SelectItem value="other">{t('report.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>{t('report.bookingId')}</Label><Input placeholder="UUID" value={form.bookingId} onChange={e => setForm(f => ({ ...f, bookingId: e.target.value }))} /></div>
          <div><Label>{t('report.description')} *</Label><Textarea rows={5} placeholder={t('report.descPlaceholder')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading}>{loading ? t('report.submitting') : t('report.submit')}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>{t('report.cancel')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
