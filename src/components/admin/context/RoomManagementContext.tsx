
import React, { createContext, useContext, useState } from 'react';
import { Room } from '@/lib/types';

interface RoomManagementContextType {
  selectedBuilding: string;
  setSelectedBuilding: (id: string) => void;
  selectedFloor: number | null;
  setSelectedFloor: (floor: number | null) => void;
  roomFilter: string;
  setRoomFilter: (filter: string) => void;
  filteredRooms: Room[];
  setFilteredRooms: (rooms: Room[]) => void;
}

const RoomManagementContext = createContext<RoomManagementContextType | undefined>(undefined);

export const RoomManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [roomFilter, setRoomFilter] = useState("");
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);

  return (
    <RoomManagementContext.Provider value={{
      selectedBuilding,
      setSelectedBuilding,
      selectedFloor,
      setSelectedFloor,
      roomFilter,
      setRoomFilter,
      filteredRooms,
      setFilteredRooms,
    }}>
      {children}
    </RoomManagementContext.Provider>
  );
};

export const useRoomManagement = () => {
  const context = useContext(RoomManagementContext);
  if (undefined === context) {
    throw new Error('useRoomManagement must be used within a RoomManagementProvider');
  }
  return context;
};
