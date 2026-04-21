import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ItemCard from '@/components/items/ItemCard';
import { useListings } from '@/contexts/ListingsContext';
import { useI18n } from '@/contexts/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, HardHat, Paintbrush, SprayCan,
  ArrowRight, Lightbulb, Package
} from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

interface ScenarioCategory {
  id: string;
  icon: React.ElementType;
  emoji: string;
  titleKey: string;
  descKey: string;
  relatedCategories: string[];
  keywords: string[];
}

interface ScenarioSectionProps {
  scenarioId?: string;
}

const SCENARIOS: Record<string, {
  titleKey: string;
  subtitleKey: string;
  tipKey: string;
  bgClass: string;
  categories: ScenarioCategory[];
}> = {
  home_renovation: {
    titleKey: 'scenario.homeTitle',
    subtitleKey: 'scenario.homeSubtitle',
    tipKey: 'scenario.homeTip',
    bgClass: 'from-warning/5 via-background to-primary/5',
    categories: [
      { id: 'power_tools', icon: Wrench, emoji: '🔧', titleKey: 'scenario.powerTools', descKey: 'scenario.powerToolsDesc', relatedCategories: ['Tools & Equipment'], keywords: ['drill', 'saw', 'power'] },
      { id: 'maintenance', icon: HardHat, emoji: '🪜', titleKey: 'scenario.maintenance', descKey: 'scenario.maintenanceDesc', relatedCategories: ['Tools & Equipment', 'Home & Kitchen'], keywords: ['ladder', 'repair'] },
      { id: 'finishing', icon: Paintbrush, emoji: '🧱', titleKey: 'scenario.finishing', descKey: 'scenario.finishingDesc', relatedCategories: ['Tools & Equipment'], keywords: ['paint', 'sand', 'tile'] },
      { id: 'cleaning', icon: SprayCan, emoji: '🧼', titleKey: 'scenario.cleaning', descKey: 'scenario.cleaningDesc', relatedCategories: ['Home & Kitchen', 'Tools & Equipment'], keywords: ['clean', 'wash', 'vacuum'] },
    ],
  },
  camping: {
    titleKey: 'scenario.campingTitle',
    subtitleKey: 'scenario.campingSubtitle',
    tipKey: 'scenario.campingTip',
    bgClass: 'from-primary/5 via-background to-accent/10',
    categories: [
      { id: 'tents', icon: Package, emoji: '⛺', titleKey: 'scenario.tents', descKey: 'scenario.tentsDesc', relatedCategories: ['Outdoor & Garden'], keywords: ['tent', 'camp'] },
      { id: 'outdoor_gear', icon: Package, emoji: '🎒', titleKey: 'scenario.outdoorGear', descKey: 'scenario.outdoorGearDesc', relatedCategories: ['Outdoor & Garden', 'Sports & Fitness'], keywords: ['outdoor', 'hike'] },
    ],
  },
};

export default function ScenarioSection({ scenarioId = 'home_renovation' }: ScenarioSectionProps) {
  const { t, isRtl } = useI18n();
  const { items } = useListings();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const scenario = SCENARIOS[scenarioId];
  if (!scenario) return null;

  const getFilteredItems = () => {
    if (!activeCategory) return [];
    const cat = scenario.categories.find(c => c.id === activeCategory);
    if (!cat) return [];
    return items.filter(item =>
      item.status === 'available' &&
      (cat.relatedCategories.includes(item.category) ||
       cat.keywords.some(kw => item.title.toLowerCase().includes(kw) || item.description.toLowerCase().includes(kw)))
    ).slice(0, 4);
  };

  const handleCategoryClick = (catId: string) => {
    if (activeCategory === catId) {
      setActiveCategory(null);
      return;
    }
    setIsLoading(true);
    setActiveCategory(catId);
    setTimeout(() => setIsLoading(false), 500);
  };

  const filteredItems = getFilteredItems();

  return (
    <section className={`py-20 bg-gradient-to-br ${scenario.bgClass}`}>
      <div className="container">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          {/* Header */}
          <motion.div variants={fadeUp} className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight">
              {t(scenario.titleKey)}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
              {t(scenario.subtitleKey)}
            </p>
          </motion.div>

          {/* Category Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {scenario.categories.map((cat) => (
              <motion.div key={cat.id} variants={fadeUp}>
                <Card
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`group cursor-pointer p-5 md:p-6 text-center transition-all duration-300 hover:-translate-y-1 border-2 ${
                    activeCategory === cat.id
                      ? 'border-primary bg-primary/5 shadow-card-hover'
                      : 'border-transparent hover:border-primary/20 hover:shadow-card-hover'
                  }`}
                >
                  <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
                    activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-primary/10 group-hover:bg-primary/20'
                  }`}>
                    <cat.icon className={`h-7 w-7 ${activeCategory === cat.id ? '' : 'text-primary'}`} />
                  </div>
                  <div className="text-xl mb-1">{cat.emoji}</div>
                  <h3 className="font-display text-sm font-bold leading-tight">{t(cat.titleKey)}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t(cat.descKey)}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Items Grid */}
          <AnimatePresence mode="wait">
            {activeCategory && (
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {isLoading ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="aspect-[4/3]" />
                        <div className="p-4 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-6 w-1/3" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : filteredItems.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-display text-lg font-bold">
                        {t('scenario.nearbyItems')}
                      </h3>
                      <Link to={`/browse?category=${encodeURIComponent(scenario.categories.find(c => c.id === activeCategory)?.relatedCategories[0] || '')}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          {t('home.viewAll')} <ArrowRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                        </Button>
                      </Link>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {filteredItems.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                        >
                          <ItemCard item={item} />
                        </motion.div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Card className="p-12 text-center border-dashed">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground/20 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">{t('scenario.noItems')}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{t('scenario.noItemsDesc')}</p>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tip */}
          <motion.div variants={fadeUp} className="mt-10">
            <Card className="p-5 bg-primary/5 border-primary/10 flex items-start gap-4 max-w-2xl mx-auto">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{t(scenario.tipKey)}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('scenario.tipGeneral')}</p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
