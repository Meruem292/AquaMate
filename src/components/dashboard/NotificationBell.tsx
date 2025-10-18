
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/firebase/useUser';
import { getNotifications, markAllNotificationsAsRead } from '@/lib/firebase/firestore';
import { Notification } from '@/lib/validation/device';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, CheckCheck } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function NotificationItem({ notification }: { notification: Notification }) {
    const isCritical = notification.parameter === 'Ammonia' || notification.value > 9 || notification.value < 6;
    return (
        <div className="flex items-start gap-4 p-4 hover:bg-muted/50">
            <AlertCircle className={cn("h-5 w-5 mt-1", isCritical ? 'text-destructive' : 'text-amber-500')} />
            <div className="grid gap-1">
                <p className="font-semibold">{notification.deviceName}: High {notification.parameter}</p>
                <p className="text-sm text-muted-foreground">
                    Reading of <span className="font-bold">{notification.value}</span> is outside the set range of {notification.range}.
                </p>
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                </p>
            </div>
        </div>
    );
}


export function NotificationBell() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const unsubscribe = getNotifications(user.uid, setNotifications);
      return () => unsubscribe();
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      await markAllNotificationsAsRead(user.uid);
       toast({
        title: 'Success',
        description: 'All notifications marked as read.',
      });
    } catch (error) {
       toast({
        title: 'Error',
        description: 'Could not mark notifications as read.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[450px] p-0">
        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
            <div className="grid gap-1">
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription className="text-xs">{unreadCount} unread notifications.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
            </Button>
          </CardHeader>
          <CardContent className="p-0 max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
                <div className="divide-y">
                    {notifications.slice(0, 10).map(notification => 
                        <NotificationItem key={notification.id} notification={notification} />
                    )}
                </div>
            ) : (
                <div className="p-8 text-center text-muted-foreground">
                    <p>No new notifications.</p>
                </div>
            )}
          </CardContent>
          <div className="border-t text-center py-2">
             <Button variant="link" asChild className="text-sm">
                <Link href="/dashboard/notifications" onClick={() => setIsPopoverOpen(false)}>
                    View All Notifications
                </Link>
             </Button>
          </div>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
