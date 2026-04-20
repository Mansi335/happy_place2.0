"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Grip, BookOpen, CheckCircle, Play, Target, Mic, RotateCcw } from "lucide-react";

const API_BASE = "http://127.0.0.1:5000";

type BrailleState = {
  letters: string[];
  index: number;
  total: number;
  current: string | null;
  done: boolean;
  image_filename: string | null;
};

export default function InclusionLearning() {
  const [activeTab, setActiveTab] = useState("braille");
  const [brailleState, setBrailleState] = useState<BrailleState | null>(null);
  const [brailleLoading, setBrailleLoading] = useState(false);
  const [brailleFeedback, setBrailleFeedback] = useState<string>("");
  const [brailleListening, setBrailleListening] = useState(false);

  const fetchBrailleState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/braille/state`);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setBrailleState(data);
    } catch {
      setBrailleFeedback("Start the Flask backend (backend/app.py) to use Braille test.");
      setBrailleState(null);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "braille") void fetchBrailleState();
  }, [activeTab, fetchBrailleState]);

  const resetBraille = async () => {
    setBrailleLoading(true);
    setBrailleFeedback("");
    try {
      const res = await fetch(`${API_BASE}/braille/reset`, { method: "POST" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setBrailleState(data);
    } catch {
      setBrailleFeedback("Could not reset — is the backend running?");
    }
    setBrailleLoading(false);
  };

  const verifySpokenText = async (text: string) => {
    setBrailleLoading(true);
    setBrailleFeedback("");
    try {
      const res = await fetch(`${API_BASE}/braille/verify-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const out = await res.json();
      if (out.status === "correct") {
        setBrailleFeedback(`Correct — you said a match for “${out.letter}”. Next letter!`);
        await fetchBrailleState();
      } else if (out.status === "done") {
        setBrailleFeedback("All letters completed!");
        await fetchBrailleState();
      } else {
        setBrailleFeedback(`Try again. Looking for something containing “${out.letter}”. Heard: “${out.spoken || ""}”`);
      }
    } catch {
      setBrailleFeedback("Verify failed — check backend.");
    }
    setBrailleLoading(false);
  };

  const startBrowserSpeech = () => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        start: () => void;
        onresult: ((ev: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        start: () => void;
        onresult: ((ev: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
      };
    };
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setBrailleFeedback("Speech recognition not supported in this browser. Use Chrome/Edge or record audio below.");
      return;
    }
    const rec = new SpeechRecognitionCtor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    setBrailleListening(true);
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript.trim();
      void verifySpokenText(text);
    };
    rec.onerror = () => {
      setBrailleListening(false);
      setBrailleFeedback("Speech capture error.");
    };
    rec.onend = () => setBrailleListening(false);
    rec.start();
  };

  const recordAndUpload = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setBrailleFeedback("Microphone not available.");
      return;
    }
    setBrailleLoading(true);
    setBrailleFeedback("Recording 3 seconds…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size) chunks.push(ev.data);
      };
      await new Promise<void>((resolve, reject) => {
        mr.onstop = () => resolve();
        mr.onerror = () => reject(new Error("recorder"));
        mr.start();
        setTimeout(() => {
          mr.stop();
          stream.getTracks().forEach((t) => t.stop());
        }, 3000);
      });
      const blob = new Blob(chunks, { type: mime });
      const fd = new FormData();
      fd.append("audio", blob, `speech.${mime.includes("webm") ? "webm" : "mp4"}`);
      const res = await fetch(`${API_BASE}/braille/verify-audio`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(String(res.status));
      const out = await res.json();
      if (out.status === "correct") {
        setBrailleFeedback(`Correct! (Whisper: ${out.transcript || out.spoken})`);
        await fetchBrailleState();
      } else if (out.status === "done") {
        setBrailleFeedback("All done!");
        await fetchBrailleState();
      } else {
        setBrailleFeedback(`Try again. Expected “${out.letter}”. Heard: “${out.transcript || out.spoken || ""}”`);
      }
    } catch {
      setBrailleFeedback("Recording or upload failed. Ensure backend is running.");
    }
    setBrailleLoading(false);
  };

  return (
    <div className="section-container">
      <header className="section-header">
        <Link href="/" className="back-btn glass-btn">
          <ArrowLeft className="icon-mr" /> Back
        </Link>
        <div className="header-text">
            <h1 className="title-small">Inclusion Learning</h1>
            <p>Interactive lessons to learn Braille and Sign Language.</p>
        </div>
      </header>

      <div className="layout-grid">
        {/* Sidebar Nav */}
        <nav className="glass-card sidebar">
        <button onClick={() => setActiveTab('sl-lessons')} className={`tab-btn ${activeTab === 'sl-lessons' ? 'active' : ''}`}>
            <BookOpen className="icon-mr" /> Lessons
          </button>
         
          <div className="mt-4 mb-4 border-b border-white border-opacity-20"></div>
          <h3 className="text-secondary mb-2 pl-4 text-sm font-bold uppercase">Sign Language</h3>
          <button onClick={() => setActiveTab('braille')} className={`tab-btn ${activeTab === 'braille' ? 'active' : ''}`}>
            <Grip className="icon-mr" /> Braille Test
          </button>
          <button onClick={() => setActiveTab('sl-quiz')} className={`tab-btn ${activeTab === 'sl-quiz' ? 'active' : ''}`}>
            <CheckCircle className="icon-mr" /> AI Practice Quiz
          </button>
          <button onClick={() => setActiveTab('sl-reallife')} className={`tab-btn ${activeTab === 'sl-reallife' ? 'active' : ''}`}>
            <Target className="icon-mr" /> Real-life Situations
          </button>
        </nav>

        {/* Content Area */}
        <main className="glass-card content-area">
          {activeTab === 'braille' && (
            <div className="feature-panel animation-fade">
              <h2><Grip className="icon-mr accent-text" /> Braille speech test</h2>
              <p className="desc-text">
                Say the letter name that matches the Braille image (same logic as <code>braille/main.py</code>).
                Use the Flask backend so images and Whisper checks work.
              </p>

              <div className="glass-card-inner flex-row wrap gap-4 align-center mb-4">
                <button type="button" className="glass-btn" onClick={() => void fetchBrailleState()} disabled={brailleLoading}>
                  Refresh state
                </button>
                <button type="button" className="glass-btn" onClick={() => void resetBraille()} disabled={brailleLoading}>
                  <RotateCcw size={16} className="icon-mr" /> Reset progress
                </button>
              </div>

              {brailleState?.done ? (
                <p className="accent-text text-lg">All dataset letters completed. Reset to practice again.</p>
              ) : brailleState?.current ? (
                <div className="flex-row wrap gap-6 align-start">
                  <div className="glass-card-inner text-center" style={{ minWidth: "220px" }}>
                    <p className="text-secondary mb-2">
                      Letter {brailleState.index + 1} of {brailleState.total}: say the name of this character
                    </p>
                    <div
                      className="mx-auto mb-3"
                      style={{
                        width: 200,
                        height: 200,
                        borderRadius: 12,
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.06)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${API_BASE}/braille/image/${encodeURIComponent(brailleState.current)}`}
                        alt={`Braille for ${brailleState.current}`}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </div>
                    <p className="text-xl font-bold">{brailleState.current}</p>
                  </div>
                  <div className="flex-1" style={{ minWidth: "260px" }}>
                    <p className="mb-3 desc-text">
                      <strong>Quick:</strong> speak the letter (e.g. “A” or “letter A”). Your browser may ask for mic access.
                    </p>
                    <div className="flex-row wrap gap-3 mb-3">
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() => startBrowserSpeech()}
                        disabled={brailleLoading || brailleListening}
                      >
                        <Mic size={18} className="icon-mr" />
                        {brailleListening ? "Listening…" : "Speak (browser)"}
                      </button>
                      <button type="button" className="primary-btn" onClick={() => void recordAndUpload()} disabled={brailleLoading}>
                        <Play size={18} className="icon-mr" />
                        Record 3s (Whisper)
                      </button>
                    </div>
                    {brailleFeedback && <p className="accent-text">{brailleFeedback}</p>}
                  </div>
                </div>
              ) : (
                <p className="text-secondary">{brailleFeedback || "Loading…"}</p>
              )}
            </div>
          )}

          {activeTab === 'sl-lessons' && (
            <div className="feature-panel animation-fade">
              <h2><BookOpen className="icon-mr accent-text" /> Sign Language Lessons</h2>
              <p className="desc-text">Start with the basics. Watch the video and try it yourself.</p>
              
              <div className="lesson-video glass-card-inner text-center">
                 <div className="video-placeholder mb-4 flex-row justify-center" style={{minHeight: '200px'}}>
                     <Play size={48} className="camera-icon mb-2" />
                 </div>
                 <h3 className="mb-4 text-xl font-bold">Lesson 1: Greetings</h3>
                 <button className="primary-btn">Start Practice Mode</button>
              </div>
            </div>
          )}

          {activeTab === 'sl-quiz' && (
             <div className="feature-panel animation-fade">
              <h2><CheckCircle className="icon-mr accent-text" /> AI Practice Quiz</h2>
              <p className="desc-text">Perform the sign over the camera, and AI will evaluate your accuracy.</p>
              
              <div className="quiz-area glass-card-inner text-center">
                 <h3 className="mb-4 text-secondary text-lg">Live camera quiz with your trained sign model</h3>
                 <p className="mb-4 text-secondary">Start backend: <code>python3 sign_lang_check/server.py</code></p>
                 <Link href="/sign-check" className="primary-btn inline-flex" style={{ textDecoration: "none" }}>
                   <Play size={18} className="icon-mr" /> Open AI Practice Quiz
                 </Link>
              </div>
            </div>
          )}

          {activeTab === 'sl-reallife' && (
            <div className="feature-panel animation-fade">
              <h2><Target className="icon-mr accent-text" /> Real-life Situations</h2>
              <p className="desc-text">Navigate common scenarios using Sign Language.</p>
              
              <div className="flex-row wrap gap-4 mt-4">
                 <div className="glass-card-inner text-center cursor-pointer hover-scale flex-1" style={{minWidth: '200px'}}>
                    <h3 className="mb-2">☕ Coffee Shop</h3>
                    <p className="text-secondary text-sm">Order a drink using signs.</p>
                 </div>
                 <div className="glass-card-inner text-center cursor-pointer hover-scale flex-1" style={{minWidth: '200px'}}>
                    <h3 className="mb-2">🏥 Hospital Visit</h3>
                    <p className="text-secondary text-sm">Explain your symptoms.</p>
                 </div>
                 <div className="glass-card-inner text-center cursor-pointer hover-scale flex-1" style={{minWidth: '200px'}}>
                    <h3 className="mb-2">👋 Meeting People</h3>
                    <p className="text-secondary text-sm">Basic introductions.</p>
                 </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}