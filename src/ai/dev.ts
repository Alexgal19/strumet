
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-employee-summary.ts';
import '@/ai/flows/check-fingerprint-appointments.ts';
import '@/ai/flows/check-expiring-contracts.ts';
import '@/ai/flows/check-planned-terminations.ts';
import '@/ai/flows/generate-avatar.ts';
import '@/ai/flows/run-daily-checks.ts';
import '@/ai/flows/run-manual-checks.ts';
import '@/ai/flows/create-stats-snapshot.ts';

// This is a dev-only file that is used to run the Genkit flows locally.
// It is not included in the production build.
// To run the flows, run `npm run genkit:watch`

