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
import { MapPin, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function AddListingPage() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const { addItem } = useListings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [form, setForm] = useState({ title: '', description: '', category: '', price_per_day: '', location: profile?.location || '', condition: '' });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'المتصفح لا يدعم تحديد الموقع', variant: 'destructive' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocationVerified(true);
        // Reverse geocode via free Nominatim (no API key needed)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || '';
          const country = data.address?.country || '';
          const label = [city, country].filter(Boolean).join('، ');
          if (label) update('location', label);
        } catch {/* ignore */}
        setLocating(false);
        toast({ title: 'تم تحديد موقعك ✅', description: 'يمكنك التحقق منه على خرائط Google' });
      },
      (err) => {
        setLocating(false);
        toast({ title: 'تعذّر تحديد الموقع', description: err.message, variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : form.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}`
      : null;

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
    if (!form.location) {
      toast({ title: 'الرجاء تحديد موقع الإعلان', description: 'استخدم زر "موقعي الحالي" أو أدخله يدوياً', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const result = await addItem({
      title: form.title,
      description: form.description,
      category: form.category,
      price_per_day: Number(form.price_per_day),
      location: coords ? `${form.location} (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})` : form.location,
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
            <div>
              <Label className="flex items-center gap-1.5">
                {t('addListing.location')} *
                {locationVerified && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
              </Label>
              <Input
                placeholder="الرياض، السعودية"
                value={form.location}
                onChange={e => { update('location', e.target.value); setLocationVerified(false); setCoords(null); }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={detectLocation} disabled={locating} className="gap-1.5">
                  {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                  موقعي الحالي
                </Button>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noreferrer">
                    <Button type="button" size="sm" variant="ghost" className="gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" /> معاينة على خرائط Google
                    </Button>
                  </a>
                )}
              </div>
              {locationVerified && coords && (
                <p className="mt-1 text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> تم التحقق من الموقع تلقائياً</p>
              )}
            </div>
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
