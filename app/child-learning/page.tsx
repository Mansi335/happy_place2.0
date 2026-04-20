"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Smile, Train, Hand, Volume2, User, LayoutDashboard } from "lucide-react";

type SoundData = {
  sound: string;
  options: string[];
  sound_url: string;
  correct: string;
};

type EmotionRound = {
  emoji: string;
  correct: string;
  options: string[];
};

const EMOTION_ROUNDS: EmotionRound[] = [
  { emoji: "😀", correct: "Happy", options: ["Happy", "Sad", "Confused", "Angry"] },
  { emoji: "😢", correct: "Sad", options: ["Happy", "Sad", "Confused", "Angry"] },
  { emoji: "😡", correct: "Angry", options: ["Happy", "Sad", "Confused", "Angry"] },
  { emoji: "😕", correct: "Confused", options: ["Happy", "Sad", "Confused", "Angry"] },
];

const getRandomEmotionRound = () =>
  EMOTION_ROUNDS[Math.floor(Math.random() * EMOTION_ROUNDS.length)];


export default function ChildLearning() {
  const [activeTab, setActiveTab] = useState("emotion");
  const [soundData, setSoundData] = useState<SoundData | null>(null);
  const [loading, setLoading] = useState(false);
  const [motionLoading, setMotionLoading] = useState(false);
  const [selectedSoundOption, setSelectedSoundOption] = useState<string | null>(null);
  const [soundFeedback, setSoundFeedback] = useState("");
  const [emotionRound, setEmotionRound] = useState<EmotionRound>(getRandomEmotionRound());
  const [selectedEmotionOption, setSelectedEmotionOption] = useState<string | null>(null);
  const [emotionFeedback, setEmotionFeedback] = useState("");
  const [emotionScore, setEmotionScore] = useState(0);

  const startSimilarSound = async (autoPlay = false) => {
    setLoading(true);
  
    try {
      const res = await fetch("http://127.0.0.1:5000/similar-sound");
      if (!res.ok) {
        throw new Error(`Failed to fetch sound question: ${res.status}`);
      }
      const data = await res.json();
  
      setSoundData(data);
      setSelectedSoundOption(null);
      setSoundFeedback("");

      if (autoPlay) {
        const audio = new Audio(data.sound_url);
        audio.play().catch((err) => {
          console.error("Audio playback failed:", err);
        });
      }
    } catch (err) {
      console.error(err);
      alert("Could not load sound game from backend");
    }
  
    setLoading(false);
  };

  const playCurrentSound = () => {
    if (!soundData?.sound_url) {
      alert("Click 'Start Similar Sound' first");
      return;
    }

    const audio = new Audio(soundData.sound_url);
    audio.play().catch((err) => {
      console.error("Audio playback failed:", err);
      alert("Could not play audio. Check backend server and browser sound settings.");
    });
  };

  const handleSoundAnswer = (answer: string) => {
    if (!soundData) {
      alert("Click 'Start Similar Sound' first");
      return;
    }

    setSelectedSoundOption(answer);
    if (answer === soundData.correct) {
      setSoundFeedback("Correct! Loading next sound...");
      setTimeout(() => {
        void startSimilarSound(true);
      }, 700);
      return;
    }

    setSoundFeedback(`Try again!`);
  };


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

  const startMotionTrain = async () => {
    setMotionLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/drag-drop");
      const data = await res.json();
      console.log(data);
      alert("Motion Train started");
    } catch (err) {
      console.error("Error:", err);
      alert("Backend not connected");
    }
    setMotionLoading(false);
  };

  const nextEmotionRound = () => {
    setEmotionRound(getRandomEmotionRound());
    setSelectedEmotionOption(null);
    setEmotionFeedback("");
  };

  const handleEmotionGuess = (guess: string) => {
    setSelectedEmotionOption(guess);
    if (guess === emotionRound.correct) {
      setEmotionScore((prev) => prev + 1);
      setEmotionFeedback(`Correct! The AI is ${emotionRound.correct}.`);
      setTimeout(() => {
        nextEmotionRound();
      }, 900);
      return;
    }

    setEmotionFeedback("Oops! Try again.");
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
              <button onClick={startMotionTrain} className="primary-btn mb-4" disabled={motionLoading}>
                {motionLoading ? "Starting..." : "Start Motion Train"}
              </button>

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
  <div>
    {/* API Button */}
    <button onClick={() => startSimilarSound(true)} className="primary-btn">
      Start Similar Sound 🎧
    </button>

    {loading && <p>Loading...</p>}

    {/* UI GAME PANEL */}
    <div className="feature-panel animation-fade">
      <h2>
        <Volume2 className="icon-mr accent-text" /> Similar Sound Game
      </h2>

      <p className="desc-text">
        Listen carefully, is it 'ba' or 'pa'?
      </p>

      <div className="game-area glass-card-inner text-center">
        <button className="primary-btn mb-4 pulsing" onClick={playCurrentSound}>
          <Volume2 size={48} />
        </button>

        <p className="mb-4 text-lg">What sound did you hear?</p>

        <div className="flex-row justify-center gap-4">
          {(soundData?.options ?? ["ba", "pa"]).map((option) => (
            <button
              key={option}
              className="primary-btn btn-large"
              onClick={() => handleSoundAnswer(option)}
              style={{
                outline: selectedSoundOption === option ? "2px solid #0b84ff" : "none",
              }}
            >
              {option}
            </button>
          ))}
        </div>
        {soundFeedback && <p className="mt-4 text-lg accent-text">{soundFeedback}</p>}
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
                  <span className="text-6xl">{emotionRound.emoji}</span>
                </div>
                <div className="flex-row justify-center gap-4 wrap mt-4">
                  {emotionRound.options.map((option) => (
                    <button
                      key={option}
                      className={option === selectedEmotionOption ? "primary-btn" : "glass-btn"}
                      onClick={() => handleEmotionGuess(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-lg accent-text">{emotionFeedback || "Pick one option to guess."}</p>
                <p className="mt-2 text-secondary">Score: {emotionScore}</p>
                <button onClick={nextEmotionRound} className="glass-btn mt-3">Next Emotion</button>
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