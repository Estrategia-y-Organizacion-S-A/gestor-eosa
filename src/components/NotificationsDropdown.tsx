import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { clsx } from 'clsx';

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-red rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-brand-red hover:text-[#A31C30] font-medium"
              >
                Marcar todas leídas
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 text-gray-300" />
                <p className="text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={clsx(
                      'p-4 transition-colors group',
                      n.read ? 'bg-white' : 'bg-brand-red/5'
                    )}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 cursor-pointer" onClick={() => markAsRead(n.id)}>
                        <h4 className={clsx('text-sm mb-0.5', n.read ? 'font-medium text-gray-700' : 'font-bold text-gray-900')}>{n.title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-gray-400 mt-2 block">
                          {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.read && (
                          <button onClick={() => markAsRead(n.id)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md" title="Marcar como leída">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => deleteNotification(n.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
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
