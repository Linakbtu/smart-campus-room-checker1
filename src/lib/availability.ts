import type { Room, AvailabilityResult } from '@/types';

export const MINUTES_PER_DAY = 1440;
export const MAX_BOOKING_LENGTH = 120;

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

export function checkAvailability(
  room: Room,
  currentTime: number,
  start: number,
  end: number
): AvailabilityResult {
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    !Number.isFinite(currentTime)
  ) {
    return { available: false, reason: 'All time fields must be valid numbers.' };
  }

  if (start < 0 || end < 0) {
    return { available: false, reason: 'Times must be at least 0 (midnight).' };
  }

  if (start >= end) {
    return {
      available: false,
      reason: 'Start time must be earlier than end time.',
    };
  }

  if (end > MINUTES_PER_DAY) {
    return {
      available: false,
      reason: 'End time must not exceed 1440 (end of day).',
    };
  }

  if (start >= MINUTES_PER_DAY) {
    return {
      available: false,
      reason: 'Start time must be before 1440 (end of day).',
    };
  }

  if (start <= currentTime) {
    return {
      available: false,
      reason: 'Start time must be after the current time.',
    };
  }

  if (end - start > MAX_BOOKING_LENGTH) {
    return {
      available: false,
      reason: `Bookings cannot exceed ${MAX_BOOKING_LENGTH} minutes.`,
    };
  }

  if (room.blocked) {
    return {
      available: false,
      reason: `${room.name} is currently blocked and cannot be booked.`,
    };
  }

  for (const booking of room.bookings) {
    if (overlaps(start, end, booking.start, booking.end)) {
      return {
        available: false,
        reason: `Overlaps existing booking "${booking.label}" (${formatTime(booking.start)}–${formatTime(booking.end)}).`,
      };
    }
  }

  return { available: true };
}

export function formatTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > MINUTES_PER_DAY) {
    return 'invalid';
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function parseMinutesInput(raw: string): number {
  if (raw.trim() === '') return NaN;
  return Number(raw);
}
