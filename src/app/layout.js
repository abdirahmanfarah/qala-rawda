import "./globals.css";
import { ThemeInitScript } from "@/components/ThemeToggle";

export const metadata = {
  title: "Qala Rawda",
  description: "Enter the fortress. Find the garden. قلعة روضة",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Amiri+Quran&family=Spectral:wght@300;400;500;600&family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeInitScript />
        {children}
      </body>
    </html>
  );
}
