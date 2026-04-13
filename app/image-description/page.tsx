"use client";

import { useState, useRef, useEffect } from "react";

export default function ImageDescriptionPage() {
  const [caption, setCaption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Start camera stream on mount
    startCamera();
    return () => {
      // Cleanup camera on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setError("Could not access the camera.");
    }
  };

  const captureAndDescribe = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsLoading(true);
    setCaption(null);
    setError(null);

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Draw the current video frame onto the canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to Blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError("Failed to capture image.");
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", blob, "capture.jpg");

        try {
          const response = await fetch("http://localhost:8000/api/image-description", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Backend failed to process image.");

          const data = await response.json();
          setCaption(data.caption);
          
          // Native text to speech
          if (data.caption && 'speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(data.caption);
            window.speechSynthesis.speak(utterance);
          }

        } catch (err: any) {
          setError(err.message || "An error occurred.");
        } finally {
          setIsLoading(false);
        }
      }, 'image/jpeg');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-6 text-gray-800">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600">
          AI Image Description
        </h1>

        <div className="flex flex-col items-center space-y-6">
          {/* Webcam feed */}
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {error && <p className="text-red-500 font-semibold">{error}</p>}

          <button
            onClick={captureAndDescribe}
            disabled={isLoading}
            className={`px-8 py-4 rounded-full text-white text-lg font-bold shadow-md transition-all ${
              isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-500 hover:bg-indigo-600 active:scale-95"
            }`}
          >
            {isLoading ? "Analyzing Scene..." : "Capture & Describe"}
          </button>

          {caption && (
            <div className="w-full bg-indigo-50 p-6 rounded-lg text-center mt-6 animate-fade-in">
              <h3 className="text-sm uppercase tracking-wider text-indigo-500 font-bold mb-2">
                What the AI Sees
              </h3>
              <p className="text-xl font-medium text-indigo-900">{caption}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
