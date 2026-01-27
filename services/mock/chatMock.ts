
import { User, Message, ChatRoom, ChatParticipant } from '../../types';

export const CHAT_MOCK_DATA = {
  rooms: [
    {
      id: 'chat_001',
      participants: [
        { id: 'user_001', name: 'Você', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200', role: 'CLIENT' },
        { id: 'pro_001', name: 'Mestre Lucas', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200', role: 'PRO' }
      ],
      lastMessage: {
        id: 'msg_103',
        senderId: 'pro_001',
        content: 'Como foi o ritual de respiração hoje?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false
      },
      unreadCount: 1,
      type: 'private',
      isPact: true,
      pactLabel: 'Pacto de Respiração'
    },
    {
       id: 'chat_002',
       participants: [
         { id: 'user_001', name: 'Você', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200', role: 'CLIENT' },
         { id: 'tribe_001', name: 'Tribo Gaia', avatar: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=200', role: 'COMMUNITY' }
       ],
       lastMessage: {
         id: 'msg_205',
         senderId: 'user_999',
         content: 'Alguém para a meditação das 18h?',
         timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
         read: true
       },
       unreadCount: 0,
       type: 'group'
    }
  ] as ChatRoom[],

  messages: {
    'chat_001': [
      { id: 'msg_101', senderId: 'pro_001', content: 'Bem-vindo ao nosso pacto. Estou aqui para te guiar.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true },
      { id: 'msg_102', senderId: 'user_001', content: 'Gratidão Mestre. Sinto que preciso de disciplina.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), read: true },
      { id: 'msg_103', senderId: 'pro_001', content: 'Como foi o ritual de respiração hoje?', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), read: false }
    ]
  } as Record<string, Message[]>
};

export const ChatServiceMock = {
    getRooms: async (): Promise<ChatRoom[]> => {
        return new Promise(resolve => setTimeout(() => resolve(CHAT_MOCK_DATA.rooms), 500));
    },
    getMessages: async (roomId: string): Promise<Message[]> => {
        return new Promise(resolve => setTimeout(() => resolve(CHAT_MOCK_DATA.messages[roomId] || []), 300));
    },
    sendMessage: async (roomId: string, content: string, senderId: string): Promise<Message> => {
        const newMsg: Message = {
            id: `msg_${Date.now()}`,
            senderId,
            content,
            timestamp: new Date().toISOString(),
            read: true
        };
        // In-memory push
        if(CHAT_MOCK_DATA.messages[roomId]) CHAT_MOCK_DATA.messages[roomId].push(newMsg);
        
        // Update last message
        const room = CHAT_MOCK_DATA.rooms.find(r => r.id === roomId);
        if(room) {
            room.lastMessage = newMsg;
        }

        return new Promise(resolve => setTimeout(() => resolve(newMsg), 300));
    }
};
