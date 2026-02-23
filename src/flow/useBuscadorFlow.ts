import React, { useContext } from 'react';
import type { BuscadorFlowContextValue } from './BuscadorFlowContext';
import { BuscadorFlowContextStore } from './BuscadorFlowContextStore';

export const useBuscadorFlow = () => {
  const context = useContext(BuscadorFlowContextStore as React.Context<BuscadorFlowContextValue | undefined>);
  if (!context) {
    throw new Error('useBuscadorFlow must be used within a BuscadorFlowProvider');
  }
  return context;
};
