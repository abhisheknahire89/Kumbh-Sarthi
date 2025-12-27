import React, { useRef, useEffect } from 'react';

interface WaveformProps {
    analyserNode: AnalyserNode | null;
    width: number;
    height: number;
}

const BAR_WIDTH = 2;
const BAR_GAP = 1;
const RADIUS = 80;

export const Waveform: React.FC<WaveformProps> = ({ analyserNode, width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !analyserNode) return;
        
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        analyserNode.fftSize = 256;
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const draw = () => {
            animationFrameId.current = requestAnimationFrame(draw);

            analyserNode.getByteFrequencyData(dataArray);

            canvasCtx.clearRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;
            const maxBarHeight = height / 2 - RADIUS - 20;

            const totalBarWidth = BAR_WIDTH + BAR_GAP;
            const circumference = 2 * Math.PI * RADIUS;
            const maxBars = Math.floor(circumference / totalBarWidth);
            const step = Math.floor(bufferLength / maxBars);
            
            for (let i = 0; i < maxBars; i++) {
                const barHeight = (dataArray[i * step] / 255) * maxBarHeight;
                
                const angle = (i / maxBars) * 2 * Math.PI;

                const startX = centerX + RADIUS * Math.cos(angle);
                const startY = centerY + RADIUS * Math.sin(angle);
                const endX = centerX + (RADIUS + barHeight) * Math.cos(angle);
                const endY = centerY + (RADIUS + barHeight) * Math.sin(angle);
                
                const gradient = canvasCtx.createLinearGradient(startX, startY, endX, endY);
                gradient.addColorStop(0, '#A78BFA'); // brand-accent
                gradient.addColorStop(1, '#8B5CF6'); // brand-primary

                canvasCtx.strokeStyle = gradient;
                canvasCtx.lineWidth = BAR_WIDTH;
                canvasCtx.beginPath();
                canvasCtx.moveTo(startX, startY);
                canvasCtx.lineTo(endX, endY);
                canvasCtx.stroke();
            }
        };

        draw();

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [analyserNode, width, height]);

    return <canvas ref={canvasRef} width={width} height={height} />;
};