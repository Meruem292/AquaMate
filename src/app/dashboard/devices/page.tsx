'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/firebase/useUser';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  addDevice,
  deleteDevice,
  getDevices,
  updateDevice,
} from '@/lib/firebase/firestore';
import { Loader2, PlusCircle, Trash2, Edit } from 'lucide-react';
import { Device, deviceSchema } from '@/lib/validation/device';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function DeviceManagementPage() {
  const { user, isLoading: userLoading } = useUser();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
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

  const handleAddDevice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const newDeviceData = {
      id: formData.get('deviceId') as string,
      name: formData.get('deviceName') as string,
    };

    const validation = deviceSchema.safeParse(newDeviceData);
    if (!validation.success) {
      toast({
        title: 'Invalid Input',
        description: validation.error.errors.map((e) => e.message).join(', '),
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await addDevice(user.uid, validation.data);
      toast({
        title: 'Success',
        description: 'Device added successfully.',
      });
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || 'There was an error adding the device.',
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };

  const handleEditDevice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !editingDevice) return;
    setIsSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const updatedData = {
      id: editingDevice.id, // ID is not editable, so we keep the original
      name: formData.get('deviceName') as string,
    };

    const validation = deviceSchema.safeParse(updatedData);

    if (!validation.success) {
      toast({
        title: 'Invalid Input',
        description: validation.error.errors.map((e) => e.message).join(', '),
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      await updateDevice(user.uid, validation.data);
      toast({
        title: 'Success',
        description: 'Device updated successfully.',
      });
      setEditingDevice(null);
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || 'There was an error updating the device.',
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!user) return;
    try {
      await deleteDevice(user.uid, deviceId);
      toast({
        title: 'Success',
        description: 'Device deleted successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || 'There was an error deleting the device.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (device: Device) => {
    setEditingDevice(device);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingDevice(null);
    setIsDialogOpen(true);
  };

  const DeviceForm = ({
    onSubmit,
    device,
  }: {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    device: Device | null;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        name="deviceId"
        placeholder="Device ID"
        defaultValue={device?.id || ''}
        required
        disabled={!!device}
      />
      <Input
        name="deviceName"
        placeholder="Device Name"
        defaultValue={device?.name || ''}
        required
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {device ? 'Save Changes' : 'Add Device'}
      </Button>
    </form>
  );

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Device Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Device
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingDevice ? 'Edit Device' : 'Add New Device'}
              </DialogTitle>
            </DialogHeader>
            <DeviceForm
              onSubmit={editingDevice ? handleEditDevice : handleAddDevice}
              device={editingDevice}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device ID</TableHead>
              <TableHead>Device Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.length > 0 ? (
              devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>{device.id}</TableCell>
                  <TableCell>{device.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(device)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the device.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDevice(device.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No devices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
