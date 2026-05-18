'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ShoppingBag, MessageSquare, User, Heart, UserPlus, PenTool } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getNotifications, markAsRead, markAllAsRead } from '@/app/actions/notifications';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface NotificationBellProps {
    user: SupabaseUser | null;
}

export function NotificationBell({ user }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const t = useTranslations();

    const getMessage = (notification: any) => {
        try {
            // Try to parse JSON message
            const data = JSON.parse(notification.message);
            if (data.key) {
                if (data.key === 'review' && data.params.hasPhoto) {
                    return t('notifications.reviewWithPhoto', data.params);
                }
                return t(`notifications.${data.key}`, data.params);
            }
        } catch (e) {
            // Not JSON, return as is (legacy support)
            return notification.message;
        }
        return notification.message;
    };

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const data = await getNotifications();
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter((n: any) => !n.is_read).length);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchNotifications();

        // Subscribe to real-time changes if Supabase Realtime is enabled
        const supabase = createClient();
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    setNotifications(prev => [payload.new, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-brown-600 hover:bg-cream-100 hover:text-rose-500 transition-colors"
                aria-label={t('notifications.title')}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-3xl shadow-xl border border-tan-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-tan-100 flex items-center justify-between bg-cream-50/50">
                        <h3 className="font-bold text-brown-700">{t('notifications.title')}</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                {t('notifications.markAllRead')}
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-brown-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">{t('notifications.empty')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-tan-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleMarkAsRead(notification.id, notification.is_read)}
                                        className={`p-4 flex gap-3 hover:bg-cream-50/50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-rose-50/30' : ''
                                            }`}
                                    >
                                        <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                            notification.type === 'like' ? 'bg-rose-100 text-rose-500' :
                                            notification.type === 'follow' ? 'bg-sky-100 text-sky-500' :
                                            notification.type === 'comment' || notification.type === 'reply' ? 'bg-amber-100 text-amber-600' :
                                            notification.type === 'new_post' ? 'bg-emerald-100 text-emerald-600' :
                                            notification.type === 'purchase' ? 'bg-sage-100 text-sage-500' :
                                                'bg-tan-100 text-brown-500'
                                            }`}>
                                            {notification.type === 'like' ? <Heart className="w-4 h-4" /> :
                                                notification.type === 'follow' ? <UserPlus className="w-4 h-4" /> :
                                                notification.type === 'comment' || notification.type === 'reply' ? <MessageSquare className="w-4 h-4" /> :
                                                notification.type === 'new_post' ? <PenTool className="w-4 h-4" /> :
                                                notification.type === 'purchase' ? <ShoppingBag className="w-4 h-4" /> :
                                                    <User className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-brown-800 leading-snug">
                                                {getMessage(notification)}
                                            </p>
                                            <p className="text-xs text-brown-400 mt-1">
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="flex-shrink-0 mt-2">
                                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
