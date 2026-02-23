import React from 'react';
import type { Product, User, ViewState } from '../../types';
import { BuscadorFlowProvider } from '../../src/flow/BuscadorFlowContext';
import { ClientViews } from '../ClientViews';

export const ClientRouteShell: React.FC<{
  user: User;
  view: ViewState;
  setView: (v: ViewState) => void;
  updateUser: (u: User) => void;
  onAddToCart: (p: Product) => void;
  onLogout: () => void;
}> = ({ user, view, setView, updateUser, onAddToCart, onLogout }) => {
  return (
    <BuscadorFlowProvider>
      <ClientViews
        user={user}
        view={view}
        setView={setView}
        updateUser={updateUser}
        onAddToCart={onAddToCart}
        onLogout={onLogout}
      />
    </BuscadorFlowProvider>
  );
};

export default ClientRouteShell;

