"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<{
    isFinal?: boolean;
    0: { transcript: string };
  }>;
};

type VoiceCommandDetail = { command: string };

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const VOICE_EVENT_NAME = "happy-place-voice-command";

export default function VoiceAssistant() {
  const router = useRouter();
  const pathname = usePathname();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState("");
  const [error, setError] = useState("");

  const isSupported = useMemo(
    () => typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    [],
  );

  const speak = (text: string) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  const announceHelp = () => {
    speak(
      "Voice commands are active. Say go home, open accessibility, open child learning, open inclusion, go back, read screen, or stop listening.",
    );
  };

  const readScreenSummary = () => {
    const heading = document.querySelector("h1,h2,h3")?.textContent?.trim();
    const buttons = Array.from(document.querySelectorAll("button"))
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
      .slice(0, 4)
      .join(", ");
    const links = Array.from(document.querySelectorAll("a"))
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
      .slice(0, 4)
      .join(", ");
    const message = `You are on ${pathname || "this page"}. ${heading ? `Heading: ${heading}. ` : ""}${
      buttons ? `Buttons include: ${buttons}. ` : ""
    }${links ? `Links include: ${links}.` : ""}`;
    speak(message);
  };

  const tryClickByText = (command: string) => {
    const clickMatch = command.match(/^(click|press|open)\s+(.+)$/);
    if (!clickMatch) return false;
    const label = clickMatch[2].trim();
    if (!label) return false;

    const targets = Array.from(document.querySelectorAll("button, a"));
    const match = targets.find((el) => (el.textContent || "").toLowerCase().includes(label));
    if (match instanceof HTMLElement) {
      match.click();
      speak(`Activated ${label}`);
      return true;
    }
    return false;
  };

  const routeFromCommand = (command: string) => {
    if (command.includes("home")) return "/";
    if (command.includes("accessibility") || command.includes("assistive")) return "/accessibility";
    if (command.includes("child")) return "/child-learning";
    if (command.includes("inclusion")) return "/inclusion";
    if (command.includes("image description")) return "/image-description";
    if (command.includes("speech")) return "/speech-to-text";
    if (command.includes("sign")) return "/sign-check";
    return null;
  };

  const handleCommand = (commandRaw: string) => {
    const command = commandRaw.toLowerCase().trim();
    if (!command) return;

    setLastCommand(command);
    setError("");

    if (command.includes("help")) {
      announceHelp();
      return;
    }

    if (command.includes("stop listening")) {
      shouldKeepListeningRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
      speak("Voice control paused.");
      return;
    }

    if (command.includes("start listening")) {
      startListening();
      return;
    }

    if (command.includes("go back")) {
      router.back();
      speak("Going back.");
      return;
    }

    if (command.includes("read screen") || command.includes("what is on screen")) {
      readScreenSummary();
      return;
    }

    const route = routeFromCommand(command);
    if (route) {
      router.push(route);
      speak(`Opening ${route.replace("/", "") || "home"}`);
      return;
    }

    if (tryClickByText(command)) return;

    window.dispatchEvent(new CustomEvent<VoiceCommandDetail>(VOICE_EVENT_NAME, { detail: { command } }));
  };

  const startListening = () => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const lastIndex = event.results.length - 1;
        if (lastIndex < 0) return;
        const transcript = event.results[lastIndex][0]?.transcript || "";
        handleCommand(transcript);
      };

      recognition.onerror = (event) => {
        setError(`Speech error: ${event.error}`);
      };

      recognition.onend = () => {
        if (shouldKeepListeningRef.current) {
          recognition.start();
          return;
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    shouldKeepListeningRef.current = true;
    recognitionRef.current.start();
    setIsListening(true);
    speak("Voice control enabled.");
  };

  const stopListening = () => {
    shouldKeepListeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    speak("Voice control disabled.");
  };

  useEffect(() => {
    return () => {
      shouldKeepListeningRef.current = false;
      recognitionRef.current?.stop();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!isSupported) return null;

  return (
    <div className="voice-assistant-panel">
      <button
        type="button"
        className={`voice-toggle-btn ${isListening ? "active" : ""}`}
        onClick={isListening ? stopListening : startListening}
        aria-label={isListening ? "Disable voice control" : "Enable voice control"}
      >
        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
        <span>{isListening ? "Voice On" : "Voice Control"}</span>
      </button>
      {lastCommand ? <p className="voice-last-command">Heard: {lastCommand}</p> : null}
      {error ? <p className="voice-error">{error}</p> : null}
    </div>
  );
}
