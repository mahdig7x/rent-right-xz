import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
import { Loader2, Upload, X, MapPin, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function EditListingPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const { items, updateItem } = useListings();
  const navigate = useNavigate();
  const item = items.find(i => i.id === id);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: '', price_per_day: '',
    location: '', condition: '', status: 'available',
  });

  const detectLocation = () => {
    if (!navigator.geolocation) { toast({ title: 'المتصفح لا يدعم تحديد الموقع', variant: 'destructive' }); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || '';
          const country = data.address?.country || '';
          const label = [city, country].filter(Boolean).join('، ');
          if (label) setForm(f => ({ ...f, location: label }));
        } catch {/* ignore */}
        setLocating(false);
        toast({ title: 'تم تحديد الموقع ✅' });
      },
      (err) => { setLocating(false); toast({ title: 'تعذّر تحديد الموقع', description: err.message, variant: 'destructive' }); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const mapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : form.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location)}` : null;

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        description: item.description,
        category: item.category,
        price_per_day: String(item.price_per_day),
        location: item.location,
        condition: item.condition,
        status: item.status,
      });
      setImageUrls(item.images || []);
    }
  }, [item?.id]);

  if (!item) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground mb-4">{t('details.itemNotFound')}</p>
        <Link to="/my-listings"><Button>{t('myListings.title')}</Button></Link>
      </div>
    );
  }

  if (item.owner_id !== user?.id) {
    return <div className="container py-16 text-center text-muted-foreground">{t('edit.notOwner')}</div>;
  }

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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
    setLoading(true);
    const ok = await updateItem(item.id, {
      title: form.title,
      description: form.description,
      category: form.category,
      price_per_day: Number(form.price_per_day),
      location: form.location,
      condition: form.condition as any,
      status: form.status as any,
      images: imageUrls,
    });
    setLoading(false);
    if (ok) { toast({ title: t('edit.updated') }); navigate('/my-listings'); }
    else toast({ title: t('edit.failed'), variant: 'destructive' });
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="font-display text-2xl font-bold mb-6">{t('edit.title')}</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><Label>{t('addListing.itemTitle')}</Label><Input value={form.title} onChange={e => update('title', e.target.value)} /></div>
          <div><Label>{t('addListing.description')}</Label><Textarea rows={4} value={form.description} onChange={e => update('description', e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('addListing.category')}</Label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{t(`cat.${c}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('addListing.condition')}</Label>
              <Select value={form.condition} onValueChange={v => update('condition', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            <div><Label>{t('addListing.pricePerDay')}</Label><Input type="number" value={form.price_per_day} onChange={e => update('price_per_day', e.target.value)} /></div>
            <div>
              <Label>{t('addListing.location')}</Label>
              <Input value={form.location} onChange={e => { update('location', e.target.value); setCoords(null); }} />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={detectLocation} disabled={locating} className="gap-1.5">
                  {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                  موقعي الحالي
                </Button>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noreferrer">
                    <Button type="button" size="sm" variant="ghost" className="gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5" /> معاينة على Google Maps
                    </Button>
                  </a>
                )}
                {coords && <span className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> تم التحقق</span>}
              </div>
            </div>
          </div>
          <div>
            <Label>{t('item.status' as any) || 'Status'}</Label>
            <Select value={form.status} onValueChange={v => update('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">{t('item.available')}</SelectItem>
                <SelectItem value="unavailable">{t('item.unavailable')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t('addListing.images')}</Label>
            <label className="mt-1 flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground hover:border-primary transition-colors">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin mb-2" /> : <Upload className="h-6 w-6 mb-2" />}
              <p>{t('addListing.dragDrop')}</p>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            {imageUrls.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} className="h-16 w-16 rounded-lg object-cover" alt="" />
                    <button type="button" className="absolute -top-1.5 -end-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t('edit.save')}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/my-listings')}>{t('addListing.cancel')}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
