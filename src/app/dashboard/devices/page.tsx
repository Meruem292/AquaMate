
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Loader2, PlusCircle, Trash2, Edit, MoreHorizontal, Phone, Search, Timer, ChevronDown } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


function DeviceRow({ device, onEdit, onDelete }: { device: Device; onEdit: (device: Device) => void; onDelete: (deviceId: string) => void; }) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!isMobile) {
    return (
      <TableRow key={device.id}>
        <TableCell className="font-mono whitespace-nowrap">{device.id}</TableCell>
        <TableCell className="font-medium whitespace-nowrap">{device.name}</TableCell>
        <TableCell className="whitespace-nowrap">{device.phone || 'N/A'}</TableCell>
        <TableCell>{device.phMin}-{device.phMax}</TableCell>
        <TableCell>{device.tempMin}-{device.tempMax}</TableCell>
        <TableCell>&lt; {device.ammoniaMax}</TableCell>
        <TableCell>{device.alertInterval}s</TableCell>
        <TableCell className="text-right">
          <DeviceActions device={device} onEdit={onEdit} onDelete={onDelete} />
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Collapsible asChild key={device.id} onOpenChange={setIsOpen}>
      <>
        <TableRow className="border-b-0">
          <TableCell colSpan={2} className="p-0">
             <div className="flex items-center">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-12">
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    <span className="sr-only">Toggle details for {device.name}</span>
                  </Button>
                </CollapsibleTrigger>
                <div className="py-4">
                  <p className="font-medium">{device.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{device.id}</p>
                </div>
            </div>
          </TableCell>
          <TableCell className="text-right p-0 pr-2">
            <DeviceActions device={device} onEdit={onEdit} onDelete={onDelete} />
          </TableCell>
        </TableRow>
        <CollapsibleContent asChild>
          <tr className="bg-muted/50">
            <td colSpan={3} className="p-0">
              <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="font-semibold">Phone:</div>
                <div>{device.phone || 'N/A'}</div>

                <div className="font-semibold">pH Range:</div>
                <div>{device.phMin} - {device.phMax}</div>

                <div className="font-semibold">Temp Range:</div>
                <div>{device.tempMin}°C - {device.tempMax}°C</div>

                <div className="font-semibold">Max Ammonia:</div>
                <div>&lt; {device.ammoniaMax} ppm</div>

                <div className="font-semibold">Alert Interval:</div>
                <div>{device.alertInterval}s</div>
              </div>
            </td>
          </tr>
        </CollapsibleContent>
      </>
    </Collapsible>
  )
}


const DeviceActions = ({ device, onEdit, onDelete }: { device: Device; onEdit: (device: Device) => void; onDelete: (deviceId: string) => void; }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button aria-haspopup="true" size="icon" variant="ghost">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Toggle menu</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem onSelect={() => onEdit(device)}>
        <Edit className="mr-2" /> Edit
      </DropdownMenuItem>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
            <Trash2 className="mr-2" />
            Delete
          </DropdownMenuItem>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the device and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(device.id)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenuContent>
  </DropdownMenu>
);


export default function DeviceManagementPage() {
  const { user, isLoading: userLoading } = useUser();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        const fullText = `${device.name} ${device.id}`.toLowerCase();
        if (!fullText.includes(lowercasedQuery)) {
          return false;
        }
      }
      return true;
    });
  }, [devices, searchQuery]);
  
  useEffect(() => {
    // Reset to page 1 whenever filters change
    setCurrentPage(1);
  }, [searchQuery]);


  const paginatedDevices = useMemo(() => {
    return filteredDevices.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredDevices, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);

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


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>, isEditing: boolean) => {
    event.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    
    const deviceData = {
      id: isEditing ? editingDevice?.id : formData.get('deviceId'),
      name: formData.get('deviceName'),
      phMin: formData.get('phMin'),
      phMax: formData.get('phMax'),
      tempMin: formData.get('tempMin'),
      tempMax: formData.get('tempMax'),
      ammoniaMax: formData.get('ammoniaMax'),
      alertInterval: formData.get('alertInterval'),
      phone: formData.get('phone'),
    };

    const validation = deviceSchema.safeParse(deviceData);
    if (!validation.success) {
      toast({
        title: 'Invalid Input',
        description: validation.error.errors.map((e) => e.message).join('\n'),
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditing) {
        await updateDevice(user.uid, validation.data);
         toast({
          title: 'Success',
          description: 'Device updated successfully.',
        });
      } else {
        await addDevice(user.uid, validation.data);
        toast({
          title: 'Success',
          description: 'Device added successfully.',
        });
      }
      setIsDialogOpen(false);
      setEditingDevice(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || `There was an error ${isEditing ? 'updating' : 'adding'} the device.`,
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
    <form onSubmit={onSubmit} className="grid gap-4 py-4 px-1">
       <div className="grid gap-2">
        <Label htmlFor="deviceId">Device ID</Label>
        <Input
          id="deviceId"
          name="deviceId"
          placeholder="e.g. A0-B1-C2-D3-E4-F5"
          defaultValue={device?.id || ''}
          required
          disabled={!!device}
          className="font-mono"
        />
      </div>
      <div className="grid gap-2">
         <Label htmlFor="deviceName">Device Name</Label>
        <Input
          id="deviceName"
          name="deviceName"
          placeholder="e.g. Main Tank Monitor"
          defaultValue={device?.name || ''}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone Number (for SMS alerts)</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="0912-345-6789"
            defaultValue={device?.phone || ''}
            className="pl-10"
          />
        </div>
      </div>

       <div className="grid gap-2">
        <Label>pH Range</Label>
        <div className="flex items-center gap-2">
          <Input type="number" name="phMin" placeholder="Min" defaultValue={device?.phMin ?? 6.5} required step="0.1" />
          <span className="text-muted-foreground">to</span>
          <Input type="number" name="phMax" placeholder="Max" defaultValue={device?.phMax ?? 8.0} required step="0.1" />
        </div>
      </div>

       <div className="grid gap-2">
        <Label>Temperature Range (°C)</Label>
        <div className="flex items-center gap-2">
          <Input type="number" name="tempMin" placeholder="Min" defaultValue={device?.tempMin ?? 24} required />
          <span className="text-muted-foreground">to</span>
          <Input type="number" name="tempMax" placeholder="Max" defaultValue={device?.tempMax ?? 32} required />
        </div>
      </div>

       <div className="grid gap-2">
        <Label htmlFor="ammoniaMax">Max Ammonia (ppm)</Label>
        <Input id="ammoniaMax" type="number" name="ammoniaMax" placeholder="e.g. 0.5" defaultValue={device?.ammoniaMax ?? 0.5} required step="0.01" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="alertInterval">Alert Interval (seconds)</Label>
         <div className="relative">
          <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input id="alertInterval" type="number" name="alertInterval" placeholder="e.g. 300" defaultValue={device?.alertInterval ?? 300} required step="1" className="pl-10" />
        </div>
        <p className="text-xs text-muted-foreground">Time to wait before sending another alert for the same parameter.</p>
      </div>


      <DialogFooter className="pt-4 pr-1">
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
    <div className="container mx-auto flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Device Management</h2>
          <p className="text-muted-foreground">Manage your AquaMate monitoring devices.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) setEditingDevice(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
             <DialogHeader>
              <DialogTitle>
                {editingDevice ? 'Edit Device' : 'Add New Device'}
              </DialogTitle>
              <DialogDescription>
                {editingDevice ? 'Update the details and ideal ranges for your device.' : 'Add a new device and set its ideal monitoring ranges.'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] -mx-6 px-6">
              <DeviceForm
                onSubmit={(e) => handleSubmit(e, !!editingDevice)}
                device={editingDevice}
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
              />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
             {!isMobile && (
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Device Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>pH</TableHead>
                  <TableHead>Temp (°C)</TableHead>
                  <TableHead>Ammonia (ppm)</TableHead>
                  <TableHead>Alert Interval</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
            )}
             {isMobile && (
                <TableHeader>
                  <TableRow>
                    <TableHead colSpan={2}>Device</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              )}
              <TableBody>
                {paginatedDevices.length > 0 ? (
                  paginatedDevices.map((device) => (
                    <DeviceRow 
                      key={device.id} 
                      device={device} 
                      onEdit={openEditDialog}
                      onDelete={handleDeleteDevice}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 3 : 8} className="h-24 text-center">
                      {searchQuery ? 'No devices match your search.' : 'No devices found.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
          </Table>
        </CardContent>
      </Card>
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
    </div>
  );
}
