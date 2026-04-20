"use client";

import { useState, useRef, useEffect } from "react";

const API_BASE = "http://127.0.0.1:5000";

type SessionResponse = {
  session_id: string;
  actions: string[];
  target_idx: number;
  target_word: string;
  score: number;
  streak_required: number;
  min_confidence: number;
};

type PredictResponse = {
  done?: boolean;
  status?: string;
  predicted_word?: string;
  confidence?: number;
  target_word?: string;
  target_idx?: number;
  correct_streak?: number;
  streak_required?: number;
  score?: number;
  round_complete?: boolean;
  next_target?: string | null;
  error?: string;
};

export default function SignLanguageCheckerPage() {
  const [targetSign, setTargetSign] = useState<string>("--");
  const [prediction, setPrediction] = useState<string>("Waiting for model...");
  const [status, setStatus] = useState<string>("Starting sign quiz session...");
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [streakRequired, setStreakRequired] = useState<number>(4);
  const [sessionReady, setSessionReady] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const streamIntervalRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const signsRef = useRef<string[]>([]);

  useEffect(() => {
    mountedRef.current = true;

    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing camera:", err);
        setStatus("Camera error. Please allow camera permission.");
      }
    };

    const startSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/sign-lang/session`, { method: "POST" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as SessionResponse;

        if (!mountedRef.current) return;
        sessionIdRef.current = data.session_id;
        signsRef.current = data.actions || [];
        setTargetSign(data.target_word);
        setScore(data.score ?? 0);
        setTotal(data.actions?.length ?? 0);
        setStreakRequired(data.streak_required ?? 4);
        setSessionReady(true);
        setDone(false);
        setStatus("Session connected. Start signing!");

        streamIntervalRef.current = window.setInterval(() => {
          void sendFrame();
        }, 180);
      } catch (err) {
        console.error(err);
        setStatus("Backend not connected. Start: python3 sign_lang_check/server.py");
      }
    };

    void setupCamera().then(() => startSession());

    return () => {
      mountedRef.current = false;
      if (streamIntervalRef.current) window.clearInterval(streamIntervalRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const str = videoRef.current.srcObject as MediaStream;
        str.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const sendFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !sessionIdRef.current) return;
    if (!sessionReady || done || inFlightRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);

    inFlightRef.current = true;
    try {
      const res = await fetch(`${API_BASE}/sign-lang/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          image: dataUrl,
        }),
      });

      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as PredictResponse;

      if (data.error) {
        setStatus(data.error);
        return;
      }

      if (data.predicted_word && typeof data.confidence === "number") {
        setPrediction(`Seeing: ${data.predicted_word} (${data.confidence.toFixed(2)})`);
      }
      if (typeof data.score === "number") setScore(data.score);
      if (typeof data.correct_streak === "number") setStreak(data.correct_streak);
      if (typeof data.streak_required === "number") setStreakRequired(data.streak_required);
      if (data.target_word) setTargetSign(data.target_word);
      if (data.status) setStatus(data.status);

      if (data.round_complete) {
        setIsCorrect(true);
        window.setTimeout(() => setIsCorrect(false), 900);
      }

      if (data.done) {
        setDone(true);
        setStatus("All signs completed! Great job.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Prediction failed. Check backend server.");
    } finally {
      inFlightRef.current = false;
    }
  };

  const restartSession = async () => {
    if (!sessionIdRef.current) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/sign-lang/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionIdRef.current }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { target_word?: string; score?: number };
      setDone(false);
      setTargetSign(data.target_word ?? (signsRef.current[0] ?? "Hello"));
      setScore(data.score ?? 0);
      setPrediction("Waiting for model...");
      setStatus("Session reset. Start signing!");
      setStreak(0);
      setIsCorrect(false);
    } catch (err) {
      console.error(err);
      setStatus("Could not reset session.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-4 text-emerald-400 font-mono tracking-tight">
          AI Sign Language Practice Quiz
        </h1>

        <div className="bg-gray-800 px-6 py-3 rounded-full mb-8 shadow-lg border border-gray-700">
          <span className="text-lg text-gray-400 mr-2">Current Target:</span>
          <span className="text-2xl font-bold text-white uppercase">{targetSign}</span>
        </div>

        <div className="mb-5 text-sm text-gray-300 flex gap-4 flex-wrap justify-center">
          <span>Score: {score}/{total || "-"}</span>
          <span>Hold steady: {streak}/{streakRequired}</span>
          {done && <span className="text-emerald-400 font-semibold">Quiz complete</span>}
        </div>

        <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden border-4 border-gray-800 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-video object-cover transform -scale-x-100"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm shadow-md">
            <p className="text-yellow-400 font-bold">{prediction || status}</p>
            {status && <p className="text-gray-200 text-sm mt-1">{status}</p>}
          </div>

          {isCorrect && (
            <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center animate-pulse">
              <h2 className="text-5xl font-black text-white drop-shadow-2xl translate-y-12 bg-emerald-600/80 px-8 py-4 rounded-3xl">
                CORRECT
              </h2>
            </div>
          )}
        </div>

        <button
          onClick={() => void restartSession()}
          disabled={busy || !sessionReady}
          className="mt-8 text-gray-300 hover:text-white underline underline-offset-4 decoration-gray-600 transition-colors disabled:opacity-60"
        >
          {busy ? "Restarting..." : "Restart quiz"}
        </button>
      </div>
    </div>
  );
}
