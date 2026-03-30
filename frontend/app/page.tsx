import Link from "next/link";
import { ArrowRight, Eye, Smile, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <main className="main-container">
      <div className="hero">
        <h1 className="title">Welcome to Happy Place 2.0</h1>
        <p className="subtitle">An inclusive, educational, and joyful platform for everyone.</p>
      </div>

      <div className="card-container">
        {/* Section 1 */}
        <Link href="/accessibility" className="feature-card glass-card">
          <Eye className="card-icon" />
          <h2>Accessibility Tools</h2>
          <p>AI Sign-Language, Emotion Indicators, and Image Descriptions for physically challenged users.</p>
          <div className="card-action">Explore <ArrowRight className="arrow" /></div>
        </Link>

        {/* Section 2 */}
        <Link href="/child-learning" className="feature-card glass-card">
          <Smile className="card-icon" />
          <h2>Child Learning</h2>
          <p>Interactive games, Emotion Recognition, and joyful learning experiences.</p>
          <div className="card-action">Play <ArrowRight className="arrow" /></div>
        </Link>

        {/* Section 3 */}
        <Link href="/inclusion" className="feature-card glass-card">
          <BookOpen className="card-icon" />
          <h2>Inclusion Learning</h2>
          <p>Learn Braille, Sign Language, and explore real-life conversational quizzes.</p>
          <div className="card-action">Learn <ArrowRight className="arrow" /></div>
        </Link>
      </div>
    </main>
  );
}
