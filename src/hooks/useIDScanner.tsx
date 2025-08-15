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
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    console.log('📹 Starting camera function called');
    try {
      setError(null);
      console.log('📹 Requesting camera access...');
      
      // Check if navigator.mediaDevices exists
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      console.log('Camera stream obtained:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('Video playing successfully');
              setIsCameraActive(true);
            }).catch((playError) => {
              console.error('Error playing video:', playError);
              setError('Error al reproducir el video de la cámara');
            });
          }
        };
        
        videoRef.current.onerror = (videoError) => {
          console.error('Video error:', videoError);
          setError('Error en el video de la cámara');
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
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
    setCapturedImage(null);
    setPreviewMode(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Error en los componentes de video');
      return;
    }

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
      setCapturedImage(imageData);
      setPreviewMode(true);
      setError(null);
    } catch (err) {
      setError('Error al capturar la imagen');
      console.error('Capture error:', err);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setPreviewMode(false);
    setError(null);
  };

  const scanCapturedImage = async (): Promise<IDData | null> => {
    if (!capturedImage) {
      setError('No hay imagen capturada para escanear');
      return null;
    }

    setIsScanning(true);
    setError(null);

    try {

      const { data: { text } } = await Tesseract.recognize(capturedImage, 'spa', {
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
    
    // Clean the text
    const cleanText = text.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ\-]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Enhanced patterns for Dominican ID extraction
    const cedulaPatterns = [
      /\b(\d{3}[\-\s]?\d{7}[\-\s]?\d{1})\b/g,
      /(\d{11})/g, // Just 11 consecutive digits
      /(\d{3}\s*\d{7}\s*\d{1})/g // With spaces
    ];
    
    // Enhanced name patterns with more variations
    const nombrePatterns = [
      /(?:NOMBRES?|NAME|PRIMER\s+NOMBRE)[:\s]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
      /NOMBRE[:\s]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
      /(?:GIVEN\s+NAME|FIRST\s+NAME)[:\s]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
      // Look for patterns like "JUAN CARLOS" in capital letters
      /^([A-ZÁÉÍÓÚÑ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ]{2,}){0,2})$/m
    ];
    
    const apellidoPatterns = [
      /(?:APELLIDOS?|SURNAME|FAMILY\s+NAME)[:\s]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
      /APELLIDO[:\s]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i,
      /(?:LAST\s+NAME)[:\s]*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+)/i
    ];
    
    // Pattern for lines with only uppercase names (common in ID cards)
    const nameLinePattern = /^([A-ZÁÉÍÓÚÑ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ]{2,})*)\s+([A-ZÁÉÍÓÚÑ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ]{2,})*)$/;

    let cedula = '';
    let nombre = '';
    let apellido = '';

    // Extract cedula with multiple patterns
    for (const pattern of cedulaPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        cedula = matches[0].replace(/[\-\s]/g, '');
        if (cedula.length === 11) break; // Valid Dominican cedula length
      }
    }

    // Extract nombres using enhanced patterns
    for (const pattern of nombrePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim().split(/\s+/).slice(0, 2).join(' ');
        if (extracted.length > 2) {
          nombre = extracted;
          break;
        }
      }
    }

    // Extract apellidos using enhanced patterns
    for (const pattern of apellidoPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim().split(/\s+/).slice(0, 2).join(' ');
        if (extracted.length > 2) {
          apellido = extracted;
          break;
        }
      }
    }

    // If no labeled matches, try to extract from lines with only uppercase letters
    if (!nombre && !apellido) {
      const lines = cleanText.split('\n').filter(line => line.trim().length > 5);
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip lines with numbers or too many spaces
        if (/\d/.test(trimmedLine) || trimmedLine.split(/\s+/).length > 6) continue;
        
        // Look for lines with 2-4 words in uppercase
        const words = trimmedLine.split(/\s+/).filter(word => word.length > 1);
        if (words.length >= 2 && words.length <= 4 && words.every(word => /^[A-ZÁÉÍÓÚÑ]+$/.test(word))) {
          if (!nombre) {
            nombre = words.slice(0, 2).join(' ');
          } else if (!apellido) {
            apellido = words.join(' ');
            break;
          }
        }
        
        // Alternative: look for pattern with clear name structure
        const nameMatch = trimmedLine.match(nameLinePattern);
        if (nameMatch && !nombre && !apellido) {
          nombre = nameMatch[1].trim();
          apellido = nameMatch[2].trim();
          break;
        }
      }
    }

    // Clean up extracted data
    nombre = nombre.replace(/\s+/g, ' ').trim();
    apellido = apellido.replace(/\s+/g, ' ').trim();

    return {
      cedula: cedula,
      nombre: nombre,
      apellido: apellido
    };
  };

  return {
    isScanning,
    isCameraActive,
    capturedImage,
    previewMode,
    error,
    videoRef,
    canvasRef,
    previewCanvasRef,
    startCamera,
    stopCamera,
    capturePhoto,
    retakePhoto,
    scanCapturedImage
  };
};