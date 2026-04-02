/**
 * SessionContext – Global session store
 * Holds authenticated user data (custId, branchId, custName, etc.)
 * after successful login. Shared across all screens.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@idhayam_session';

export interface SessionData {
    custId: string;
    branchId: string;
    userId: string;
    custName: string;
    custType: string;
    partyMudId: string;
    hubName: string;
    territoryName: string;
    gstNo: string;
    pan: string;
    mobile: string;
    branchName: string;
}

interface SessionContextValue {
    session: SessionData | null;
    setSession: (data: SessionData) => Promise<void>;
    clearSession: () => Promise<void>;
}

const DEFAULT_SESSION: SessionData = {
    custId: '',
    branchId: '',
    userId: '2937', 
    custName: '',
    custType: 'CM',
    partyMudId: '',
    hubName: '',
    territoryName: '',
    gstNo: '',
    pan: '',
    mobile: '',
    branchName: '',
};

const SessionContext = createContext<SessionContextValue>({
    session: null,
    setSession: async () => {},
    clearSession: async () => {},
});

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSessionState] = useState<SessionData | null>(null);

    const setSession = useCallback(async (data: SessionData) => {
        setSessionState(data);
        try {
            await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to persist session:', e);
        }
    }, []);

    const clearSession = useCallback(async () => {
        setSessionState(null);
        try {
            await AsyncStorage.removeItem(SESSION_KEY);
        } catch (e) {
            console.warn('Failed to clear session:', e);
        }
    }, []);

    // Restore session from storage on mount
    React.useEffect(() => {
        AsyncStorage.getItem(SESSION_KEY).then(stored => {
            if (stored) {
                try {
                    setSessionState(JSON.parse(stored));
                } catch { }
            }
        });
    }, []);

    return (
        <SessionContext.Provider value={{ session, setSession, clearSession }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = (): SessionContextValue => useContext(SessionContext);

export { DEFAULT_SESSION };
export default SessionContext;
