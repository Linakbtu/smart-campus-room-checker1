import type { Room, AvailabilityResult } from '@/types';

export type ReasonCode =
  | 'AVAILABLE'
  | 'INVALID_INPUT'
  | 'OUT_OF_DAY'
  | 'START_NOT_BEFORE_END'
  | 'PAST_TIME'
  | 'TOO_LONG'
  | 'BLOCKED'
  | 'OVERLAP';

export interface ExplainContext {
  decision: boolean;
  reasonCode: ReasonCode;
  reason: string;
  roomName: string;
  start: number;
  end: number;
  durationMinutes: number;
}

export const SYSTEM_PROMPT =
  'Explain the booking decision in at most 2 short, respectful sentences, using only the supplied facts. Never change or contradict the decision. Do not invent rules, times or people.';

export const EXPLAIN_FALLBACK =
  'Explanation unavailable right now. The decision above is still correct.';

const MAX_TEXT = 200;
const MAX_EXPLANATION = 300;

function truncate(value: string): string {
  return value.length > MAX_TEXT ? value.slice(0, MAX_TEXT) : value;
}

export function toReasonCode(result: AvailabilityResult): ReasonCode {
  if (result.available) return 'AVAILABLE';
  const reason = result.reason;
  if (/valid numbers/i.test(reason)) return 'INVALID_INPUT';
  if (/at least 0/i.test(reason)) return 'INVALID_INPUT';
  if (/earlier than end/i.test(reason)) return 'START_NOT_BEFORE_END';
  if (/exceed 1440|before 1440/i.test(reason)) return 'OUT_OF_DAY';
  if (/after the current time/i.test(reason)) return 'PAST_TIME';
  if (/cannot exceed/i.test(reason)) return 'TOO_LONG';
  if (/blocked/i.test(reason)) return 'BLOCKED';
  if (/verlap/i.test(reason)) return 'OVERLAP';
  return 'INVALID_INPUT';
}

export function buildExplainContext(
  room: Room,
  currentTime: number,
  start: number,
  end: number,
  result: AvailabilityResult
): ExplainContext {
  const durationMinutes =
    Number.isFinite(start) && Number.isFinite(end)
      ? Math.max(0, end - start)
      : 0;
  return {
    decision: result.available,
    reasonCode: toReasonCode(result),
    reason: result.available ? '' : truncate(result.reason),
    roomName: truncate(room.name),
    start,
    end,
    durationMinutes,
  };
}

export async function mockLlmAdapter(
  context: ExplainContext,
  options: { delayMs?: number; fail?: boolean; timeoutMs?: number } = {}
): Promise<string> {
  const { delayMs = 0, fail = false, timeoutMs = 3000 } = options;
  if (fail) throw new Error('LLM_ERROR');
  if (delayMs > timeoutMs) throw new Error('LLM_TIMEOUT');
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  if (context.decision) {
    return `${context.roomName} is available for ${context.durationMinutes} minute(s) from ${context.start} to ${context.end}.`;
  }
  return `${context.roomName} is unavailable: ${context.reason}.`;
}

function contradictsDecision(text: string, available: boolean): boolean {
  const lower = text.toLowerCase();
  const negative =
    /unavailable|not available|cannot be booked|cannot book|can't book|not bookable|not free|blocked/i.test(lower);
  const positive =
    /is available|are available|is free|are free|can be booked|can book|bookable/i.test(lower);
  if (available) return negative;
  return positive && !negative;
}

export async function explainAvailability(
  room: Room,
  currentTime: number,
  start: number,
  end: number,
  result: AvailabilityResult,
  adapter: typeof mockLlmAdapter = mockLlmAdapter,
  options: { delayMs?: number; fail?: boolean; timeoutMs?: number } = {}
): Promise<string> {
  try {
    if (!room || !result) return EXPLAIN_FALLBACK;
    const context = buildExplainContext(room, currentTime, start, end, result);
    const timeoutMs = options.timeoutMs ?? 3000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('LLM_TIMEOUT')), timeoutMs);
    });
    let text: string;
    try {
      text = await Promise.race([adapter(context, options), timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (typeof text !== 'string') return EXPLAIN_FALLBACK;
    const trimmed = text.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_EXPLANATION) {
      return EXPLAIN_FALLBACK;
    }
    if (contradictsDecision(trimmed, result.available)) return EXPLAIN_FALLBACK;
    return trimmed;
  } catch {
    return EXPLAIN_FALLBACK;
  }
}
