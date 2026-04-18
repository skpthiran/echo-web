import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Users, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Notification } from '../lib/types';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export function NotificationPanel({ notifications, onMarkRead, onMarkAllRead, onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'match': return <Users className="w-4 h-4 text-pink-400" />;
      case 'resonance': return <Activity className="w-4 h-4 text-purple-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleNotificationClick = (n: Notification) => {
    onMarkRead(n.id);
    if (n.post_id) {
      navigate(`/feed/${n.post_id}`);
    }
    onClose();
  };

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-full right-0 mt-4 w-[320px] max-h-[480px] bg-[#0a0a0f] border border-white/5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col z-[100]"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/90">Notifications</h3>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onMarkAllRead();
          }}
          className="text-[10px] font-medium text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-tight"
        >
          Mark all read
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          <div className="divide-y divide-white/5">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`w-full p-4 flex gap-3 text-left hover:bg-white/[0.03] transition-colors relative group
                  ${!n.is_read ? 'bg-white/[0.02]' : ''}`}
              >
                {!n.is_read && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r-full" />
                )}
                
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0 py-0.5">
                  <p className={`text-xs leading-relaxed mb-1 ${!n.is_read ? 'text-white font-medium' : 'text-white/60'}`}>
                    {n.message}
                  </p>
                  <p className="text-[10px] text-white/30 font-medium">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>

                {!n.is_read && (
                  <div className="flex-shrink-0 self-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600 shadow-[0_0_10px_rgba(142,132,173,0.5)]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white/20" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-white/20 italic font-medium leading-relaxed">
                You're in the silence.
              </p>
              <p className="text-xs text-white/10 italic">
                No notifications yet.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 bg-white/[0.01] border-t border-white/5 text-center">
          <p className="text-[9px] text-white/20 uppercase tracking-[0.2em]">End of resonance</p>
        </div>
      )}
    </motion.div>
  );
}
