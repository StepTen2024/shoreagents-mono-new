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

/**
 * Format date for Admin dashboard (Philippines timezone)
 * @param dateString - ISO date string
 * @returns Formatted date in PH timezone (e.g., "Nov 19, 2025")
 */
export function formatAdminDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format date and time for Admin dashboard (Philippines timezone)
 * @param dateString - ISO date string
 * @returns Formatted date and time in PH timezone (e.g., "Nov 19, 2025, 02:30 PM")
 */
export function formatAdminDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format date for Client dashboard (browser's local timezone)
 * @param dateString - ISO date string
 * @returns Formatted date in US format (e.g., "Nov 19, 2025")
 */
export function formatClientDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format date and time for Client dashboard (browser's local timezone)
 * @param dateString - ISO date string
 * @returns Formatted date and time in US format (e.g., "Nov 19, 2025, 02:30 PM")
 */
export function formatClientDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}