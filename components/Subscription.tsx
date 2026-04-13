"use client";

import { useState } from "react";
import { X, Crown, Settings, BarChart, Globe, Brain, Phone } from "lucide-react";

export default function Subscription() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="subscription-btn glass-btn">
        <Crown className="btn-icon" /> Subscribe
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <X />
            </button>
            <div className="modal-header">
              <Crown className="modal-title-icon" />
              <h2>Premium Features</h2>
            </div>
            
            <ul className="feature-list">
              <li>
                <Settings className="feature-icon" />
                <div>
                  <h3>Customizable UI</h3>
                  <p>Tailor the interface to specific child needs (e.g., ADHD, Autism).</p>
                </div>
              </li>
              <li>
                <BarChart className="feature-icon" />
                <div>
                  <h3>Adaptive Learning Levels</h3>
                  <p>Adjusts difficulty based on child performance, daily tasks, and badges.</p>
                </div>
              </li>
              <li>
                <Globe className="feature-icon" />
                <div>
                  <h3>Multi-Language Dashboard</h3>
                  <p>Comprehensive learning dashboard available in multiple languages.</p>
                </div>
              </li>
              <li>
                <Brain className="feature-icon" />
                <div>
                  <h3>AI Performance Analysis</h3>
                  <p>Intelligent AI will tell you your weak points and how to improve.</p>
                </div>
              </li>
              <li>
                <Phone className="feature-icon" />
                <div>
                  <h3>Emergency Help Platform</h3>
                  <p>Easily connect to a help professional or contact a pre-saved trusted person in times of need.</p>
                </div>
              </li>
            </ul>

            <button className="upgrade-btn">Upgrade Now</button>
          </div>
        </div>
      )}
    </>
  );
}
