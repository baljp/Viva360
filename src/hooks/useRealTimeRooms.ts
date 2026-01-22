import { useState, useCallback, useEffect, useRef } from 'react';
import { io as socketIO, Socket } from 'socket.io-client';

// ==========================================
// REAL-TIME ROOMS HOOK
// For: Santuário (Space) Profile
// Live room status, IoT sensors, bookings
// ==========================================

interface RoomSensor {
  motion: boolean;
  temperature: number;
  humidity: number;
  lightLevel: number;
  lastUpdate: string;
}

interface NextBooking {
  userName: string;
  startTime: string;
  endTime: string;
}

interface RealTimeRoom {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  currentOccupant?: string;
  currentOccupantAvatar?: string;
  currentBookingEndsAt?: string;
  nextBooking: NextBooking | null;
  todayBookingsCount: number;
  availableSlots: string[];
  sensors: RoomSensor;
  updatedAt: string;
}

interface RoomSummary {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
}

interface RoomBooking {
  id: string;
  roomId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: string;
}

interface TimeSlot {
  time: string;
  endTime: string;
  isAvailable: boolean;
  booking: {
    id: string;
    userName: string;
    userAvatar?: string;
    startTime: string;
    endTime: string;
  } | null;
}

interface SpaceAnalytics {
  summary: {
    totalRooms: number;
    totalBookings: number;
    totalRevenue: number;
    avgOccupancy: number;
  };
  roomStats: {
    roomId: string;
    roomName: string;
    bookingsCount: number;
    totalHours: number;
    occupancyRate: number;
    revenue: number;
  }[];
  dailyStats: {
    date: string;
    bookings: number;
    revenue: number;
    hours: number;
  }[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

const getHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

export function useRealTimeRooms(spaceId?: string) {
  const [rooms, setRooms] = useState<RealTimeRoom[]>([]);
  const [summary, setSummary] = useState<RoomSummary | null>(null);
  const [analytics, setAnalytics] = useState<SpaceAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch rooms with real-time status
  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/rooms/real-time`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
      setSummary(data.summary || null);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar salas';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update room status
  const updateRoomStatus = useCallback(async (
    roomId: string, 
    status: 'available' | 'occupied' | 'maintenance',
    currentOccupant?: string,
    reason?: string
  ) => {
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, currentOccupant, reason }),
      });
      if (!res.ok) throw new Error('Failed to update room status');
      const data = await res.json();
      
      // Update local state immediately
      setRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { ...room, status, currentOccupant: status === 'occupied' ? currentOccupant : undefined }
          : room
      ));
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
      setError(message);
      return null;
    }
  }, []);

  // Create room booking
  const createBooking = useCallback(async (
    roomId: string,
    date: string,
    startTime: string,
    endTime: string,
    price?: number
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/rooms/bookings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ roomId, date, startTime, endTime, price }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }
      const data = await res.json();
      
      // Refresh rooms data
      await fetchRooms();
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar reserva';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchRooms]);

  // Cancel room booking
  const cancelBooking = useCallback(async (bookingId: string) => {
    try {
      const res = await fetch(`${API_URL}/rooms/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to cancel booking');
      const data = await res.json();
      
      // Refresh rooms data
      await fetchRooms();
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cancelar reserva';
      setError(message);
      return null;
    }
  }, [fetchRooms]);

  // Get room schedule for specific date
  const getRoomSchedule = useCallback(async (roomId: string, date?: string): Promise<TimeSlot[] | null> => {
    try {
      const params = date ? `?date=${date}` : '';
      const res = await fetch(`${API_URL}/rooms/${roomId}/schedule${params}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch schedule');
      const data = await res.json();
      return data.slots || [];
    } catch (err) {
      console.error('Failed to fetch schedule:', err);
      return null;
    }
  }, []);

  // Fetch space analytics
  const fetchAnalytics = useCallback(async (period: number = 7) => {
    try {
      const res = await fetch(`${API_URL}/rooms/analytics?period=${period}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAnalytics(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      return null;
    }
  }, []);

  // Simulate IoT trigger (for demo/testing)
  const simulateIoT = useCallback(async (
    roomId: string,
    sensorType: 'motion' | 'door' | 'temperature' | 'light',
    value: any
  ) => {
    try {
      const res = await fetch(`${API_URL}/rooms/iot/trigger`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ roomId, sensorType, value }),
      });
      if (!res.ok) throw new Error('Failed to trigger IoT');
      return await res.json();
    } catch (err) {
      console.error('IoT simulation error:', err);
      return null;
    }
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!spaceId) return;

    const token = localStorage.getItem('access_token');
    
    try {
      socketRef.current = socketIO(WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socketRef.current.on('connect', () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        socketRef.current?.emit('join:space', spaceId);
      });

      socketRef.current.on('disconnect', () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
      });

      // Real-time room status updates
      socketRef.current.on('room:statusChange', (data) => {
        console.log('🚪 Room status changed:', data);
        setRooms(prev => prev.map(room =>
          room.id === data.roomId
            ? { ...room, status: data.status, currentOccupant: data.currentOccupant }
            : room
        ));
      });

      // New booking created
      socketRef.current.on('room:newBooking', (data) => {
        console.log('📅 New booking:', data);
        fetchRooms(); // Refresh all rooms data
      });

      // Booking cancelled
      socketRef.current.on('room:bookingCancelled', (data) => {
        console.log('❌ Booking cancelled:', data);
        fetchRooms(); // Refresh all rooms data
      });

      // IoT sensor updates
      socketRef.current.on('room:sensorUpdate', (data) => {
        console.log('📡 Sensor update:', data);
        setRooms(prev => prev.map(room =>
          room.id === data.roomId
            ? {
                ...room,
                status: data.newStatus || room.status,
                sensors: { ...room.sensors, [data.sensorType]: data.value }
              }
            : room
        ));
      });

    } catch (err) {
      console.warn('WebSocket connection failed, falling back to polling');
      // Fallback to polling if WebSocket fails
      pollingRef.current = setInterval(fetchRooms, 30000);
    }

    return () => {
      socketRef.current?.disconnect();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [spaceId, fetchRooms]);

  // Initial load
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    // State
    rooms,
    summary,
    analytics,
    isLoading,
    error,
    isConnected,
    
    // Actions
    fetchRooms,
    updateRoomStatus,
    createBooking,
    cancelBooking,
    getRoomSchedule,
    fetchAnalytics,
    simulateIoT,
    
    // Computed
    availableRooms: rooms.filter(r => r.status === 'available'),
    occupiedRooms: rooms.filter(r => r.status === 'occupied'),
    roomsInMaintenance: rooms.filter(r => r.status === 'maintenance'),
  };
}
