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
  await set(deviceRef, device);

  // Also create an initial data entry for the device with default values
  addDummyDeviceData(device.id);
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

export const getDevice = (
  userId: string,
  deviceId: string,
  callback: (device: Device | null) => void
) => {
  const deviceRef = getDeviceRef(userId, deviceId);
  const unsubscribe = onValue(deviceRef, (snapshot) => {
    const data = snapshot.val();
    if(data) {
      callback({ ...data, id: deviceId });
    } else {
      callback(null);
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

export const getDeviceDataHistory = (
  deviceId: string,
  callback: (data: DeviceData[]) => void
) => {
  const deviceDataRef = getDeviceDataRef(deviceId);
  const historyQuery = query(deviceDataRef, orderByChild('timestamp'));

  const unsubscribe = onValue(historyQuery, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const history = Object.values(data) as DeviceData[];
      callback(history);
    } else {
      callback([]);
    }
  });
  return unsubscribe;
};

// Function to add dummy data for a specific device
export const addDummyDeviceData = async (deviceId: string) => {
  const deviceDataRef = getDeviceDataRef(deviceId);
  const newDataRef = push(deviceDataRef);
  const dummyData: DeviceData = {
    ph: parseFloat((6.0 + Math.random() * 2.0).toFixed(1)), // pH between 6.0 and 8.0
    temperature: parseFloat((20.0 + Math.random() * 10.0).toFixed(1)), // Temp between 20.0 and 30.0
    ammonia: parseFloat((Math.random() * 1.0).toFixed(2)), // Ammonia between 0.0 and 1.0
    timestamp: Date.now(),
  };
  await set(newDataRef, dummyData);
};
