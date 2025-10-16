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
} from 'firebase/database';
import { app } from './config';
import { Device, DeviceData, Notification } from '../validation/device';

const db = getDatabase(app);

// Device References
const getDevicesRef = (userId: string) => ref(db, `users/${userId}/devices`);
const getDeviceRef = (userId: string, deviceId: string) => ref(db, `users/${userId}/devices/${deviceId}`);
const getDeviceDataRef = (deviceId: string) => ref(db, `devices/${deviceId}`);

// Notification References
const getNotificationsRef = (userId: string) => ref(db, `users/${userId}/notifications`);

// --- Device Functions ---

export const addDevice = async (userId: string, device: Device) => {
  const deviceRef = getDeviceRef(userId, device.id);
  await set(deviceRef, device);
  // Create an initial data entry
  await addDummyDeviceData(userId, device.id);
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
  // Optional: Also delete notifications for this device
  const notificationsSnapshot = await get(query(getNotificationsRef(userId), orderByChild('deviceId'), ref(db, deviceId)));
  if (notificationsSnapshot.exists()) {
    const updates: { [key: string]: null } = {};
    notificationsSnapshot.forEach((child) => {
      updates[child.key!] = null;
    });
    await update(getNotificationsRef(userId), updates);
  }
};


// --- Device Data Functions ---

export const onDeviceDataUpdate = (
  deviceId: string,
  callback: (data: DeviceData) => void
) => {
  const latestDataQuery = query(getDeviceDataRef(deviceId), orderByChild('timestamp'), limitToLast(1));
  const unsubscribe = onValue(latestDataQuery, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const latestEntry = Object.values(data)[0] as DeviceData;
      callback(latestEntry);
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
    const history = data ? Object.values(data) as DeviceData[] : [];
    callback(history);
  });
  return unsubscribe;
};

const createNotification = async (userId: string, device: Device, parameter: 'pH' | 'Temperature' | 'Ammonia', value: number, threshold: string, range: string) => {
    const notificationsRef = getNotificationsRef(userId);
    const newNotificationRef = push(notificationsRef);
    const notification: Omit<Notification, 'id'> = {
      deviceId: device.id,
      deviceName: device.name,
      parameter,
      value,
      threshold,
      range,
      timestamp: Math.floor(Date.now() / 1000),
      read: false,
    };
    await set(newNotificationRef, notification);
};


export const addDummyDeviceData = async (userId: string, deviceId: string) => {
  const deviceSnapshot = await get(getDeviceRef(userId, deviceId));
  if (!deviceSnapshot.exists()) {
    console.error("Device settings not found for", deviceId);
    return;
  }
  const device: Device = deviceSnapshot.val();

  const newDataRef = push(getDeviceDataRef(deviceId));
  const timestamp = Math.floor(Date.now() / 1000);
  const dummyData: DeviceData = {
    ph: parseFloat((5.0 + Math.random() * 5.0).toFixed(1)), // pH between 5.0 and 10.0 for more alert variety
    temperature: parseFloat((18.0 + Math.random() * 18.0).toFixed(1)), // Temp between 18.0 and 36.0
    ammonia: parseFloat((Math.random() * 1.5).toFixed(2)), // Ammonia between 0.0 and 1.5
    timestamp,
  };
  await set(newDataRef, dummyData);

  // Check for alerts
  if (dummyData.ph < device.phMin) {
    await createNotification(userId, device, 'pH', dummyData.ph, 'Below Minimum', `${device.phMin} - ${device.phMax}`);
  } else if (dummyData.ph > device.phMax) {
    await createNotification(userId, device, 'pH', dummyData.ph, 'Above Maximum', `${device.phMin} - ${device.phMax}`);
  }

  if (dummyData.temperature < device.tempMin) {
    await createNotification(userId, device, 'Temperature', dummyData.temperature, 'Below Minimum', `${device.tempMin}°C - ${device.tempMax}°C`);
  } else if (dummyData.temperature > device.tempMax) {
    await createNotification(userId, device, 'Temperature', dummyData.temperature, 'Above Maximum', `${device.tempMin}°C - ${device.tempMax}°C`);
  }
  
  if (dummyData.ammonia > device.ammoniaMax) {
      await createNotification(userId, device, 'Ammonia', dummyData.ammonia, 'Above Maximum', `< ${device.ammoniaMax} ppm`);
  }
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