import { Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { useListings } from '@/contexts/ListingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function MyListingsPage() {
  const { t } = useI18n();
  const { items, deleteItem } = useListings();
  const { user } = useAuth();
  const myListings = items.filter(i => i.owner_id === user?.id);

  const handleDelete = async (id: string) => {
    const ok = await deleteItem(id);
    if (ok) toast({ title: t('myListings.deleted') });
    else toast({ title: 'فشل في حذف الإعلان', variant: 'destructive' });
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">{t('myListings.title')}</h1>
        <Link to="/listings/new"><Button><Plus className="me-1.5 h-4 w-4" />{t('nav.listItem')}</Button></Link>
      </div>
      {myListings.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">{t('myListings.noListings')}</p>
          <Link to="/listings/new"><Button><Plus className="me-1.5 h-4 w-4" />{t('myListings.createFirst')}</Button></Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {myListings.map(item => (
            <Card key={item.id} className="flex items-center gap-4 p-4">
              <img src={item.images[0]} alt={item.title} className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <Link to={`/items/${item.id}`} className="font-semibold text-sm hover:underline">{item.title}</Link>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">${item.price_per_day}{t('item.perDay')}</span>
                  <Badge variant={item.status === 'available' ? 'default' : 'secondary'} className="text-xs">{item.status === 'available' ? t('item.available') : t('item.booked')}</Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
