"use client";

import { useState, useRef } from "react";

export default function SpeechToTextPage() {
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
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
      // Assuming FastAPI is running locally on port 8000
      const response = await fetch("http://localhost:8000/api/speech", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process audio.");
      }

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-gray-800">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Speech to Text & Emotion Demo
        </h1>

        <div className="flex flex-col items-center space-y-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md transition-all ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isRecording ? "Stop" : "Record"}
          </button>

          {isRecording && <p className="text-red-500 font-medium">Recording...</p>}
          {isLoading && <p className="text-blue-500 font-medium">Analyzing audio...</p>}
          {error && <p className="text-red-500 text-center">{error}</p>}

          {(transcript || emotion) && (
            <div className="w-full bg-gray-100 p-6 rounded-lg space-y-4">
              <div>
                <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-1">
                  Transcript
                </h3>
                <p className="text-lg">{transcript}</p>
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-1">
                  Emotion
                </h3>
                <p className="text-lg capitalize">
                  {emotion === "Unknown" ? "Could not detect" : emotion}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
