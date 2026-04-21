import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  booking_id?: string | null;
  sender_name?: string;
  sender_image?: string;
}

export interface ChatConversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_image: string | null;
  last_message: string;
  last_message_date: string;
  unread_count: number;
}

interface ChatContextType {
  conversations: ChatConversation[];
  loading: boolean;
  getMessages: (otherUserId: string) => Promise<ChatMessage[]>;
  sendMessage: (receiverId: string, content: string) => Promise<boolean>;
  totalUnread: number;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) { setConversations([]); return; }
    setLoading(true);

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!msgs) { setLoading(false); return; }

    // Get unique other user IDs
    const otherIds = [...new Set(msgs.map(m => m.sender_id === user.id ? m.receiver_id : m.sender_id))];

    let profilesMap: Record<string, { name: string; profile_image: string | null }> = {};
    if (otherIds.length > 0) {
      const { data: profilesData } = await (supabase as any)
        .from('profiles_public')
        .select('user_id, name, profile_image')
        .in('user_id', otherIds);
      if (profilesData) {
        profilesMap = profilesData.reduce((acc, p) => {
          acc[p.user_id] = { name: p.name, profile_image: p.profile_image };
          return acc;
        }, {} as Record<string, { name: string; profile_image: string | null }>);
      }
    }

    const convMap = new Map<string, ChatConversation>();
    for (const msg of msgs as any[]) {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const otherProfile = profilesMap[otherUserId];
      if (!convMap.has(otherUserId)) {
        convMap.set(otherUserId, {
          id: otherUserId,
          other_user_id: otherUserId,
          other_user_name: otherProfile?.name || 'مستخدم',
          other_user_image: otherProfile?.profile_image || null,
          last_message: msg.content,
          last_message_date: msg.created_at,
          unread_count: 0,
        });
      }
      if (!msg.read && msg.receiver_id === user.id) {
        const conv = convMap.get(otherUserId)!;
        conv.unread_count++;
      }
    }

    setConversations(Array.from(convMap.values()));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  const getMessages = useCallback(async (otherUserId: string): Promise<ChatMessage[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', user.id)
      .eq('read', false);

    // Fetch sender profiles
    const senderIds = [...new Set((data || []).map((m: any) => m.sender_id))];
    let profilesMap: Record<string, { name: string; profile_image: string | null }> = {};
    if (senderIds.length > 0) {
      const { data: profs } = await (supabase as any)
        .from('profiles_public')
        .select('user_id, name, profile_image')
        .in('user_id', senderIds);
      if (profs) {
        profilesMap = profs.reduce((acc, p) => {
          acc[p.user_id] = { name: p.name, profile_image: p.profile_image };
          return acc;
        }, {} as Record<string, { name: string; profile_image: string | null }>);
      }
    }

    return (data || []).map((m: any) => ({
      ...m,
      sender_name: profilesMap[m.sender_id]?.name,
      sender_image: profilesMap[m.sender_id]?.profile_image,
    }));
  }, [user]);

  const sendMessage = useCallback(async (receiverId: string, content: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, receiver_id: receiverId, content });
    if (error) return false;
    await fetchConversations();
    return true;
  }, [user, fetchConversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <ChatContext.Provider value={{ conversations, loading, getMessages, sendMessage, totalUnread, refreshConversations: fetchConversations }}>
      {children}
    </ChatContext.Provider>
  );
};
