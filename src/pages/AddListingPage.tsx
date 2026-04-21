import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useListings } from '@/contexts/ListingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload } from 'lucide-react';

export default function AddListingPage() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const { addItem } = useListings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [form, setForm] = useState({ title: '', description: '', category: '', price_per_day: '', location: profile?.location || '', condition: '' });
  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('item-images').upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('item-images').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setImageUrls(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.price_per_day || !form.condition) {
      toast({ title: t('addListing.fillFields'), variant: 'destructive' }); return;
    }
    setLoading(true);
    const result = await addItem({
      title: form.title,
      description: form.description,
      category: form.category,
      price_per_day: Number(form.price_per_day),
      location: form.location,
      condition: form.condition as 'new' | 'like_new' | 'good' | 'fair',
      images: imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop'],
    });
    setLoading(false);
    if (result) {
      toast({ title: t('addListing.created'), description: t('addListing.createdDesc') });
      navigate('/my-listings');
    } else {
      toast({ title: 'فشل في إنشاء الإعلان', variant: 'destructive' });
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="font-display text-2xl font-bold mb-6">{t('addListing.title')}</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><Label>{t('addListing.itemTitle')} *</Label><Input placeholder={t('addListing.titlePlaceholder')} value={form.title} onChange={e => update('title', e.target.value)} /></div>
          <div><Label>{t('addListing.description')} *</Label><Textarea placeholder={t('addListing.descPlaceholder')} rows={4} value={form.description} onChange={e => update('description', e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('addListing.category')} *</Label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger><SelectValue placeholder={t('addListing.selectCategory')} /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{t(`cat.${c}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('addListing.condition')} *</Label>
              <Select value={form.condition} onValueChange={v => update('condition', v)}>
                <SelectTrigger><SelectValue placeholder={t('addListing.selectCondition')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t('item.new')}</SelectItem>
                  <SelectItem value="like_new">{t('item.like_new')}</SelectItem>
                  <SelectItem value="good">{t('item.good')}</SelectItem>
                  <SelectItem value="fair">{t('item.fair')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>{t('addListing.pricePerDay')} *</Label><Input type="number" placeholder="25" value={form.price_per_day} onChange={e => update('price_per_day', e.target.value)} /></div>
            <div><Label>{t('addListing.location')}</Label><Input placeholder={t('addListing.location')} value={form.location} onChange={e => update('location', e.target.value)} /></div>
          </div>
          <div>
            <Label>{t('addListing.images')}</Label>
            <label className="mt-1 flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground hover:border-primary transition-colors">
              {uploading ? <Loader2 className="h-8 w-8 animate-spin mb-2" /> : <Upload className="h-8 w-8 mb-2" />}
              <p>{t('addListing.dragDrop')}</p>
              <p className="text-xs mt-1">{t('addListing.fileTypes')}</p>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
            {imageUrls.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {imageUrls.map((url, i) => (
                  <img key={i} src={url} className="h-16 w-16 rounded-lg object-cover" alt="" />
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>{loading ? t('addListing.creating') : t('addListing.create')}</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>{t('addListing.cancel')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
