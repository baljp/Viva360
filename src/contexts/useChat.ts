import React, { useContext } from 'react';
import type { ChatContextType } from './ChatContext';
import { ChatContextStore } from './ChatContextStore';

export const useChat = () => {
  const context = useContext(ChatContextStore as React.Context<ChatContextType>);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
