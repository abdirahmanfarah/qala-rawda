'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { HADITH_COLLECTIONS } from '@/data/collections';
import { HADITH_BOOKS } from '@/data/hadith-books';
import { fetchFromUmmah } from '@/lib/api';

export default function HadithPage() {
  // View state: 'collections' | 'books' | 'browser'
  const [view, setView] = useState('collections');
  const [mode, setMode] = useState('browse'); // 'browse' | 'learn'
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);

  // Browser state
  const [currentNumber, setCurrentNumber] = useState(null);
  const [hadith, setHadith] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jumpInput, setJumpInput] = useState('');

  function selectCollection(collection) {
    setSelectedCollection(collection);
    setSelectedBook(null);
    setView('books');
  }

  function selectBook(bookNum) {
    const col = selectedCollection;
    const bookData = HADITH_BOOKS[col.id];
    const details = bookData.section_details[bookNum];
    setSelectedBook({
      num: bookNum,
      name: bookData.sections[bookNum],
      first: details.hadithnumber_first,
      last: details.hadithnumber_last,
    });
    setCurrentNumber(details.hadithnumber_first);
    setView('browser');
  }

  function openBrowserForCollection() {
    setSelectedBook(null);
    setCurrentNumber(1);
    setView('browser');
  }

  // Fetch hadith when currentNumber changes
  useEffect(() => {
    if (view !== 'browser' || currentNumber === null || !selectedCollection) return;

    let cancelled = false;
    setLoading(true);
    setHadith(null);

    fetchFromUmmah(`/hadith/${selectedCollection.id}/${currentNumber}`)
      .then((res) => {
        if (!cancelled) {
          setHadith(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [view, currentNumber, selectedCollection]);

  // Position helpers
  function getPosition() {
    if (selectedBook) {
      return currentNumber - selectedBook.first + 1;
    }
    return currentNumber;
  }

  function getTotal() {
    if (selectedBook) {
      return selectedBook.last - selectedBook.first + 1;
    }
    return selectedCollection?.total || 0;
  }

  function goNext() {
    if (selectedBook) {
      if (currentNumber < selectedBook.last) setCurrentNumber(currentNumber + 1);
    } else {
      if (currentNumber < selectedCollection.total) setCurrentNumber(currentNumber + 1);
    }
  }

  function goPrev() {
    if (selectedBook) {
      if (currentNumber > selectedBook.first) setCurrentNumber(currentNumber - 1);
    } else {
      if (currentNumber > 1) setCurrentNumber(currentNumber - 1);
    }
  }

  function handleJump() {
    const pos = parseInt(jumpInput, 10);
    if (isNaN(pos) || pos < 1 || pos > getTotal()) return;
    if (selectedBook) {
      setCurrentNumber(selectedBook.first + pos - 1);
    } else {
      setCurrentNumber(pos);
    }
    setJumpInput('');
  }

  function atStart() {
    if (selectedBook) return currentNumber <= selectedBook.first;
    return currentNumber <= 1;
  }

  function atEnd() {
    if (selectedBook) return currentNumber >= selectedBook.last;
    return currentNumber >= selectedCollection?.total;
  }

  // Get sorted book numbers for a collection
  function getBookNumbers(colId) {
    const bookData = HADITH_BOOKS[colId];
    if (!bookData) return [];
    return Object.keys(bookData.sections)
      .filter((k) => bookData.sections[k])
      .sort((a, b) => parseInt(a) - parseInt(b));
  }

  // ─── RENDER ───

  // View 1: Collections Grid
  if (view === 'collections') {
    return (
      <div className="inner-page">
        <ThemeToggle />
        <div className="top-bar">
          <Link href="/hall" className="back-button">← Return to the Hall</Link>
        </div>

        <div className="page-header">
          <h1>الحديث النبوي</h1>
          <p>The Prophetic Traditions</p>
        </div>

        <div className="inner-content">
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'browse' ? 'active' : ''}`}
              onClick={() => setMode('browse')}
            >
              Browse
            </button>
            <button
              className={`mode-btn ${mode === 'learn' ? 'active' : ''}`}
              onClick={() => setMode('learn')}
            >
              Learn
            </button>
          </div>

          {mode === 'learn' ? (
            <div className="loading-text">
              Learning mode coming soon.
            </div>
          ) : (
            <div className="hadith-collections-grid">
              {HADITH_COLLECTIONS.map((col) => (
                <div
                  key={col.id}
                  className="hadith-collection-card"
                  onClick={() => selectCollection(col)}
                >
                  <div className="hc-arabic">{col.ar}</div>
                  <div className="hc-name">{col.en}</div>
                  <div className="hc-author">{col.author}</div>
                  <div className="hc-meta">{col.total.toLocaleString()} hadiths</div>
                  <div className="hc-grade">{col.grade}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // View 2: Books Grid
  if (view === 'books') {
    const bookNums = getBookNumbers(selectedCollection.id);
    const bookData = HADITH_BOOKS[selectedCollection.id];

    return (
      <div className="inner-page">
        <ThemeToggle />
        <div className="top-bar">
          <button className="back-button" onClick={() => setView('collections')}>
            ← All Collections
          </button>
        </div>

        <div className="page-header">
          <h1>{selectedCollection.ar}</h1>
          <p>{selectedCollection.en}</p>
          <p>{bookNums.length} books &middot; {selectedCollection.total.toLocaleString()} hadiths</p>
        </div>

        <div className="inner-content">
          <div className="hadith-books-grid">
            {bookNums.map((num) => {
              const details = bookData.section_details[num];
              const count = details.hadithnumber_last - details.hadithnumber_first + 1;
              return (
                <div
                  key={num}
                  className="hadith-book-card"
                  onClick={() => selectBook(num)}
                >
                  <div className="hadith-book-num">Book {num}</div>
                  <div className="hadith-book-name">{bookData.sections[num]}</div>
                  <div className="hadith-book-range">{count} hadith{count !== 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // View 3: Hadith Browser
  if (view === 'browser') {
    const position = getPosition();
    const total = getTotal();

    return (
      <div className="inner-page">
        <ThemeToggle />
        <div className="top-bar">
          {selectedBook ? (
            <button className="back-button" onClick={() => { setView('books'); setHadith(null); }}>
              ← All Books
            </button>
          ) : (
            <button className="back-button" onClick={() => { setView('collections'); setHadith(null); }}>
              ← All Collections
            </button>
          )}
        </div>

        <div className="page-header">
          <h1>{selectedCollection.ar}</h1>
          <p>{selectedCollection.en}</p>
          {selectedBook && (
            <p>Book {selectedBook.num}: {selectedBook.name}</p>
          )}
        </div>

        <div className="inner-content">
          <div className="hadith-browser">
            <div className="hadith-jump">
              <input
                type="number"
                min="1"
                max={total}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                placeholder={String(position)}
                onKeyDown={(e) => e.key === 'Enter' && handleJump()}
              />
              <button onClick={handleJump}>Go</button>
              <span className="hadith-jump-label">of {total}</span>
            </div>

            <div className="hadith-nav">
              <button className="hadith-nav-btn" onClick={goPrev} disabled={atStart()}>Previous</button>
              <span className="hadith-nav-num">{position} / {total}</span>
              <button className="hadith-nav-btn" onClick={goNext} disabled={atEnd()}>Next</button>
            </div>

            <div className="hadith-display">
              {loading && <p className="loading-text">Loading...</p>}
              {hadith && (
                <>
                  <div className="hadith-arabic-text">{hadith.arabic}</div>
                  <div className="hadith-english-text">{hadith.english}</div>
                  {hadith.grade && (
                    <div className="hadith-grade-badge">{hadith.grade}</div>
                  )}
                  <div className="hadith-number-label">Hadith #{hadith.hadithnumber}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
