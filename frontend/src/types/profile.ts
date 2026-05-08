import { z } from 'zod';
import { profileSchema } from '../constants/profileConstants';

export type ProfileFormData = z.infer<typeof profileSchema>;
