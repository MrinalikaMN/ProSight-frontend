import { createContext, useContext } from 'react';

export const ToastContext = createContext(() => {});
// toast('Saved') or toast('Something failed', 'error')
export const useToast = () => useContext(ToastContext);
