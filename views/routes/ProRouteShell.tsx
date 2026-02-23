import React from 'react';
import type { Professional, User, ViewState } from '../../types';
import { GuardiaoFlowProvider } from '../../src/flow/GuardiaoFlowContext';
import { ProViews } from '../ProViews';

export const ProRouteShell: React.FC<{
  user: Professional;
  view: ViewState;
  setView: (v: ViewState) => void;
  updateUser: (u: User) => void;
  onLogout?: () => void;
}> = ({ user, view, setView, updateUser, onLogout }) => {
  return (
    <GuardiaoFlowProvider>
      <ProViews user={user} view={view} setView={setView} updateUser={updateUser} onLogout={onLogout} />
    </GuardiaoFlowProvider>
  );
};

export default ProRouteShell;

