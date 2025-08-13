import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

interface IDData {
  cedula: string;
  nombre: string;
  apellido: string;
}

export const useIDScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Verifique los permisos.');
      console.error('Camera access error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureAndScan = async (): Promise<IDData | null> => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Error en los componentes de video');
      return null;
    }

    setIsScanning(true);
    setError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No se pudo obtener el contexto del canvas');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/png');

      const { data: { text } } = await Tesseract.recognize(imageData, 'spa', {
        logger: m => console.log(m)
      });

      const parsedData = parseIDText(text);
      
      if (!parsedData.cedula && !parsedData.nombre) {
        setError('No se pudo extraer información de la cédula. Intente de nuevo.');
        return null;
      }

      return parsedData;
    } catch (err) {
      setError('Error al procesar la imagen. Intente de nuevo.');
      console.error('OCR Error:', err);
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  const parseIDText = (text: string): IDData => {
    console.log('OCR Text:', text);
    
    // Patterns for Dominican ID
    const cedulaPattern = /\b\d{3}-?\d{7}-?\d{1}\b/g;
    const nombrePattern = /(?:NOMBRES?|NAME)[:\s]*([A-ZÁÉÍÓÚÑ\s]+)/i;
    const apellidoPattern = /(?:APELLIDOS?|SURNAME)[:\s]*([A-ZÁÉÍÓÚÑ\s]+)/i;
    
    // Alternative patterns for names without labels
    const linePattern = /^([A-ZÁÉÍÓÚÑ\s]{2,})\s+([A-ZÁÉÍÓÚÑ\s]{2,})$/m;

    let cedula = '';
    let nombre = '';
    let apellido = '';

    // Extract cedula
    const cedulaMatch = text.match(cedulaPattern);
    if (cedulaMatch) {
      cedula = cedulaMatch[0].replace(/-/g, '');
    }

    // Extract nombres
    const nombreMatch = text.match(nombrePattern);
    if (nombreMatch) {
      nombre = nombreMatch[1].trim();
    }

    // Extract apellidos
    const apellidoMatch = text.match(apellidoPattern);
    if (apellidoMatch) {
      apellido = apellidoMatch[1].trim();
    }

    // If no labeled matches, try to extract from lines
    if (!nombre && !apellido) {
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      for (const line of lines) {
        const lineMatch = line.match(linePattern);
        if (lineMatch && !nombre && !apellido) {
          nombre = lineMatch[1].trim();
          apellido = lineMatch[2].trim();
          break;
        }
      }
    }

    return {
      cedula: cedula,
      nombre: nombre,
      apellido: apellido
    };
  };

  return {
    isScanning,
    isCameraActive,
    error,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureAndScan
  };
};