import { useState } from 'react'
import { Bell, CheckCircle2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/store/uiStore'

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const notifications = useUiStore((state) => state.notifications)
  const dismissNotification = useUiStore((state) => state.dismissNotification)

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="size-4" aria-hidden="true" />
      </Button>
      {notifications.length > 0 ? (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-pink text-[10px] font-semibold text-pink-foreground">
          {notifications.length}
        </span>
      ) : null}

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] rounded-lg border bg-popover p-3 text-popover-foreground shadow-elevated">
          <div className="flex items-center justify-between gap-3 px-1 pb-2">
            <p className="text-sm font-semibold">Notifications</p>
            <Badge variant="outline">{notifications.length}</Badge>
          </div>
          <div className="grid gap-2">
            {notifications.length === 0 ? (
              <div className="rounded-md border bg-background p-4 text-sm text-secondary-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="rounded-md border bg-background p-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{notification.title}</p>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-secondary-foreground">{notification.body}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label="Dismiss notification"
                      onClick={() => dismissNotification(notification.id)}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
