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
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast({ title: t('login.fillFields'), variant: 'destructive' }); return; }
    setLoading(true);
    setNeedsConfirm(false);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      toast({ title: t('login.welcomeBack') });
      navigate('/dashboard');
    } else {
      const msg = (result.error || '').toLowerCase();
      if (msg.includes('not confirmed') || msg.includes('email_not_confirmed')) {
        setNeedsConfirm(true);
        toast({
          title: 'بريدك الإلكتروني غير موثّق',
          description: 'تحقق من بريدك أو اطلب رسالة تأكيد جديدة من الزر بالأسفل.',
          variant: 'destructive',
        });
      } else {
        toast({ title: result.error || 'Login failed', variant: 'destructive' });
      }
    }
  };

  const resendConfirmation = async () => {
    if (!email) {
      toast({ title: 'أدخل بريدك الإلكتروني أولاً', variant: 'destructive' });
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (error) toast({ title: 'تعذر إرسال الرسالة', description: error.message, variant: 'destructive' });
    else toast({ title: 'تم إرسال رسالة التأكيد ✉️', description: 'تحقق من صندوق الوارد (والرسائل غير المرغوب فيها)' });
  };

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold">{t('login.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('login.subtitle')}</p>
        </div>
        
        <Button variant="outline" className="w-full mb-4 gap-2" onClick={loginWithGoogle} type="button">
          <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          {t('login.google') || 'تسجيل الدخول بـ Google'}
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">{t('login.or') || 'أو'}</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label htmlFor="email">{t('login.email')}</Label><Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label htmlFor="password">{t('login.password')}</Label><Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? t('login.signing') : t('login.submit')}</Button>
        </form>
        {needsConfirm && (
          <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium">بريدك الإلكتروني لم يُؤكَّد بعد</p>
              <p className="text-xs text-muted-foreground mt-0.5">افتح الرسالة المرسلة إلى <span className="font-medium">{email}</span> واضغط على الرابط، أو أعد إرسالها:</p>
              <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={resendConfirmation} disabled={resending}>
                {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                إعادة إرسال رسالة التأكيد
              </Button>
            </div>
          </div>
        )}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('login.noAccount')} <Link to="/register" className="font-medium text-primary hover:underline">{t('nav.signup')}</Link>
        </p>
      </Card>
    </div>
  );
}
