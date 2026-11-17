import { useState } from 'react';
import { RoomAvailabilityChecker } from '@/components/RoomAvailabilityChecker';
import { rooms as initialRooms } from '@/data/rooms';
import type { Room } from '@/types';

function App() {
  const [rooms] = useState<Room[]>(initialRooms);

  return (
    <div className="min-h-screen bg-slate-50">
      <RoomAvailabilityChecker rooms={rooms} />
    </div>
  );
}

export default App;
