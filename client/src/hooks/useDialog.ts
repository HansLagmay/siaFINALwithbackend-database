import { useState, useCallback } from 'react';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export interface PromptConfig {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'number';
}

export interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ConfirmDialogState {
  type: 'confirm';
  isOpen: boolean;
  config: ConfirmConfig;
  resolve: (value: boolean) => void;
}

interface PromptDialogState {
  type: 'prompt';
  isOpen: boolean;
  config: PromptConfig;
  resolve: (value: string | null) => void;
}

interface NoDialogState {
  type: null;
  isOpen: boolean;
  config: null;
  resolve: null;
}

type DialogState = ConfirmDialogState | PromptDialogState | NoDialogState;

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
  isVisible: boolean;
}

export const useDialog = () => {
  const [dialogState, setDialogState] = useState<DialogState>({
    type: null,
    isOpen: false,
    config: null,
    resolve: null
  });

  const [toastState, setToastState] = useState<ToastState>({
    message: '',
    type: 'info',
    duration: 3000,
    isVisible: false
  });

  const openConfirm = useCallback((config: ConfirmConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        type: 'confirm',
        isOpen: true,
        config,
        resolve
      });
    });
  }, []);

  const openPrompt = useCallback((config: PromptConfig): Promise<string | null> => {
    return new Promise((resolve) => {
      setDialogState({
        type: 'prompt',
        isOpen: true,
        config,
        resolve
      });
    });
  }, []);

  const showToast = useCallback((config: ToastConfig) => {
    setToastState({
      message: config.message,
      type: config.type,
      duration: config.duration || 3000,
      isVisible: true
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialogState.type === 'confirm' && dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState({ type: null, isOpen: false, config: null, resolve: null });
  }, [dialogState]);

  const handleCancel = useCallback(() => {
    if (dialogState.type === 'confirm' && dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState({ type: null, isOpen: false, config: null, resolve: null });
  }, [dialogState]);

  const handlePromptSubmit = useCallback((value: string) => {
    if (dialogState.type === 'prompt' && dialogState.resolve) {
      dialogState.resolve(value);
    }
    setDialogState({ type: null, isOpen: false, config: null, resolve: null });
  }, [dialogState]);

  const handlePromptCancel = useCallback(() => {
    if (dialogState.type === 'prompt' && dialogState.resolve) {
      dialogState.resolve(null);
    }
    setDialogState({ type: null, isOpen: false, config: null, resolve: null });
  }, [dialogState]);

  const closeToast = useCallback(() => {
    setToastState(prev => ({ ...prev, isVisible: false }));
  }, []);

  return {
    // Dialog methods
    openConfirm,
    openPrompt,
    showToast,
    
    // Dialog state
    dialogState,
    toastState,
    
    // Dialog handlers
    handleConfirm,
    handleCancel,
    handlePromptSubmit,
    handlePromptCancel,
    closeToast
  };
};
