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
  onChildAdded,
} from 'firebase/database';
import { app } from './config';
import { Device, DeviceData, Notification } from '../validation/device';

const db = getDatabase(app);

// --- References ---
const getDevicesRef = (userId: string) => ref(db, `users/${userId}/devices`);
const getDeviceRef = (userId: string, deviceId: string) => ref(db, `users/${userId}/devices/${deviceId}`);
const getDeviceDataRef = (deviceId: string) => ref(db, `devices/${deviceId}`);
const getNotificationsRef = (userId: string) => ref(db, `users/${userId}/notifications`);

// --- Device Functions ---

export const addDevice = async (userId: string, device: Device) => {
  const deviceRef = getDeviceRef(userId, device.id);
  await set(deviceRef, device);
  // Create an initial data entry to prevent errors on the dashboard
  const initialData: DeviceData = {
    ph: (device.phMin + device.phMax) / 2,
    temperature: (device.tempMin + device.tempMax) / 2,
    ammonia: device.ammoniaMax / 2,
    timestamp: Date.now(), // Use milliseconds
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
    const devices = data ? Object.values(data) as Device[] : [];
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
  const notificationsRef = getNotificationsRef(userId);
  const snapshot = await get(query(notificationsRef, orderByChild('deviceId'), ref(db, deviceId)));
  if (snapshot.exists()) {
    const updates: { [key: string]: null } = {};
    snapshot.forEach((child) => {
      updates[child.key!] = null;
    });
    await update(notificationsRef, updates);
  }
};


// --- Notification and Data Check Functions ---

const createNotification = async (userId: string, device: Device, parameter: 'pH' | 'Temperature' | 'Ammonia', value: number, threshold: string, range: string) => {
    const notificationsRef = getNotificationsRef(userId);
    const newNotificationRef = push(notificationsRef);
    
    const notificationPayload: Omit<Notification, 'id'> & { sms?: boolean } = {
      deviceId: device.id,
      deviceName: device.name,
      parameter,
      value,
      threshold,
      range,
      timestamp: Math.floor(Date.now() / 1000),
      read: false,
    };

    // If device has SMS enabled, add the sms flag to the notification
    if (device.sendSms) {
        notificationPayload.sms = true;
    }

    await set(newNotificationRef, notificationPayload);
};


export const checkDataAndCreateNotification = async (userId: string, deviceId: string, data: DeviceData) => {
  const deviceSnapshot = await get(getDeviceRef(userId, deviceId));
  if (!deviceSnapshot.exists()) {
    console.error("Device settings not found for", deviceId);
    return;
  }
  const device: Device = deviceSnapshot.val();
  
  if (data.ph < device.phMin) {
    await createNotification(userId, device, 'pH', data.ph, 'Below Minimum', `${device.phMin} - ${device.phMax}`);
  } else if (data.ph > device.phMax) {
    await createNotification(userId, device, 'pH', data.ph, 'Above Maximum', `${device.phMin} - ${device.phMax}`);
  }

  if (data.temperature < device.tempMin) {
    await createNotification(userId, device, 'Temperature', data.temperature, 'Below Minimum', `${device.tempMin}°C - ${device.tempMax}°C`);
  } else if (data.temperature > device.tempMax) {
    await createNotification(userId, device, 'Temperature', data.temperature, 'Above Maximum', `${device.tempMin}°C - ${device.tempMax}°C`);
  }
  
  if (data.ammonia > device.ammoniaMax) {
      await createNotification(userId, device, 'Ammonia', data.ammonia, 'Above Maximum', `< ${device.ammoniaMax} ppm`);
  }
};

// --- Device Data Functions ---
const listenerCache = new Map<string, () => void>();

export const onDeviceDataUpdate = (
  userId: string,
  deviceId: string,
  callback: (data: DeviceData) => void
) => {
  
  // If a listener already exists for this device, do nothing.
  if (listenerCache.has(deviceId)) {
    // Return the existing unsubscribe function
     const latestDataQuery = query(getDeviceDataRef(deviceId), limitToLast(1));
     onValue(latestDataQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const latestKey = Object.keys(data)[0];
          callback(data[latestKey]);
        }
     }, { onlyOnce: true });

    return listenerCache.get(deviceId)!;
  }

  const dataRef = getDeviceDataRef(deviceId);
  let initialDataLoaded = false;

  const listener = onChildAdded(query(dataRef, limitToLast(20)), (snapshot) => {
    const data = snapshot.val() as DeviceData;
    if (!data) return;

    if (!initialDataLoaded) {
      return;
    }
    
    // Update UI
    callback(data);
    
    // Check for notifications
    checkDataAndCreateNotification(userId, deviceId, data);
  });
  
  // This part handles the initial load to get the very last data point for the UI
  // without triggering a notification for it.
  onValue(query(dataRef, limitToLast(1)), (snapshot) => {
      const data = snapshot.val();
      if (data) {
          const latestKey = Object.keys(data)[0];
          callback(data[latestKey]);
      }
      initialDataLoaded = true; // Mark initial data as loaded
  }, { onlyOnce: true });


  const unsubscribe = () => {
    // Firebase off() function can be used here if needed, but onChildAdded doesn't have a direct off switch
    // in the same way onValue does. Instead, we can rely on React's unmount to eventually clear memory.
    // For our purpose, we just need to clear from cache.
    listenerCache.delete(deviceId);
  };
  
  listenerCache.set(deviceId, unsubscribe);

  return unsubscribe;
};


export const getDeviceDataHistory = (
  deviceId: string,
  callback: (data: DeviceData[]) => void
) => {
  const historyQuery = query(getDeviceDataRef(deviceId), orderByChild('timestamp'));
  const unsubscribe = onValue(historyQuery, (snapshot) => {
    const data = snapshot.val();
    const history = data ? Object.values(data).map(d => ({
        ...d as DeviceData,
        // Ensure timestamp is in seconds for consistency with old data if it exists
        timestamp: (d as any).timestamp > 1000000000000 ? Math.floor((d as any).timestamp / 1000) : (d as any).timestamp,
    })) : [];
    callback(history);
  });
  return unsubscribe;
};


// --- Notification Functions ---

export const getNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const notificationsQuery = query(getNotificationsRef(userId), orderByChild('timestamp'));
  const unsubscribe = onValue(notificationsQuery, (snapshot) => {
    const data = snapshot.val();
    const notifications = data ? Object.entries(data).map(([id, value]) => ({ id, ...(value as object) } as Notification)).reverse() : [];
    callback(notifications);
  });
  return unsubscribe;
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const notificationsRef = getNotificationsRef(userId);
  const snapshot = await get(notificationsRef);
  if (snapshot.exists()) {
    const updates: { [key: string]: any } = {};
    snapshot.forEach(child => {
      updates[`${child.key}/read`] = true;
    });
    await update(notificationsRef, updates);
  }
};
