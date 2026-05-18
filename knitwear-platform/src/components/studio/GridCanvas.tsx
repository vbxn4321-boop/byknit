'use client';

import React, { useRef, useMemo } from 'react';
import { Stage, Layer, Rect, Group, Line, Circle, Text } from 'react-konva';
import { GridCell, StitchSymbolDef } from './types';

interface GridCanvasProps {
    width: number;
    height: number;
    gridData: GridCell[][];
    gridSize: { rows: number; cols: number };
    scale: number;
    position: { x: number; y: number };
    activeTool: string;
    symbolDefs: StitchSymbolDef[];
    onUpdateCell: (row: number, col: number) => void;
    onWheel: (e: any) => void;
    onMouseDown: (e: any) => void;
    onMouseMove: (e: any) => void;
    onMouseUp?: (e: any) => void;
    onMouseLeave?: (e: any) => void;
    onTouchStart?: (e: any) => void;
    onTouchMove?: (e: any) => void;
    onTouchEnd?: (e: any) => void;
    onTouchCancel?: (e: any) => void;
    selectionStart?: { row: number; col: number } | null;
    selectionEnd?: { row: number; col: number } | null;
    stageRef?: React.RefObject<any>;
    disabled?: boolean;
    floatingBuffer?: {
        data: GridCell[][];
        startRow: number;
        startCol: number;
    } | null;
    onContextMenu?: (e: any) => void;
    hiddenZone?: {
        startRow: number;
        endRow: number;
        startCol: number;
        endCol: number;
    } | null;
    shapePreview?: { row: number; col: number }[];
    selectedColor?: string;
    selectedSymbol?: string;
    finalSelection?: {
        startRow: number;
        endRow: number;
        startCol: number;
        endCol: number;
    } | null;
    shapeRotation?: number;
    isRotationMode?: boolean;
}

export default function GridCanvas({
    width,
    height,
    gridData,
    gridSize,
    scale,
    position,
    activeTool,
    symbolDefs,
    onUpdateCell,
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    selectionStart,
    selectionEnd,
    stageRef,
    disabled,
    floatingBuffer,
    onContextMenu,
    hiddenZone,
    shapePreview,
    selectedColor,
    selectedSymbol,
    finalSelection,
    shapeRotation = 0,
    isRotationMode = false
}: GridCanvasProps) {
    const CELL_SIZE = 30;

    // Render symbol based on symbolId
    const renderSymbol = (symbolId: string, x: number, y: number, size: number) => {
        switch (symbolId) {
            case 'knit':
                return <Line points={[x + size / 2, y + size * 0.2, x + size / 2, y + size * 0.8]} stroke="#333" strokeWidth={1.5} listening={false} />;
            case 'purl':
                return <Line points={[x + size * 0.2, y + size / 2, x + size * 0.8, y + size / 2]} stroke="#333" strokeWidth={1.5} listening={false} />;
            case 'yo':
                return <Circle x={x + size / 2} y={y + size / 2} radius={size * 0.3} stroke="#333" strokeWidth={1.5} listening={false} />;
            case 'k2tog':
                return <Line points={[x + size * 0.8, y + size * 0.2, x + size * 0.2, y + size * 0.8]} stroke="#333" strokeWidth={1.5} listening={false} />;
            case 'ssk':
                return <Line points={[x + size * 0.2, y + size * 0.2, x + size * 0.8, y + size * 0.8]} stroke="#333" strokeWidth={1.5} listening={false} />;
            case 'tbl':
                return <Text x={x} y={y + 1} width={size} height={size} text="Ω" fontSize={size * 0.7} align="center" verticalAlign="middle" fill="#333" listening={false} />;
            case 'cable':
                return (
                    <Group>
                        <Line points={[x + size * 0.2, y + size * 0.2, x + size * 0.8, y + size * 0.8]} stroke="#333" strokeWidth={1.5} listening={false} />
                        <Line points={[x + size * 0.8, y + size * 0.2, x + size * 0.2, y + size * 0.8]} stroke="#333" strokeWidth={1.5} listening={false} />
                    </Group>
                );
            case 'no_stitch':
                return <Rect x={x} y={y} width={size} height={size} fill="#d1d5db" listening={false} />;
            default:
                // Custom symbols - render as text
                const symbolDef = symbolDefs.find(s => s.id === symbolId);
                if (symbolDef) {
                    return <Text x={x} y={y + 1} width={size} height={size} text={symbolDef.label} fontSize={size * 0.7} fontStyle="bold" align="center" verticalAlign="middle" fill="#333" listening={false} />;
                }
                return null;
        }
    };

    // Memoize the grid layer to avoid re-rendering all rects on every mouse move
    const GridLayer = useMemo(() => {
        if (!gridData.length) return null;

        return (
            <Group>
                {gridData.map((row, r) => (
                    row.map((cell, c) => {
                        const x = c * CELL_SIZE;
                        const y = r * CELL_SIZE;

                        return (
                            <Group key={`${r}-${c}`}>
                                <Rect
                                    x={x} y={y} width={CELL_SIZE} height={CELL_SIZE}
                                    fill={(hiddenZone &&
                                        r >= hiddenZone.startRow && r <= hiddenZone.endRow &&
                                        c >= hiddenZone.startCol && c <= hiddenZone.endCol) ? '#ffffff' : cell.color}
                                    stroke="#e2e8f0" strokeWidth={1}
                                    listening={false}
                                    perfectDrawEnabled={false}
                                />
                                {!(hiddenZone &&
                                    r >= hiddenZone.startRow && r <= hiddenZone.endRow &&
                                    c >= hiddenZone.startCol && c <= hiddenZone.endCol) &&
                                    cell.symbolId && renderSymbol(cell.symbolId, x, y, CELL_SIZE)}
                            </Group>
                        );
                    })
                ))}
            </Group>
        );
    }, [gridData, symbolDefs, hiddenZone]);

    // 5-unit grid lines overlay
    const FiveUnitLines = useMemo(() => {
        const lines: React.ReactElement[] = [];
        const totalWidth = gridSize.cols * CELL_SIZE;
        const totalHeight = gridSize.rows * CELL_SIZE;

        // Vertical lines every 5 columns
        for (let c = 5; c < gridSize.cols; c += 5) {
            lines.push(
                <Line
                    key={`v-${c}`}
                    points={[c * CELL_SIZE, 0, c * CELL_SIZE, totalHeight]}
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    listening={false}
                />
            );
        }

        // Horizontal lines every 5 rows
        for (let r = 5; r < gridSize.rows; r += 5) {
            lines.push(
                <Line
                    key={`h-${r}`}
                    points={[0, r * CELL_SIZE, totalWidth, r * CELL_SIZE]}
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    listening={false}
                />
            );
        }

        return <Group>{lines}</Group>;
        return <Group>{lines}</Group>;
    }, [gridSize]);

    // Floating Buffer Layer (Rotated Preview)
    const FloatingLayer = useMemo(() => {
        if (!floatingBuffer) return null;
        const { data, startRow, startCol } = floatingBuffer;

        // Calculate Pivot (Center of buffer)
        const height = data.length;
        const width = data[0].length;
        const pivotRow = startRow + height / 2;
        const pivotCol = startCol + width / 2;

        return (
            <Group
                x={pivotCol * CELL_SIZE}
                y={pivotRow * CELL_SIZE}
                rotation={(shapeRotation * 180) / Math.PI}
            >
                {data.map((row, r) => (
                    row.map((cell, c) => {
                        // Relative to pivot
                        const absX = (startCol + c) * CELL_SIZE;
                        const absY = (startRow + r) * CELL_SIZE;
                        const x = absX - (pivotCol * CELL_SIZE);
                        const y = absY - (pivotRow * CELL_SIZE);

                        return (
                            <Group key={`float-${r}-${c}`}>
                                <Rect
                                    x={x} y={y} width={CELL_SIZE} height={CELL_SIZE}
                                    fill={cell.color}
                                    stroke="#e2e8f0" strokeWidth={1}
                                    listening={false}
                                    shadowBlur={5} shadowOpacity={0.1} // Subtle shadow for lift
                                />
                                {cell.symbolId && renderSymbol(cell.symbolId, x, y, CELL_SIZE)}
                            </Group>
                        );
                    })
                ))}
                {/* Floating Preview Border - Blue to distinguish */}
                <Rect
                    x={(startCol * CELL_SIZE) - (pivotCol * CELL_SIZE)}
                    y={(startRow * CELL_SIZE) - (pivotRow * CELL_SIZE)}
                    width={width * CELL_SIZE}
                    height={height * CELL_SIZE}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dash={[5, 5]}
                    listening={false}
                />
            </Group>
        );
    }, [floatingBuffer, symbolDefs, shapeRotation]);

    // Shape Tool Preview Layer
    const ShapePreviewLayer = useMemo(() => {
        if (!shapePreview || shapePreview.length === 0) return null;

        return (
            <Group opacity={0.8}>
                {shapePreview.map((cell, i) => (
                    <Group key={`preview-${i}`}>
                        <Rect
                            x={cell.col * CELL_SIZE}
                            y={cell.row * CELL_SIZE}
                            width={CELL_SIZE}
                            height={CELL_SIZE}
                            fill={selectedColor || '#E8B4B8'}
                            stroke="#e2e8f0"
                            strokeWidth={1}
                            listening={false}
                        />
                        {selectedSymbol && renderSymbol(selectedSymbol, cell.col * CELL_SIZE, cell.row * CELL_SIZE, CELL_SIZE)}
                    </Group>
                ))}
            </Group>
        );
    }, [shapePreview, selectedColor, selectedSymbol, symbolDefs]);

    return (
        <Stage
            ref={stageRef}
            width={width}
            height={height}
            draggable={activeTool === 'move' && !disabled}
            preventDefault={true}
            listening={!disabled}
            onWheel={disabled ? undefined : onWheel}
            onMouseDown={disabled ? undefined : onMouseDown}
            onTap={disabled ? undefined : onMouseDown}
            onMouseMove={disabled ? undefined : onMouseMove}
            onMouseUp={disabled ? undefined : onMouseUp}
            onContextMenu={disabled ? undefined : onContextMenu}
            onTouchStart={disabled ? undefined : onTouchStart}
            onTouchMove={(e) => {
                // We handle logic in parent, so just pass through or use the prop directly if we passed one that handles logic.
                // Wait, previous code had custom logic inline?
                // The parent GridEditor passes `handleTouchMove` which contains the logic.
                // So we should just call onTouchMove(e).
                if (onTouchMove) onTouchMove(e);
            }}
            onTouchEnd={onTouchEnd}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
        >
            <Layer>
                {/* Background (infinite-ish) */}
                <Rect
                    x={-5000} y={-5000} width={10000} height={10000}
                    fill="#f8fafc"
                    listening={true}
                />

                {GridLayer}

                {FloatingLayer}

                {ShapePreviewLayer}

                {/* 5-unit grid lines */}
                {FiveUnitLines}

                {/* Border around pattern */}
                <Rect
                    x={0} y={0}
                    width={gridSize.cols * CELL_SIZE}
                    height={gridSize.rows * CELL_SIZE}
                    stroke="#94a3b8"
                    strokeWidth={2}
                    listening={false}
                />

                {/* Column Numbers (콧수) - Top Edge */}
                {Array.from({ length: gridSize.cols }, (_, c) => (
                    <Text
                        key={`col-top-${c}`}
                        x={c * CELL_SIZE}
                        y={-20}
                        width={CELL_SIZE}
                        height={18}
                        text={String(c + 1)}
                        fontSize={10}
                        fill="#64748b"
                        align="center"
                        verticalAlign="bottom"
                        listening={false}
                    />
                ))}

                {/* Column Numbers (콧수) - Bottom Edge */}
                {Array.from({ length: gridSize.cols }, (_, c) => (
                    <Text
                        key={`col-bottom-${c}`}
                        x={c * CELL_SIZE}
                        y={gridSize.rows * CELL_SIZE + 4}
                        width={CELL_SIZE}
                        height={18}
                        text={String(c + 1)}
                        fontSize={10}
                        fill="#64748b"
                        align="center"
                        verticalAlign="top"
                        listening={false}
                    />
                ))}

                {/* Row Numbers (단수) - Left Edge */}
                {Array.from({ length: gridSize.rows }, (_, r) => (
                    <Text
                        key={`row-left-${r}`}
                        x={-25}
                        y={r * CELL_SIZE}
                        width={22}
                        height={CELL_SIZE}
                        text={String(r + 1)}
                        fontSize={10}
                        fill="#64748b"
                        align="right"
                        verticalAlign="middle"
                        listening={false}
                    />
                ))}

                {/* Row Numbers (단수) - Right Edge */}
                {Array.from({ length: gridSize.rows }, (_, r) => (
                    <Text
                        key={`row-right-${r}`}
                        x={gridSize.cols * CELL_SIZE + 4}
                        y={r * CELL_SIZE}
                        width={22}
                        height={CELL_SIZE}
                        text={String(r + 1)}
                        fontSize={10}
                        fill="#64748b"
                        align="left"
                        verticalAlign="middle"
                        listening={false}
                    />
                ))}

                {/* Selection Overlay */}
                {selectionStart && selectionEnd && !((activeTool === 'shape' || isRotationMode) && finalSelection) && (
                    <Group>
                        <Rect
                            x={Math.min(selectionStart.col, selectionEnd.col) * CELL_SIZE}
                            y={Math.min(selectionStart.row, selectionEnd.row) * CELL_SIZE}
                            width={(Math.abs(selectionEnd.col - selectionStart.col) + 1) * CELL_SIZE}
                            height={(Math.abs(selectionEnd.row - selectionStart.row) + 1) * CELL_SIZE}
                            fill={activeTool === 'shape' ? 'transparent' : 'rgba(244, 63, 94, 0.2)'}
                            stroke={activeTool === 'shape' ? '#3b82f6' : '#f43f5e'}
                            strokeWidth={2}
                            dash={activeTool === 'shape' ? [5, 5] : []}
                            listening={false}
                        />
                    </Group>
                )}
                {((activeTool === 'shape' || isRotationMode) && finalSelection && selectionStart && selectionEnd) && (() => {
                    const sStart = selectionStart!;
                    const sEnd = selectionEnd!;
                    const rSmall = Math.min(sStart.row, sEnd.row);
                    const rLarge = Math.max(sStart.row, sEnd.row) + 1;
                    const cSmall = Math.min(sStart.col, sEnd.col);
                    const cLarge = Math.max(sStart.col, sEnd.col) + 1;

                    const centerRow = (rSmall + rLarge) / 2;
                    const centerCol = (cSmall + cLarge) / 2;

                    const rotateCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8'/%3E%3Cpolyline points='21 3 21 8 16 8'/%3E%3C/svg%3E") 12 12, crosshair`;

                    return (
                        <Group
                            x={centerCol * CELL_SIZE}
                            y={centerRow * CELL_SIZE}
                            rotation={(shapeRotation * 180) / Math.PI}
                            offsetX={((cLarge - cSmall) / 2) * CELL_SIZE}
                            offsetY={((rLarge - rSmall) / 2) * CELL_SIZE}
                        >
                            <Rect
                                x={0}
                                y={0}
                                width={(cLarge - cSmall) * CELL_SIZE}
                                height={(rLarge - rSmall) * CELL_SIZE}
                                fill="transparent"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dash={[5, 5]}
                                listening={false}
                            />

                            {[
                                { x: 0, y: 0, type: 'rotate' },
                                { x: (cLarge - cSmall) * CELL_SIZE, y: 0, type: 'rotate' },
                                { x: 0, y: (rLarge - rSmall) * CELL_SIZE, type: 'rotate' },
                                { x: (cLarge - cSmall) * CELL_SIZE, y: (rLarge - rSmall) * CELL_SIZE, type: 'rotate' }
                            ].map((pos, i) => (
                                <Rect
                                    key={`corner-${i}`}
                                    x={pos.x - 4}
                                    y={pos.y - 4}
                                    width={8}
                                    height={8}
                                    fill="white"
                                    stroke="#3b82f6"
                                    strokeWidth={1}
                                    handleIndex={i} // Explicit attr
                                    handleType={pos.type} // Explicit attr
                                    listening={true}
                                    onMouseEnter={(e) => {
                                        const stage = e.target.getStage();
                                        if (stage) stage.container().style.cursor = rotateCursor;
                                    }}
                                    onMouseLeave={(e) => {
                                        const stage = e.target.getStage();
                                        if (stage) stage.container().style.cursor = 'default';
                                    }}
                                    onMouseDown={(e) => {
                                        e.cancelBubble = true;
                                        // Still pass via event for backward compat, but attributes are primary
                                        onMouseDown({ ...e, handleIndex: i, handleType: 'rotate' });
                                    }}
                                />
                            ))}

                            <Rect
                                x={0}
                                y={-2}
                                width={(cLarge - cSmall) * CELL_SIZE}
                                height={4}
                                fill="transparent"
                                handleIndex={4}
                                handleType="resize"
                                listening={true}
                                onMouseEnter={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'pointer';
                                }}
                                onMouseLeave={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'default';
                                }}
                                onMouseDown={(e) => {
                                    e.cancelBubble = true;
                                    onMouseDown({ ...e, handleIndex: 4, handleType: 'resize' });
                                }}
                            />
                            <Rect
                                x={(cLarge - cSmall) * CELL_SIZE - 2}
                                y={0}
                                width={4}
                                height={(rLarge - rSmall) * CELL_SIZE}
                                fill="transparent"
                                handleIndex={5}
                                handleType="resize"
                                listening={true}
                                onMouseEnter={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'pointer';
                                }}
                                onMouseLeave={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'default';
                                }}
                                onMouseDown={(e) => {
                                    e.cancelBubble = true;
                                    onMouseDown({ ...e, handleIndex: 5, handleType: 'resize' });
                                }}
                            />
                            <Rect
                                x={0}
                                y={(rLarge - rSmall) * CELL_SIZE - 2}
                                width={(cLarge - cSmall) * CELL_SIZE}
                                height={4}
                                fill="transparent"
                                handleIndex={6}
                                handleType="resize"
                                listening={true}
                                onMouseEnter={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'pointer';
                                }}
                                onMouseLeave={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'default';
                                }}
                                onMouseDown={(e) => {
                                    e.cancelBubble = true;
                                    onMouseDown({ ...e, handleIndex: 6, handleType: 'resize' });
                                }}
                            />
                            <Rect
                                x={-2}
                                y={0}
                                width={4}
                                height={(rLarge - rSmall) * CELL_SIZE}
                                fill="transparent"
                                handleIndex={7}
                                handleType="resize"
                                listening={true}
                                onMouseEnter={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'pointer';
                                }}
                                onMouseLeave={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'default';
                                }}
                                onMouseDown={(e) => {
                                    e.cancelBubble = true;
                                    onMouseDown({ ...e, handleIndex: 7, handleType: 'resize' });
                                }}
                            />
                            <Rect
                                x={-2}
                                y={0}
                                width={4}
                                height={(rLarge - rSmall) * CELL_SIZE}
                                fill="transparent"
                                listening={true}
                                onMouseEnter={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'pointer';
                                }}
                                onMouseLeave={(e) => {
                                    const stage = e.target.getStage();
                                    if (stage) stage.container().style.cursor = 'default';
                                }}
                                onMouseDown={(e) => {
                                    e.cancelBubble = true;
                                    onMouseDown({ ...e, handleIndex: 7, handleType: 'resize' });
                                }}
                            />
                        </Group>
                    );
                })()}
                {/* Handles logic here or transformation handles ... */}
            </Layer>
        </Stage >
    );
}
