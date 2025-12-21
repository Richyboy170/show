'use client';

import { useEffect, useRef, useState } from 'react';

interface SheetMusicProps {
    notation: string;
    width?: number;
    lineHeight?: number; // Fixed height for each staff line
    responsive?: boolean;
    className?: string;
}

/**
 * Renders ABC music notation as sheet music using ABCjs
 * Uses fixed height with horizontal stretching instead of proportional scaling
 */
export default function SheetMusic({
    notation,
    width = 250,
    lineHeight = 40, // Fixed height per line
    responsive = true,
    className = ''
}: SheetMusicProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const [scaleY, setScaleY] = useState(1);

    useEffect(() => {
        if (!innerRef.current || !notation) return;

        // Dynamically import ABCjs (client-side only)
        import('abcjs').then((abcjs) => {
            if (!innerRef.current) return;

            // Build full ABC notation with header
            const abcString = `X:1
T:
M:4/4
L:1/4
K:C
${notation}`;

            // Render at natural size (no scale), we'll use CSS to control height
            abcjs.default.renderAbc(innerRef.current, abcString, {
                responsive: responsive ? 'resize' : undefined,
                staffwidth: width,
                paddingtop: 0,
                paddingbottom: 0,
                paddingleft: 0,
                paddingright: 0,
                scale: 0.6, // Render at reasonable size
                add_classes: true,
                print: false
            });

            // After rendering, calculate the scale factor to fit fixed height
            requestAnimationFrame(() => {
                if (!innerRef.current) return;
                const renderedHeight = innerRef.current.scrollHeight;
                if (renderedHeight > 0) {
                    // Calculate scale to fit the target line height
                    const targetScale = lineHeight / renderedHeight;
                    setScaleY(Math.min(targetScale, 1)); // Don't scale up, only down
                }
            });
        }).catch((err) => {
            console.error('[SheetMusic] Failed to load ABCjs:', err);
        });
    }, [notation, width, lineHeight, responsive]);

    if (!notation) return null;

    return (
        <div
            ref={containerRef}
            className={`sheet-music bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
            style={{
                height: lineHeight,
                overflow: 'hidden'
            }}
        >
            <div
                ref={innerRef}
                style={{
                    transformOrigin: 'top left',
                    transform: `scaleY(${scaleY})`,
                    width: '100%'
                }}
            />
        </div>
    );
}
