
'use client';

import {
  getDatabase,
  ref,
  set,
  onValue,
  update,
  remove,
  query,
  orderByChild,
  limitToLast,
  push,
  get,
  type Unsubscribe,
} from 'firebase/database';
import { app } from './config';
import { Device, DeviceData, Notification, NotificationFromDb } from '../validation/device';

const db = getDatabase(app);

// --- References ---
const getDevicesRef = (userId: string) => ref(db, `users/${userId}/devices`);
const getDeviceRef = (userId:string, deviceId: string) => ref(db, `users/${userId}/devices/${deviceId}`);
const getDeviceDataRef = (deviceId: string) => ref(db, `devices/${deviceId}`);

// This is the new reference for notifications, nested under each device
const getDeviceNotificationsRef = (deviceId: string) => ref(db, `devices/${deviceId}/notifications`);

// --- Device Functions ---

export const addDevice = async (userId: string, device: Device) => {
  const deviceRef = getDeviceRef(userId, device.id);
  const deviceData = { ...device };
  // Ensure optional fields that are undefined are not written to Firebase
  if (deviceData.phone === undefined) {
    delete (deviceData as any).phone;
  }
  await set(deviceRef, deviceData);
  
  // Create an initial data entry to prevent errors on the dashboard
  const initialData: DeviceData = {
    ph: (device.phMin + device.phMax) / 2,
    temperature: (device.tempMin + device.tempMax) / 2,
    ammonia: device.ammoniaMax / 2,
    timestamp: Math.floor(Date.now() / 1000), 
  };
  const newDataRef = push(getDeviceDataRef(device.id));
  await set(newDataRef, initialData);
};

export const getDevices = (
  userId: string,
  callback: (devices: Device[]) => void
) => {
  const devicesRef = getDevicesRef(userId);
  const unsubscribe = onValue(devicesRef, (snapshot) => {
    const data = snapshot.val();
    const devices: Device[] = data ? Object.values(data) : [];
    callback(devices);
  });
  return unsubscribe;
};

export const getDevice = (
  userId: string,
  deviceId: string,
  callback: (device: Device | null) => void
) => {
  const deviceRef = getDeviceRef(userId, deviceId);
  const unsubscribe = onValue(deviceRef, (snapshot) => {
    const data = snapshot.val();
    callback(data ? { ...data, id: deviceId } : null);
  });
  return unsubscribe;
};

export const updateDevice = async (userId: string, device: Device) => {
  const deviceRef = getDeviceRef(userId, device.id);
  await update(deviceRef, device);
};

export const deleteDevice = async (userId: string, deviceId: string) => {
  await remove(getDeviceRef(userId, deviceId));
  await remove(getDeviceDataRef(deviceId));
  // Also remove notifications for that device
  await remove(getDeviceNotificationsRef(deviceId));
};


// --- Device Data Functions ---

/**
 * Gets the latest data for a device and listens for real-time updates.
 */
export const onDeviceDataUpdate = (
  deviceId: string,
  callback: (data: DeviceData | null) => void
): Unsubscribe => {
  const dataRef = getDeviceDataRef(deviceId);
  const dataQuery = query(dataRef, orderByChild('timestamp'), limitToLast(1));
  
  const unsubscribe = onValue(dataQuery, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const key = Object.keys(data)[0];
      callback(data[key] as DeviceData);
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

export const getDeviceDataHistory = (
  deviceId: string,
  callback: (data: DeviceData[]) => void
) => {
  const historyQuery = query(getDeviceDataRef(deviceId), orderByChild('timestamp'));
  const unsubscribe = onValue(historyQuery, (snapshot) => {
    const data = snapshot.val();
    const history = data ? Object.values(data).map(d => d as DeviceData) : [];
    callback(history);
  });
  return unsubscribe;
};


// --- Notification Functions ---

const enrichNotification = (notif: NotificationFromDb, id: string, device: Device): Notification => {
  let range = '';
  let threshold = '';
  switch (notif.parameter.toLowerCase()) {
    case 'ph':
      range = `${device.phMin} - ${device.phMax}`;
      threshold = notif.value < device.phMin ? `below ${device.phMin}` : `above ${device.phMax}`;
      break;
    case 'temperature':
      range = `${device.tempMin}°C - ${device.tempMax}°C`;
      threshold = notif.value < device.tempMin ? `below ${device.tempMin}°C` : `above ${device.tempMax}°C`;
      break;
    case 'ammonia':
       range = `< ${device.ammoniaMax} ppm`;
       threshold = `above ${device.ammoniaMax} ppm`;
      break;
  }
  return {
    ...notif,
    id,
    deviceId: device.id,
    deviceName: device.name,
    read: notif.read ?? false, // Default to false if 'read' is not present
    range,
    threshold,
    parameter: notif.parameter.charAt(0).toUpperCase() + notif.parameter.slice(1),
  };
};

export const getNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe => {
  const userDevicesRef = getDevicesRef(userId);
  let allNotifications: { [deviceId: string]: Notification[] } = {};
  let deviceListeners: Unsubscribe[] = [];

  const userDevicesListener = onValue(userDevicesRef, (snapshot) => {
    // Clear old listeners when user's devices change
    deviceListeners.forEach(unsubscribe => unsubscribe());
    deviceListeners = [];
    allNotifications = {};

    const userDevices = snapshot.val() as { [id: string]: Device } | null;
    if (!userDevices) {
      callback([]);
      return;
    }

    Object.values(userDevices).forEach((device) => {
      const notificationsRef = getDeviceNotificationsRef(device.id);
      const notificationsQuery = query(notificationsRef, orderByChild('timestamp'));

      const listener = onValue(notificationsQuery, (notifSnapshot) => {
        const deviceNotifications: Notification[] = [];
        notifSnapshot.forEach((childSnapshot) => {
          const notifId = childSnapshot.key!;
          const notifData = childSnapshot.val() as NotificationFromDb;
          // Ensure device has the necessary properties before enriching
          if (device.phMin !== undefined && device.phMax !== undefined && 
              device.tempMin !== undefined && device.tempMax !== undefined && 
              device.ammoniaMax !== undefined) {
            const enrichedNotif = enrichNotification(notifData, notifId, device);
            deviceNotifications.push(enrichedNotif);
          }
        });
        
        allNotifications[device.id] = deviceNotifications;

        // Combine all notifications from all devices, sort, and callback
        const combined = Object.values(allNotifications).flat();
        combined.sort((a, b) => b.timestamp - a.timestamp);
        callback(combined);
      });
      
      deviceListeners.push(listener);
    });
  });

  // Return a function that unsubscribes from everything
  return () => {
    userDevicesListener();
    deviceListeners.forEach(unsubscribe => unsubscribe());
  };
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const userDevicesRef = getDevicesRef(userId);
  const userDevicesSnap = await get(userDevicesRef);

  if (userDevicesSnap.exists()) {
    const devices = userDevicesSnap.val() as { [id: string]: Device };
    for (const deviceId in devices) {
      const notificationsRef = getDeviceNotificationsRef(deviceId);
      const snapshot = await get(notificationsRef);
      if (snapshot.exists()) {
        const updates: { [key: string]: any } = {};
        snapshot.forEach(child => {
          if (!child.val().read) {
            updates[`${child.key}/read`] = true;
          }
        });
        if (Object.keys(updates).length > 0) {
          await update(notificationsRef, updates);
        }
      }
    }
  }
};
