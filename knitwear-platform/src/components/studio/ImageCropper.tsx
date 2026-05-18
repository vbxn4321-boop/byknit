'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Group } from 'react-konva';
import useImage from 'use-image';

interface ImageCropperProps {
    src: string;
    aspectRatio?: number; // width / height, default 3/4
    onCrop: (croppedDataUrl: string) => void;
    onCancel: () => void;
}

export function ImageCropper({ src, aspectRatio = 3 / 4, onCrop, onCancel }: ImageCropperProps) {
    const [image] = useImage(src);
    const stageRef = useRef<any>(null);
    const trRef = useRef<any>(null);
    const maskRef = useRef<any>(null);

    // Stage size (fit within modal - reduced to avoid overflow)
    const STAGE_WIDTH = 400;
    const STAGE_HEIGHT = 400;

    const [imgState, setImgState] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        scale: 1
    });

    const [cropState, setCropState] = useState({
        x: 50,
        y: 50,
        width: 200,
        height: 200 / aspectRatio
    });

    useEffect(() => {
        if (image) {
            // Fit image to stage
            const scale = Math.min(STAGE_WIDTH / image.width, STAGE_HEIGHT / image.height);
            const imgW = image.width * scale;
            const imgH = image.height * scale;

            const newImgState = {
                x: (STAGE_WIDTH - imgW) / 2,
                y: (STAGE_HEIGHT - imgH) / 2,
                width: imgW,
                height: imgH,
                scale: scale
            };
            setImgState(newImgState);

            // Init crop box centered
            // Start with desired size
            let cropH = STAGE_HEIGHT * 0.6;
            let cropW = cropH * aspectRatio;

            // Shrink if larger than image
            if (cropW > imgW) {
                cropW = imgW;
                cropH = cropW / aspectRatio;
            }
            if (cropH > imgH) {
                cropH = imgH;
                cropW = cropH * aspectRatio;
            }

            setCropState({
                x: newImgState.x + (imgW - cropW) / 2,
                y: newImgState.y + (imgH - cropH) / 2,
                width: cropW,
                height: cropH
            });
        }
    }, [image, aspectRatio]);

    useEffect(() => {
        if (trRef.current && maskRef.current) {
            trRef.current.nodes([maskRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [imgState]); // Update when image loads

    const handleCrop = () => {
        if (!image || !stageRef.current) return;

        // 1. Calculate crop coordinates relative to original image
        // Crop Rect on Stage relative to Image on Stage
        const relX = cropState.x - imgState.x;
        const relY = cropState.y - imgState.y;

        // Convert to original image scale
        // Clamp to ensure we don't go out of bounds (0 to image.width/height)
        let originalX = Math.max(0, relX / imgState.scale);
        let originalY = Math.max(0, relY / imgState.scale);

        let originalW = cropState.width / imgState.scale;
        let originalH = cropState.height / imgState.scale;

        // Prevent width/height from exceeding image bounds from the start point
        // Max Width allowed = Image Width - Start X
        originalW = Math.min(originalW, image.width - originalX);
        originalH = Math.min(originalH, image.height - originalY);

        // 2. Create temp canvas to crop
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, originalW);
        canvas.height = Math.max(1, originalH);
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(
                image,
                originalX, originalY, originalW, originalH,
                0, 0, originalW, originalH
            );

            // 3. Resize if too large (Max 1080px for standard social/commerce square)
            const MAX_SIZE = 1080;
            let finalCanvas = canvas;

            if (originalW > MAX_SIZE || originalH > MAX_SIZE) {
                const ratio = Math.min(MAX_SIZE / originalW, MAX_SIZE / originalH);
                const resizeW = originalW * ratio;
                const resizeH = originalH * ratio;

                const resizeCanvas = document.createElement('canvas');
                resizeCanvas.width = resizeW;
                resizeCanvas.height = resizeH;
                const resizeCtx = resizeCanvas.getContext('2d');

                if (resizeCtx) {
                    resizeCtx.drawImage(canvas, 0, 0, resizeW, resizeH);
                    finalCanvas = resizeCanvas;
                }
            }

            // 4. Export
            onCrop(finalCanvas.toDataURL('image/jpeg', 0.9));
        }
    };

    if (!image) return <div className="h-[400px] flex items-center justify-center text-stone-400">Loading...</div>;

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="border border-stone-200 rounded-lg overflow-hidden bg-stone-100 relative">
                <Stage
                    ref={stageRef}
                    width={STAGE_WIDTH}
                    height={STAGE_HEIGHT}
                    onMouseDown={(e) => {
                        // Deselect if clicked empty area? No, always keep crop active
                    }}
                >
                    <Layer>
                        {/* Background Image (dimmed) */}
                        <KonvaImage
                            image={image}
                            x={imgState.x}
                            y={imgState.y}
                            width={imgState.width}
                            height={imgState.height}
                            opacity={0.5}
                        />

                        {/* Crop Area (Clear/Bright) */}
                        {/* Actually implementing a "Hole" is tricky in Konva simply. 
                            Easier strategy: 
                            1. Draw image dimmed.
                            2. Draw crop rect (transparent fill, border)
                            3. Draw image again inside the crop rect using clip? 
                            
                            Or simpler: Just show the rect on top of dimmed image. 
                            The user understands the box is what they get.
                        */}
                        <Group
                            clipX={cropState.x}
                            clipY={cropState.y}
                            clipWidth={cropState.width}
                            clipHeight={cropState.height}
                        >
                            <KonvaImage
                                image={image}
                                x={imgState.x}
                                y={imgState.y}
                                width={imgState.width}
                                height={imgState.height}
                            />
                        </Group>

                        {/* Draggable Crop Rect */}
                        <Rect
                            ref={maskRef}
                            x={cropState.x}
                            y={cropState.y}
                            width={cropState.width}
                            height={cropState.height}
                            stroke="#fff"
                            strokeWidth={2}
                            dash={[5, 5]}
                            draggable
                            dragBoundFunc={(pos) => {
                                // Clamp x and y to stay within the visible image area
                                // visible image area is defined by imgState: {x, y, width, height}
                                const node = maskRef.current;
                                const rectW = node.width() * node.scaleX();
                                const rectH = node.height() * node.scaleY();

                                // Min allowed X is image left edge (imgState.x)
                                // Max allowed X is image right edge - rect width (imgState.x + imgState.width - rectW)
                                const minX = imgState.x;
                                const maxX = imgState.x + imgState.width - rectW;

                                // Min allowed Y is image top edge (imgState.y)
                                // Max allowed Y is image bottom edge - rect height (imgState.y + imgState.height - rectH)
                                const minY = imgState.y;
                                const maxY = imgState.y + imgState.height - rectH;

                                const newX = Math.max(minX, Math.min(pos.x, maxX));
                                const newY = Math.max(minY, Math.min(pos.y, maxY));

                                return { x: newX, y: newY };
                            }}
                            onDragMove={(e) => {
                                setCropState(prev => ({ ...prev, x: e.target.x(), y: e.target.y() }));
                            }}
                            onTransformEnd={(e) => {
                                const node = maskRef.current;
                                const scaleX = node.scaleX();
                                const scaleY = node.scaleY();

                                // Reset scale and update width/height
                                node.scaleX(1);
                                node.scaleY(1);

                                setCropState({
                                    x: node.x(),
                                    y: node.y(),
                                    width: Math.max(50, node.width() * scaleX),
                                    height: Math.max(50, node.height() * scaleY)
                                });
                            }}
                        />
                        <Transformer
                            ref={trRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                // 1. Enforce aspect ratio
                                let width = newBox.width;
                                let height = newBox.height; // this might be wrong if aspect is enforced by transformer?

                                // Transformer with keepRatio=true already calculates width/height based on ratio, 
                                // but we need to re-verify or just check bound collisions.

                                // 2. Enforce boundaries
                                // Current position is newBox.x, newBox.y
                                // Right/Bottom edges are newBox.x + width, newBox.y + height

                                // Check left collision
                                if (newBox.x < imgState.x) {
                                    newBox.x = imgState.x;
                                    width = (newBox.x + width) - imgState.x; // reduce width? No, preventing expansion to left.
                                    // If we simply clamp position, width might still be large. 
                                    // Complex logic required to shrink box while moving anchor.
                                    // Simpler: Reject change if out of bounds.
                                    return oldBox;
                                }
                                // Check top collision
                                if (newBox.y < imgState.y) {
                                    newBox.y = imgState.y;
                                    return oldBox;
                                }
                                // Check right collision
                                if (newBox.x + width > imgState.x + imgState.width) {
                                    return oldBox;
                                }
                                // Check bottom collision
                                if (newBox.y + height > imgState.y + imgState.height) {
                                    return oldBox;
                                }

                                return newBox;
                            }}
                            keepRatio={true} // Lock aspect ratio
                            rotateEnabled={false}
                            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                        />
                    </Layer>
                </Stage>

                <div className="absolute top-4 left-0 w-full text-center pointer-events-none">
                    <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Drag to move • Corner to resize
                    </span>
                </div>
            </div>

            <div className="flex gap-3 w-full max-w-[400px]">
                <button
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 rounded-xl border border-stone-200 font-bold text-stone-600 hover:bg-stone-50"
                >
                    취소
                </button>
                <button
                    onClick={handleCrop}
                    className="flex-1 px-4 py-3 rounded-xl bg-stone-800 text-white font-bold hover:bg-black shadow-lg"
                >
                    자르기 완료 ({aspectRatio === 1 ? '1:1' : '3:4'})
                </button>
            </div>
        </div>
    );
}
