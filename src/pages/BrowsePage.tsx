import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ItemCard from '@/components/items/ItemCard';
import { useListings } from '@/contexts/ListingsContext';
import { CATEGORIES } from '@/types';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

export default function BrowsePage() {
  const { t } = useI18n();
  const { items } = useListings();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || 'all');
  const [location, setLocation] = useState('all');
  const locations = useMemo(() => [...new Set(items.map(i => i.location))], [items]);

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== 'all' && item.category !== category) return false;
      if (location !== 'all' && item.location !== location) return false;
      return true;
    });
  }, [search, category, location, items]);

  return (
    <div className="container py-8">
      <h1 className="font-display text-3xl font-bold mb-6">{t('browse.title')}</h1>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('browse.searchPlaceholder')} className="ps-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]"><SlidersHorizontal className="me-2 h-4 w-4" /><SelectValue placeholder={t('addListing.category')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('browse.allCategories')}</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{t(`cat.${c}`)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('addListing.location')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('browse.allLocations')}</SelectItem>
              {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="font-display text-lg font-semibold">{t('browse.noItems')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('browse.noItemsDesc')}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
