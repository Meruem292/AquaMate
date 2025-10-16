'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/firebase/useUser';
import { getNotifications, markAllNotificationsAsRead } from '@/lib/firebase/firestore';
import { Notification } from '@/lib/validation/device';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';


export default function NotificationsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const unsubscribe = getNotifications(user.uid, (data) => {
        setNotifications(data);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else if (!userLoading) {
      setIsLoading(false);
    }
  }, [user, userLoading]);
  
  const handleMarkAllRead = async () => {
    if (!user) return;
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

  if (userLoading || isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex-grow p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">History of all alerts from your devices.</p>
        </div>
        <Button onClick={handleMarkAllRead}>
            <CheckCheck className="mr-2" /> Mark all as read
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Parameter</TableHead>
                <TableHead>Reading</TableHead>
                <TableHead>Ideal Range</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <TableRow key={notif.id} className={cn(!notif.read && 'bg-accent/50 font-semibold')}>
                    <TableCell>
                      {!notif.read ? (
                          <Badge>New</Badge>
                      ) : (
                          <Badge variant="outline">Read</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{notif.deviceName}</span>
                        <span className="text-xs text-muted-foreground font-mono">{notif.deviceId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                           <AlertCircle className={cn('h-4 w-4', notif.parameter === 'Ammonia' ? 'text-destructive' : 'text-amber-500')} />
                           {notif.parameter}
                        </div>
                    </TableCell>
                    <TableCell>{notif.value.toFixed(2)} ({notif.threshold})</TableCell>
                    <TableCell>{notif.range}</TableCell>
                    <TableCell>{format(new Date(notif.timestamp * 1000), 'PPpp')}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-48">
                    <p className="text-xl text-muted-foreground">No notifications yet!</p>
                    <p>All your device alerts will appear here.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
