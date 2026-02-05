
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Loader2, CameraOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Tesseract from 'tesseract.js';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

interface PassportScannerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScanComplete: (data: { firstName: string, lastName: string }) => void;
}

const parseMRZ = (ocrText: string): { firstName: string, lastName: string } | null => {
  const lines = ocrText.split('\n').map(line => line.replace(/[^A-Z0-9<]/g, '').trim());
  const mrzLineIndex = lines.findIndex(line => line.startsWith('P') && line.length > 40);
  
  if (mrzLineIndex === -1 || !lines[mrzLineIndex + 1]) {
    console.warn('Nie znaleziono poprawnej strefy MRZ.');
    return null;
  }

  const line1 = lines[mrzLineIndex];
  const namesPart = line1.substring(5);
  const parts = namesPart.split('<<');

  if (parts.length < 2) return null;

  const rawSurname = parts[0].replace(/</g, ' ').trim();
  const rawName = parts[1].replace(/</g, ' ').trim();

  return {
    firstName: rawName,
    lastName: rawSurname,
  };
};

export const PassportScanner: React.FC<PassportScannerProps> = ({ open, onOpenChange, onScanComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const getCameraPermission = async () => {
            if (!open) {
                if (videoRef.current?.srcObject) {
                    (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                }
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                setHasCameraPermission(true);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Brak dostępu do kamery',
                    description: 'Proszę włączyć uprawnienia do kamery w ustawieniach przeglądarki.',
                });
            }
        };

        getCameraPermission();

        return () => {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        };
    }, [open, toast]);

    const handleCaptureAndProcess = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsProcessing(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
            setIsProcessing(false);
            return;
        }
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const imageDataUrl = canvas.toDataURL('image/png');

        try {
            const result = await Tesseract.recognize(
                imageDataUrl,
                'eng',
                {
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
                } as any
            );

            const extractedData = parseMRZ(result.data.text);
            
            if (extractedData) {
                onScanComplete(extractedData);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Nie udało się odczytać danych',
                    description: 'Spróbuj ponownie z lepszym oświetleniem i upewnij się, że strefa MRZ jest w kadrze.',
                });
            }
        } catch (error) {
            console.error('OCR Processing Error:', error);
            toast({
                variant: 'destructive',
                title: 'Błąd przetwarzania',
                description: 'Wystąpił błąd podczas analizy obrazu.',
            });
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Skaner Paszportu</DialogTitle>
                    <DialogDescription>
                        Umieść strefę MRZ (dolna część z tekstem maszynowym) paszportu wewnątrz ramki i naciśnij "Skanuj".
                    </DialogDescription>
                </DialogHeader>
                
                <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                    {hasCameraPermission === null && (
                         <div className="flex h-full w-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin" />
                         </div>
                    )}
                    {hasCameraPermission === false && (
                         <div className="flex h-full w-full flex-col items-center justify-center text-center text-muted-foreground">
                            <CameraOff className="h-12 w-12" />
                            <p className="mt-4">Kamera jest niedostępna lub nie udzielono pozwolenia.</p>
                         </div>
                    )}
                    {hasCameraPermission && (
                        <>
                            <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                            <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-4">
                                <div className="h-1/4 w-full rounded-lg border-2 border-dashed border-white/80 bg-black/20" />
                            </div>
                            {isProcessing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                                    <p className="mt-4 text-white">Przetwarzanie...</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
                 <canvas ref={canvasRef} className="hidden" />

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
                    <Button onClick={handleCaptureAndProcess} disabled={isProcessing || !hasCameraPermission}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Skanuj
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
