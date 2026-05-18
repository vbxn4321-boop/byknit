import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);
const writeFilePromise = promisify(fs.writeFile);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('image') as File;
        const gaugeStitches = Number(formData.get('gauge_stitches') || 20);
        const gaugeRows = Number(formData.get('gauge_rows') || 28);
        const widthCm = Number(formData.get('width_cm') || 30);
        const numColors = Number(formData.get('colors') || 8);

        if (!file) {
            return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
        }

        // Save temp file
        const buffer = Buffer.from(await file.arrayBuffer());
        const tempDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const tempFilePath = path.join(tempDir, `upload_${Date.now()}.png`);
        await writeFilePromise(tempFilePath, buffer);

        // Call Python Script
        // Ideally this script exists in /scripts/image_processor.py
        const scriptPath = path.join(process.cwd(), 'scripts', 'image_processor.py');

        // Calculate target dimensions
        // Width (stitches) = Width(cm) * (Gauge(st) / 10)
        const targetWidth = Math.round(widthCm * (gaugeStitches / 10));

        // Command: python scripts/image_processor.py [input] [width] [colors]
        const command = `python "${scriptPath}" "${tempFilePath}" ${targetWidth} ${numColors}`;

        const { stdout, stderr } = await execPromise(command);

        if (stderr) {
            console.error('Python Error:', stderr);
        }

        // Clean up
        fs.unlinkSync(tempFilePath);

        // Python script should return JSON grid data in stdout
        const gridData = JSON.parse(stdout.trim());

        return NextResponse.json({ grid: gridData, width: targetWidth });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}
