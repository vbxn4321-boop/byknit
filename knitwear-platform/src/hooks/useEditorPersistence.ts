'use client';

import { useState, useEffect, useCallback } from 'react';

export interface EditorSession {
    id: string;
    name: string;
    width: number;
    height: number;
    grid: { color: string; symbol: string }[][];
    palette: string[];
    lastModified: string;
}

const STORAGE_KEY = 'knitwear-editor-session';
const AI_IMPORT_KEY = 'knitwear-ai-import';

export function useEditorPersistence() {
    const [isLoaded, setIsLoaded] = useState(false);

    const saveSession = useCallback((session: Omit<EditorSession, 'id' | 'lastModified'>) => {
        try {
            const fullSession: EditorSession = {
                ...session,
                id: crypto.randomUUID(),
                lastModified: new Date().toISOString(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fullSession));
            return true;
        } catch (error) {
            console.error('Failed to save session:', error);
            return false;
        }
    }, []);

    const loadSession = useCallback((): EditorSession | null => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                setIsLoaded(true);
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error('Failed to load session:', error);
            return null;
        }
    }, []);

    const clearSession = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Failed to clear session:', error);
            return false;
        }
    }, []);

    // AI Import functions
    const saveAIImport = useCallback((data: {
        grid: number[][];
        palette: string[];
        width: number;
        height: number;
    }) => {
        try {
            sessionStorage.setItem(AI_IMPORT_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save AI import:', error);
            return false;
        }
    }, []);

    const loadAIImport = useCallback(() => {
        try {
            const data = sessionStorage.getItem(AI_IMPORT_KEY);
            if (data) {
                sessionStorage.removeItem(AI_IMPORT_KEY); // Clear after loading
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error('Failed to load AI import:', error);
            return null;
        }
    }, []);

    const hasAIImport = useCallback(() => {
        return sessionStorage.getItem(AI_IMPORT_KEY) !== null;
    }, []);

    return {
        isLoaded,
        saveSession,
        loadSession,
        clearSession,
        saveAIImport,
        loadAIImport,
        hasAIImport,
    };
}
