import React from 'react';

export type StitchSymbolDef = {
    id: string;
    label: string; // Used for UI button text
    name?: string; // Used for tooltip
    type?: 'basic' | 'custom';
    render: (props: { x: number; y: number; size: number; color?: string }) => React.ReactNode;
};

export type GridCell = {
    color: string;
    symbolId: string | null;
};

export type GridCellData = GridCell;

export type GridSize = {
    rows: number;
    cols: number;
};

export interface YarnPart {
    id: string;
    partName: string;
    yarnName: string;
    amount: string;
    needle: string;
    gauge?: string;
    technique?: string;
}
