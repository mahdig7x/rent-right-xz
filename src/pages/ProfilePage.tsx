import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, AlertCircle, Mail, Phone, Loader2, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({ name: '', phone: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);

  useEffect(() => {
    if (profile) setForm({ name: profile.name || '', phone: profile.phone || '', location: profile.location || '' });
    else if (user) {
      setForm({
        name: (user.user_metadata?.name as string) || (user.user_metadata?.full_name as string) || '',
        phone: '',
        location: '',
      });
    }
  }, [profile, user]);

  if (authLoading) {
    return <div className="container py-16 flex items-center justify-center text-muted-foreground gap-2"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));
  const emailVerified = !!user.email_confirmed_at;
  const phoneVerified = !!user.phone_confirmed_at;
  const displayName = profile?.name || form.name || (user.email ? user.email.split('@')[0] : 'User');
  const avatarUrl = profile?.profile_image || (user.user_metadata?.avatar_url as string) || undefined;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const ok = await updateProfile(form);
    setSaving(false);
    if (ok) toast({ title: t('profile.updated') });
    else toast({ title: 'فشل في تحديث الملف الشخصي', variant: 'destructive' });
  };

  const resendEmailVerification = async () => {
    if (!user.email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: { emailRedirectTo: window.location.origin },
    });
    setResending(false);
    if (error) toast({ title: 'تعذر إرسال الرسالة', description: error.message, variant: 'destructive' });
    else toast({ title: 'تم إرسال رسالة التأكيد ✉️', description: 'تحقق من بريدك الإلكتروني (وصندوق الرسائل غير المرغوب فيها)' });
  };

  const sendPhoneOtp = async () => {
    if (!form.phone || form.phone.length < 8) {
      toast({ title: 'أدخل رقم جوال صحيح بصيغة دولية مثل +9665XXXXXXXX', variant: 'destructive' });
      return;
    }
    setPhoneSending(true);
    const { error } = await supabase.auth.updateUser({ phone: form.phone });
    setPhoneSending(false);
    if (error) {
      toast({ title: 'تعذر إرسال رمز التحقق', description: error.message, variant: 'destructive' });
    } else {
      setPhoneOtpSent(true);
      toast({ title: 'تم إرسال رمز التحقق 📱', description: 'أدخل الرمز المكوّن من 6 أرقام المُرسل إلى جوالك' });
    }
  };

  const verifyPhoneOtp = async () => {
    if (!phoneCode || phoneCode.length < 4) {
      toast({ title: 'أدخل رمز التحقق', variant: 'destructive' });
      return;
    }
    setPhoneVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: form.phone,
      token: phoneCode,
      type: 'phone_change',
    });
    setPhoneVerifying(false);
    if (error) {
      toast({ title: 'الرمز غير صحيح', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم توثيق رقم الجوال ✅' });
      setPhoneOtpSent(false);
      setPhoneCode('');
      // Persist phone in profile too
      await updateProfile({ phone: form.phone });
    }
  };

  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <h1 className="font-display text-2xl font-bold">{t('profile.title')}</h1>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-lg truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            {profile?.created_at && (
              <p className="text-xs text-muted-foreground">{t('profile.memberSince')} {new Date(profile.created_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>

        <Separator className="my-2" />

        {/* Verification status */}
        <div className="my-4 space-y-3">
          <h3 className="font-display font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> حالة التوثيق</h3>

          {/* Email */}
          <div className="flex items-center justify-between rounded-lg border p-3 gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
              </div>
            </div>
            {emailVerified ? (
              <Badge variant="default" className="gap-1 bg-success/15 text-success hover:bg-success/15 border border-success/30"><CheckCircle2 className="h-3 w-3" /> موثّق</Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1 bg-warning/15 text-warning border border-warning/30"><AlertCircle className="h-3 w-3" /> غير موثّق</Badge>
                <Button size="sm" variant="outline" onClick={resendEmailVerification} disabled={resending}>
                  {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'إرسال رسالة التأكيد'}
                </Button>
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{form.phone || 'لم يُضف رقم جوال بعد'}</p>
                  <p className="text-xs text-muted-foreground">رقم الجوال</p>
                </div>
              </div>
              {phoneVerified ? (
                <Badge variant="default" className="gap-1 bg-success/15 text-success hover:bg-success/15 border border-success/30"><CheckCircle2 className="h-3 w-3" /> موثّق</Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 bg-warning/15 text-warning border border-warning/30"><AlertCircle className="h-3 w-3" /> غير موثّق</Badge>
              )}
            </div>

            {!phoneVerified && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Input
                    placeholder="+9665XXXXXXXX"
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                    className="flex-1 min-w-[160px]"
                    dir="ltr"
                  />
                  <Button onClick={sendPhoneOtp} disabled={phoneSending} variant="outline" size="sm">
                    {phoneSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (phoneOtpSent ? 'إعادة الإرسال' : 'إرسال رمز التحقق')}
                  </Button>
                </div>
                {phoneOtpSent && (
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      placeholder="رمز التحقق"
                      value={phoneCode}
                      onChange={e => setPhoneCode(e.target.value)}
                      maxLength={6}
                      className="flex-1 min-w-[160px]"
                      dir="ltr"
                    />
                    <Button onClick={verifyPhoneOtp} disabled={phoneVerifying} size="sm">
                      {phoneVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'تأكيد'}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">قد يتطلب تفعيل توثيق الجوال إعداد مزود رسائل في إعدادات المنصة. إذا لم يصلك الرمز، تواصل مع الدعم.</p>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-2" />

        {/* Editable fields */}
        <form onSubmit={handleSave} className="space-y-4 mt-4">
          <div><Label>{t('profile.name')}</Label><Input value={form.name} onChange={e => update('name', e.target.value)} /></div>
          <div><Label>{t('profile.location')}</Label><Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="المدينة، البلد" /></div>
          <Button type="submit" disabled={saving}>{saving ? t('profile.saving') : t('profile.save')}</Button>
        </form>
      </Card>
    </div>
  );
}
