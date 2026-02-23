import React, { useContext } from 'react';
import type { GuardiaoFlowContextValue } from './GuardiaoFlowContext';
import { GuardiaoFlowContextStore } from './GuardiaoFlowContextStore';

export const useGuardiaoFlow = () => {
  const context = useContext(GuardiaoFlowContextStore as React.Context<GuardiaoFlowContextValue | undefined>);
  if (!context) throw new Error('useGuardiaoFlow must be used within GuardiaoFlowProvider');
  return context;
};
