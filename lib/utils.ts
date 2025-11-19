import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert 24-hour time format to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "09:00", "18:00", "21:30")
 * @returns Time in 12-hour format (e.g., "9:00 AM", "6:00 PM", "9:30 PM")
 */
export function convertTo12Hour(time24: string): string {
  if (!time24 || time24.trim() === '') return ''
  
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}