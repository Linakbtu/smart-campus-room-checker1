import { describe, it, expect, vi } from 'vitest';
import { checkAvailability } from '@/lib/availability';
import {
  toReasonCode,
  buildExplainContext,
  explainAvailability,
  mockLlmAdapter,
  EXPLAIN_FALLBACK,
  SYSTEM_PROMPT,
  type mockLlmAdapter as MockLlmAdapterType,
} from '@/lib/explain';
import type { Room } from '@/types';

const CURRENT_TIME = 540;

function makeDefaultRoom(): Room {
  return {
    id: 'test-room',
    name: 'Test Room',
    blocked: false,
    bookings: [{ start: 600, end: 660, label: 'Calculus 101' }],
  };
}

describe('explain', () => {
  it('available decision maps to AVAILABLE and produces an explanation', async () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 660, 720);
    expect(result.available).toBe(true);
    expect(toReasonCode(result)).toBe('AVAILABLE');
    const text = await explainAvailability(room, CURRENT_TIME, 660, 720, result);
    expect(text.length).toBeGreaterThan(0);
    expect(text.length).toBeLessThanOrEqual(300);
    expect(room).toEqual(snapshot);
  });

  it('overlap maps to OVERLAP and explains', async () => {
    const room = makeDefaultRoom();
    const result = checkAvailability(room, CURRENT_TIME, 630, 690);
    expect(result.available).toBe(false);
    expect(toReasonCode(result)).toBe('OVERLAP');
    const text = await explainAvailability(room, CURRENT_TIME, 630, 690, result);
    expect(text.length).toBeGreaterThan(0);
  });

  it('blocked room maps to BLOCKED and explains', async () => {
    const room = makeDefaultRoom();
    room.blocked = true;
    const result = checkAvailability(room, CURRENT_TIME, 660, 720);
    expect(result.available).toBe(false);
    expect(toReasonCode(result)).toBe('BLOCKED');
    const text = await explainAvailability(room, CURRENT_TIME, 660, 720, result);
    expect(text.length).toBeGreaterThan(0);
  });

  it('start >= end maps to START_NOT_BEFORE_END and explains', async () => {
    const room = makeDefaultRoom();
    const result = checkAvailability(room, CURRENT_TIME, 720, 720);
    expect(result.available).toBe(false);
    expect(toReasonCode(result)).toBe('START_NOT_BEFORE_END');
    const text = await explainAvailability(room, CURRENT_TIME, 720, 720, result);
    expect(text.length).toBeGreaterThan(0);
  });

  it('past time maps to PAST_TIME and explains', async () => {
    const room = makeDefaultRoom();
    const result = checkAvailability(room, CURRENT_TIME, 500, 560);
    expect(result.available).toBe(false);
    expect(toReasonCode(result)).toBe('PAST_TIME');
    const text = await explainAvailability(room, CURRENT_TIME, 500, 560, result);
    expect(text.length).toBeGreaterThan(0);
  });

  it('NaN/empty input maps to INVALID_INPUT and explains', async () => {
    const room = makeDefaultRoom();
    const result = checkAvailability(room, CURRENT_TIME, NaN, 720);
    expect(result.available).toBe(false);
    expect(toReasonCode(result)).toBe('INVALID_INPUT');
    const text = await explainAvailability(room, CURRENT_TIME, NaN, 720, result);
    expect(text.length).toBeGreaterThan(0);
  });

  it('end past 1440 maps to OUT_OF_DAY', () => {
    const room = makeDefaultRoom();
    const result = checkAvailability(room, CURRENT_TIME, 1380, 1441);
    expect(toReasonCode(result)).toBe('OUT_OF_DAY');
  });

  it('duration over 120 maps to TOO_LONG', () => {
    const room = makeDefaultRoom();
    const result = checkAvailability(room, CURRENT_TIME, 720, 841);
    expect(toReasonCode(result)).toBe('TOO_LONG');
  });

  it('long room name is truncated to 200 characters in context', () => {
    const room = makeDefaultRoom();
    room.name = 'A'.repeat(300);
    const result = checkAvailability(room, CURRENT_TIME, 660, 720);
    const context = buildExplainContext(room, CURRENT_TIME, 660, 720, result);
    expect(context.roomName.length).toBe(200);
    expect(context.roomName).toBe('A'.repeat(200));
  });

  it('timeout (delayMs > timeoutMs) returns fallback', async () => {
    const room = makeDefaultRoom();
    const result = checkAvailability(room, CURRENT_TIME, 660, 720);
    const text = await explainAvailability(
      room,
      CURRENT_TIME,
      660,
      720,
      result,
      mockLlmAdapter,
      { delayMs: 4000, timeoutMs: 3000 }
    );
    expect(text).toBe(EXPLAIN_FALLBACK);
  });

  it('simulated adapter failure returns fallback', async () => {
    const room = makeDefaultRoom();
    const result = checkAvailability(room, CURRENT_TIME, 660, 720);
    const text = await explainAvailability(
      room,
      CURRENT_TIME,
      660,
      720,
      result,
      mockLlmAdapter,
      { fail: true }
    );
    expect(text).toBe(EXPLAIN_FALLBACK);
  });

  it('contradictory adapter output is rejected and returns fallback', async () => {
    const room = makeDefaultRoom();
    const result = checkAvailability(room, CURRENT_TIME, 660, 720);
    expect(result.available).toBe(true);
    const contradictory: typeof MockLlmAdapterType = async () =>
      'This room is unavailable for booking.';
    const text = await explainAvailability(
      room,
      CURRENT_TIME,
      660,
      720,
      result,
      contradictory
    );
    expect(text).toBe(EXPLAIN_FALLBACK);
  });

  it('decision is unchanged after explanation (AC5/authority)', async () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const before = checkAvailability(room, CURRENT_TIME, 660, 720);
    await explainAvailability(room, CURRENT_TIME, 660, 720, before);
    const after = checkAvailability(room, CURRENT_TIME, 660, 720);
    expect(after).toEqual(before);
    expect(room).toEqual(snapshot);
  });

  it('SYSTEM_PROMPT is the exact required string', () => {
    expect(SYSTEM_PROMPT).toBe(
      'Explain the booking decision in at most 2 short, respectful sentences, using only the supplied facts. Never change or contradict the decision. Do not invent rules, times or people.'
    );
  });

  it('never-resolving adapter returns fallback after timeout (fake timers)', async () => {
    vi.useFakeTimers();
    try {
      const room = makeDefaultRoom();
      const result = checkAvailability(room, CURRENT_TIME, 660, 720);
      const never: typeof MockLlmAdapterType = () => new Promise<string>(() => {});
      const promise = explainAvailability(
        room,
        CURRENT_TIME,
        660,
        720,
        result,
        never,
        { timeoutMs: 3000 }
      );
      await vi.advanceTimersByTimeAsync(3000);
      const text = await promise;
      expect(text).toBe(EXPLAIN_FALLBACK);
    } finally {
      vi.useRealTimers();
    }
  });

  it('available result + "You cannot book this room." is rejected (H1)', async () => {
    const room = makeDefaultRoom();
    const result = checkAvailability(room, CURRENT_TIME, 660, 720);
    expect(result.available).toBe(true);
    const adapter: typeof MockLlmAdapterType = async () =>
      'You cannot book this room.';
    const text = await explainAvailability(
      room,
      CURRENT_TIME,
      660,
      720,
      result,
      adapter
    );
    expect(text).toBe(EXPLAIN_FALLBACK);
  });

  it('unavailable result + "You can book this room." is rejected (H1)', async () => {
    const room = makeDefaultRoom();
    const result = checkAvailability(room, CURRENT_TIME, 630, 690);
    expect(result.available).toBe(false);
    const adapter: typeof MockLlmAdapterType = async () =>
      'You can book this room.';
    const text = await explainAvailability(
      room,
      CURRENT_TIME,
      630,
      690,
      result,
      adapter
    );
    expect(text).toBe(EXPLAIN_FALLBACK);
  });

  it('adapter output longer than 300 characters returns fallback (C1)', async () => {
    const room = makeDefaultRoom();
    const result = checkAvailability(room, CURRENT_TIME, 660, 720);
    const adapter: typeof MockLlmAdapterType = async () => 'A'.repeat(301);
    const text = await explainAvailability(
      room,
      CURRENT_TIME,
      660,
      720,
      result,
      adapter
    );
    expect(text).toBe(EXPLAIN_FALLBACK);
  });
});
