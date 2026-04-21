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
      .select('*, sender:profiles!messages_sender_id_fkey(name, profile_image), receiver:profiles!messages_receiver_id_fkey(name, profile_image)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!msgs) { setLoading(false); return; }

    const convMap = new Map<string, ChatConversation>();
    for (const msg of msgs as any[]) {
      const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const otherProfile = msg.sender_id === user.id ? msg.receiver : msg.sender;
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
      .select('*, sender:profiles!messages_sender_id_fkey(name, profile_image)')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', user.id)
      .eq('read', false);

    return (data || []).map((m: any) => ({
      ...m,
      sender_name: m.sender?.name,
      sender_image: m.sender?.profile_image,
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
