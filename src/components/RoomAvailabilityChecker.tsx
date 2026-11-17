import { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  DoorOpen,
  Ban,
  CalendarClock,
  Info,
  Sparkles,
} from 'lucide-react';
import type { Room, AvailabilityResult } from '@/types';
import {
  checkAvailability,
  formatTime,
  formatDuration,
  MAX_BOOKING_LENGTH,
  MINUTES_PER_DAY,
  parseMinutesInput,
} from '@/lib/availability';
import { explainAvailability } from '@/lib/explain';

interface Props {
  rooms: Room[];
}

export function RoomAvailabilityChecker({ rooms }: Props) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id ?? '');
  const [currentTime, setCurrentTime] = useState<number>(540);
  const [startTime, setStartTime] = useState<number>(700);
  const [endTime, setEndTime] = useState<number>(750);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState<boolean>(false);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) ?? rooms[0],
    [rooms, selectedRoomId]
  );

  const result: AvailabilityResult | null = useMemo(() => {
    if (!selectedRoom) return null;
    return checkAvailability(selectedRoom, currentTime, startTime, endTime);
  }, [selectedRoom, currentTime, startTime, endTime]);

  const duration =
    Number.isFinite(startTime) && Number.isFinite(endTime)
      ? Math.max(0, endTime - startTime)
      : 0;

  useEffect(() => {
    setExplanation(null);
  }, [selectedRoomId, currentTime, startTime, endTime]);

  const handleExplain = async () => {
    if (!selectedRoom || !result) return;
    setExplaining(true);
    try {
      const text = await explainAvailability(
        selectedRoom,
        currentTime,
        startTime,
        endTime,
        result
      );
      setExplanation(text);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-sm">
              <DoorOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Smart Campus Room Availability
              </h1>
              <p className="text-sm text-slate-500">
                Check whether a room is free for your desired time slot.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Inputs */}
          <section className="lg:col-span-2 space-y-5">
            {/* Room selector */}
            <Card>
              <CardHeader
                icon={<DoorOpen className="w-4 h-4" />}
                title="Select Room"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {rooms.map((room) => {
                  const isActive = room.id === selectedRoomId;
                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`
                        relative text-left px-4 py-3 rounded-lg border-2 transition-all duration-200
                        ${
                          isActive
                            ? 'border-blue-600 bg-blue-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }
                      `}
                    >
                      <span
                        className={`block text-sm font-semibold ${
                          isActive ? 'text-blue-700' : 'text-slate-700'
                        }`}
                      >
                        {room.name}
                      </span>
                      <span className="flex items-center gap-1 mt-1 text-xs">
                        {room.blocked ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                            <Ban className="w-3 h-3" /> Blocked
                          </span>
                        ) : room.bookings.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <CalendarClock className="w-3 h-3" />
                            {room.bookings.length} booking{room.bookings.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">
                            No bookings
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Time inputs */}
            <Card>
              <CardHeader
                icon={<Clock className="w-4 h-4" />}
                title="Time Window"
                subtitle="All values are minutes from midnight (0–1440)."
              />
              <div className="space-y-4">
                <NumberField
                  label="Current Time"
                  value={currentTime}
                  onChange={setCurrentTime}
                  min={0}
                  max={MINUTES_PER_DAY}
                  hint={formatTime(currentTime)}
                />
                <NumberField
                  label="Start Time"
                  value={startTime}
                  onChange={setStartTime}
                  min={0}
                  max={MINUTES_PER_DAY}
                  hint={formatTime(startTime)}
                />
                <NumberField
                  label="End Time"
                  value={endTime}
                  onChange={setEndTime}
                  min={0}
                  max={MINUTES_PER_DAY}
                  hint={formatTime(endTime)}
                />
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="text-slate-500">Requested duration</span>
                  <span
                    className={`font-semibold ${
                      duration > MAX_BOOKING_LENGTH
                        ? 'text-rose-600'
                        : duration > 0
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {formatDuration(duration)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Result */}
            {result && (
              <div className="space-y-3">
                <ResultBanner result={result} roomName={selectedRoom.name} />
                <button
                  type="button"
                  onClick={handleExplain}
                  disabled={explaining}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  {explaining ? 'Explaining…' : 'Explain availability'}
                </button>
                {explaining && (
                  <p className="text-sm text-slate-500">Generating explanation…</p>
                )}
                {explanation && !explaining && (
                  <p className="text-sm text-slate-600">{explanation}</p>
                )}
              </div>
            )}
          </section>

          {/* Right: Room detail */}
          <section className="lg:col-span-3 space-y-5">
            <Card>
              <CardHeader
                icon={<CalendarClock className="w-4 h-4" />}
                title={`${selectedRoom.name} — Overview`}
              />

              {/* Status pills */}
              <div className="flex flex-wrap gap-2 mb-5">
                {selectedRoom.blocked ? (
                  <StatusPill
                    color="rose"
                    icon={<Ban className="w-3.5 h-3.5" />}
                    label="Blocked"
                  />
                ) : (
                  <StatusPill
                    color="emerald"
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    label="Not Blocked"
                  />
                )}
                <StatusPill
                  color="blue"
                  icon={<CalendarClock className="w-3.5 h-3.5" />}
                  label={`${selectedRoom.bookings.length} existing booking${selectedRoom.bookings.length !== 1 ? 's' : ''}`}
                />
              </div>

              {/* Bookings list */}
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Existing Bookings
                </h3>
                {selectedRoom.bookings.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">
                    No existing bookings for this room.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedRoom.bookings.map((b, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {b.label}
                        </span>
                        <span className="text-sm tabular-nums text-slate-500">
                          {formatTime(b.start)}–{formatTime(b.end)}
                          <span className="text-slate-400 ml-2">
                            ({formatDuration(b.end - b.start)})
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* Rules reference */}
            <Card>
              <CardHeader
                icon={<Info className="w-4 h-4" />}
                title="Booking Rules"
              />
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  Interval must satisfy 0 ≤ start &lt; end ≤ 1440, and start must be after the current time.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  Maximum booking length is 120 minutes.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  Blocked rooms cannot be booked.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">•</span>
                  Overlapping existing bookings are rejected; touching endpoints (e.g. 600–660 then 660–720) are allowed.
                </li>
              </ul>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

// --- Sub-components ---

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <span className="text-blue-600">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-slate-400 mt-1 ml-6">{subtitle}</p>}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  hint: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-xs tabular-nums text-slate-400">{hint}</span>
      </div>
      <input
        type="number"
        value={Number.isNaN(value) ? '' : value}
        min={min}
        max={max}
        onChange={(e) => {
          onChange(parseMinutesInput(e.target.value));
        }}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      />
    </div>
  );
}

function StatusPill({
  color,
  icon,
  label,
}: {
  color: 'rose' | 'emerald' | 'blue';
  icon: React.ReactNode;
  label: string;
}) {
  const colors = {
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[color]}`}
    >
      {icon}
      {label}
    </span>
  );
}

function ResultBanner({
  result,
  roomName,
}: {
  result: AvailabilityResult;
  roomName: string;
}) {
  if (result.available) {
    return (
      <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-base font-bold text-emerald-800">Available</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              {roomName} is free for your requested time slot. No existing data was modified.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-base font-bold text-rose-800">Unavailable</p>
          <p className="text-sm text-rose-700 mt-0.5">{result.reason}</p>
        </div>
      </div>
    </div>
  );
}
