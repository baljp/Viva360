import React from 'react';
import type { User, ViewState } from '../../types';
import { SantuarioFlowProvider } from '../../src/flow/SantuarioFlowContext';
import { SpaceViews } from '../SpaceViews';

export const SpaceRouteShell: React.FC<{
  user: User;
  view: ViewState;
  setView: (v: ViewState) => void;
  onLogout?: () => void;
}> = ({ user, view, setView, onLogout }) => {
  return (
    <SantuarioFlowProvider>
      <SpaceViews user={user} view={view} setView={setView} onLogout={onLogout} />
    </SantuarioFlowProvider>
  );
};

export default SpaceRouteShell;

