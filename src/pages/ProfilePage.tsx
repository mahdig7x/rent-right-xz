import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({ name: profile?.name || '', phone: profile?.phone || '', location: profile?.location || '' });
  const [loading, setLoading] = useState(false);

  if (!profile) return null;

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await updateProfile(form);
    setLoading(false);
    if (ok) toast({ title: t('profile.updated') });
    else toast({ title: 'فشل في تحديث الملف الشخصي', variant: 'destructive' });
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="font-display text-2xl font-bold mb-6">{t('profile.title')}</h1>
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16"><AvatarImage src={profile.profile_image || undefined} /><AvatarFallback className="bg-primary text-primary-foreground text-lg">{profile.name.charAt(0)}</AvatarFallback></Avatar>
          <div>
            <p className="font-display font-semibold text-lg">{profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="text-sm text-muted-foreground">{t('profile.memberSince')} {new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div><Label>{t('profile.name')}</Label><Input value={form.name} onChange={e => update('name', e.target.value)} /></div>
          <div><Label>{t('profile.phone')}</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
          <div><Label>{t('profile.location')}</Label><Input value={form.location} onChange={e => update('location', e.target.value)} /></div>
          <Button type="submit" disabled={loading}>{loading ? t('profile.saving') : t('profile.save')}</Button>
        </form>
      </Card>
    </div>
  );
}
