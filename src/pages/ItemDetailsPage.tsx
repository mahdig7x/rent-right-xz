import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

import { useListings } from '@/contexts/ListingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin, Star, MessageSquare, Calendar as CalendarIcon, Shield, Flag,
  ChevronLeft, ChevronRight, Heart, Share2, CheckCircle2,
  Clock, Package, Info, CreditCard, ArrowLeft, ArrowRight,
  ZoomIn, X, Loader2, PartyPopper, Eye
} from 'lucide-react';
import { SaudiRiyal } from '@/components/SaudiRiyal';
import { toast } from '@/hooks/use-toast';
import { differenceInDays, format, addDays } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { motion, AnimatePresence } from 'framer-motion';
import ItemCard from '@/components/items/ItemCard';
import { cn } from '@/lib/utils';
import { useChat } from '@/contexts/ChatContext';
import PaymentForm from '@/components/PaymentForm';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

// Image Lightbox Component
function ImageLightbox({ images, activeIndex, onClose, onNavigate }: {
  images: string[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate((activeIndex - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') onNavigate((activeIndex + 1) % images.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIndex, images.length, onClose, onNavigate]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <Button variant="ghost" size="icon" className="absolute top-4 end-4 text-white hover:bg-white/10 h-12 w-12 z-10" onClick={onClose}>
        <X className="h-6 w-6" />
      </Button>
      {images.length > 1 && (
        <>
          <Button variant="ghost" size="icon" className="absolute start-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12" onClick={e => { e.stopPropagation(); onNavigate((activeIndex - 1 + images.length) % images.length); }}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="absolute end-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12" onClick={e => { e.stopPropagation(); onNavigate((activeIndex + 1) % images.length); }}>
            <ArrowRight className="h-6 w-6" />
          </Button>
        </>
      )}
      <img
        src={images[activeIndex]}
        alt=""
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
        onClick={e => e.stopPropagation()}
      />
      {images.length > 1 && (
        <div className="absolute bottom-6 start-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); onNavigate(i); }}
              className={`h-2 rounded-full transition-all ${i === activeIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Booking Success Component
function BookingSuccess({ item, days, total, insurance, onClose, t }: {
  item: any; days: number; total: number; insurance: number; onClose: () => void; t: (k: string) => string;
}) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4 space-y-5">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <PartyPopper className="h-10 w-10 text-primary" />
      </motion.div>
      <div>
        <h3 className="font-display text-xl font-bold">{t('details.bookingSuccess')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('details.bookingSuccessDesc')}</p>
      </div>
      <Card className="p-4 text-start">
        <div className="flex items-center gap-3">
          <img src={item.images[0]} alt="" className="h-14 w-14 rounded-xl object-cover" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{item.title}</p>
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1 flex-wrap">{days} {t('details.forDays')} • {total + insurance}<SaudiRiyal className="h-3 w-3" /></p>
          </div>
          <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
        </div>
      </Card>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose}>{t('details.continueBrowsing')}</Button>
        <Button className="flex-1" onClick={() => window.location.href = '/my-bookings'}>{t('details.viewBookings')}</Button>
      </div>
    </motion.div>
  );
}

// Loading Skeleton
function ItemDetailsSkeleton() {
  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Skeleton className="aspect-[16/10] rounded-2xl" />
          <div className="flex gap-2">
            <Skeleton className="h-16 w-20 rounded-lg" />
            <Skeleton className="h-16 w-20 rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function ItemDetailsPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { t, isRtl, locale } = useI18n();
  const { sendMessage: chatSendMessage } = useChat();
  const navigate = useNavigate();
  const { items } = useListings();
  const item = items.find(i => i.id === id);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!item) return;
    (async () => {
      const { data: bks } = await supabase.from('bookings').select('id').eq('item_id', item.id);
      const ids = (bks || []).map((b: any) => b.id);
      if (ids.length === 0) { setReviews([]); return; }
      const { data: rs } = await supabase.from('reviews').select('*').in('booking_id', ids).order('created_at', { ascending: false });
      if (!rs) { setReviews([]); return; }
      const reviewerIds = [...new Set(rs.map((r: any) => r.reviewer_id))];
      const { data: profs } = await (supabase as any).from('profiles_public').select('user_id, name, profile_image').in('user_id', reviewerIds);
      const pmap = (profs || []).reduce((acc: any, p: any) => { acc[p.user_id] = p; return acc; }, {});
      setReviews(rs.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        reviewDate: r.created_at,
        reviewerName: pmap[r.reviewer_id]?.name || 'مستخدم',
        reviewerImage: pmap[r.reviewer_id]?.profile_image,
      })));
    })();
  }, [item?.id]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [message, setMessage] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingState, setBookingState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dateLocale = locale === 'ar' ? ar : enUS;

  // Simulate loading
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [id]);

  if (isLoading) return <ItemDetailsSkeleton />;

  if (!item) {
    return (
      <div className="container py-32 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Package className="mx-auto h-20 w-20 text-muted-foreground/30 mb-6" />
          <h2 className="font-display text-2xl font-bold mb-2">{t('details.itemNotFound')}</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('details.itemNotFoundDesc')}</p>
          <Link to="/browse"><Button size="lg">{t('details.backToBrowse')}</Button></Link>
        </motion.div>
      </div>
    );
  }

  const days = dateRange?.from && dateRange?.to ? Math.max(1, differenceInDays(dateRange.to, dateRange.from)) : 0;
  const total = days * item.price_per_day;
  const insurance = Math.round(total * 0.15);
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const statusLabel = item.status === 'available' ? t('item.available') : item.status === 'booked' ? t('item.booked') : t('item.unavailable');
  const conditionLabel = t(`item.${item.condition}`);

  const similarItems = items
    .filter(i => i.id !== item.id && i.category === item.category && i.status === 'available')
    .slice(0, 4);

  const handleBook = async () => {
    if (!isAuthenticated || !user) { navigate('/login'); return; }
    if (!dateRange?.from || !dateRange?.to) {
      toast({ title: t('details.selectDates'), description: t('details.selectDatesDesc'), variant: 'destructive' });
      return;
    }
    if (days < 1) { toast({ title: t('details.invalidDates'), variant: 'destructive' }); return; }

    setBookingState('processing');
    const { data: booking, error } = await supabase.from('bookings').insert({
      item_id: item.id,
      renter_id: user.id,
      lessor_id: item.owner_id,
      start_date: dateRange.from.toISOString().split('T')[0],
      end_date: dateRange.to.toISOString().split('T')[0],
      total_price: total,
      insurance_amount: insurance,
      status: 'confirmed',
    }).select().single();
    if (error || !booking) {
      toast({ title: 'فشل في إنشاء الحجز', variant: 'destructive' });
      setBookingState('idle');
      return;
    }
    // Record demo payments
    await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', booking.id);
    setBookingState('success');
  };

  const handleMessage = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!message.trim()) return;
    chatSendMessage(item.owner_id, message);
    toast({ title: t('details.messageSent'), description: `${item.owner_name}` });
    setMessage('');
    setMessageOpen(false);
  };

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const formatDateRange = () => {
    if (!dateRange?.from) return t('details.pickDates');
    if (!dateRange.to) return format(dateRange.from, 'PP', { locale: dateLocale });
    return `${format(dateRange.from, 'PP', { locale: dateLocale })} — ${format(dateRange.to, 'PP', { locale: dateLocale })}`;
  };

  return (
    <>
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <ImageLightbox
            images={item.images}
            activeIndex={activeImage}
            onClose={() => setLightboxOpen(false)}
            onNavigate={setActiveImage}
          />
        )}
      </AnimatePresence>

      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
        {/* Breadcrumb / Back */}
        <div className="border-b bg-card/50">
          <div className="container py-3 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-muted-foreground hover:text-foreground">
              <BackIcon className="h-4 w-4" />{t('details.back')}
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setLiked(!liked); toast({ title: liked ? t('details.removedFav') : t('details.addedFav') }); }}>
                <Heart className={`h-4 w-4 transition-all ${liked ? 'fill-destructive text-destructive scale-110' : ''}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: t('details.linkCopied') }); }}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="container px-3 sm:px-4 py-4 md:py-8">
          <div className="grid gap-6 md:gap-8 lg:grid-cols-5">
            {/* Left: Images + Details */}
            <div className="lg:col-span-3 space-y-6 md:space-y-8 min-w-0">
              {/* Image Gallery */}
              <motion.div variants={fadeUp}>
                <div className="relative group overflow-hidden rounded-2xl aspect-[16/10] bg-muted cursor-pointer" onClick={() => setLightboxOpen(true)}>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      src={item.images[activeImage]}
                      alt={`${item.title} ${activeImage + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </AnimatePresence>
                  {/* Zoom hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm">
                      <ZoomIn className="h-4 w-4" />
                      {t('details.clickToZoom')}
                    </div>
                  </div>
                  {/* Status badge */}
                  <Badge variant={item.status === 'available' ? 'default' : 'secondary'} className="absolute top-4 start-4 px-3 py-1.5 text-xs font-semibold shadow-lg">
                    {item.status === 'available' && <CheckCircle2 className="me-1 h-3 w-3" />}
                    {statusLabel}
                  </Badge>
                  {/* Image counter */}
                  {item.images.length > 1 && (
                    <div className="absolute top-4 end-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Eye className="h-3 w-3" />
                      {activeImage + 1} / {item.images.length}
                    </div>
                  )}
                  {/* Navigation arrows */}
                  {item.images.length > 1 && (
                    <>
                      <Button variant="secondary" size="icon" className="absolute start-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-elevated opacity-0 group-hover:opacity-90 transition-opacity"
                        onClick={e => { e.stopPropagation(); setActiveImage((activeImage - 1 + item.images.length) % item.images.length); }}>
                        {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                      </Button>
                      <Button variant="secondary" size="icon" className="absolute end-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full shadow-elevated opacity-0 group-hover:opacity-90 transition-opacity"
                        onClick={e => { e.stopPropagation(); setActiveImage((activeImage + 1) % item.images.length); }}>
                        {isRtl ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                      </Button>
                    </>
                  )}
                </div>
                {/* Thumbnails */}
                {item.images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {item.images.map((img, i) => (
                      <button key={i} onClick={() => setActiveImage(i)}
                        className={cn("relative overflow-hidden rounded-xl w-20 h-16 shrink-0 border-2 transition-all",
                          i === activeImage ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent opacity-50 hover:opacity-100')}>
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Title & Meta */}
              <motion.div variants={fadeUp}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">{t(`cat.${item.category}`)}</Badge>
                  <Badge variant="outline" className="text-xs">{conditionLabel}</Badge>
                </div>
                <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">{item.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{item.location}</span>
                  {avgRating && (
                    <span className="flex items-center gap-1.5"><Star className="h-4 w-4 text-warning fill-warning" />{avgRating} ({reviews.length})</span>
                  )}
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{t('details.listedOn')} {new Date(item.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
              </motion.div>

              <Separator />

              {/* Description */}
              <motion.div variants={fadeUp}>
                <h3 className="font-display text-lg font-semibold mb-3">{t('details.description')}</h3>
                <p className="text-muted-foreground leading-relaxed text-[15px]">{item.description}</p>
              </motion.div>

              {/* Item Details Grid */}
              <motion.div variants={fadeUp}>
                <h3 className="font-display text-lg font-semibold mb-4">{t('details.itemDetails')}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: t('details.condition'), value: conditionLabel, icon: Info },
                    { label: t('details.category'), value: t(`cat.${item.category}`), icon: Package },
                    { label: t('details.location'), value: item.location, icon: MapPin },
                    { label: t('details.pricePerDay'), value: <span className="inline-flex items-center gap-1">{item.price_per_day}<SaudiRiyal className="h-3 w-3" /></span>, icon: CreditCard },
                    { label: t('details.insurance'), value: '15%', icon: Shield },
                    { label: t('details.status'), value: statusLabel, icon: CheckCircle2 },
                  ].map((detail, i) => (
                    <Card key={i} className="p-4 bg-muted/30 border border-border/50 hover:border-primary/20 transition-colors">
                      <detail.icon className="h-4 w-4 text-primary mb-2" />
                      <div className="text-xs text-muted-foreground">{detail.label}</div>
                      <div className="font-display text-sm font-semibold mt-0.5 truncate">{detail.value}</div>
                    </Card>
                  ))}
                </div>
              </motion.div>

              {/* Location Map */}
              <motion.div variants={fadeUp}>
                <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />{t('details.locationMap')}
                </h3>
                <Card className="overflow-hidden border-2">
                  <div className="aspect-[16/9] w-full bg-muted">
                    <iframe
                      title="map"
                      src={
                        item.latitude && item.longitude
                          ? `https://maps.google.com/maps?q=${item.latitude},${item.longitude}&z=14&output=embed`
                          : `https://maps.google.com/maps?q=${encodeURIComponent(item.location)}&z=12&output=embed`
                      }
                      className="h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                  <div className="p-3 flex items-center justify-between bg-card">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={
                          item.latitude && item.longitude
                            ? `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('details.openInMaps')}
                      </a>
                    </Button>
                  </div>
                </Card>
              </motion.div>

              <Separator />

              {/* Owner */}
              <motion.div variants={fadeUp}>
                <h3 className="font-display text-lg font-semibold mb-4">{t('details.aboutOwner')}</h3>
                <Card className="p-5 hover:shadow-card-hover transition-shadow">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                      <AvatarImage src={item.owner_image} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">{item.owner_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-base">{item.owner_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />{t('details.verifiedMember')}
                      </p>
                    </div>
                    {user?.id !== item.owner_id && (
                    <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-1.5 shrink-0">
                          <MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">{t('details.message')}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>{t('details.messageTo')} {item.owner_name}</DialogTitle></DialogHeader>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-2">
                          <img src={item.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                          <div>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">{item.price_per_day}<SaudiRiyal className="h-3 w-3" /> {t('item.perDay')}</p>
                          </div>
                        </div>
                        <Textarea placeholder={t('details.writeMessage')} value={message} onChange={e => setMessage(e.target.value)} rows={4} className="resize-none" />
                        <Button onClick={handleMessage} className="w-full">{t('details.sendMessage')}</Button>
                      </DialogContent>
                    </Dialog>
                    )}
                  </div>
                </Card>
              </motion.div>

              <Separator />

              {/* Reviews */}
              <motion.div variants={fadeUp}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-semibold">{t('details.reviews')}</h3>
                  {avgRating && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(avgRating)) ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      <span className="font-display text-sm font-bold">{avgRating}</span>
                      <span className="text-xs text-muted-foreground">({reviews.length})</span>
                    </div>
                  )}
                </div>
                {reviews.length === 0 ? (
                  <Card className="p-10 text-center border-dashed">
                    <Star className="mx-auto h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">{t('details.noReviews')}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{t('details.beFirstReview')}</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <Card key={r.id} className="p-5 hover:shadow-card transition-shadow">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 mt-0.5">
                            <AvatarImage src={r.reviewerImage} />
                            <AvatarFallback className="bg-secondary text-sm">{r.reviewerName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">{r.reviewerName}</p>
                              <span className="text-xs text-muted-foreground">{new Date(r.reviewDate).toLocaleDateString(locale)}</span>
                            </div>
                            <div className="flex items-center gap-0.5 mt-1 mb-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right: Booking Sidebar */}
            <div className="lg:col-span-2">
              <motion.div variants={fadeUp}>
                <Card className="lg:sticky lg:top-24 p-5 md:p-6 space-y-5 shadow-card-hover border-2">
                  {/* Price Header */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="font-display text-3xl md:text-4xl font-extrabold text-primary inline-flex items-baseline gap-1.5">{item.price_per_day}<SaudiRiyal className="h-[0.7em] w-[0.7em] translate-y-[2px]" /></span>
                      <span className="text-muted-foreground ms-1">/ {t('details.day')}</span>
                    </div>
                    {avgRating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span className="font-semibold">{avgRating}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Calendar Date Range Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground block">{t('details.rentalPeriod')}</label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 justify-start text-start font-normal rounded-xl border-2 hover:border-primary/50 transition-colors",
                            !dateRange?.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="me-2 h-4 w-4 text-primary shrink-0" />
                          <span className="truncate text-sm">{formatDateRange()}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center" sideOffset={8}>
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={(range) => {
                            setDateRange(range);
                            if (range?.from && range?.to) {
                              setTimeout(() => setCalendarOpen(false), 300);
                            }
                          }}
                          numberOfMonths={1}
                          disabled={(date) => date < new Date()}
                          locale={dateLocale}
                          className={cn("p-3 pointer-events-auto")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Quick duration buttons */}
                    <div className="flex gap-2">
                      {[
                        { label: t('details.dur1Day'), days: 1 },
                        { label: t('details.dur3Days'), days: 3 },
                        { label: t('details.dur7Days'), days: 7 },
                      ].map(dur => (
                        <Button
                          key={dur.days}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "flex-1 text-xs h-8 rounded-lg",
                            days === dur.days && "border-primary bg-primary/5 text-primary"
                          )}
                          onClick={() => {
                            const from = new Date();
                            from.setHours(0, 0, 0, 0);
                            setDateRange({ from, to: addDays(from, dur.days) });
                          }}
                        >
                          {dur.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <AnimatePresence>
                    {days > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-xl bg-muted/50 p-4 space-y-2.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground inline-flex items-center gap-1">{item.price_per_day}<SaudiRiyal className="h-3 w-3" /> × {days} {t('details.days')}</span>
                            <span className="font-medium inline-flex items-center gap-1">{total}<SaudiRiyal className="h-3 w-3" /></span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Shield className="h-3.5 w-3.5 text-primary" />{t('details.insurance')}
                            </span>
                            <span className="font-medium inline-flex items-center gap-1">{insurance}<SaudiRiyal className="h-3 w-3" /></span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-display font-bold text-base">
                            <span>{t('details.total')}</span>
                            <span className="text-primary inline-flex items-center gap-1">{total + insurance}<SaudiRiyal className="h-3.5 w-3.5" /></span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Book Button */}
                  {user?.id === item.owner_id ? (
                    <Button className="w-full h-12 text-base font-semibold rounded-xl" size="lg" variant="secondary" disabled>
                      <CalendarIcon className="me-2 h-5 w-5" />
                      {t('details.ownerCannotBook')}
                    </Button>
                  ) : (
                  <Dialog open={bookingOpen} onOpenChange={(open) => {
                    setBookingOpen(open);
                    if (!open) setBookingState('idle');
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full h-12 text-base font-semibold rounded-xl shadow-elevated" size="lg" disabled={item.status !== 'available'}>
                        <CalendarIcon className="me-2 h-5 w-5" />
                        {item.status === 'available' ? t('details.bookNow') : t('item.unavailable')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <AnimatePresence mode="wait">
                        {bookingState === 'success' ? (
                          <BookingSuccess
                            key="success"
                            item={item}
                            days={days}
                            total={total}
                            insurance={insurance}
                            onClose={() => { setBookingOpen(false); setBookingState('idle'); }}
                            t={t}
                          />
                        ) : (
                          <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <DialogHeader><DialogTitle className="text-xl">{t('details.confirmBooking')}</DialogTitle></DialogHeader>
                            <div className="space-y-4 mt-2">
                              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                                <img src={item.images[0]} alt="" className="h-16 w-16 rounded-xl object-cover" />
                                <div>
                                  <p className="font-display font-semibold">{item.title}</p>
                                  {dateRange?.from && dateRange?.to && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {format(dateRange.from, 'PP', { locale: dateLocale })} → {format(dateRange.to, 'PP', { locale: dateLocale })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="rounded-xl border p-4 space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">{t('details.rental')} ({days} {t('details.days')})</span><span className="font-medium inline-flex items-center gap-1">{total}<SaudiRiyal className="h-3 w-3" /></span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">{t('details.insurance')}</span><span className="font-medium inline-flex items-center gap-1">{insurance}<SaudiRiyal className="h-3 w-3" /></span></div>
                                <Separator />
                                <div className="flex justify-between font-display font-bold text-base"><span>{t('details.total')}</span><span className="text-primary inline-flex items-center gap-1">{total + insurance}<SaudiRiyal className="h-3.5 w-3.5" /></span></div>
                              </div>
                              <PaymentForm amount={total + insurance} onSuccess={handleBook} loading={bookingState === 'processing'} />
                              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                                <Shield className="h-3 w-3" />{t('details.secureCheckout')}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </DialogContent>
                  </Dialog>
                  )}

                  {/* Quick Info */}
                  <div className="space-y-3 pt-2">
                    {[
                      { icon: Shield, text: t('details.insuranceIncluded') },
                      { icon: CheckCircle2, text: t('details.freeCancellation') },
                      { icon: Clock, text: t('details.instantConfirm') },
                    ].map((info, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <info.icon className="h-4 w-4 text-primary shrink-0" />
                        <span>{info.text}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive gap-1.5" size="sm" onClick={() => navigate('/report')}>
                    <Flag className="h-4 w-4" />{t('details.reportIssue')}
                  </Button>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Similar Items */}
          {similarItems.length > 0 && (
            <motion.div variants={fadeUp} className="mt-16">
              <Separator className="mb-12" />
              <h2 className="font-display text-2xl font-bold mb-6">{t('details.similarItems')}</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {similarItems.map(si => <ItemCard key={si.id} item={si} />)}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}
