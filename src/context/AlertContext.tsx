import React, { createContext, useContext, useState, useCallback } from 'react';

type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

interface AlertOptions {
    title?: string;
    message: string;
    type: AlertType;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface AlertContextType {
    showAlert: (message: string, type?: AlertType, title?: string) => void;
    showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
    closeAlert: () => void;
    alertState: AlertOptions & { show: boolean };
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alertState, setAlertState] = useState<AlertOptions & { show: boolean }>({
        show: false,
        message: '',
        type: 'info',
        title: ''
    });

    const showAlert = useCallback((message: string, type: AlertType = 'info', title?: string) => {
        setAlertState({
            show: true,
            message,
            type,
            title: title || (type === 'error' ? 'Error' : type === 'success' ? 'Éxito' : 'Aviso'),
            onConfirm: undefined,
            onCancel: undefined
        });
    }, []);

    const showConfirm = useCallback((message: string, onConfirm: () => void, title: string = 'Confirmar Acción') => {
        setAlertState({
            show: true,
            message,
            type: 'confirm',
            title,
            onConfirm: () => {
                setAlertState(prev => ({ ...prev, show: false }));
                onConfirm();
            },
            onCancel: () => setAlertState(prev => ({ ...prev, show: false }))
        });
    }, []);

    const closeAlert = useCallback(() => {
        setAlertState(prev => ({ ...prev, show: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm, closeAlert, alertState }}>
            {children}
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) throw new Error('useAlert must be used within AlertProvider');
    return context;
};
