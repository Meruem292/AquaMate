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
} from 'firebase/database';
import { app } from './config';
import { Device, DeviceData } from '../validation/device';

const db = getDatabase(app);

const getDevicesRef = (userId: string) => {
  return ref(db, `users/${userId}/devices`);
};

const getDeviceRef = (userId: string, deviceId: string) => {
  return ref(db, `users/${userId}/devices/${deviceId}`);
};

const getDeviceDataRef = (deviceId: string) => {
  return ref(db, `devices/${deviceId}`);
};

export const addDevice = async (userId: string, device: Device) => {
  const deviceRef = getDeviceRef(userId, device.id);
  // Set default values for sensor data when adding a new device
  const newDevice = {
    ...device,
    ph: 7,
    temperature: 25,
    ammonia: 0,
  };
  await set(deviceRef, newDevice);

  // Also create an initial data entry for the device
  const deviceDataRef = getDeviceDataRef(device.id);
  const initialData = {
    ph: 7,
    temperature: 25,
    ammonia: 0,
    timestamp: Date.now(),
  };
  await set(ref(db, `devices/${device.id}/${Date.now()}`), initialData);
};

export const getDevices = (
  userId: string,
  callback: (devices: Device[]) => void
) => {
  const devicesRef = getDevicesRef(userId);
  const unsubscribe = onValue(devicesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const devices = Object.keys(data).map((key) => ({
        ...data[key],
        id: key,
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
  // Also delete the sensor data
  const deviceDataRef = getDeviceDataRef(deviceId);
  await remove(deviceDataRef);
};

export const onDeviceDataUpdate = (
  deviceId: string,
  callback: (data: DeviceData) => void
) => {
  const deviceDataRef = getDeviceDataRef(deviceId);
  const latestDataQuery = query(
    deviceDataRef,
    orderByChild('timestamp'),
    limitToLast(1)
  );

  const unsubscribe = onValue(latestDataQuery, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const latestEntryId = Object.keys(data)[0];
      const latestData = data[latestEntryId];
      callback(latestData);
    }
  });
  return unsubscribe;
};
