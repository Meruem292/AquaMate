
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
  off,
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

export const addDevice = async (userId: string, device: Device & { sendSms?: boolean }) => {
  const deviceRef = getDeviceRef(userId, device.id);
  await set(deviceRef, {
    ...device,
    sendSms: device.sendSms || false,
  });
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

export const updateDevice = async (userId: string, device: Device & { sendSms?: boolean }) => {
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

const createNotification = async (userId: string, device: Device & { sendSms?: boolean }, parameter: 'pH' | 'Temperature' | 'Ammonia', value: number, threshold: string, range: string) => {
    const notificationsRef = getNotificationsRef(userId);
    const newNotificationRef = push(notificationsRef);
    
    const notificationPayload: Omit<Notification, 'id'> & { sms?: boolean } = {
      deviceId: device.id,
      deviceName: device.name,
      parameter,
      value,
      threshold,
      range,
      timestamp: Date.now(),
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
  const device: Device & { sendSms?: boolean } = deviceSnapshot.val();
  
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

export const onDeviceDataUpdate = (
  userId: string,
  deviceId: string,
  callback: (data: DeviceData | null) => void
) => {
  const dataRef = getDeviceDataRef(deviceId);
  const initialQuery = query(dataRef, orderByChild('timestamp'), limitToLast(1));

  // 1. Get the last known data point for initial display
  get(initialQuery).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const key = Object.keys(data)[0];
      callback(data[key]);
    } else {
      callback(null);
    }
  });

  // 2. Listen for NEW children added after the initial load.
  // We use `onChildAdded` which is the most reliable way to listen for new items
  // in a list-like structure in Firebase Realtime Database.
  const newReadingsQuery = query(dataRef, orderByChild('timestamp'), limitToLast(1));
  const listener = onChildAdded(newReadingsQuery, (snapshot) => {
    const latestData = snapshot.val() as DeviceData;
    if (latestData) {
      // Update the UI with the very latest data.
      callback(latestData);
      
      // IMPORTANT: Only check for notifications on RECENT data to avoid old alerts on load.
      // We check if the timestamp is within the last minute.
      // Timestamp from DB is in seconds, convert to ms for comparison.
      if (Date.now() - (latestData.timestamp * 1000) < 60000) { 
         checkDataAndCreateNotification(userId, deviceId, latestData);
      }
    }
  });

  // Return a function to clean up the listener when the component unmounts.
  return () => {
    off(newReadingsQuery, 'child_added', listener);
  };
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
