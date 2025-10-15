'use client';

import {
  getDatabase,
  ref,
  set,
  onValue,
  update,
  remove,
} from 'firebase/database';
import { app } from './config';
import { Device } from '../validation/device';

const db = getDatabase(app);

const getDevicesRef = (userId: string) => {
  return ref(db, `users/${userId}/devices`);
};

const getDeviceRef = (userId: string, deviceId: string) => {
  return ref(db, `users/${userId}/devices/${deviceId}`);
};

export const addDevice = async (userId: string, device: Device) => {
  const deviceRef = getDeviceRef(userId, device.id);
  await set(deviceRef, device);
};

export const getDevices = (
  userId: string,
  callback: (devices: Device[]) => void
) => {
  const devicesRef = getDevicesRef(userId);
  const unsubscribe = onValue(devicesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const devices = Object.keys(data).map(key => ({
        ...data[key],
        id: key
      }));
      callback(devices);
    } else {
      callback([]);
    }
  });
  return unsubscribe;
};

export const updateDevice = async (userId: string, device: Device) => {
  const deviceRef = getDeviceRef(userId, device.id);
  await update(deviceRef, { name: device.name });
};

export const deleteDevice = async (userId: string, deviceId: string) => {
  const deviceRef = getDeviceRef(userId, deviceId);
  await remove(deviceRef);
};
