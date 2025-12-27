'use client';

import { useEffect, useRef, useState } from 'react';

interface SheetMusicProps {
    notation: string;
    lineHeight?: number; // Fixed height for each staff line
    className?: string;
    currentTime?: number; // Current playback time in seconds
    startTime?: number; // Lyric start time
    endTime?: number; // Lyric end time
}

/**
 * Renders ABC music notation as sheet music using ABCjs
 * Controls spacing between notes rather than stretching width
 */
export default function SheetMusic({
    notation,
    lineHeight = 50,
    className = '',
    currentTime = 0,
    startTime = 0,
    endTime = 0
}: SheetMusicProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const visualObjRef = useRef<any>(null);
    const timingRef = useRef<any[]>([]);

    useEffect(() => {
        if (!containerRef.current || !notation) {
            return;
        }

        // Dynamically import ABCjs (client-side only)
        import('abcjs').then((abcjs) => {
            if (!containerRef.current) return;

            // Check if notation already has headers (starts with X: or contains %%)
            const hasHeaders = notation.trim().startsWith('X:') ||
                             notation.includes('%%staves') ||
                             notation.includes('V:');

            let abcString: string;

            if (hasHeaders) {
                // Use notation as-is if it already has headers
                abcString = notation;
            } else {
                // Add basic headers for simple notation
                abcString = `X:1
T:
M:4/4
L:1/4
K:C
${notation}`;
            }

            // Detect if this is a complex multi-voice arrangement
            const isComplexArrangement = abcString.includes('V:1') && abcString.includes('V:2');

            // Render with spacing configuration optimized for complexity
            try {
                const visualObj = abcjs.default.renderAbc(containerRef.current, abcString, {
                    responsive: 'resize',
                    staffwidth: isComplexArrangement ? 600 : 400, // Wider for multi-voice
                    paddingtop: 0,
                    paddingbottom: 0,
                    paddingleft: 5,
                    paddingright: 5,
                    scale: isComplexArrangement ? 0.7 : 0.6, // Slightly larger for readability
                    add_classes: true,
                    print: false,
                    wrap: {
                        minSpacing: isComplexArrangement ? 1.5 : 2.0, // Tighter for complex music
                        maxSpacing: isComplexArrangement ? 3.0 : 4.0,
                        preferredMeasuresPerLine: isComplexArrangement ? 4 : 8 // Fewer measures per line for clarity
                    }
                });

                visualObjRef.current = visualObj;

                // Calculate note timings
                if (visualObj && visualObj[0]) {
                    const tune = visualObj[0];
                    const duration = endTime - startTime;
                    const timings: any[] = [];

                    // Extract all notes from the tune
                    tune.lines?.forEach((line: any) => {
                        line.staff?.forEach((staff: any) => {
                            staff.voices?.forEach((voice: any) => {
                                let currentOffset = 0;
                                voice.forEach((element: any) => {
                                    if (element.abselem?.elemset) {
                                        element.abselem.elemset.forEach((note: any) => {
                                            if (note.classList?.contains('abcjs-note')) {
                                                const noteDuration = element.duration || 0.25;
                                                timings.push({
                                                    element: note,
                                                    offset: currentOffset,
                                                    duration: noteDuration
                                                });
                                            }
                                        });
                                        currentOffset += element.duration || 0.25;
                                    }
                                });
                            });
                        });
                    });

                    timingRef.current = timings;
                }
            } catch (renderErr) {
                console.error('[SheetMusic] Error rendering ABC notation:', renderErr);
            }
        }).catch((err) => {
            console.error('[SheetMusic] Failed to load ABCjs:', err);
        });
    }, [notation, lineHeight, startTime, endTime]);

    // Highlight notes based on current time
    useEffect(() => {
        if (!timingRef.current.length || !visualObjRef.current) return;

        const relativeTime = currentTime - startTime;
        const duration = endTime - startTime;

        if (relativeTime < 0 || relativeTime > duration) {
            // Clear all highlights
            timingRef.current.forEach(({ element }) => {
                element.setAttribute('fill', '#555555');
            });
            return;
        }

        // Calculate progress through the lyric (0 to 1)
        const progress = relativeTime / duration;

        timingRef.current.forEach(({ element, offset, duration: noteDuration }, index) => {
            const totalDuration = timingRef.current.reduce((sum, t) => sum + t.duration, 0);
            const noteStart = offset / totalDuration;
            const noteEnd = (offset + noteDuration) / totalDuration;

            if (progress >= noteStart && progress < noteEnd) {
                // This note should be highlighted
                element.setAttribute('fill', '#FF6B6B'); // Bright coral color
                element.setAttribute('opacity', '1');
            } else if (progress >= noteEnd) {
                // This note has been played
                element.setAttribute('fill', '#999999'); // Light gray
                element.setAttribute('opacity', '0.6');
            } else {
                // This note hasn't been played yet
                element.setAttribute('fill', '#333333'); // Dark gray
                element.setAttribute('opacity', '1');
            }
        });
    }, [currentTime, startTime, endTime]);

    if (!notation) return null;

    // Check if this is multi-staff notation for dynamic height
    const isMultiStaff = notation?.includes('%%staves') || notation?.includes('V:');
    const dynamicHeight = isMultiStaff ? lineHeight * 2.5 : lineHeight;

    return (
        <>
            <style jsx global>{`
                .sheet-music svg {
                    width: 100% !important;
                    height: auto !important;
                }
                .sheet-music .abcjs-staff {
                    stroke: #444444 !important;
                    stroke-width: 1 !important;
                }
                .sheet-music .abcjs-note {
                    fill: #333333 !important;
                }
                .sheet-music .abcjs-rest {
                    fill: #333333 !important;
                }
                .sheet-music .abcjs-ledger {
                    stroke: #444444 !important;
                }
                .sheet-music .abcjs-stem {
                    stroke: #333333 !important;
                }
                .sheet-music .abcjs-clef,
                .sheet-music .abcjs-key-signature,
                .sheet-music .abcjs-time-signature {
                    fill: #222222 !important;
                }
                .sheet-music .abcjs-bar {
                    stroke: #444444 !important;
                }
                /* Hide reference numbers (X:1, X:2, etc.), titles, and metadata to save space */
                .sheet-music .abcjs-number,
                .sheet-music .abcjs-title,
                .sheet-music .abcjs-subtitle,
                .sheet-music .abcjs-composer,
                .sheet-music .abcjs-author {
                    display: none !important;
                }
            `}</style>
            <div
                ref={containerRef}
                className={`sheet-music bg-white rounded-lg border border-gray-200 overflow-auto ${className}`}
                style={{
                    minHeight: dynamicHeight,
                    maxHeight: dynamicHeight * 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px'
                }}
            />
        </>
    );
}

