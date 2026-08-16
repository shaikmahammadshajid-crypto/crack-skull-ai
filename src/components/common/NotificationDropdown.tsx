import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCheck, Trash2, X, AlertCircle, Flame, Target } from 'lucide-react';

export const NotificationDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications, setActiveTab } = useApp();

  const getIcon = (type: string) => {
    switch (type) {
      case 'exam_alert':
        return <AlertCircle size={16} className="text-pink-400" />;
      case 'streak':
        return <Flame size={16} className="text-amber-400" />;
      case 'weak_topic':
        return <AlertCircle size={16} className="text-orange-400" />;
      default:
        return <Target size={16} className="text-purple-400" />;
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-purple-400" />
          <span className="text-xs font-bold font-heading text-white uppercase tracking-wider">
            Academic Alerts
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 my-1">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No new notifications. You are all caught up!
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => {
                markNotificationRead(notif.id);
                if (notif.actionUrl) {
                  setActiveTab(notif.actionUrl as any);
                  onClose();
                }
              }}
              className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                notif.isRead ? 'opacity-60 hover:bg-slate-800/40' : 'bg-purple-950/20 hover:bg-purple-900/30'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="p-1 rounded-lg bg-slate-800/80 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs font-semibold text-white leading-snug">
                    {notif.title}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    {notif.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
