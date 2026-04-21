import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { ListingItem } from '@/contexts/ListingsContext';
import { useI18n } from '@/contexts/I18nContext';

interface Props {
  item: ListingItem;
}

const ItemCard = forwardRef<HTMLAnchorElement, Props>(({ item }, ref) => {
  const { t } = useI18n();

  const conditionLabel = t(`item.${item.condition}`);
  const statusLabel = item.status === 'available' ? t('item.available') : item.status === 'booked' ? t('item.booked') : t('item.unavailable');
  const categoryLabel = t(`cat.${item.category}`);

  return (
    <Link ref={ref} to={`/items/${item.id}`}>
      <Card className="group overflow-hidden border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={item.images?.[0]} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
          <Badge variant={item.status === 'available' ? 'default' : 'secondary'} className="absolute start-3 top-3 text-xs">{statusLabel}</Badge>
        </div>
        <div className="p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{categoryLabel}</span>
            <span className="text-xs text-muted-foreground">{conditionLabel}</span>
          </div>
          <h3 className="font-display text-base font-semibold leading-tight line-clamp-1">{item.title}</h3>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{item.location}</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="font-display text-lg font-bold text-primary">${item.price_per_day}</span>
            <span className="text-xs text-muted-foreground">{t('item.perDay')}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
});

ItemCard.displayName = 'ItemCard';

export default ItemCard;
