
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/firebase/useUser';
import { getDevices, onDeviceDataUpdate } from '@/lib/firebase/firestore';
import { Device, DeviceData } from '@/lib/validation/device';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function DeviceCard({ device, index }: { device: Device; index: number }) {
  const { user } = useUser();
  const [data, setData] = useState<DeviceData | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // This listener is for UI updates ONLY.
    const unsubscribeFromData = onDeviceDataUpdate(device.id, (latestData) => {
      setData(latestData);
    });

    // This will be called when the component unmounts
    return () => {
        unsubscribeFromData();
    };
  }, [device.id, user]);
  
  const cardColors = [
    "bg-teal-900/20 hover:bg-teal-900/30 border-teal-700/40",
    "bg-cyan-900/20 hover:bg-cyan-900/30 border-cyan-700/40",
    "bg-sky-900/20 hover:bg-sky-900/30 border-sky-700/40",
    "bg-blue-900/20 hover:bg-blue-900/30 border-blue-700/40",
    "bg-indigo-900/20 hover:bg-indigo-900/30 border-indigo-700/40",
    "bg-violet-900/20 hover:bg-violet-900/30 border-violet-700/40",
  ]

  const colorClass = cardColors[index % cardColors.length];


  return (
    <Link href={`/dashboard/devices/${device.id}`}>
      <Card className={cn("shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl", colorClass)}>
        <CardHeader>
          <CardTitle className="text-xl">{device.name}</CardTitle>
          <p className="text-sm text-muted-foreground break-all">ID: {device.id}</p>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">pH Level</span>
            <span className="text-2xl font-bold">
              {data && typeof data.ph === 'number' ? (
                data.ph.toFixed(1)
              ) : (
                <Loader2 className="h-6 w-6 animate-spin inline-block" />
              )}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Temperature</span>
            <span className="text-2xl font-bold">
              {data && typeof data.temperature === 'number' ? (
                `${data.temperature.toFixed(1)}°C`
              ) : (
                <Loader2 className="h-6 w-6 animate-spin inline-block" />
              )}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Ammonia</span>
            <span className="text-2xl font-bold">
              {data && typeof data.ammonia === 'number' ? (
                `${data.ammonia.toFixed(2)}`
              ) : (
                <Loader2 className="h-6 w-6 animate-spin inline-block" />
              )}
            </span>
             <span className="text-xs text-muted-foreground -mt-1">ppm</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useUser();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const unsubscribe = getDevices(user.uid, (devices) => {
        setDevices(devices);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else if (!userLoading) {
      setIsLoading(false);
    }
  }, [user, userLoading]);

  if (userLoading || isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto flex-grow p-4 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Device Dashboard
      </h1>
      {devices.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device, index) => (
            <DeviceCard key={device.id} device={device} index={index} />
          ))}
        </div>
      ) : (
        <Card className="w-full text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">No Devices Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Please go to the 'Device Management' page to add a new device.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
