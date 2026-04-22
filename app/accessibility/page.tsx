"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, Image as ImageIcon, Video, HandMetal, MessageSquare, Camera } from "lucide-react";

const API_BASE = "http://127.0.0.1:5000";

export default function AccessibilitySettings() {
  const [activeTab, setActiveTab] = useState("sign-lang");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isRealtimeOn, setIsRealtimeOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signText, setSignText] = useState("Waiting for hand gesture...");
  const [signError, setSignError] = useState("");
  const [cameraStatus, setCameraStatus] = useState("Camera is off");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const lastSpokenRef = useRef("");

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    // If stream exists but video element remounted (tab switch), reattach it.
    if (activeTab === "sign-lang" && isCameraOn && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [activeTab, isCameraOn]);

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          void videoRef.current?.play().catch(() => {});
        };
      }
      setIsCameraOn(true);
      setSignError("");
      setCameraStatus("Camera is on");
    } catch {
      setSignError("Could not access camera.");
      setCameraStatus("Camera permission denied");
    }
  };

  const stopCamera = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRealtimeOn(false);
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
    setCameraStatus("Camera is off");
  };

  const captureFrameBase64 = () => {
    if (!videoRef.current || !canvasRef.current) return "";
    const video = videoRef.current;
    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) return "";
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    return dataUrl.split(",")[1] || "";
  };

  const translateFrame = async () => {
    if (!isCameraOn) {
      setSignError("Enable camera first.");
      return;
    }
    if (inFlightRef.current) return;

    const imageData = captureFrameBase64();
    if (!imageData) {
      setSignError("Could not capture frame.");
      return;
    }

    inFlightRef.current = true;
    setIsLoading(true);
    setSignError("");
    try {
      const res = await fetch(`${API_BASE}/sign-lang/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: `data:image/jpeg;base64,${imageData}`,
        }),
      });
      if (!res.ok) {
        throw new Error("Prediction request failed");
      }
      const data = await res.json();
      const text = String(data?.predicted_word || data?.status || "Gesture unclear.").trim();
      setSignText(text);
      if (
        text !== lastSpokenRef.current &&
        text.toLowerCase() !== "gesture unclear." &&
        typeof data?.confidence === "number" &&
        data.confidence >= 0.6
      ) {
        lastSpokenRef.current = text;
        speakText(text);
      }
    } catch (err: any) {
      setSignError(err?.message || "Sign translation failed. Check backend.");
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  };

  const toggleRealtime = () => {
    if (isRealtimeOn) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setIsRealtimeOn(false);
      return;
    }
    if (!isCameraOn) {
      setSignError("Enable camera first.");
      return;
    }
    void translateFrame();
    timerRef.current = setInterval(() => {
      void translateFrame();
    }, 2500);
    setIsRealtimeOn(true);
  };

  return (
    <div className="section-container">
      <header className="section-header">
        <Link href="/" className="back-btn glass-btn">
          <ArrowLeft /> Back
        </Link>
        <div className="header-text">
          <h1 className="title-small">Accessibility Tools</h1>
          <p>Empowering communication and understanding for everyone.</p>
        </div>
      </header>

      <div className="layout-grid">
        {/* Sidebar Nav */}
        <nav className="glass-card sidebar">
          <button
            className={`tab-btn ${activeTab === 'sign-lang' ? 'active' : ''}`}
            onClick={() => setActiveTab('sign-lang')}
          >
            <HandMetal className="icon-mr" /> Sign-Language Translator
          </button>
          <button
            className={`tab-btn ${activeTab === 'speech' ? 'active' : ''}`}
            onClick={() => setActiveTab('speech')}
          >
            <Mic className="icon-mr" /> Speech-to-Text
          </button>
          <button
            className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            <ImageIcon className="icon-mr" /> Image Description
          </button>
        </nav>

        {/* Content Area */}
        <main className="glass-card content-area">
          {activeTab === 'sign-lang' && (
            <div className="feature-panel animation-fade">
              <h2><HandMetal className="icon-mr accent-text" /> Sign-Language ↔ Text/Voice</h2>
              <p className="desc-text">Translate live hand gestures to text and voice in realtime using local sign backend.</p>

              <div className="video-placeholder glass-card-inner">
                <div className="relative w-full max-w-xl aspect-video bg-black rounded-lg overflow-hidden mb-3">
                  {isCameraOn ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/80">
                      <div className="text-center">
                        <Camera size={44} className="mx-auto mb-2" />
                        <p>Camera is off</p>
                      </div>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex-row wrap gap-3 justify-center">
                  <button className="primary-btn mt-2" onClick={() => (isCameraOn ? stopCamera() : void startCamera())}>
                    {isCameraOn ? "Stop Camera" : "Enable Camera"}
                  </button>
                  <button className="primary-btn mt-2" onClick={toggleRealtime} disabled={!isCameraOn}>
                    {isRealtimeOn ? "Stop Realtime Translate" : "Start Realtime Translate"}
                  </button>
                </div>
                <button className="glass-btn mt-3" onClick={() => void translateFrame()} disabled={!isCameraOn || isLoading}>
                  {isLoading ? "Translating..." : "Translate Current Frame"}
                </button>
                <p className="text-secondary mt-2">{cameraStatus}</p>
                {signError && <p className="accent-text mt-2">{signError}</p>}
              </div>

              <div className="translation-box glass-card-inner mt-4">
                <div className="trans-result">
                  <span className="label">Detected Sign / Text:</span>
                  <p className="mock-text">{signText}</p>
                </div>
                <div className="actions mt-4">
                  <button className="primary-btn" onClick={() => speakText(signText)}>
                    <MessageSquare className="icon-mr" /> Speak Output
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'speech' && (
            <div className="feature-panel animation-fade">
              <h2><Mic className="icon-mr accent-text" /> Speech-to-Text with Emotion Indicators</h2>
              <p className="desc-text">Speak to generate text along with detected emotional undertones.</p>

              <div className="mic-area glass-card-inner">
                <button className="record-btn pulsing mb-4">
                  <Mic size={32} />
                </button>
                <p>Listening...</p>
              </div>

              <div className="transcript-box glass-card-inner mt-4">
                <div className="emotion-indicator mb-2">
                  <span className="emotion joy glass-badge">😊 Joyful (85%)</span>
                </div>
                <p className="transcript-text text-lg italic">"I am so excited to use this new application!"</p>
              </div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="feature-panel animation-fade">
              <h2><ImageIcon className="icon-mr accent-text" /> Image Description</h2>
              <p className="desc-text">Upload or capture an image to hear an AI-generated description.</p>

              <div className="upload-area glass-card-inner">
                <Video size={48} className="upload-icon mb-2 accent-text" />
                <p>Drag and drop an image, or click to browse</p>
                <Link
                  href="/image-description"
                  className="primary-btn mt-4 inline-flex"
                  style={{ textDecoration: "none" }}
                >
                  Capture Image
                </Link>
              </div>

              <div className="description-result glass-card-inner mt-4">
                <h3 className="mb-2">AI Description:</h3>
                <p className="text-lg">"A sunny park with children playing on a swing set, and a large oak tree in the foreground."</p>
                <button className="primary-btn mt-4"><Mic className="icon-mr" /> Read Aloud</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
