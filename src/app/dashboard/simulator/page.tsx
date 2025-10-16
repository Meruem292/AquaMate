'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/firebase/useUser';
import { getDevices, addDummyDeviceData } from '@/lib/firebase/firestore';
import { Device } from '@/lib/validation/device';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TestTube } from 'lucide-react';

export default function SimulatorPage() {
  const { user, isLoading: userLoading } = useUser();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleSimulate = async (deviceId: string) => {
    if (!user) return;
    setIsSimulating(deviceId);
    try {
      await addDummyDeviceData(user.uid, deviceId);
      toast({
        title: 'Success',
        description: `Dummy data sent for device ${deviceId}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to send dummy data.',
        variant: 'destructive',
      });
    }
    setIsSimulating(null);
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
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Device Data Simulator
      </h1>
      {devices.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <Card key={device.id} className="shadow-lg">
              <CardHeader>
                <CardTitle>{device.name}</CardTitle>
                <p className="text-sm text-muted-foreground">ID: {device.id}</p>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => handleSimulate(device.id)}
                  disabled={!!isSimulating}
                >
                  {isSimulating === device.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="mr-2 h-4 w-4" />
                  )}
                  Generate Data
                </Button>
              </CardContent>
            </Card>
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
    </main>
  );
}
