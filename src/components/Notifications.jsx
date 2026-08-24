import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      console.log('✅ Notification API is supported');
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('🔔 Notification permission:', permission);
        });
      } else {
        console.log('🔔 Notification permission status:', Notification.permission);
      }
    } else {
      console.log('❌ Notification API is NOT supported');
    }
  }, []);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.value = 800;
      osc1.type = 'sine';
      gain1.gain.value = 0.4;
      
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.value = 0.3;
      
      osc1.start();
      osc2.start(0.15);
      osc1.stop(0.2);
      osc2.stop(0.35);
      
      setTimeout(() => {
        audioCtx.close();
      }, 400);
      
      console.log('🔊 Sound played!');
    } catch (err) {
      console.log('🔇 Sound error:', err);
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(0.15);
        setTimeout(() => audioCtx.close(), 200);
      } catch (e) {
        console.log('🔇 Fallback sound failed:', e);
      }
    }
  };

  const sendSystemNotification = (title, body) => {
    try {
      if (!('Notification' in window)) {
        console.log('⚠️ Notifications not supported');
        return;
      }

      if (Notification.permission === 'granted') {
        playNotificationSound();
        
        setTimeout(() => {
          const notification = new Notification(title, {
            body: body,
            icon: '/logo.png',
            silent: true,
            tag: 'notification-tag-' + Date.now(),
            requireInteraction: true,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };

          setTimeout(() => {
            notification.close();
          }, 8000);

          console.log('🔔 System notification sent');
        }, 100);
      } else if (Notification.permission === 'denied') {
        console.log('⚠️ Notifications blocked by user');
      } else {
        console.log('⚠️ Notification permission not granted');
        Notification.requestPermission();
      }
    } catch (err) {
      console.log('🔇 Notification error:', err);
    }
  };

  const triggerNotification = (title, message) => {
    console.log('🔔 Triggering notification:', title, message);
    playNotificationSound();
    sendSystemNotification(title, message);
  };

  useEffect(() => {
    checkUserAndLoad();

    const interval = setInterval(() => {
      if (userId) {
        console.log('🔄 Auto-refreshing notifications...');
        loadNotifications(userId, true);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, [userId]);

  const checkUserAndLoad = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }

      setUserId(userData.user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userData.user.id)
        .single();

      const admin = profile?.role === 'admin' || profile?.role === 'super_admin';
      setIsAdmin(admin);
      
      await loadNotifications(userData.user.id, true);

      let channelFilter = `user_id=eq.${userData.user.id}`;
      
      if (admin) {
        channelFilter = `user_id=neq.00000000-0000-0000-0000-000000000000`;
        console.log('👑 Admin mode: Listening to all notifications');
      } else {
        console.log('👤 User mode: Listening to personal notifications');
      }

      const channel = supabase
        .channel('notifications-channel-' + userData.user.id)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: channelFilter,
          },
          (payload) => {
            const newNotif = payload.new;
            console.log('🔔 New notification (realtime):', newNotif);

            triggerNotification(newNotif.title, newNotif.message);

            setNotifications((prev) => [newNotif, ...prev]);
            if (!newNotif.is_read) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
        });

      return () => {
        channel.unsubscribe();
      };
    } catch (err) {
      console.log('Error:', err);
      setLoading(false);
    }
  };

  const loadNotifications = async (uid, silent = false) => {
    setLoading(true);
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (isAdmin) {
        console.log('🔍 Admin: Loading all notifications');
      } else {
        console.log('🔍 User: Loading notifications for user:', uid);
        query = query.eq('user_id', uid);
      }

      const { data, error } = await query;

      if (error) {
        console.log('Error loading notifications:', error);
        setNotifications([]);
        setLoading(false);
        return;
      }

      const newUnread = data?.filter(n => !n.is_read && !notifications.some(old => old.id === n.id));
      if (newUnread && newUnread.length > 0 && !silent) {
        const latest = newUnread[0];
        triggerNotification(latest.title, latest.message);
      }

      console.log('📋 Loaded notifications:', data);
      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (err) {
      console.log('Error:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.log('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.log('Error marking all as read:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_booking': return '📅';
      case 'status_change': return '🔄';
      case 'extension_approved': return '✅';
      case 'extension_rejected': return '❌';
      case 'extension_request': return '📝';
      case 'admin_message': return '📩';
      case 'booking_confirmed': return '✅';
      case 'booking_cancelled': return '❌';
      case 'booking_completed': return '🏁';
      case 'booking_expired': return '⚠️';
      case 'new_user': return '👤';
      case 'welcome': return '👋';
      default: return '🔔';
    }
  };

  const getTimeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
  };

  return (
    <div className="notifications-wrapper">
      <button
        className="notifications-bell"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notifications-list">
            {loading ? (
              <div className="notification-item">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-item empty">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <span className="notification-icon">{getIcon(n.type)}</span>
                  <div className="notification-content">
                    <div className="notification-title">{n.title}</div>
                    <div className="notification-message">{n.message}</div>
                    <div className="notification-time">{getTimeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;