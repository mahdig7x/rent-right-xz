import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

export default function ReportPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({ type: '', description: '', bookingId: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description) { toast({ title: t('report.descRequired'), variant: 'destructive' }); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
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
          <div><Label>{t('report.bookingId')}</Label><Input placeholder="e.g. b1" value={form.bookingId} onChange={e => setForm(f => ({ ...f, bookingId: e.target.value }))} /></div>
          <div><Label>{t('report.description')} *</Label><Textarea rows={5} placeholder={t('report.descPlaceholder')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div>
            <Label>{t('report.evidence')}</Label>
            <div className="mt-1 rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">{t('report.evidenceDesc')}</div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading}>{loading ? t('report.submitting') : t('report.submit')}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>{t('report.cancel')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
