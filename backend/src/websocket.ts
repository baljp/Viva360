import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './config/database';
import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient, isRedisAvailable } from './config/redis';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
  userRole?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'notification';
}

interface OnlineUser {
  odId: string;
  name: string;
  role: string;
  socketId: string;
}

// Store online users (fallback for non-Redis mode)
const onlineUsers = new Map<string, OnlineUser>();

export const initializeWebSocket = async (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Set up Redis adapter for cluster-safe WebSocket
  const redisAvailable = await isRedisAvailable();
  if (redisAvailable) {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('💬 WebSocket using Redis adapter (cluster-safe)');
  } else {
    console.log('💬 WebSocket using in-memory adapter (single instance)');
  }

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, role: true },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.userName = user.name;
      socket.userRole = user.role;
      
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 User connected: ${socket.userName} (${socket.userId})`);

    // Add to online users
    if (socket.userId) {
      onlineUsers.set(socket.userId, {
        odId: socket.userId,
        name: socket.userName || '',
        role: socket.userRole || '',
        socketId: socket.id,
      });

      // Broadcast online status
      io.emit('user:online', {
        userId: socket.userId,
        name: socket.userName,
        role: socket.userRole,
      });
    }

    // Join user's room for direct messages
    socket.join(`user:${socket.userId}`);

    // Handle private messages
    socket.on('message:send', async (data: { receiverId: string; content: string }) => {
      try {
        const { receiverId, content } = data;

        // Save message to database
        const message = await prisma.message.create({
          data: {
            senderId: socket.userId!,
            receiverId,
            content,
          },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        });

        const chatMessage: ChatMessage = {
          id: message.id,
          senderId: socket.userId!,
          senderName: socket.userName!,
          receiverId,
          content,
          timestamp: message.createdAt,
          type: 'text',
        };

        // Send to receiver
        io.to(`user:${receiverId}`).emit('message:receive', chatMessage);
        
        // Confirm to sender
        socket.emit('message:sent', chatMessage);

        // Create notification for receiver
        await prisma.notification.create({
          data: {
            userId: receiverId,
            title: 'Nova mensagem',
            message: `${socket.userName} enviou uma mensagem`,
            type: 'MESSAGE',
          },
        });

        // Send real-time notification
        io.to(`user:${receiverId}`).emit('notification:new', {
          title: 'Nova mensagem',
          message: `${socket.userName} enviou uma mensagem`,
          type: 'MESSAGE',
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });

    // Get chat history
    socket.on('message:history', async (data: { partnerId: string; limit?: number }) => {
      try {
        const { partnerId, limit = 50 } = data;

        const messages = await prisma.message.findMany({
          where: {
            OR: [
              { senderId: socket.userId!, receiverId: partnerId },
              { senderId: partnerId, receiverId: socket.userId! },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        });

        socket.emit('message:history', messages.reverse());
      } catch (error) {
        socket.emit('message:error', { error: 'Failed to load history' });
      }
    });

    // Typing indicators
    socket.on('typing:start', (data: { receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('typing:start', {
        userId: socket.userId,
        userName: socket.userName,
      });
    });

    socket.on('typing:stop', (data: { receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('typing:stop', {
        userId: socket.userId,
      });
    });

    // Get online users
    socket.on('users:online', () => {
      socket.emit('users:online', Array.from(onlineUsers.values()));
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userName}`);
      
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        io.emit('user:offline', { userId: socket.userId });
      }
    });
  });

  console.log('💬 WebSocket server initialized');
  return io;
};

export { onlineUsers };
