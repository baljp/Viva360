import React, { useContext } from 'react';
import type { SantuarioFlowContextValue } from './SantuarioFlowContext';
import { SantuarioFlowContextStore } from './SantuarioFlowContextStore';

export const useSantuarioFlow = () => {
  const context = useContext(SantuarioFlowContextStore as React.Context<SantuarioFlowContextValue | undefined>);
  if (!context) throw new Error('useSantuarioFlow must be used within SantuarioFlowProvider');
  return context;
};
