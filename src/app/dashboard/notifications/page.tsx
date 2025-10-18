
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/lib/firebase/useUser';
import { getNotifications, markAllNotificationsAsRead } from '@/lib/firebase/firestore';
import { Notification } from '@/lib/validation/device';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCheck, Calendar as CalendarIcon, Search } from 'lucide-react';
import { format, startOfDay, endOfDay, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';

export default function NotificationsPage() {
  const { user, isLoading: userLoading } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // Default to last 7 days
    to: endOfDay(new Date()),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Date filter
      const timestampDate = new Date(notif.timestamp * 1000);
      if (date?.from && timestampDate < date.from) return false;
      if (date?.to && timestampDate > date.to) return false;

      // Search query filter
      if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        const fullText = `${notif.deviceName} ${notif.deviceId} ${notif.parameter} ${notif.issue} ${notif.value}`.toLowerCase();
        if (!fullText.includes(lowercasedQuery)) {
          return false;
        }
      }
      return true;
    });
  }, [notifications, searchQuery, date]);

  const paginatedNotifications = useMemo(() => {
    return filteredNotifications.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredNotifications, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  useEffect(() => {
    // Reset to page 1 whenever filters change
    setCurrentPage(1);
  }, [searchQuery, date]);


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
  };

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
        <Button onClick={handleMarkAllRead} disabled={notifications.filter(n => !n.read).length === 0}>
          <CheckCheck className="mr-2" /> Mark all as read
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
           <div className="flex flex-col md:flex-row items-center gap-4">
             <div className="relative w-full md:w-1/2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
             </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-auto justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedNotifications.length > 0 ? (
                paginatedNotifications.map((notif) => (
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
                           <AlertCircle className={cn('h-4 w-4 shrink-0', notif.parameter.toLowerCase() === 'ammonia' ? 'text-destructive' : 'text-amber-500')} />
                           <p>
                              High <span className="font-bold">{notif.parameter}</span> reading of <span className="font-bold">{notif.value.toFixed(2)}</span>. {notif.issue}. Ideal range is {notif.range}.
                           </p>
                        </div>
                    </TableCell>
                    <TableCell>
                      {isValid(new Date(notif.timestamp * 1000)) ? format(new Date(notif.timestamp * 1000), 'PPpp') : 'Invalid Date'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-48">
                    <p className="text-xl text-muted-foreground">No notifications found.</p>
                    <p>Adjust your search or date range to find alerts.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
           {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button onClick={handlePreviousPage} disabled={currentPage === 1} variant="outline">
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline">
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
