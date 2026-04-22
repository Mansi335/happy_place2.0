import "./globals.css";
import type { Metadata } from "next";
import VoiceAssistant from "@/components/VoiceAssistant";

export const metadata: Metadata = {
  title: "Happy Place 2.0",
  description: "An inclusive and educational platform for all.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <VoiceAssistant />
      </body>
    </html>
  );
}
