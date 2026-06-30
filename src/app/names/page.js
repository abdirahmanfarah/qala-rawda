'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { NAMES_DATA } from '@/data/names-data';
import Modal from '@/components/Modal';
import ThemeToggle from '@/components/ThemeToggle';

export default function NamesPage() {
  const [selectedName, setSelectedName] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const closeModal = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setSelectedName(null);
  }, []);

  function playAudio(url) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }
    audioRef.current = new Audio(url);
    audioRef.current.play();
    setIsPlaying(true);
    audioRef.current.addEventListener('ended', () => {
      setIsPlaying(false);
      audioRef.current = null;
    });
  }

  function renderDetails(details) {
    if (!details) return null;
    const html = details
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
    return <div className="modal-details" dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <div className="inner-page">
      <ThemeToggle />
      <div className="top-bar">
        <Link href="/hall" className="back-button">← Return to the Hall</Link>
      </div>
      <div className="page-header">
        <h1>أسماء الله الحسنى</h1>
        <p>The 99 Beautiful Names of Allah</p>
      </div>
      <div className="names-grid">
        {NAMES_DATA.map((name, i) => (
          <div
            key={name.number}
            className="name-card"
            style={{ animationDelay: `${i * 0.03}s` }}
            onClick={() => setSelectedName(name)}
          >
            <div className="number">{name.number}</div>
            <div className="arabic">{name.name.arabic}</div>
            <div className="translit">{name.name.transliteration}</div>
            <div className="translated">{name.name.translated}</div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedName} onClose={closeModal}>
        {selectedName && (
          <>
            <div className="modal-number">{selectedName.number}</div>
            <div className="modal-arabic">{selectedName.name.arabic}</div>
            <div className="modal-translit">{selectedName.name.transliteration}</div>
            <div className="modal-translated">{selectedName.name.translated}</div>
            {selectedName.audio_url && (
              <div className="modal-audio">
                <button
                  className={`play-button${isPlaying ? ' playing' : ''}`}
                  onClick={() => playAudio(selectedName.audio_url)}
                >
                  {isPlaying ? 'Pause' : 'Listen'}
                </button>
              </div>
            )}
            <div className="modal-meaning">{selectedName.meaning}</div>
            {renderDetails(selectedName.details)}
          </>
        )}
      </Modal>
    </div>
  );
}
