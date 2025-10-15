
'use client';

import { useState, useEffect } from 'react';
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
import { format } from 'date-fns';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DeviceDetailsPage({
  params,
}: {
  params: { deviceId: string };
}) {
  const { user, isLoading: userLoading } = useUser();
  const { deviceId } = params;
  const [device, setDevice] = useState<Device | null>(null);
  const [history, setHistory] = useState<DeviceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getDevice(user.uid, deviceId, (deviceDetails) => {
        setDevice(deviceDetails);
      });

      const unsubscribe = getDeviceDataHistory(deviceId, (dataHistory) => {
        setHistory(dataHistory);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else if (!userLoading) {
      setIsLoading(false);
    }
  }, [user, userLoading, deviceId]);

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

  const chartData = history.map((d) => ({
    ...d,
    timestamp: format(new Date(d.timestamp), 'MMM d, HH:mm'),
  }));

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
          {history.length > 1 ? (
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
               <p>Not enough data to display a chart. Please generate more data.</p>
             </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Data Readings</CardTitle>
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
              {history.length > 0 ? (
                [...history].reverse().map((data) => (
                  <TableRow key={data.timestamp}>
                    <TableCell>
                      {format(new Date(data.timestamp), 'PPpp')}
                    </TableCell>
                    <TableCell>{data.ph.toFixed(1)}</TableCell>
                    <TableCell>{data.temperature.toFixed(1)}</TableCell>
                    <TableCell>{data.ammonia.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No data readings found.
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
