'use client'; 
import React, { createContext, useContext } from 'react';
import { ToastContainer, toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Create a Context with the type definition for showToast
interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error', options?: ToastOptions) => void;
}

// Create the context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Custom Hook to use Toast Context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ToastProvider Component
interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const showToast = (message: string, type: 'success' | 'error', options?: ToastOptions) => {
    if (type === 'success') {
      toast.success(message, options);
    } else {
      toast.error(message, options);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar />
    </ToastContext.Provider>
  );
};