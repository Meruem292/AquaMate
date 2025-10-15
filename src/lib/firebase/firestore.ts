'use client';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getFirestore,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { app } from './config';
import { Device } from '../validation/device';

const db = getFirestore(app);

const getDevicesCollection = (userId: string) => {
  return collection(db, 'users', userId, 'devices');
};

export const addDevice = async (userId: string, device: Device) => {
  // Use device.id as the document ID
  const deviceRef = doc(getDevicesCollection(userId), device.id);
  await addDoc(getDevicesCollection(userId), device);
};

export const getDevices = (
  userId: string,
  callback: (devices: Device[]) => void
) => {
  return onSnapshot(getDevicesCollection(userId), (snapshot) => {
    const devices = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    })) as Device[];
    callback(devices);
  });
};

export const updateDevice = async (userId: string, device: Device) => {
  const deviceRef = doc(getDevicesCollection(userId), device.id);
  await updateDoc(deviceRef, { name: device.name });
};

export const deleteDevice = async (userId: string, deviceId: string) => {
  const deviceRef = doc(getDevicesCollection(userId), deviceId);
  await deleteDoc(deviceRef);
};
