'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global Error:', error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4 font-sans">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-2 border-red-200">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Critial Error!</h2>
                        <p className="text-gray-600 mb-8">{error.message}</p>
                        <button
                            onClick={() => reset()}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
