"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Grip, HandMetal, BookOpen, CheckCircle, Play, Target } from "lucide-react";

export default function InclusionLearning() {
  const [activeTab, setActiveTab] = useState("braille");

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
          <button onClick={() => setActiveTab('braille')} className={`tab-btn ${activeTab === 'braille' ? 'active' : ''}`}>
            <Grip className="icon-mr" /> Braille Sound Learner
          </button>
          <div className="mt-4 mb-4 border-b border-white border-opacity-20"></div>
          <h3 className="text-secondary mb-2 pl-4 text-sm font-bold uppercase">Sign Language</h3>
          <button onClick={() => setActiveTab('sl-lessons')} className={`tab-btn ${activeTab === 'sl-lessons' ? 'active' : ''}`}>
            <BookOpen className="icon-mr" /> Lessons
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
              <h2><Grip className="icon-mr accent-text" /> Braille Alphabet Learner</h2>
              <p className="desc-text">Click on any Braille character to hear its sound!</p>
              
              <div className="braille-grid glass-card-inner">
                 <div className="braille-char">
                    <div className="dots-layout">
                       <span className="b-dot active"></span><span className="b-dot"></span>
                       <span className="b-dot"></span><span className="b-dot"></span>
                       <span className="b-dot"></span><span className="b-dot"></span>
                    </div>
                    <span className="char-label">A</span>
                    <button className="sound-btn mt-2 glass-btn"><Play size={16} /></button>
                 </div>
                 <div className="braille-char">
                    <div className="dots-layout">
                       <span className="b-dot active"></span><span className="b-dot"></span>
                       <span className="b-dot active"></span><span className="b-dot"></span>
                       <span className="b-dot"></span><span className="b-dot"></span>
                    </div>
                    <span className="char-label">B</span>
                    <button className="sound-btn mt-2 glass-btn"><Play size={16} /></button>
                 </div>
                 <div className="braille-char">
                     <div className="dots-layout">
                       <span className="b-dot active"></span><span className="b-dot active"></span>
                       <span className="b-dot"></span><span className="b-dot"></span>
                       <span className="b-dot"></span><span className="b-dot"></span>
                    </div>
                    <span className="char-label">C</span>
                    <button className="sound-btn mt-2 glass-btn"><Play size={16} /></button>
                 </div>
                 <div className="braille-char">
                     <div className="dots-layout">
                       <span className="b-dot active"></span><span className="b-dot active"></span>
                       <span className="b-dot"></span><span className="b-dot active"></span>
                       <span className="b-dot"></span><span className="b-dot"></span>
                    </div>
                    <span className="char-label">D</span>
                    <button className="sound-btn mt-2 glass-btn"><Play size={16} /></button>
                 </div>
              </div>
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
                 <h3 className="mb-4 text-secondary text-lg">Current Task: Sign "Thank You"</h3>
                 <div className="video-placeholder mb-4 mx-auto" style={{maxWidth: '400px', minHeight: '250px'}}>
                    <p className="pulsing text-xl">⏳ Waiting for gesture...</p>
                 </div>
                 <div className="flex-row gap-4 align-center w-full justify-center">
                    <div style={{width: '60%', background: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '5px', overflow:'hidden', position: 'relative'}}>
                        <div style={{width: '60%', background: 'var(--success)', height: '100%', borderRadius: '5px'}}></div>
                    </div>
                    <span>60%</span>
                 </div>
                 <p className="mt-2 text-sm text-secondary">Keep trying!</p>
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
