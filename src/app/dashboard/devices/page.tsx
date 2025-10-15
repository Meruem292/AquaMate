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
  DialogDescription,
  DialogFooter
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
import { Loader2, PlusCircle, Trash2, Edit, MoreHorizontal } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


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
    <form onSubmit={onSubmit} className="grid gap-4 py-4">
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
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {device ? 'Save Changes' : 'Add Device'}
        </Button>
      </DialogFooter>
    </form>
  );

  if (userLoading || isLoading) {
     return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Device Management</h2>
          <p className="text-muted-foreground">Manage your AquaMate monitoring devices.</p>
        </div>
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
              <DialogDescription>
                {editingDevice ? 'Update the details of your existing device.' : 'Add a new device to your account to start monitoring.'}
              </DialogDescription>
            </DialogHeader>
            <DeviceForm
              onSubmit={editingDevice ? handleEditDevice : handleAddDevice}
              device={editingDevice}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
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
                    <TableCell className="font-mono">{device.id}</TableCell>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => openEditDialog(device)}>
                            <Edit className="mr-2" /> Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="mr-2 text-destructive" /> 
                                <span className="text-destructive">Delete</span>
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently
                                  delete the device and all its data.
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">
                    No devices found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
