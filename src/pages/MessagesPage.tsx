import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChat, ChatMessage } from '@/contexts/ChatContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, ArrowLeft, Search, Check, CheckCheck, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const { t, isRtl } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const { conversations, getMessages, sendMessage } = useChat();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const initialUser = params.get('user') || conversations[0]?.other_user_id || null;
  const initialBooking = params.get('booking');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialUser);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(initialBooking);
  const [bookingInfo, setBookingInfo] = useState<{ title: string; image?: string; status: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(!!initialUser);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const convo = conversations.find(c => c.other_user_id === selectedUserId);

  const loadMessages = useCallback(async (userId: string, bookingId: string | null) => {
    const msgs = await getMessages(userId, bookingId);
    setMessages(msgs);
  }, [getMessages]);

  useEffect(() => {
    if (selectedUserId) loadMessages(selectedUserId, selectedBookingId);
  }, [selectedUserId, selectedBookingId, loadMessages]);

  // Load booking info when bookingId is provided
  useEffect(() => {
    if (!selectedBookingId) { setBookingInfo(null); return; }
    (async () => {
      const { data } = await supabase
        .from('bookings')
        .select('status, items(title, images)')
        .eq('id', selectedBookingId)
        .maybeSingle();
      if (data) {
        const it: any = (data as any).items;
        setBookingInfo({ title: it?.title || '', image: it?.images?.[0], status: (data as any).status });
      }
    })();
  }, [selectedBookingId]);

  const filteredConvos = conversations.filter(c =>
    c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedUserId]);

  useEffect(() => {
    if (selectedUserId && window.innerWidth >= 1024) {
      inputRef.current?.focus();
    }
  }, [selectedUserId]);

  // Poll for new messages
  useEffect(() => {
    if (!selectedUserId) return;
    const interval = setInterval(() => loadMessages(selectedUserId, selectedBookingId), 5000);
    return () => clearInterval(interval);
  }, [selectedUserId, selectedBookingId, loadMessages]);

  const [otherUserFallback, setOtherUserFallback] = useState<{ name: string; image: string | null } | null>(null);

  useEffect(() => {
    if (!selectedUserId || convo) { setOtherUserFallback(null); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from('profiles_public')
        .select('name, profile_image')
        .eq('user_id', selectedUserId)
        .maybeSingle();
      if (data) setOtherUserFallback({ name: data.name || 'User', image: data.profile_image });
    })();
  }, [selectedUserId, convo]);

  if (!isAuthenticated) {
    return (
      <div className="container py-32 text-center">
        <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">{t('messages.title')}</h2>
        <p className="text-muted-foreground mb-6">{t('messages.loginRequired')}</p>
        <Button onClick={() => navigate('/login')}>{t('nav.login')}</Button>
      </div>
    );
  }

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedUserId) return;
    const ok = await sendMessage(selectedUserId, newMsg, selectedBookingId);
    if (ok) {
      setNewMsg('');
      await loadMessages(selectedUserId, selectedBookingId);
      inputRef.current?.focus();
    }
  };

  const selectConvo = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedBookingId(null);
    setBookingInfo(null);
    setParams({}, { replace: true });
    setShowMobileChat(true);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return t('messages.yesterday');
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const ConversationList = () => (
    <Card className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="font-display text-lg font-bold mb-3">{t('messages.title')}</h2>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('messages.searchPlaceholder')} className="ps-9 h-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConvos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">{t('messages.noConversations')}</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {filteredConvos.map(c => (
              <button
                key={c.id}
                onClick={() => selectConvo(c.other_user_id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl p-3 text-start transition-all duration-200",
                  selectedUserId === c.other_user_id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'
                )}
              >
                <Avatar className="h-11 w-11">
                  <AvatarImage src={c.other_user_image || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{c.other_user_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold truncate">{c.other_user_name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(c.last_message_date)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{c.last_message}</p>
                    {c.unread_count > 0 && (
                      <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[10px] flex items-center justify-center shrink-0">{c.unread_count}</Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );

  const headerName = convo?.other_user_name || otherUserFallback?.name || '';
  const headerImage = convo?.other_user_image || otherUserFallback?.image || null;

  const ChatPanel = () => (
    <Card className="flex flex-col h-full overflow-hidden">
      {selectedUserId ? (
        <>
          <div className="border-b p-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 shrink-0" onClick={() => setShowMobileChat(false)}>
              <ArrowLeft className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarImage src={headerImage || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">{headerName.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{headerName}</p>
              {selectedBookingId && bookingInfo && (
                <p className="text-[10px] text-muted-foreground truncate">{t('messages.aboutBooking')}: {bookingInfo.title}</p>
              )}
            </div>
            {selectedBookingId && (
              <Badge variant="outline" className="text-[10px] gap-1"><Package className="h-3 w-3" />{t('messages.bookingChat')}</Badge>
            )}
          </div>
          {selectedBookingId && bookingInfo && (
            <div className="border-b bg-muted/40 p-3 flex items-center gap-3">
              {bookingInfo.image && <img src={bookingInfo.image} alt="" className="h-10 w-10 rounded-lg object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{bookingInfo.title}</p>
                <p className="text-[10px] text-muted-foreground">{t(`bookingStatus.${bookingInfo.status}`)}</p>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground/20 mb-2" />
                  <p className="text-sm text-muted-foreground">{t('messages.startChat')}</p>
                </div>
              </div>
            )}
            <AnimatePresence>
              {messages.map((m, idx) => {
                const isMine = m.sender_id === user?.id;
                const showAvatar = !isMine && (idx === 0 || messages[idx - 1].sender_id !== m.sender_id);
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMine && showAvatar && (
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={m.sender_image || undefined} />
                        <AvatarFallback className="text-[10px]">{m.sender_name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                    )}
                    {!isMine && !showAvatar && <div className="w-7" />}
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      isMine ? 'bg-primary text-primary-foreground rounded-ee-md' : 'bg-muted rounded-es-md'
                    )}>
                      <p>{m.content}</p>
                      <div className={cn("flex items-center gap-1 mt-1", isMine ? 'justify-end' : 'justify-start')}>
                        <span className={cn("text-[10px]", isMine ? 'text-primary-foreground/60' : 'text-muted-foreground')}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMine && (m.read ? <CheckCheck className="h-3 w-3 text-primary-foreground/60" /> : <Check className="h-3 w-3 text-primary-foreground/60" />)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-3">
            <div className="flex gap-2 items-center">
              <Input
                ref={inputRef}
                placeholder={t('messages.typePlaceholder')}
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                className="flex-1 h-11 rounded-xl"
              />
              <Button size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={handleSend} disabled={!newMsg.trim()}>
                <Send className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h3 className="font-display font-semibold mb-1">{t('messages.selectConvo')}</h3>
          <p className="text-sm text-muted-foreground max-w-xs">{t('messages.selectConvoDesc')}</p>
        </div>
      )}
    </Card>
  );

  return (
    <div className="container py-6 md:py-8">
      <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-12rem)]">
        <div className={cn("lg:col-span-1", showMobileChat ? 'hidden lg:block' : 'block')}><ConversationList /></div>
        <div className={cn("lg:col-span-2", !showMobileChat ? 'hidden lg:block' : 'block')}><ChatPanel /></div>
      </div>
    </div>
  );
}
