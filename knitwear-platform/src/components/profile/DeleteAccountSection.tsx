'use client';

import { useState } from 'react';
import { deleteAccount } from '@/app/actions/profile';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteAccountSectionProps {
    title: string;
    description: string;
    buttonText: string;
    confirmMessage: string;
    locale: string;
}

export function DeleteAccountSection({
    title,
    description,
    buttonText,
    confirmMessage,
    locale
}: DeleteAccountSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [step, setStep] = useState(0); // 0: closed, 1: initial warning, 2: final confirmation
    const [confirmInput, setConfirmInput] = useState('');
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (confirmInput !== 'delete') {
            setError('Please type "delete" to confirm.');
            return;
        }

        setIsDeleting(true);
        try {
            await deleteAccount();
            window.location.href = `/${locale}`;
        } catch (err: any) {
            alert(err.message);
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex justify-end pt-4">
            <button
                onClick={() => setStep(1)}
                className="text-stone-400 hover:text-rose-500 text-sm font-medium transition-colors flex items-center gap-2"
            >
                <Trash2 className="w-4 h-4" />
                {buttonText}
            </button>

            {step > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => { setStep(0); setConfirmInput(''); setError(''); }}
                            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-2 rounded-full hover:bg-stone-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-2">
                                <AlertTriangle className="w-8 h-8" />
                            </div>

                            {step === 1 ? (
                                <>
                                    <h3 className="text-xl font-bold text-stone-800">Are you sure?</h3>
                                    <p className="text-stone-600 leading-relaxed">
                                        You are about to delete your account. This action cannot be undone. All your data, including patterns and order history, will be permanently removed.
                                    </p>
                                    <div className="flex gap-3 w-full pt-4">
                                        <button
                                            onClick={() => setStep(0)}
                                            className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-700 font-bold hover:bg-stone-200 transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => setStep(2)}
                                            className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-rose-sm transition-all"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold text-stone-800">Final Confirmation</h3>
                                    <p className="text-stone-600 text-sm">
                                        To permanently delete your account, please type <strong>delete</strong> below.
                                    </p>
                                    <input
                                        type="text"
                                        value={confirmInput}
                                        onChange={(e) => { setConfirmInput(e.target.value); setError(''); }}
                                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500 outline-none text-center font-bold"
                                        placeholder="Type 'delete'"
                                        autoFocus
                                    />
                                    {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting || confirmInput !== 'delete'}
                                        className="w-full py-4 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-rose-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete Account Permanently'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
