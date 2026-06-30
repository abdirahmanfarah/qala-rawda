'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NAMES_DATA } from '@/data/names-data';

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * NAMES_DATA.length);
    setName(NAMES_DATA[randomIndex]);
  }, []);

  if (!name) return null;

  return (
    <div className="landing">
      <span className="name-arabic-large">{name.name.arabic}</span>
      <span className="name-transliteration-large">{name.name.transliteration}</span>
      <span className="name-meaning-large">{name.name.translated}</span>
      <button
        className="enter-button"
        onClick={() => router.push('/hall')}
      >
        Qala Rawda
      </button>
    </div>
  );
}
