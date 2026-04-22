import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, Plus, MessageSquare, LayoutDashboard, LogOut, User as UserIcon, Globe, MapPin, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo-full.png';

export default function Navbar() {
  const { isAuthenticated, profile, logout, user } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const { totalUnread } = useChat();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').then(({ data }) => {
      setIsAdmin(!!data && data.length > 0);
    });
  }, [user]);

  const toggleLang = () => setLocale(locale === 'en' ? 'ar' : 'en');

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center group shrink-0">
          <img
            src={logo}
            alt="Rent Right استأجر صح"
            className="h-9 sm:h-10 md:h-12 lg:h-14 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/browse"><Button variant="ghost" size="sm">{t('nav.browse')}</Button></Link>
          <Link to="/nearby"><Button variant="ghost" size="sm"><MapPin className="me-1.5 h-4 w-4" />{t('nav.nearby')}</Button></Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard"><Button variant="ghost" size="sm"><LayoutDashboard className="me-1.5 h-4 w-4" />{t('nav.dashboard')}</Button></Link>
              <Link to="/messages" className="relative">
                <Button variant="ghost" size="sm"><MessageSquare className="me-1.5 h-4 w-4" />{t('nav.messages')}</Button>
                {totalUnread > 0 && (
                  <Badge className="absolute -top-1 -end-1 h-5 min-w-5 rounded-full px-1 text-[10px] flex items-center justify-center">{totalUnread}</Badge>
                )}
              </Link>
              <Link to="/listings/new"><Button size="sm" className="ms-2"><Plus className="me-1.5 h-4 w-4" />{t('nav.listItem')}</Button></Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5">
            <Globe className="h-4 w-4" />
            <span className="text-xs">{t('lang.switch')}</span>
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.profile_image || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{profile?.name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/profile')}><UserIcon className="me-2 h-4 w-4" />{t('nav.profile')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard')}><LayoutDashboard className="me-2 h-4 w-4" />{t('nav.dashboard')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate('/'); }}><LogOut className="me-2 h-4 w-4" />{t('nav.logout')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden gap-2 md:flex">
              <Link to="/login"><Button variant="ghost" size="sm">{t('nav.login')}</Button></Link>
              <Link to="/register"><Button size="sm">{t('nav.signup')}</Button></Link>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side={locale === 'ar' ? 'left' : 'right'} className="w-72">
              <nav className="mt-8 flex flex-col gap-2">
                <Link to="/browse" onClick={() => setOpen(false)}><Button variant="ghost" className="w-full justify-start">{t('nav.browse')}</Button></Link>
                <Link to="/nearby" onClick={() => setOpen(false)}><Button variant="ghost" className="w-full justify-start">{t('nav.nearby')}</Button></Link>
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" onClick={() => setOpen(false)}><Button variant="ghost" className="w-full justify-start">{t('nav.dashboard')}</Button></Link>
                    <Link to="/messages" onClick={() => setOpen(false)}><Button variant="ghost" className="w-full justify-start">{t('nav.messages')}</Button></Link>
                    <Link to="/listings/new" onClick={() => setOpen(false)}><Button className="w-full justify-start">{t('nav.listItem')}</Button></Link>
                    <Link to="/profile" onClick={() => setOpen(false)}><Button variant="ghost" className="w-full justify-start">{t('nav.profile')}</Button></Link>
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { logout(); navigate('/'); setOpen(false); }}>{t('nav.logout')}</Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setOpen(false)}><Button variant="ghost" className="w-full justify-start">{t('nav.login')}</Button></Link>
                    <Link to="/register" onClick={() => setOpen(false)}><Button className="w-full justify-start">{t('nav.signup')}</Button></Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
