import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const isStrongPassword = (pw: string) =>
    pw.length >= 8 &&
    /[a-z]/.test(pw) &&
    /[A-Z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast({ title: t('register.fillFields'), variant: 'destructive' });
      return;
    }
    if (!isStrongPassword(form.password)) {
      toast({ title: t('register.passwordWeak'), variant: 'destructive' });
      return;
    }
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (!result.success) {
      toast({ title: result.error || 'Registration failed', variant: 'destructive' });
      return;
    }

    // Always sign out any auto-created session and send the user to the login page
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.auth.signOut();

    toast({
      title: t('register.checkEmail'),
      description: t('register.checkEmailDesc'),
    });
    navigate(`/login?email=${encodeURIComponent(form.email)}`);
  };

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold">{t('register.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('register.subtitle')}</p>
        </div>

        <Button variant="outline" className="w-full mb-4 gap-2" onClick={loginWithGoogle} type="button">
          <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          {t('register.googleSignup')}
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{t('login.or') || 'أو'}</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label htmlFor="name">{t('register.name')} *</Label><Input id="name" placeholder={t('register.name')} value={form.name} onChange={e => update('name', e.target.value)} /></div>
          <div><Label htmlFor="email">{t('register.email')} *</Label><Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} /></div>
          <div><Label htmlFor="password">{t('register.password')} *</Label><Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} /></div>
          <div><Label htmlFor="phone">{t('register.phone')}</Label><Input id="phone" placeholder="+966 5XX XXX XXXX" value={form.phone} onChange={e => update('phone', e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? t('register.creating') : t('register.submit')}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('register.hasAccount')} <Link to="/login" className="font-medium text-primary hover:underline">{t('nav.login')}</Link>
        </p>
      </Card>
    </div>
  );
}
