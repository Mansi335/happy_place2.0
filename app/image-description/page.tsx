"use client";

import { useState, useRef, useEffect } from "react";

const PRIMARY_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";
const FALLBACK_BACKEND_URL = "http://localhost:5000";
const VOICE_EVENT_NAME = "happy-place-voice-command";

export default function ImageDescriptionPage() {
  const [caption, setCaption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const realtimeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const lastSpokenRef = useRef<string>("");

  useEffect(() => {
    // Start camera stream on mount
    startCamera();
    return () => {
      // Cleanup camera on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (realtimeIntervalRef.current) clearInterval(realtimeIntervalRef.current);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (!isRealtime) {
      if (realtimeIntervalRef.current) clearInterval(realtimeIntervalRef.current);
      realtimeIntervalRef.current = null;
      return;
    }

    // Analyze one frame immediately, then every 3 seconds.
    void captureAndDescribe(true);
    realtimeIntervalRef.current = setInterval(() => {
      void captureAndDescribe(true);
    }, 3000);

    return () => {
      if (realtimeIntervalRef.current) clearInterval(realtimeIntervalRef.current);
      realtimeIntervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRealtime]);

  useEffect(() => {
    const onVoiceCommand = (event: Event) => {
      const customEvent = event as CustomEvent<{ command?: string }>;
      const command = customEvent.detail?.command?.toLowerCase().trim() || "";
      if (!command) return;

      if (command.includes("capture") || command.includes("describe now")) {
        void captureAndDescribe();
        return;
      }

      if (command.includes("start realtime")) {
        setIsRealtime(true);
        speakCaption("Realtime mode started.");
        return;
      }

      if (command.includes("stop realtime")) {
        setIsRealtime(false);
        speakCaption("Realtime mode stopped.");
        return;
      }

      if ((command.includes("read caption") || command.includes("speak caption")) && caption) {
        speakCaption(caption);
      }
    };

    window.addEventListener(VOICE_EVENT_NAME, onVoiceCommand as EventListener);
    return () => window.removeEventListener(VOICE_EVENT_NAME, onVoiceCommand as EventListener);
  }, [caption]);

  const speakCaption = (text: string) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

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

  const captureAndDescribe = async (silent = false) => {
    if (!videoRef.current || !canvasRef.current) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setIsLoading(true);
    if (!silent) setCaption(null);
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
          let response: Response;
          try {
            response = await fetch(`${PRIMARY_BACKEND_URL}/api/image-description`, {
              method: "POST",
              body: formData,
            });
            if (!response.ok) {
              response = await fetch(`${FALLBACK_BACKEND_URL}/api/image-description`, {
                method: "POST",
                body: formData,
              });
            }
          } catch {
            // Fallback for localhost/127.0.0.1 mismatch in browser networking.
            response = await fetch(`${FALLBACK_BACKEND_URL}/api/image-description`, {
              method: "POST",
              body: formData,
            });
          }

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "Backend failed to process image.");
          }

          const data = await response.json();
          setCaption(data.caption);

          if (data.caption && lastSpokenRef.current !== data.caption) {
            lastSpokenRef.current = data.caption;
            speakCaption(data.caption);
          }

        } catch (err: any) {
          setError(err.message || "An error occurred.");
        } finally {
          inFlightRef.current = false;
          setIsLoading(false);
        }
      }, 'image/jpeg');
    } else {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-6 text-gray-800">
      <div className="max-w-xs w-full bg-white rounded-xl shadow-lg p-3">
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600">
          AI Image Description
        </h1>

        <div className="flex flex-col items-center space-y-6">
          {/* Webcam feed */}
          <div className="relative w-full max-w-xs aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
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
            onClick={() => void captureAndDescribe()}
            disabled={isLoading}
            className={`px-8 py-4 rounded-full text-white text-lg font-bold shadow-md transition-all ${
              isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-500 hover:bg-indigo-600 active:scale-95"
            }`}
          >
            {isLoading ? "Analyzing Scene..." : "Capture & Describe"}
          </button>

          <button
            onClick={() => setIsRealtime((prev) => !prev)}
            className={`px-8 py-4 rounded-full text-white text-lg font-bold shadow-md transition-all ${
              isRealtime ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
            }`}
          >
            {isRealtime ? "Stop Realtime Mode" : "Start Realtime Mode"}
          </button>

          {caption && (
            <div className="w-full bg-indigo-50 p-6 rounded-lg text-center mt-6 animate-fade-in">
              <h3 className="text-sm uppercase tracking-wider text-indigo-500 font-bold mb-2">
                What the AI Sees
              </h3>
              <p className="text-xl font-bold text-indigo-900">{caption}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
