'use client';

import { useEffect, useRef } from 'react';

interface SheetMusicProps {
    notation: string;
    lineHeight?: number; // Fixed height for each staff line
    className?: string;
}

/**
 * Renders ABC music notation as sheet music using ABCjs
 * Controls spacing between notes rather than stretching width
 */
export default function SheetMusic({
    notation,
    lineHeight = 50,
    className = ''
}: SheetMusicProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || !notation) return;

        // Dynamically import ABCjs (client-side only)
        import('abcjs').then((abcjs) => {
            if (!containerRef.current) return;

            // Build full ABC notation with header
            const abcString = `X:1
T:
M:4/4
L:1/4
K:C
${notation}`;

            // Render with spacing configuration
            // Use smaller scale and let notes spread out naturally
            abcjs.default.renderAbc(containerRef.current, abcString, {
                responsive: 'resize',
                staffwidth: 400, // Wider staff = more space between notes
                paddingtop: 0,
                paddingbottom: 0,
                paddingleft: 5,
                paddingright: 5,
                scale: 0.5, // Smaller notes
                add_classes: true,
                print: false,
                wrap: {
                    minSpacing: 2.0, // More space between notes
                    maxSpacing: 4.0, // Maximum spacing
                    preferredMeasuresPerLine: 8
                }
            });
        }).catch((err) => {
            console.error('[SheetMusic] Failed to load ABCjs:', err);
        });
    }, [notation, lineHeight]);

    if (!notation) return null;

    return (
        <div
            ref={containerRef}
            className={`sheet-music bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
            style={{
                height: lineHeight,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center'
            }}
        />
    );
}

