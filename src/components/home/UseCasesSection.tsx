import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Tent, Sparkles, Camera, Wrench } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/button';
import camping from '@/assets/usecase-camping.jpg';
import wedding from '@/assets/usecase-wedding.jpg';
import photography from '@/assets/usecase-photography.jpg';
import renovation from '@/assets/usecase-renovation.jpg';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function UseCasesSection() {
  const { t, isRtl } = useI18n();

  const cases = [
    {
      img: camping,
      icon: Tent,
      title: t('usecase.camping.title'),
      desc: t('usecase.camping.desc'),
      cta: t('usecase.camping.cta'),
      tag: t('usecase.camping.tag'),
      saving: t('usecase.camping.saving'),
      category: 'Outdoor & Garden',
      gradient: 'from-orange-500/80 to-rose-600/80',
    },
    {
      img: wedding,
      icon: Sparkles,
      title: t('usecase.wedding.title'),
      desc: t('usecase.wedding.desc'),
      cta: t('usecase.wedding.cta'),
      tag: t('usecase.wedding.tag'),
      saving: t('usecase.wedding.saving'),
      category: 'Party & Events',
      gradient: 'from-amber-500/80 to-yellow-600/80',
    },
    {
      img: photography,
      icon: Camera,
      title: t('usecase.photography.title'),
      desc: t('usecase.photography.desc'),
      cta: t('usecase.photography.cta'),
      tag: t('usecase.photography.tag'),
      saving: t('usecase.photography.saving'),
      category: 'Cameras & Photography',
      gradient: 'from-slate-700/85 to-slate-900/85',
    },
    {
      img: renovation,
      icon: Wrench,
      title: t('usecase.renovation.title'),
      desc: t('usecase.renovation.desc'),
      cta: t('usecase.renovation.cta'),
      tag: t('usecase.renovation.tag'),
      saving: t('usecase.renovation.saving'),
      category: 'Tools & Equipment',
      gradient: 'from-blue-600/80 to-cyan-700/80',
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="container relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-14 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wider uppercase border border-primary/20 mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              {t('usecase.badge')}
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">
              {t('usecase.title')}
            </h2>
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              {t('usecase.subtitle')}
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {cases.map((c, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Link
                  to={`/browse?category=${encodeURIComponent(c.category)}`}
                  className="group relative block overflow-hidden rounded-3xl shadow-card hover:shadow-elevated transition-all duration-500 h-[420px] md:h-[460px]"
                >
                  <img
                    src={c.img}
                    alt={c.title}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${c.gradient} opacity-90 transition-opacity duration-500 group-hover:opacity-95`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Top tag */}
                  <div className="absolute top-5 start-5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold">
                    <c.icon className="h-3.5 w-3.5" />
                    {c.tag}
                  </div>

                  {/* Saving badge */}
                  <div className="absolute top-5 end-5 px-3 py-1.5 rounded-full bg-white text-foreground text-xs font-black shadow-lg">
                    {c.saving}
                  </div>

                  {/* Bottom content */}
                  <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 text-white">
                    <h3 className="font-display text-2xl md:text-3xl font-black leading-tight mb-2 drop-shadow-lg">
                      {c.title}
                    </h3>
                    <p className="text-sm md:text-base text-white/90 leading-relaxed mb-5 max-w-md drop-shadow">
                      {c.desc}
                    </p>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-foreground font-bold text-sm shadow-xl group-hover:gap-3 transition-all">
                      {c.cta}
                      <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''} transition-transform group-hover:translate-x-0.5`} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} className="mt-12 text-center">
            <Link to="/browse">
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-xl font-bold">
                {t('usecase.exploreAll')}
                <ArrowRight className={`ms-2 h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
