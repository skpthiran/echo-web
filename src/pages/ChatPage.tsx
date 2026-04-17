import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Lock, Mic, Image, Sparkles, User as UserIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Message } from '../lib/types';

interface Conversation {
  userId: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  displayName: string;
}

export function ChatPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('with');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(targetUserId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations
  useEffect(() => {
    if (!user) return;

    async function fetchConversations() {
      // This is a naive implementation: get all messages and group by partner
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error || !data) return;

      const partnerMap = new Map<string, Conversation>();
      
      data.forEach((msg) => {
        const partnerId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, {
            userId: partnerId,
            lastMessage: msg.content,
            timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unreadCount: 0, // Simplified
            displayName: `Echo User ${partnerId.slice(0, 8)}`
          });
        }
      });

      // If we're coming from "Matches", ensure that user is in the list
      if (targetUserId && !partnerMap.has(targetUserId)) {
        partnerMap.set(targetUserId, {
          userId: targetUserId,
          lastMessage: 'Start a new conversation',
          timestamp: 'Now',
          unreadCount: 0,
          displayName: `Echo User ${targetUserId.slice(0, 8)}`
        });
      }

      setConversations(Array.from(partnerMap.values()));
      setLoading(false);
    }

    fetchConversations();
  }, [user, targetUserId]);

  // 2. Fetch/Subscribe to Messages for Active Conversation
  useEffect(() => {
    if (!user || !activePartnerId) return;

    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${activePartnerId}),and(sender_id.eq.${activePartnerId},receiver_id.eq.${user?.id})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
      }
    }

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${activePartnerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === activePartnerId) {
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activePartnerId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!user || !activePartnerId || !newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    const tempMsg: Message = {
      id: Math.random().toString(),
      sender_id: user.id,
      receiver_id: activePartnerId,
      content: messageContent,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: activePartnerId,
        content: messageContent
      });

    if (error) {
      console.error('Failed to send message:', error);
      // Ideally remove temp message or show error
    }
  };

  const activePartner = conversations.find(c => c.userId === activePartnerId);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar - Conversation list */}
      <div className="w-80 border-r border-[rgba(255,255,255,0.05)] bg-[#050508] flex flex-col flex-shrink-0 hidden md:flex">
        <div className="p-6 border-b border-[rgba(255,255,255,0.05)]">
          <h2 className="font-serif text-2xl text-white font-light">Connections</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <button
              key={c.userId}
              onClick={() => setActivePartnerId(c.userId)}
              className={`w-full text-left p-6 border-b border-[rgba(255,255,255,0.02)] transition-colors
                ${activePartnerId === c.userId ? 'bg-[rgba(255,255,255,0.02)] border-l-2 border-l-[#8e84ad]' : 'hover:bg-[rgba(255,255,255,0.01)] border-l-2 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-white truncate pr-4">{c.displayName}</span>
                <span className="text-[10px] text-[#e1e3ed]/40 whitespace-nowrap pt-1">{c.timestamp}</span>
              </div>
              <p className="text-xs text-[#e1e3ed]/60 font-light truncate">{c.lastMessage}</p>
            </button>
          ))}
          {!loading && conversations.length === 0 && (
            <div className="p-12 text-center text-[#e1e3ed]/20 italic font-serif text-sm">
              No connections established yet.
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0a0b12] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[rgba(255,255,255,0.02)] to-transparent pointer-events-none" />
        
        {activePartnerId ? (
          <>
            <header className="flex-shrink-0 px-8 py-6 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between relative z-10 backdrop-blur-sm">
              <div>
                <h3 className="font-medium text-white tracking-wide">{activePartner?.displayName || `Echo User ${activePartnerId.slice(0, 8)}`}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Lock className="w-3 h-3 text-[#e1e3ed]/40" />
                  <span className="text-[10px] uppercase tracking-widest text-[#e1e3ed]/40">End-to-End Encrypted</span>
                </div>
              </div>
              
              <div className="px-3 py-1 flex items-center gap-2 bg-[rgba(142,132,173,0.1)] border border-[rgba(142,132,173,0.2)] rounded-full text-[10px] uppercase tracking-[0.1em] text-[#8e84ad]">
                <Sparkles className="w-3 h-3" /> Wavelength Match
              </div>
            </header>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 relative z-10"
            >
              <div className="w-full flex justify-center mb-8">
                <span className="px-4 py-1.5 rounded-full bg-[rgba(255,255,255,0.02)] text-[10px] uppercase tracking-widest text-[#e1e3ed]/30 relative z-10">
                  Connection established based on mutual resonance
                </span>
              </div>

              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-lg ${msg.sender_id === user?.id ? 'self-end' : 'self-start'}`}
                >
                  <div className={`p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border
                    ${msg.sender_id === user?.id 
                      ? 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)] rounded-tr-sm' 
                      : 'bg-[#14151a] border-[rgba(255,255,255,0.03)] rounded-tl-sm'}`}
                  >
                    <p className="text-[#e1e3ed]/90 font-light leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                  <div className={`text-[10px] text-[#e1e3ed]/40 mt-2 ${msg.sender_id === user?.id ? 'mr-1 text-right' : 'ml-1'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex-shrink-0 p-6 relative z-10">
              <div className="max-w-4xl mx-auto bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-full p-2 flex items-center pr-3 focus-within:border-[rgba(255,255,255,0.15)] focus-within:bg-[rgba(255,255,255,0.03)] transition-colors">
                <button className="w-10 h-10 flex items-center justify-center text-[#e1e3ed]/30 hover:text-white transition-colors rounded-full">
                  <Image className="w-5 h-5" />
                </button>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Speak softly..." 
                  className="flex-1 bg-transparent border-none outline-none text-[#e1e3ed] placeholder:text-[#e1e3ed]/20 px-4 font-light text-sm"
                />
                <button className="w-10 h-10 flex items-center justify-center text-[#e1e3ed]/30 hover:text-white transition-colors rounded-full">
                  <Mic className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {newMessage.trim().length > 0 && (
                    <motion.button 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      onClick={handleSend}
                      className="w-10 h-10 ml-2 flex items-center justify-center bg-white text-black hover:bg-[#e1e3ed] transition-colors rounded-full"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <UserIcon className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="font-serif text-2xl text-white font-light mb-2">Select a Soul</h3>
            <p className="text-[#e1e3ed]/40 text-sm max-w-xs leading-relaxed">
              Choose a connection from the list to begin a conversation based on mutual resonance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
