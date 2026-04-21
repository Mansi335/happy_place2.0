"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Grip, BookOpen, CheckCircle, Play, Target, RotateCcw } from "lucide-react";

type BrailleQuestion = {
  answer: string;
  options: string[];
  activeDots: number[];
};

const BRAILLE_QUESTIONS: BrailleQuestion[] = [
  { answer: "A", options: ["A", "B", "C", "D"], activeDots: [1] },
  { answer: "B", options: ["A", "B", "C", "D"], activeDots: [1, 2] },
  { answer: "C", options: ["A", "B", "C", "D"], activeDots: [1, 4] },
  { answer: "D", options: ["A", "B", "C", "D"], activeDots: [1, 4, 5] },
  { answer: "E", options: ["E", "F", "G", "H"], activeDots: [1, 5] },
  { answer: "F", options: ["E", "F", "G", "H"], activeDots: [1, 2, 4] },
];

const dotCoordinates: Record<number, [number, number]> = {
  1: [60, 60],
  2: [60, 120],
  3: [60, 180],
  4: [140, 60],
  5: [140, 120],
  6: [140, 180],
};

function createBrailleImage(activeDots: number[]) {
  const circles = [1, 2, 3, 4, 5, 6]
    .map((dot) => {
      const [cx, cy] = dotCoordinates[dot];
      const isActive = activeDots.includes(dot);
      return `<circle cx="${cx}" cy="${cy}" r="22" fill="${isActive ? "#4b5563" : "#e5e7eb"}" />`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="240" viewBox="0 0 220 240">
    <rect width="220" height="240" rx="16" fill="#f8fafc"/>
    ${circles}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function InclusionLearning() {
  const [activeTab, setActiveTab] = useState("braille");
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [brailleFeedback, setBrailleFeedback] = useState<string>("");
  const currentQuestion = useMemo(() => BRAILLE_QUESTIONS[quizIndex] ?? null, [quizIndex]);

  const resetBraille = () => {
    setQuizIndex(0);
    setSelectedOption(null);
    setBrailleFeedback("");
  };

  const goToNextQuestion = () => {
    if (!currentQuestion) return;
    if (!selectedOption) {
      setBrailleFeedback("Select an option first.");
      return;
    }

    if (selectedOption === currentQuestion.answer) {
      setBrailleFeedback("Correct!");
    } else {
      setBrailleFeedback(`Incorrect. Correct answer: ${currentQuestion.answer}`);
    }

    if (quizIndex < BRAILLE_QUESTIONS.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setQuizIndex(BRAILLE_QUESTIONS.length);
      setSelectedOption(null);
    }
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
        <button onClick={() => setActiveTab('sl-lessons')} className={`tab-btn m-1 ${activeTab === 'sl-lessons' ? 'active' : ''}`}>
            <BookOpen className="icon-mr" /> Lessons
          </button>
         
          <div className="mt-4 mb-4 border-b border-white border-opacity-20"></div>
          <h3 className="text-secondary mb-2 pl-4 text-sm font-bold uppercase">Sign Language</h3>
          <button onClick={() => setActiveTab('braille')} className={`tab-btn m-1 ${activeTab === 'braille' ? 'active' : ''}`}>
            <Grip className="icon-mr" /> Braille Test
          </button>
          <button onClick={() => setActiveTab('sl-quiz')} className={`tab-btn m-1 ${activeTab === 'sl-quiz' ? 'active' : ''}`}>
            <CheckCircle className="icon-mr" /> AI Practice Quiz
          </button>
          <button onClick={() => setActiveTab('sl-reallife')} className={`tab-btn m-1 ${activeTab === 'sl-reallife' ? 'active' : ''}`}>
            <Target className="icon-mr" /> Real-life Situations
          </button>
        </nav>

        {/* Content Area */}
        <main className="glass-card content-area">
          {activeTab === 'braille' && (
            <div className="feature-panel animation-fade">
              <h2><Grip className="icon-mr accent-text" /> Braille MCQ test</h2>
              <p className="desc-text">
                See the Braille image, pick one option
              </p>

              <div className="glass-card-inner flex-row wrap gap-4 align-center mb-4">
                <button type="button" className="glass-btn m-1" onClick={resetBraille}>
                  <RotateCcw size={16} className="icon-mr" /> Reset progress
                </button>
              </div>

              {BRAILLE_QUESTIONS.length ? (
                quizIndex >= BRAILLE_QUESTIONS.length ? (
                  <p className="accent-text text-lg">Quiz completed. Reset progress to start again.</p>
                ) : (
                  <div className="flex-row wrap gap-18 align-start">
                    <div className="glass-card-inner text-center" style={{ minWidth: "220px" }}>
                      <p className="text-secondary mb-12">
                        Question {quizIndex + 1} of {BRAILLE_QUESTIONS.length}
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
                          src={createBrailleImage(currentQuestion?.activeDots ?? [])}
                          alt={`Braille question ${quizIndex + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      </div>
                    </div>
                    <div className="flex-1" style={{ minWidth: "260px" }}>
                      <p className="mb-4 desc-text"><strong>Select answer:</strong></p>
                      <div className="flex-row wrap gap-1 mb-4">
                        {(currentQuestion?.options ?? []).map((option, idx) => (
                          <button
                            key={option}
                            type="button"
                            className={selectedOption === option ? "primary-btn m-110" : "glass-btn m-1"}
                            onClick={() => setSelectedOption(option)}
                          >
                            {String.fromCharCode(97 + idx)}. {option}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="primary-btn m-1"
                        onClick={goToNextQuestion}
                      >
                        Next
                      </button>
                      {brailleFeedback && <p className="accent-text mt-4">{brailleFeedback}</p>}
                    </div>
                  </div>
                )
              ) : (
                <p className="text-secondary">No questions available.</p>
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
                 <button className="primary-btn m-1">Start Practice Mode</button>
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