
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
  timestamp: z.number(), // Storing as epoch milliseconds
});

export type DeviceData = z.infer<typeof deviceDataSchema>;

export const notificationSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  deviceName: z.string(),
  parameter: z.enum(['pH', 'Temperature', 'Ammonia']),
  value: z.number(),
  threshold: z.string(),
  range: z.string(),
  timestamp: z.number(),
  read: z.boolean(),
});

export type Notification = z.infer<typeof notificationSchema>;
