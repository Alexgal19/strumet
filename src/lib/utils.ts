import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRandomNumber(min: number = 0, max: number = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function objectToArray(obj: Record<string, any> | undefined | null): any[] {
  return obj ? Object.keys(obj).map(key => ({ id: key, ...obj[key] })) : [];
}
