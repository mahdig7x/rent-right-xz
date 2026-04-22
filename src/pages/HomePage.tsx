import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import ItemCard from '@/components/items/ItemCard';
import ScenarioSection from '@/components/home/ScenarioSection';
import UseCasesSection from '@/components/home/UseCasesSection';
import { useListings } from '@/contexts/ListingsContext';
import { CATEGORIES } from '@/types';
import {
  Search, Shield, Star, ArrowRight, Zap, Users, Lock,
  Camera, Trees, Wrench, Dumbbell, Home, PartyPopper,
  Car, Music, Package, CheckCircle2, TrendingUp, Heart, Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/contexts/I18nContext';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo-full.png';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Electronics': Zap,
  'Outdoor & Garden': Trees,
  'Tools & Equipment': Wrench,
  'Sports & Fitness': Dumbbell,
  'Home & Kitchen': Home,
  'Party & Events': PartyPopper,
  'Vehicles': Car,
  'Cameras & Photography': Camera,
  'Music & Instruments': Music,
  'Other': Package,
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { t, isRtl } = useI18n();
  const { items } = useListings();
  const featured = items.filter(i => i.status === 'available' && i.moderation_status === 'approved').slice(0, 4);
  const [liveStats, setLiveStats] = useState({ items: 0, users: 0, satisfaction: 98 });

  useEffect(() => {
    (async () => {
      const [itemsRes, usersRes, reviewsRes] = await Promise.all([
        supabase.from('items').select('id', { count: 'exact', head: true }).eq('moderation_status', 'approved'),
        (supabase as any).from('profiles_public').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('rating'),
      ]);
      const ratings = reviewsRes.data || [];
      const avg = ratings.length > 0 ? Math.round((ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length) * 20) : 98;
      setLiveStats({
        items: itemsRes.count || 0,
        users: usersRes.count || 0,
        satisfaction: avg,
      });
    })();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center bg-background overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh" />
        <div className="absolute inset-0 grid-pattern opacity-40" />

        <div className="absolute top-20 -start-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-10 -end-20 w-[500px] h-[500px] bg-info/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/3 start-1/2 w-72 h-72 bg-warning/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '8s' }} />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-24 end-[8%] hidden lg:block animate-float"
        >
          <img src={logo} alt="" className="w-32 h-32 object-contain drop-shadow-2xl rotate-6" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="absolute bottom-32 start-[6%] hidden lg:block animate-float"
          style={{ animationDelay: '2s' }}
        >
          <img src={logo} alt="" className="w-20 h-20 object-contain drop-shadow-xl -rotate-12 opacity-60" />
        </motion.div>

        <div className="container relative z-10 py-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div variants={fadeUp} className="flex justify-center mb-8 lg:hidden">
              <img src={logo} alt="Rent Right" className="w-24 h-24 object-contain drop-shadow-xl" />
            </motion.div>

            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-xs font-bold tracking-wider uppercase border border-primary/30 bg-primary/10 text-primary backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 me-1.5" />
                {t('home.badge')}
              </Badge>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-display text-[2.25rem] xs:text-4xl tracking-tight sm:text-6xl md:text-7xl leading-[1.05] sm:leading-[0.95] text-center mx-0 pb-[19px] py-[16px] border-none font-extrabold lg:text-7xl break-words [text-wrap:balance]">
              {t('home.title1')}
              <br />
              <span className="text-gradient inline-block mt-2 my-[9px] py-[10px]">
                {t('home.title2')}
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('home.subtitle')}
            </motion.p>

            <motion.form variants={fadeUp} onSubmit={handleSearch} className="mt-10 flex flex-col sm:flex-row gap-3 mx-auto max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute start-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('home.searchPlaceholder')}
                  className="ps-14 h-16 text-base rounded-2xl border-2 border-border bg-card/80 backdrop-blur-md shadow-soft focus:border-primary focus:shadow-glow transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="h-16 px-10 rounded-2xl text-base font-bold shadow-glow bg-gradient-hero hover:opacity-90 transition-opacity">
                {t('home.search')}
                <ArrowRight className={`ms-2 h-5 w-5 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </motion.form>

            <motion.div variants={fadeUp} className="mt-14 flex flex-wrap items-center justify-center gap-10 md:gap-16">
              {[
                { value: liveStats.items > 0 ? `${liveStats.items}+` : '—', label: t('home.statItems') },
                { value: liveStats.users > 0 ? `${liveStats.users}+` : '—', label: t('home.statUsers') },
                { value: `${liveStats.satisfaction}%`, label: t('home.statSatisfaction') },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="font-display text-3xl md:text-4xl font-black text-gradient">{stat.value}</div>
                  <div className="text-xs md:text-sm text-muted-foreground mt-1 font-medium">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold">{t('home.browseByCategory')}</h2>
            <p className="mt-3 text-muted-foreground">{t('home.categorySubtitle')}</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {CATEGORIES.map(cat => {
              const Icon = CATEGORY_ICONS[cat] || Package;
              return (
                <motion.div key={cat} variants={fadeUp}>
                  <Link to={`/browse?category=${encodeURIComponent(cat)}`}>
                    <Card className="group flex flex-col items-center gap-3 p-6 text-center cursor-pointer border-2 border-transparent hover:border-primary/30 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <span className="font-display text-sm font-semibold leading-tight">{t(`cat.${cat}`)}</span>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Featured */}
      <section className="bg-secondary/30 py-20">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold">{t('home.featured')}</h2>
                <p className="mt-2 text-muted-foreground">{t('home.featuredSubtitle')}</p>
              </div>
              <Link to="/browse">
                <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5">
                  {t('home.viewAll')} <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                </Button>
              </Link>
            </motion.div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((item, i) => (
                <motion.div key={item.id} variants={fadeUp} transition={{ delay: i * 0.05 }}>
                  <ItemCard item={item} />
                </motion.div>
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link to="/browse">
                <Button variant="outline">{t('home.viewAll')} <ArrowRight className={`ms-1 h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} /></Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Real Use Cases */}
      <UseCasesSection />

      {/* Scenario: Home Renovation */}
      <ScenarioSection scenarioId="home_renovation" />

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <Badge variant="secondary" className="mb-4 text-xs">{t('home.simpleProcess')}</Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold">{t('home.howItWorks')}</h2>
            </motion.div>
            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto relative">
              {/* Connector line */}
              <div className="hidden md:block absolute top-16 start-[20%] end-[20%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
              {[
                { icon: Search, title: t('home.step1Title'), desc: t('home.step1Desc'), step: '1' },
                { icon: Zap, title: t('home.step2Title'), desc: t('home.step2Desc'), step: '2' },
                { icon: Star, title: t('home.step3Title'), desc: t('home.step3Desc'), step: '3' },
              ].map((s, i) => (
                <motion.div key={i} variants={fadeUp} className="relative text-center">
                  <div className="mx-auto mb-5 relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elevated mx-auto">
                      <s.icon className="h-8 w-8" />
                    </div>
                    <span className="absolute -top-2 -end-2 flex h-7 w-7 items-center justify-center rounded-full bg-card border-2 border-primary text-xs font-bold text-primary">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-accent/30 py-20">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold">{t('home.testimonialTitle')}</h2>
              <p className="mt-3 text-muted-foreground">{t('home.testimonialSubtitle')}</p>
            </motion.div>
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {[
                { name: t('home.test1Name'), role: t('home.test1Role'), text: t('home.test1Text'), rating: 5 },
                { name: t('home.test2Name'), role: t('home.test2Role'), text: t('home.test2Text'), rating: 5 },
                { name: t('home.test3Name'), role: t('home.test3Role'), text: t('home.test3Text'), rating: 4 },
              ].map((review, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-6 h-full border-0 shadow-card hover:shadow-card-hover transition-shadow">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: review.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{review.text}"</p>
                    <div className="mt-auto">
                      <div className="font-display text-sm font-semibold">{review.name}</div>
                      <div className="text-xs text-muted-foreground">{review.role}</div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl font-bold">{t('home.trustedSecure')}</h2>
              <p className="mt-3 text-muted-foreground">{t('home.trustSubtitle')}</p>
            </motion.div>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { icon: Shield, title: t('home.insurance'), desc: t('home.insuranceDesc'), color: 'bg-primary/10' },
                { icon: Users, title: t('home.verified'), desc: t('home.verifiedDesc'), color: 'bg-info/10' },
                { icon: Lock, title: t('home.securePay'), desc: t('home.securePayDesc'), color: 'bg-warning/10' },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <Card className="p-8 text-center border-2 border-transparent hover:border-primary/20 transition-all group">
                    <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${item.color} group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-display text-base font-bold">{item.title}</h4>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent-foreground" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
        <div className="container relative z-10 py-20 md:py-24 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp}>
              <TrendingUp className="mx-auto h-12 w-12 text-primary-foreground/80 mb-6" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight">
              {t('home.ctaTitle')}
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-primary-foreground/80 max-w-lg mx-auto">
              {t('home.ctaDesc')}
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="h-14 px-10 text-base font-bold rounded-xl shadow-elevated">
                  {t('home.ctaButton')}
                </Button>
              </Link>
              <Link to="/browse">
                <Button size="lg" variant="ghost" className="h-14 px-10 text-base font-semibold rounded-xl text-primary-foreground border-2 border-primary-foreground/30 hover:bg-primary-foreground/10">
                  {t('home.exploreCta')}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
