"use client";

import { useState, useRef } from "react";
import { Mic } from "lucide-react";

export default function SpeechToTextTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setTranscript(null);
      setEmotion(null);
    } catch (err: any) {
      setError(err.message || "Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
      const response = await fetch("http://localhost:8000/api/speech", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to process audio.");

      const data = await response.json();
      setTranscript(data.text);
      setEmotion(data.emotion);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="feature-panel animation-fade">
      <h2><Mic className="icon-mr accent-text" /> Speech-to-Text with Emotion Indicators</h2>
      <p className="desc-text">Speak to generate text along with detected emotional undertones.</p>
      
      <div className="mic-area glass-card-inner">
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={`record-btn ${isRecording ? 'pulsing bg-red-500 text-white border-red-400' : 'bg-transparent text-white'} mb-4`}
          disabled={isLoading}
        >
          <Mic size={32} />
        </button>
        <p>
          {isLoading ? "Analyzing audio..." : isRecording ? "Listening... click to stop" : "Click mic to speak"}
        </p>
        {error && <p className="text-red-400 mt-2">{error}</p>}
      </div>

      {(transcript || emotion) && (
        <div className="transcript-box glass-card-inner mt-4">
          <div className="emotion-indicator mb-2">
            <span className="emotion joy glass-badge uppercase">
              {emotion === 'Unknown' ? 'Could not detect emotion' : emotion}
            </span>
          </div>
          <p className="transcript-text text-lg italic mt-2">"{transcript}"</p>
        </div>
      )}
    </div>
  );
}
