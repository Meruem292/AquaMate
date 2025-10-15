import * as z from 'zod';

export const deviceSchema = z.object({
  id: z.string().min(1, 'Device ID is required.'),
  name: z.string().min(1, 'Device name is required.'),
});

export type Device = z.infer<typeof deviceSchema>;

export const deviceDataSchema = z.object({
  ph: z.number(),
  temperature: z.number(),
  ammonia: z.number(),
  timestamp: z.number(),
});

export type DeviceData = z.infer<typeof deviceDataSchema>;
