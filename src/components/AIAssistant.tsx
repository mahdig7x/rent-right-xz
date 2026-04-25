import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Send, X, Loader2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SaudiRiyal } from '@/components/SaudiRiyal';
import { supabase } from '@/integrations/supabase/client';
import { useListings } from '@/contexts/ListingsContext';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/hooks/use-toast';

type Recommendation = { id: string; reason: string };
type ChatMsg =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; recs?: Recommendation[] };

function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function AIAssistant() {
  const { t } = useI18n();
  const { items } = useListings();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', text: t('ai.welcome') },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const requestLocation = () => {
    if (!navigator.geolocation) { toast({ title: t('ai.geoUnsupported'), variant: 'destructive' }); return; }
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('granted');
        toast({ title: t('ai.geoEnabled') });
      },
      () => { setLocStatus('denied'); toast({ title: t('ai.geoDenied'), variant: 'destructive' }); },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  const itemById = (id: string) => items.find(i => i.id === id);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const approved = items.filter(i => i.moderation_status === 'approved' && i.status === 'available');
      const enriched = approved.map(i => ({
        id: i.id,
        title: i.title,
        description: (i.description || '').slice(0, 200),
        category: i.category,
        price_per_day: i.price_per_day,
        location: i.location,
        condition: i.condition,
        distance_km: userLoc && i.latitude != null && i.longitude != null
          ? Math.round(haversine(userLoc, { lat: i.latitude, lng: i.longitude }) * 10) / 10
          : null,
      }));
      const sorted = userLoc
        ? [...enriched].sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999))
        : enriched;

      const { data, error } = await supabase.functions.invoke('ai-recommend', {
        body: { query: q, candidates: sorted, hasLocation: !!userLoc },
      });

      if (error || (data as any)?.error) {
        const msg = (data as any)?.error || error?.message || t('ai.failed');
        setMessages(prev => [...prev, { role: 'assistant', text: msg }]);
      } else {
        const payload = data as { message: string; recommendations: Recommendation[] };
        setMessages(prev => [...prev, { role: 'assistant', text: payload.message, recs: payload.recommendations }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: t('ai.failed') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 end-6 z-40 group flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 px-4 py-3 shadow-lg shadow-primary/30 ring-1 ring-primary/40 hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
          aria-label={t('ai.open')}
        >
          <Sparkles className="h-5 w-5 text-primary-foreground" />
          <span className="font-display text-sm font-semibold text-primary-foreground hidden sm:inline">{t('ai.launcher')}</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 end-6 z-50 w-[min(420px,calc(100vw-2rem))] h-[min(640px,calc(100vh-3rem))] flex flex-col rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden">
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold leading-tight">{t('ai.title')}</p>
                <p className="text-xs text-muted-foreground leading-tight truncate">{t('ai.subtitle')}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </header>

          {/* Location bar */}
          <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center gap-2 text-xs">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            {userLoc ? (
              <span className="text-foreground/80">{t('ai.geoOn')}</span>
            ) : (
              <button onClick={requestLocation} disabled={locStatus === 'loading'} className="text-primary hover:underline inline-flex items-center gap-1">
                {locStatus === 'loading' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Navigation className="h-3 w-3" />}
                {t('ai.geoEnable')}
              </button>
            )}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  {m.role === 'assistant' && m.recs && m.recs.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {m.recs.map((r) => {
                        const it = itemById(r.id);
                        if (!it) return null;
                        const dist = userLoc && it.latitude != null && it.longitude != null
                          ? haversine(userLoc, { lat: it.latitude, lng: it.longitude })
                          : null;
                        return (
                          <Link key={r.id} to={`/items/${it.id}`} onClick={() => setOpen(false)}>
                            <Card className="flex gap-2.5 p-2 hover:bg-accent/50 transition-colors border-border/60">
                              <img src={it.images[0]} alt={it.title} className="h-14 w-14 rounded-lg object-cover shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold truncate text-foreground">{it.title}</p>
                                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{r.reason}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 inline-flex items-baseline gap-0.5">
                                    {it.price_per_day}
                                    <SaudiRiyal className="h-[0.7em] w-[0.7em]" />
                                  </Badge>
                                  {dist != null && (
                                    <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
                                      <MapPin className="h-2.5 w-2.5" />
                                      {dist < 1 ? `${Math.round(dist * 1000)} م` : `${dist.toFixed(1)} كم`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('ai.thinking')}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t border-border p-3 flex items-center gap-2 bg-card"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.placeholder')}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
