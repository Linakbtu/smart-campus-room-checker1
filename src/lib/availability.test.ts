import { describe, it, expect } from 'vitest';
import { checkAvailability, MAX_BOOKING_LENGTH, MINUTES_PER_DAY, parseMinutesInput } from '@/lib/availability';
import { rooms } from '@/data/rooms';
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

function expectRoomUnchanged(room: Room, snapshot: Room): void {
  expect(room).toEqual(snapshot);
}

describe('checkAvailability', () => {
  it('T01: 660–720 touching after existing booking is available (AC4)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 660, 720);
    expect(result.available).toBe(true);
    expectRoomUnchanged(room, snapshot);
  });

  it('T02: 540–570 start equals now is rejected (AC1)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 540, 570);
    expect(result.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T03: 720–720 zero duration is rejected (AC1)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 720, 720);
    expect(result.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T04: 750–720 reversed interval is rejected (AC1)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 750, 720);
    expect(result.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T05: 1380–1441 end past 1440 is rejected (AC1)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 1380, 1441);
    expect(result.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T06: 720–840 exactly 120 minutes is available (AC2)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 720, 840);
    expect(result.available).toBe(true);
    expectRoomUnchanged(room, snapshot);
  });

  it('T07: 720–841 121 minutes is rejected (AC2)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 720, 841);
    expect(result.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T08: 570–600 touching before existing booking is available (AC4)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 570, 600);
    expect(result.available).toBe(true);
    expectRoomUnchanged(room, snapshot);
  });

  it('T09: 630–690 partial overlap is rejected (AC4)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 630, 690);
    expect(result.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T10: 570–690 containing booking is rejected (AC4)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 570, 690);
    expect(result.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T11: 615–645 inside booking is rejected (AC4)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 615, 645);
    expect(result.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T12: 600–660 identical to booking is rejected (AC4)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 600, 660);
    expect(result.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T13: 660–720 with blocked room is rejected (AC3)', () => {
    const room = makeDefaultRoom();
    room.blocked = true;
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 660, 720);
    expect(result.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T14: 630–690 with no bookings is available (AC4)', () => {
    const room: Room = {
      id: 'empty-room',
      name: 'Empty Room',
      blocked: false,
      bookings: [],
    };
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 630, 690);
    expect(result.available).toBe(true);
    expectRoomUnchanged(room, snapshot);
  });

  it('T15: repeated checks do not mutate room data (AC5)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const first = checkAvailability(room, CURRENT_TIME, 660, 720);
    expect(first.available).toBe(true);
    const second = checkAvailability(room, CURRENT_TIME, 630, 690);
    expect(second.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T16: 1320–1440 upper bounds inclusive is available (AC1/AC2)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 1320, 1440);
    expect(result.available).toBe(true);
    expectRoomUnchanged(room, snapshot);
  });

  it('T17: 700–750 overlapping second booking is rejected (AC4)', () => {
    const room: Room = {
      id: 'two-bookings',
      name: 'Two Booking Room',
      blocked: false,
      bookings: [
        { start: 600, end: 660, label: 'Calculus 101' },
        { start: 720, end: 780, label: 'Physics 201' },
      ],
    };
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 700, 750);
    expect(result.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T18: 500–560 start before now is rejected (AC1)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, 500, 560);
    expect(result.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T19: NaN start is rejected (AC1/AC6)', () => {
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, NaN, 600);
    expect(result).toEqual({ available: false, reason: expect.stringMatching(/valid numbers/i) });
    expectRoomUnchanged(room, snapshot);
  });

  it('T20: real fixtures are unchanged after available and unavailable checks (AC5)', () => {
    const snapshot = structuredClone(rooms);
    const [roomA, roomB, roomC] = rooms;
    expect(checkAvailability(roomA, CURRENT_TIME, 700, 750).available).toBe(true);
    expect(checkAvailability(roomA, CURRENT_TIME, 630, 690).available).toBe(false);
    expect(checkAvailability(roomB, CURRENT_TIME, 700, 750).available).toBe(false);
    expect(checkAvailability(roomC, CURRENT_TIME, 700, 750).available).toBe(true);
    expect(checkAvailability(roomC, CURRENT_TIME, 500, 560).available).toBe(false);
    expect(rooms).toEqual(snapshot);
  });

  it('T21: exported limits are 1440 and 120 and the 120-minute boundary is enforced (AC1/AC2)', () => {
    expect(MINUTES_PER_DAY).toBe(1440);
    expect(MAX_BOOKING_LENGTH).toBe(120);
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const atLimit = checkAvailability(room, CURRENT_TIME, 720, 720 + MAX_BOOKING_LENGTH);
    expect(atLimit.available).toBe(true);
    const overLimit = checkAvailability(room, CURRENT_TIME, 720, 720 + MAX_BOOKING_LENGTH + 1);
    expect(overLimit.available).toBe(false);
    expectRoomUnchanged(room, snapshot);
  });

  it('T22: parseMinutesInput treats empty/whitespace as NaN and feeds the valid-numbers rejection (AC1/AC6)', () => {
    expect(Number.isNaN(parseMinutesInput(''))).toBe(true);
    expect(Number.isNaN(parseMinutesInput('  '))).toBe(true);
    expect(parseMinutesInput('660')).toBe(660);
    const room = makeDefaultRoom();
    const snapshot = structuredClone(room);
    const result = checkAvailability(room, CURRENT_TIME, parseMinutesInput(''), 720);
    expect(result.available).toBe(false);
    expect(result).toEqual({ available: false, reason: expect.stringMatching(/valid numbers/i) });
    expectRoomUnchanged(room, snapshot);
  });
});
