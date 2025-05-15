import { createContext } from 'react';

interface MainLayoutContextType {
  handleLogin?: () => void;
}

const MainLayoutContext = createContext<MainLayoutContextType>({});

export default MainLayoutContext;