
'use client';

import { useState, useEffect, use } from 'react';
import * as React from 'react';
import { useUser } from '@/lib/firebase/useUser';
import { getDevice, getDeviceDataHistory } from '@/lib/firebase/firestore';
import { Device, DeviceData } from '@/lib/validation/device';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, isValid, startOfDay, endOfDay } from 'date-fns';
import { Loader2, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export default function DeviceDetailsPage({
  params,
}: {
  params: Promise<{ deviceId: string }>;
}) {
  const { deviceId } = use(params);
  const { user, isLoading: userLoading } = useUser();
  const [device, setDevice] = useState<Device | null>(null);
  const [history, setHistory] = useState<DeviceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for date range filtering
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    to: endOfDay(new Date()),
  });

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user) {
      getDevice(user.uid, deviceId, (deviceDetails) => {
        setDevice(deviceDetails);
      });

      const unsubscribe = getDeviceDataHistory(deviceId, (dataHistory) => {
        setHistory(dataHistory.sort((a, b) => b.timestamp - a.timestamp)); // Sort descending
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else if (!userLoading) {
      setIsLoading(false);
    }
  }, [user, userLoading, deviceId]);

  const filteredHistory = history.filter((d) => {
    if (!date?.from || !date?.to) return true;
    const timestampDate = new Date(d.timestamp * 1000);
    return timestampDate >= date.from && timestampDate <= date.to;
  });

  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

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


  if (userLoading || isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-4">
        <p className="text-xl text-muted-foreground">Device not found.</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  // Chart data should be from filtered history, but not paginated
  // Also, let's sort it ascending for the chart
  const chartData = [...filteredHistory].reverse().map((d) => {
    const date = new Date(d.timestamp * 1000);
    return {
      ...d,
      timestamp: isValid(date) ? format(date, 'MMM d, HH:mm') : 'Invalid Date',
    }
  });


  return (
    <main className="flex-grow p-4 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {device.name}
          </h1>
          <p className="text-sm text-muted-foreground">ID: {device.id}</p>
        </div>
      </div>

      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle>Sensor Data History</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredHistory.length > 1 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ph"
                  stroke="hsl(var(--chart-1))"
                  name="pH Level"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="hsl(var(--chart-2))"
                  name="Temperature (°C)"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="ammonia"
                  stroke="hsl(var(--chart-3))"
                  name="Ammonia (ppm)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex h-[400px] items-center justify-center text-muted-foreground">
               <p>Not enough data to display a chart for the selected range.</p>
             </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Data Readings</CardTitle>
           <div className="flex items-center gap-4 pt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[300px] justify-start text-left font-normal",
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
                <TableHead>Timestamp</TableHead>
                <TableHead>pH Level</TableHead>
                <TableHead>Temperature (°C)</TableHead>
                <TableHead>Ammonia (ppm)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedHistory.length > 0 ? (
                paginatedHistory.map((data, index) => (
                  <TableRow key={`${data.timestamp}-${index}`}>
                    <TableCell>
                      {isValid(new Date(data.timestamp * 1000)) ? format(new Date(data.timestamp * 1000), 'PPpp') : 'Invalid Date'}
                    </TableCell>
                    <TableCell>{typeof data.ph === 'number' ? data.ph.toFixed(1) : 'N/A'}</TableCell>
                    <TableCell>{typeof data.temperature === 'number' ? data.temperature.toFixed(1) : 'N/A'}</TableCell>
                    <TableCell>{typeof data.ammonia === 'number' ? data.ammonia.toFixed(2) : 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    No data readings found for the selected date range.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between mt-4">
            <Button onClick={handlePreviousPage} disabled={currentPage === 1}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button onClick={handleNextPage} disabled={currentPage === totalPages}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
