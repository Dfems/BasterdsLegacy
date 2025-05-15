import { useContext } from 'react';
import MainLayoutContext from '../contexts/MainLayoutContext';

const useMainLayout = () => {
    const context = useContext(MainLayoutContext);
    if (!context) {
        throw new Error('useMainLayout must be used within a MainLayoutProvider');
    }
    return context;
};

export default useMainLayout;