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
    const { data: itemsData, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !itemsData) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Fetch owner profiles in a single query
    const ownerIds = [...new Set(itemsData.map(i => i.owner_id))];
    let profilesMap: Record<string, { name: string; profile_image: string | null }> = {};
    if (ownerIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, name, profile_image')
        .in('user_id', ownerIds);
      if (profilesData) {
        profilesMap = profilesData.reduce((acc, p) => {
          acc[p.user_id] = { name: p.name, profile_image: p.profile_image };
          return acc;
        }, {} as Record<string, { name: string; profile_image: string | null }>);
      }
    }

    const mapped: ListingItem[] = itemsData.map((item: any) => ({
      ...item,
      images: item.images && item.images.length > 0 ? item.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop'],
      owner_name: profilesMap[item.owner_id]?.name || 'مستخدم',
      owner_image: profilesMap[item.owner_id]?.profile_image || null,
    }));
    setItems(mapped);
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
