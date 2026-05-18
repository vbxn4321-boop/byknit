"use client";

import { useState, useEffect } from 'react';
import { PenTool } from 'lucide-react';

export function EditorDemo() {
    const [activeCells, setActiveCells] = useState<number[]>([
        0, 0, 1, 0, 1, 0, 0,
        0, 1, 1, 1, 1, 1, 0,
        1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1,
        0, 1, 1, 1, 1, 1, 0,
        0, 0, 1, 1, 1, 0, 0,
        0, 0, 0, 1, 0, 0, 0
    ]);

    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isClicking, setIsClicking] = useState(false);
    const [cursorVisible, setCursorVisible] = useState(false); // Start hidden until animation begins

    useEffect(() => {
        // Animation sequence
        // 1. Clear heart
        // 2. Move cursor to draw it again

        let timeout: NodeJS.Timeout;
        let step = 0;

        const animate = () => {
            // Steps to draw the heart roughly
            // Let's pretend we are "filling" some missing pixels
            // For simplicity, let's just toggle some pixels on/off to make it look "alive"

            // Sequence: 
            // - Cursor moves to a specific empty spot
            // - Clicks (filling it)
            // - Moves to another
            // - Clicks

            // Actually, let's just make the cursor move around and "paint" the heart from scratch? 
            // Or easier: make the cursor hover over existing cells and "pop" them.

            // Let's go with: Cursor moves to (2, 2) [index 16], clicks.

            // Simpler loop: Move -> Click -> Toggle -> Wait -> Repeat

            // Let's define keyframes for the cursor movement relative to the grid
            // Grid is 7x7. Let's assume approx coordinates.
            // Normalized coordinates (0-100%)

            const steps = [
                { x: 30, y: 30, action: 'move', delay: 1000 },
                { x: 30, y: 30, action: 'click', index: 16, delay: 200 },
                { x: 50, y: 80, action: 'move', delay: 800 },
                { x: 50, y: 80, action: 'click', index: 45, delay: 200 }, // Tip
                { x: 80, y: 30, action: 'move', delay: 800 },
                { x: 80, y: 30, action: 'click', index: 20, delay: 200 },
                { x: 100, y: 100, action: 'idle', delay: 2000 } // Move away
            ];

            const loop = async () => {
                setCursorVisible(true);

                // Keep the heart mostly full but maybe remove a few pieces to start with?
                // Or just toggle them.

                // Let's make it simpler: Just move the cursor to a few spots and animate the scale of the cells
                // without actually changing the state (mock interaction).
                // Or actually changing state is cooler.

                // Start with a 'perfect' heart.
                // Step 1: Cursor moves to removing a pixel (toggle off)
                // Step 2: Cursor moves to put it back (toggle on)

                const sequence = [
                    { x: 20, y: 40, index: 14, type: 'toggle' }, // Left edge
                    { x: 80, y: 40, index: 20, type: 'toggle' }, // Right edge
                    { x: 50, y: 90, index: 45, type: 'toggle' }, // Bottom tip
                ];

                for (const frame of sequence) {
                    // Move
                    setCursorPos({ x: frame.x, y: frame.y });
                    await new Promise(r => setTimeout(r, 800));

                    // Click down
                    setIsClicking(true);
                    await new Promise(r => setTimeout(r, 150));

                    // Action
                    setActiveCells(prev => {
                        const next = [...prev];
                        next[frame.index] = next[frame.index] ? 0 : 1;
                        return next;
                    });
                    await new Promise(r => setTimeout(r, 150));

                    // Click up
                    setIsClicking(false);
                    await new Promise(r => setTimeout(r, 500));
                }

                // Move away effectively hiding it or just parking it
                setCursorPos({ x: 90, y: 90 });

                // Schedule next loop
                timeout = setTimeout(loop, 2000);
            };

            loop();
        };

        timeout = setTimeout(animate, 1000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="relative group w-full h-full">
            <div className="aspect-square rounded-3xl bg-white border border-tan-200 shadow-soft-lg overflow-hidden flex flex-col h-full">
                {/* Mock Window Header */}
                <div className="h-12 border-b border-tan-100 bg-cream-50 flex items-center px-4 gap-2 flex-shrink-0">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-rose-300/60" />
                        <div className="w-3 h-3 rounded-full bg-sage-300/60" />
                        <div className="w-3 h-3 rounded-full bg-peach-300/60" />
                    </div>
                    <div className="ml-4 w-32 h-2 rounded-full bg-tan-200/50" />
                </div>

                {/* Mock Editor Area */}
                <div className="flex-1 flex p-6 gap-6 relative bg-white min-h-0">
                    {/* Mock Toolbar */}
                    <div className="w-12 flex flex-col gap-3 py-2 flex-shrink-0">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-10 h-10 rounded-xl bg-tan-100/50 flex items-center justify-center hover:bg-rose-50 transition-colors cursor-pointer">
                                <div className={`w-5 h-5 rounded-md ${i === 1 ? 'bg-rose-400' : 'bg-tan-300/50'}`} />
                            </div>
                        ))}
                    </div>

                    {/* Mock Grid - Alive! */}
                    <div className="flex-1 bg-tan-50/50 rounded-2xl border border-tan-100 p-4 flex items-center justify-center min-w-0 relative overflow-hidden">
                        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 md:gap-2">
                            {/* 7x7 Grid to draw a heart */}
                            {activeCells.map((active, i) => (
                                <div
                                    key={i}
                                    className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-md transition-all duration-300 ${active ? 'bg-rose-400 shadow-sm scale-100' : 'bg-white border border-tan-100 scale-90'}`}
                                />
                            ))}
                        </div>

                        {/* Animated Cursor */}
                        <div
                            className="absolute pointer-events-none transition-all duration-700 ease-in-out z-10"
                            style={{
                                left: `${cursorPos.x}%`,
                                top: `${cursorPos.y}%`,
                                opacity: cursorVisible ? 1 : 0.8,
                                transform: `translate(-50%, -50%) scale(${isClicking ? 0.9 : 1})`
                            }}
                        >
                            <div className={`bg-white p-2 rounded-xl shadow-soft-lg border border-tan-200 text-rose-500 transition-colors duration-200 ${isClicking ? 'bg-rose-50 border-rose-200' : ''}`}>
                                <PenTool className="w-6 h-6 fill-rose-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative Blobs */}
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-gradient-to-br from-rose-200 to-peach-200 rounded-full blur-3xl opacity-50 -z-10" />
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-sage-200/50 rounded-full blur-3xl opacity-50 -z-10" />
        </div>
    );
}
