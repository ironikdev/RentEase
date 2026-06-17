import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Heart } from 'lucide-react';
import { useAuth } from '../../store/useAuth';
import { useNotifications } from '../../store/useNotifications';

const formatRelativeTime = (isoString) => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
};

export default function NotificationBell() {
  const { profile } = useAuth();
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAllNotifications 
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const storageKey = profile ? `rentease_notifications_${profile.id}` : 'rentease_notifications_anon';
  const list = notifications[storageKey] || [];
  const unreadCount = list.filter(n => !n.read).length;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n) => {
    markAsRead(n.id, profile?.id);
    setIsOpen(false);
    navigate(`/properties/${n.propertyId}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full border bg-brand-section transition-all duration-200 hover:scale-105 hover:bg-brand-surface group ${
          isOpen ? 'border-brand-green text-brand-green' : 'border-brand-border text-brand-secondary hover:border-brand-green/40'
        }`}
        title="Notifications"
        id="notification-bell-btn"
      >
        <Bell size={18} className="transition-transform group-hover:rotate-12" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-error px-1 text-[9px] font-bold text-white ring-2 ring-brand-section animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 bg-brand-section border border-brand-border rounded-xl shadow-2xl z-[1050] overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand-bg/50 border-b border-brand-border">
            <span className="font-bold font-sans text-xs uppercase tracking-wider text-brand-text">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead(profile?.id)}
                className="text-[10px] font-semibold text-brand-green hover:underline flex items-center gap-0.5"
              >
                <Check size={10} /> Mark all read
              </button>
            )}
          </div>

          {/* List Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-brand-border/60">
            {list.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell size={24} className="text-brand-secondary/40 mx-auto" />
                <p className="text-xs text-brand-secondary font-medium">No notifications yet</p>
                <p className="text-[10px] text-brand-secondary/80 max-w-[200px] mx-auto leading-normal">
                  Alerts regarding your wishlisted properties will appear here.
                </p>
              </div>
            ) : (
              list.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex gap-2.5 items-start transition-colors relative group/item cursor-pointer hover:bg-brand-surface/40 ${
                    !n.read ? 'bg-brand-surface/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  {/* Status Indicator Dot */}
                  {!n.read && (
                    <span className="absolute top-4 right-3.5 w-2 h-2 rounded-full bg-brand-green shadow-sm shadow-brand-green/50" />
                  )}

                  {/* Icon Column */}
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 border ${
                    n.title.toLowerCase().includes('available')
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-brand-green'
                      : 'bg-brand-surface border-brand-border text-brand-secondary'
                  }`}>
                    <Heart size={14} fill={n.title.toLowerCase().includes('available') ? 'currentColor' : 'none'} />
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 space-y-1 pr-4">
                    <h5 className="font-bold text-xs text-brand-text leading-tight">
                      {n.title}
                    </h5>
                    <p className="text-[11px] text-brand-secondary leading-normal">
                      {n.message}
                    </p>
                    <span className="block text-[9px] text-brand-secondary/80">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>

                  {/* Clear single item button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(n.id, profile?.id);
                    }}
                    className="absolute bottom-2.5 right-2 text-brand-secondary/40 hover:text-brand-error opacity-0 group-hover/item:opacity-100 p-1 rounded transition-all"
                    title="Remove notification"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer actions */}
          {list.length > 0 && (
            <div className="px-4 py-2 border-t border-brand-border bg-brand-bg/30 text-center">
              <button
                onClick={() => clearAllNotifications(profile?.id)}
                className="text-[10px] font-bold text-brand-secondary hover:text-brand-error uppercase tracking-wider transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
