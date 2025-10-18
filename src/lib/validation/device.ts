
import * as z from 'zod';

export const deviceSchema = z.object({
  id: z.string().min(1, 'Device ID is required.'),
  name: z.string().min(1, 'Device name is required.'),
  phMin: z.number({ coerce: true }).min(0).max(14),
  phMax: z.number({ coerce: true }).min(0).max(14),
  tempMin: z.number({ coerce: true }),
  tempMax: z.number({ coerce: true }),
  ammoniaMax: z.number({ coerce: true }),
  phone: z.string()
    .optional()
    .or(z.literal(''))
    .transform(e => e === "" ? undefined : e) // Transform empty string to undefined
    .refine(e => e === undefined || (e.length === 11 && e.startsWith('09') && /^[0-9]+$/.test(e)), {
      message: "Phone number must be 11 digits and start with '09'.",
    }),
}).refine(data => data.phMin < data.phMax, {
  message: "Min pH must be less than Max pH",
  path: ["phMin"],
}).refine(data => data.tempMin < data.tempMax, {
  message: "Min Temp must be less than Max Temp",
  path: ["tempMin"],
});


export type Device = z.infer<typeof deviceSchema>;

export const deviceDataSchema = z.object({
  ph: z.number(),
  temperature: z.number(),
  ammonia: z.number(),
  timestamp: z.number(), // Storing as epoch seconds
});

export type DeviceData = z.infer<typeof deviceDataSchema>;

// This is the schema for data read from devices/{deviceId}/notifications/{notificationId}
const notificationFromDbSchema = z.object({
  issue: z.string(),
  parameter: z.string(), // Can't be an enum as we might not know all possible values
  timestamp: z.number(), // epoch seconds
  value: z.number(),
});

// This is the schema for the notification object used in the app, enriched with more info
export const notificationSchema = notificationFromDbSchema.extend({
  id: z.string(),
  deviceId: z.string(),
  deviceName: z.string(),
  read: z.boolean(),
  // For UI display, we'll construct these
  threshold: z.string(), 
  range: z.string(),
});


export type Notification = z.infer<typeof notificationSchema>;
export type NotificationFromDb = z.infer<typeof notificationFromDbSchema>;
