"use client";

import { useState, useRef, useEffect } from "react";

export default function SignLanguageCheckerPage() {
  const [targetSign, setTargetSign] = useState<string>("Hello");
  const [prediction, setPrediction] = useState<string>("");
  const [status, setStatus] = useState<string>("Connecting...");
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const signs = ['Hello', 'ThankYou', 'GoodMorning', 'Sorry', 'HowAreYou'];

  useEffect(() => {
    // Setup Camera
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing camera:", err);
        setStatus("Camera error.");
      }
    };
    
    // Setup WebSocket
    const setupWebSocket = () => {
      wsRef.current = new WebSocket("ws://localhost:8000/ws/sign-check");
      
      wsRef.current.onopen = () => {
        setStatus("Connected! Start signing.");
        // Start streaming frames
        streamIntervalRef.current = setInterval(sendFrame, 150); // ~6.6 FPS
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.status) {
          setStatus(data.status); // Usually gathering frames message
        }
        
        if (data.word) {
          setPrediction(`Seeing: ${data.word} (${data.confidence.toFixed(2)})`);
          setStatus("");
          
          // Check for success
          if (data.word === targetSign && data.confidence > 0.4) {
            setIsCorrect(true);
            setTimeout(() => {
              setIsCorrect(false);
              nextSign();
            }, 2000);
          }
        }
      };

      wsRef.current.onclose = () => setStatus("Disconnected.");
    };

    setupCamera().then(() => setupWebSocket());

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const str = videoRef.current.srcObject as MediaStream;
        str.getTracks().forEach(t => t.stop());
      }
    };
  }, [targetSign]); // Re-bind effect when targetSign changes so closure captures new targetSign

  const sendFrame = () => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current) return;
    if (wsRef.current.readyState !== WebSocket.OPEN) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.5); // compress to speed up transfer
      wsRef.current.send(dataUrl);
    }
  };

  const nextSign = () => {
    setTargetSign((prev) => {
      const idx = signs.indexOf(prev);
      if (idx < signs.length - 1) return signs[idx + 1];
      setStatus("All signs completed!");
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="max-w-4xl w-full flex flex-col items-center">
        
        <h1 className="text-4xl font-bold mb-4 text-emerald-400 font-mono tracking-tight">
          AI Sign Language Checker
        </h1>
        
        <div className="bg-gray-800 px-6 py-3 rounded-full mb-8 shadow-lg border border-gray-700">
          <span className="text-lg text-gray-400 mr-2">Target Sign:</span>
          <span className="text-2xl font-bold text-white uppercase">{targetSign}</span>
        </div>

        <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden border-4 border-gray-800 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-video object-cover transform -scale-x-100" // Mirrors the camera
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Status Overlay */}
          <div className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm shadow-md">
            <p className="text-yellow-400 font-bold">{prediction || status}</p>
          </div>

          {/* Success Overlay */}
          {isCorrect && (
            <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center animate-pulse">
              <h2 className="text-6xl font-black text-white drop-shadow-2xl translate-y-12 bg-emerald-600/80 px-8 py-4 rounded-3xl">
                CORRECT! 🎉
              </h2>
            </div>
          )}
        </div>

        <button 
          onClick={nextSign}
          className="mt-8 text-gray-400 hover:text-white underline underline-offset-4 decoration-gray-600 transition-colors"
        >
          Skip to next word ⏭
        </button>

      </div>
    </div>
  );
}
