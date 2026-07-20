import { useState, useRef, useEffect } from 'react'
import { FiBell } from 'react-icons/fi'
import { useNotifications } from '../../hooks/useNotifications'

function getNotificationIcon(type) {
  switch (type) {
    case 'transfer_received':
      return { icon: '📥', color: 'text-cyan-400' }
    case 'transfer_downloaded':
      return { icon: '⬇️', color: 'text-blue-400' }
    case 'transfer_expired':
      return { icon: '⏰', color: 'text-red-400' }
    case 'transfer_deleted':
      return { icon: '🗑️', color: 'text-gray-400' }
    default:
      return { icon: '🔔', color: 'text-gray-400' }
  }
}

function timeAgo(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <FiBell className="text-lg" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-500 text-sm">Loading...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <FiBell className="text-gray-600 text-3xl mx-auto mb-3" />
                <div className="text-gray-500 text-sm">No notifications yet</div>
              </div>
            ) : (
              notifications.map((notification) => {
                const { icon, color } = getNotificationIcon(notification.type)
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-b border-gray-800/50 cursor-pointer transition-colors hover:bg-gray-800/50 ${
                      !notification.read ? 'bg-gray-800/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <span className={`text-base flex-shrink-0 mt-0.5 ${color}`}>
                        {icon}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-snug ${
                              !notification.read
                                ? 'text-white font-medium'
                                : 'text-gray-400'
                            }`}
                          >
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {notification.transfer_code && (
                            <span className="text-xs text-gray-500 font-mono">
                              {notification.transfer_code}
                            </span>
                          )}
                          <span className="text-xs text-gray-600">
                            {timeAgo(notification.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
