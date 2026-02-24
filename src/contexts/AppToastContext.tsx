import React, { createContext, useContext } from 'react';

export type AppToast = {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
};

type AppToastContextValue = {
  toast: AppToast | null;
  showToast: (toast: AppToast) => void;
  clearToast: () => void;
};

const AppToastContext = createContext<AppToastContextValue | undefined>(undefined);

export const AppToastProvider: React.FC<{
  toast: AppToast | null;
  setToast: React.Dispatch<React.SetStateAction<AppToast | null>>;
  children: React.ReactNode;
}> = ({ toast, setToast, children }) => {
  return (
    <AppToastContext.Provider
      value={{
        toast,
        showToast: (nextToast) => setToast(nextToast),
        clearToast: () => setToast(null),
      }}
    >
      {children}
    </AppToastContext.Provider>
  );
};

export const useAppToast = () => {
  const context = useContext(AppToastContext);
  if (!context) throw new Error('useAppToast must be used within AppToastProvider');
  return context;
};
