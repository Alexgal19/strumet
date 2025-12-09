
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-employee-summary.ts';
import '@/ai/flows/check-fingerprint-appointments.ts';
import '@/ai/flows/check-expiring-contracts.ts';

// This is a dev-only file that is used to run the Genkit flows locally.
// It is not included in the production build.
// To run the flows, run `npm run genkit:watch`

