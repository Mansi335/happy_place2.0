"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Smile, Train, Hand, Volume2, User, LayoutDashboard } from "lucide-react";

export default function ChildLearning() {
  const [activeTab, setActiveTab] = useState("emotion");

  // ✅ API call with debugging
  const startFingerDrawing = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/finger-drawing");
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error("Error:", err);
      alert("Backend not connected");
    }
  };

  return (
    <div className="section-container">
      <header className="section-header">
        <Link href="/" className="back-btn glass-btn">
          <ArrowLeft className="icon-mr" /> Back
        </Link>

        <div className="header-text">
          <h1 className="title-small">Child Learning & Play</h1>
          <p>Joyful interactive games to develop emotional and cognitive skills.</p>
        </div>
      </header>

      <div className="layout-grid">

        {/* Sidebar */}
        <nav className="glass-card sidebar">
          <button onClick={() => setActiveTab('emotion')} className={`tab-btn ${activeTab === 'emotion' ? 'active' : ''}`}>
            <Smile className="icon-mr" /> Emotion Recognition
          </button>

          <button onClick={() => setActiveTab('motion')} className={`tab-btn ${activeTab === 'motion' ? 'active' : ''}`}>
            <Train className="icon-mr" /> Motion Train
          </button>

          <button onClick={() => setActiveTab('finger')} className={`tab-btn ${activeTab === 'finger' ? 'active' : ''}`}>
            <Hand className="icon-mr" /> Finger Connect Dots
          </button>

          <button onClick={() => setActiveTab('sound')} className={`tab-btn ${activeTab === 'sound' ? 'active' : ''}`}>
            <Volume2 className="icon-mr" /> Similar Sound Game
          </button>

          <button onClick={() => setActiveTab('guess')} className={`tab-btn ${activeTab === 'guess' ? 'active' : ''}`}>
            <User className="icon-mr" /> Guess Emotion
          </button>

          <button onClick={() => setActiveTab('parent')} className={`tab-btn ${activeTab === 'parent' ? 'active' : ''}`}>
            <LayoutDashboard className="icon-mr" /> Parent Dashboard
          </button>
        </nav>

        {/* Content */}
        <main className="glass-card content-area">

          {/* ✅ FINGER TAB */}
          {activeTab === 'finger' && (
            <div className="feature-panel">

              <h2>✋ Finger Connect the Dots</h2>
              <p>Use your finger via camera to draw shapes!</p>

              <div
                style={{
                  padding: "20px",
                  border: "2px dashed #ccc",
                  borderRadius: "10px",
                  textAlign: "center"
                }}
              >

                {/* 🔥 BUTTON (100% visible) */}
                <button
                  onClick={startFingerDrawing}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#c89b6d",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "16px",
                    marginBottom: "15px"
                  }}
                >
                  ▶ Start Finger Drawing
                </button>

                <p>Camera will open on click</p>

              </div>
            </div>
          )}

          {/* Emotion */}
          {activeTab === 'emotion' && (
            <div className="feature-panel animation-fade">
              <h2><Smile className="icon-mr accent-text" /> Emotion Recognition Camera</h2>
              <p className="desc-text">Shows your face, detects emotion (happy, sad, angry) and responds playfully.</p>

              <div className="video-placeholder glass-card-inner">
                <Smile size={64} className="camera-icon mb-2 pulsing" />
                <p>Looking for your beautiful smile...</p>
                <div className="emotion-overlay joy">
                  ✨ Happy Detected! ✨
                </div>
              </div>
            </div>
          )}

          {activeTab === 'motion' && (
            <div className="feature-panel animation-fade">
              <h2><Train className="icon-mr accent-text" /> Motion Train</h2>
              <p className="desc-text">Drag and drop the shapes into the correct train car!</p>

              <div className="game-area glass-card-inner">
                <div className="train-cars flex-row mb-4">
                  <div className="car red">Square Car</div>
                  <div className="car blue">Circle Car</div>
                </div>
                <div className="shapes flex-row">
                  <div className="shape box draggable mr-2">🟦</div>
                  <div className="shape circle draggable">🔴</div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'sound' && (
            <div className="feature-panel animation-fade">
              <h2><Volume2 className="icon-mr accent-text" /> Similar Sound Game</h2>
              <p className="desc-text">Listen carefully, is it 'ba' or 'pa'?</p>

              <div className="game-area glass-card-inner text-center">
                <button className="primary-btn mb-4 pulsing"><Volume2 size={48} /></button>
                <p className="mb-4 text-lg">What sound did you hear?</p>
                <div className="flex-row justify-center gap-4">
                  <button className="primary-btn btn-large">ba</button>
                  <button className="primary-btn btn-large">pa</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guess' && (
            <div className="feature-panel animation-fade">
              <h2><User className="icon-mr accent-text" /> Guess the AI Emotion</h2>
              <p className="desc-text">Can you guess how the AI friend is feeling today?</p>

              <div className="game-area glass-card-inner text-center">
                <div className="ai-face mb-4">
                  <span className="text-6xl">😕</span>
                </div>
                <div className="flex-row justify-center gap-4 wrap mt-4">
                  <button className="primary-btn">Happy</button>
                  <button className="primary-btn">Sad</button>
                  <button className="glass-btn">Confused</button>
                  <button className="glass-btn">Angry</button>
                </div>
                <p className="mt-4 text-lg accent-text">✨ Correct! The AI is Confused.</p>
              </div>
            </div>
          )}

          {activeTab === 'parent' && (
            <div className="feature-panel animation-fade">
              <h2><LayoutDashboard className="icon-mr accent-text" /> Parent Dashboard</h2>
              <p className="desc-text">Monitor learning progress and game statistics.</p>

              <div className="stats-grid">
                <div className="glass-card-inner text-center">
                  <h3 className="text-secondary">Emotions Mastered</h3>
                  <p className="text-6xl text-gradient font-bold mt-2">4/6</p>
                </div>
                <div className="glass-card-inner text-center">
                  <h3 className="text-secondary">Hours Played</h3>
                  <p className="text-6xl text-gradient font-bold mt-2">12</p>
                </div>
                <div className="glass-card-inner text-center">
                  <h3 className="text-secondary">Accuracy (Sounds)</h3>
                  <p className="text-6xl text-gradient font-bold mt-2">85%</p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}