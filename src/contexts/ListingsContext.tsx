import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ListingItem {
  id: string;
  title: string;
  description: string;
  category: string;
  price_per_day: number;
  location: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  status: 'available' | 'booked' | 'unavailable';
  moderation_status: 'approved' | 'pending_review' | 'flagged' | 'suspended';
  moderation_note: string | null;
  images: string[];
  owner_id: string;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  owner_name?: string;
  owner_image?: string;
}

interface ListingsContextType {
  items: ListingItem[];
  loading: boolean;
  addItem: (data: {
    title: string;
    description: string;
    category: string;
    price_per_day: number;
    location: string;
    condition: 'new' | 'like_new' | 'good' | 'fair';
    images: string[];
  }) => Promise<ListingItem | null>;
  deleteItem: (id: string) => Promise<boolean>;
  refreshItems: () => Promise<void>;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*, profiles!items_owner_id_fkey(name, profile_image)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped = data.map((item: any) => ({
        ...item,
        images: item.images || [],
        owner_name: item.profiles?.name || '',
        owner_image: item.profiles?.profile_image || null,
      }));
      setItems(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (data: {
    title: string;
    description: string;
    category: string;
    price_per_day: number;
    location: string;
    condition: 'new' | 'like_new' | 'good' | 'fair';
    images: string[];
  }): Promise<ListingItem | null> => {
    if (!user) return null;
    const { data: newItem, error } = await supabase
      .from('items')
      .insert({
        ...data,
        owner_id: user.id,
      })
      .select()
      .single();
    if (error || !newItem) return null;
    await fetchItems();
    return newItem as ListingItem;
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) return false;
    setItems(prev => prev.filter(item => item.id !== id));
    return true;
  };

  return (
    <ListingsContext.Provider value={{ items, loading, addItem, deleteItem, refreshItems: fetchItems }}>
      {children}
    </ListingsContext.Provider>
  );
}

export function useListings() {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error('useListings must be used within ListingsProvider');
  return ctx;
}
