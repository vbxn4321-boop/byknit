'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CrisisButton() {
    const router = useRouter();

    const handleEmergencyReset = () => {
        if (!confirm('This will clear all local data and log you out. Continue?')) return;

        // 1. Clear Local Storage
        localStorage.clear();
        sessionStorage.clear();

        // 2. Clear Cookies (Client-side attempt)
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // 3. Force Hard Reload to Root
        window.location.href = '/';
    };

    return (
        <button
            onClick={handleEmergencyReset}
            style={{
                zIndex: 2147483647,
                pointerEvents: 'auto',
                position: 'fixed'
            }}
            className="bottom-4 right-4 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 transition-all flex items-center gap-2 font-bold border-4 border-white animate-pulse"
            title="Emergency Reset"
        >
            <Trash2 size={24} />
            <span className="sr-only">Reset App</span>
        </button>
    );
}
