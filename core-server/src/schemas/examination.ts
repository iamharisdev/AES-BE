import { z } from '@hono/zod-openapi'

export const ExaminationSchema = z.object({
  generalAppearance: z.string().optional(),
  vitalSigns: z.object({
    temperature: z.number().optional(),
    pulse: z.number().optional(),
    respiratoryRate: z.number().optional(),
    bloodPressure: z.object({
      systolic: z.number().optional(),
      diastolic: z.number().optional(),
    }).optional(),
    oxygenSaturation: z.number().optional(),
  }).optional(),
  headAndNeck: z.object({
    head: z.string().optional(),
    eyes: z.string().optional(),
    ears: z.string().optional(),
    nose: z.string().optional(),
    throat: z.string().optional(),
    neck: z.string().optional(),
  }).optional(),
  cardiovascular: z.object({
    heartSounds: z.string().optional(),
    murmurs: z.string().optional(),
    pulses: z.string().optional(),
    edema: z.string().optional(),
  }).optional(),
  respiratory: z.object({
    breathSounds: z.string().optional(),
    wheezing: z.string().optional(),
    crackles: z.string().optional(),
    chestExpansion: z.string().optional(),
  }).optional(),
  gastrointestinal: z.object({
    abdomen: z.string().optional(),
    bowelSounds: z.string().optional(),
    liver: z.string().optional(),
    spleen: z.string().optional(),
  }).optional(),
  musculoskeletal: z.object({
    joints: z.string().optional(),
    muscles: z.string().optional(),
  spine: z.string().optional(),
    gait: z.string().optional(),
  }).optional(),
  neurological: z.object({
    mentalStatus: z.string().optional(),
    cranialNerves: z.string().optional(),
    motorFunction: z.string().optional(),
    sensoryFunction: z.string().optional(),
    reflexes: z.string().optional(),
  }).optional(),
  skin: z.object({
    color: z.string().optional(),
    texture: z.string().optional(),
    lesions: z.string().optional(),
    rashes: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
})

export type Examination = z.infer<typeof ExaminationSchema>
