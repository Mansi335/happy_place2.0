"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, Image as ImageIcon, Video, HandMetal, MessageSquare, Camera } from "lucide-react";

export default function AccessibilitySettings() {
  const [activeTab, setActiveTab] = useState("sign-lang");

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
              <p className="desc-text">Translate your sign language to text/voice or vice-versa in real-time.</p>
              
              <div className="video-placeholder glass-card-inner">
                <Camera size={48} className="camera-icon mb-2" />
                <p>Camera feed for Sign Recognition</p>
                <button className="primary-btn mt-4">Enable Camera</button>
              </div>

              <div className="translation-box glass-card-inner mt-4">
                <div className="trans-result">
                  <span className="label">Detected Sign / Text:</span>
                  <p className="mock-text">"Hello, how are you today?"</p>
                </div>
                <div className="actions mt-4">
                  <button className="primary-btn"><MessageSquare className="icon-mr"/> Speak Output</button>
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
              <h2><ImageIcon className="icon-mr accent-text" /> Image Description for Blind Users</h2>
              <p className="desc-text">Upload or capture an image to hear an AI-generated description.</p>
              
              <div className="upload-area glass-card-inner">
                <Video size={48} className="upload-icon mb-2 accent-text" />
                <p>Drag and drop an image, or click to browse</p>
                <button className="primary-btn mt-4">Upload Image</button>
              </div>

              <div className="description-result glass-card-inner mt-4">
                <h3 className="mb-2">AI Description:</h3>
                <p className="text-lg">"A sunny park with children playing on a swing set, and a large oak tree in the foreground."</p>
                <button className="primary-btn mt-4"><Mic className="icon-mr"/> Read Aloud</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
