import * as z from 'zod';

export const deviceSchema = z.object({
  id: z.string().min(1, 'Device ID is required.'),
  name: z.string().min(1, 'Device name is required.'),
  phMin: z.number({ coerce: true }).min(0).max(14),
  phMax: z.number({ coerce: true }).min(0).max(14),
  tempMin: z.number({ coerce: true }),
  tempMax: z.number({ coerce: true }),
  ammoniaMax: z.number({ coerce: true }),
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
