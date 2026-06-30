'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { fetchFromUmmah, fetchFromQuranCom } from '@/lib/api';
import { getBookmarks, setBookmark, getNotes, saveNote } from '@/lib/storage';

// ---------------------------------------------------------------------------
// SVG icon constants
// ---------------------------------------------------------------------------
const SVG_PLAY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
const SVG_PAUSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
const SVG_BOOKMARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
const SVG_BOOKMARK_FILLED = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
const SVG_BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>';
const SVG_EDIT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
const SVG_MSG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function pad(n, len = 3) {
  return String(n).padStart(len, '0');
}

function stripHtml(html) {
  if (typeof document === 'undefined') return html;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Tafsir sources
const TAFSIR_TABS = [
  { id: 168, label: "Ma'arif" },
  { id: 169, label: 'Ibn Kathir' },
  { id: 817, label: 'Tazkirul' },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function QuranPage() {
  // -- Browse vs detail state -----------------------------------------------
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [browseMode, setBrowseMode] = useState('browse'); // 'browse' | 'learn'

  // -- Surah list -----------------------------------------------------------
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);

  // -- Surah detail ---------------------------------------------------------
  const [surahInfo, setSurahInfo] = useState(null);
  const [showSurahInfo, setShowSurahInfo] = useState(false);
  const [verses, setVerses] = useState([]);
  const [versesLoading, setVersesLoading] = useState(false);
  const [readingMode, setReadingMode] = useState('reading'); // 'arabic' | 'reading' | 'wbw'

  // -- Word by word cache ---------------------------------------------------
  const [wbwCache, setWbwCache] = useState({});

  // -- Audio ----------------------------------------------------------------
  const [playingKey, setPlayingKey] = useState(null);
  const audioRef = useRef(null);

  // -- Bookmarks & notes ----------------------------------------------------
  const [bookmarks, setBookmarks] = useState({});
  const [notes, setNotes] = useState({});
  const [openNotes, setOpenNotes] = useState({});

  // -- Tafsir ---------------------------------------------------------------
  const [openTafsirs, setOpenTafsirs] = useState({});
  const [tafsirData, setTafsirData] = useState({});
  const [tafsirTab, setTafsirTab] = useState({});

  // =========================================================================
  // Load bookmarks & notes from storage on mount
  // =========================================================================
  useEffect(() => {
    setBookmarks(getBookmarks());
    setNotes(getNotes());
  }, []);

  // =========================================================================
  // Fetch chapter list
  // =========================================================================
  useEffect(() => {
    setChaptersLoading(true);
    fetchFromQuranCom('/chapters?language=en')
      .then((res) => {
        if (res?.chapters) setChapters(res.chapters);
      })
      .catch(() => {})
      .finally(() => setChaptersLoading(false));
  }, []);

  // =========================================================================
  // Fetch verses when surah selected
  // =========================================================================
  useEffect(() => {
    if (!selectedSurah) return;
    const num = selectedSurah.id;

    setVersesLoading(true);
    setVerses([]);
    setSurahInfo(null);
    setShowSurahInfo(false);

    // Fetch surah info
    fetchFromQuranCom(`/chapters/${num}/info?language=en`)
      .then((res) => {
        if (res?.chapter_info) setSurahInfo(res.chapter_info);
      })
      .catch(() => {});

    // Fetch verses — try Ummah first, fallback to Quran.com
    fetchFromUmmah(`/quran/surah/${num}?lang=en`)
      .then((res) => {
        if (res?.data?.verses && res.data.verses.length > 0) {
          return normalizeUmmah(res.data.verses, num);
        }
        throw new Error('fallback');
      })
      .catch(() =>
        fetchFromQuranCom(
          `/verses/by_chapter/${num}?language=en&translations=20&fields=text_uthmani&per_page=300`
        ).then((res) => normalizeQuranCom(res, num))
      )
      .then((normalized) => setVerses(normalized))
      .catch(() => setVerses([]))
      .finally(() => setVersesLoading(false));
  }, [selectedSurah]);

  // =========================================================================
  // Normalizers
  // =========================================================================
  function normalizeUmmah(rawVerses, surahNum) {
    return rawVerses.map((v, i) => ({
      num: v.number || v.ayah || i + 1,
      arabic: v.arabic || v.text || '',
      translation: v.translation || v.english || v.text_en || '',
      key: `${surahNum}:${v.number || v.ayah || i + 1}`,
    }));
  }

  function normalizeQuranCom(res, surahNum) {
    if (!res?.verses) return [];
    return res.verses.map((v) => {
      const ayahNum = v.verse_number || v.verse_key?.split(':')[1];
      return {
        num: Number(ayahNum),
        arabic: v.text_uthmani || '',
        translation:
          v.translations?.[0]?.text
            ? stripHtml(v.translations[0].text)
            : '',
        key: `${surahNum}:${ayahNum}`,
      };
    });
  }

  // =========================================================================
  // Audio
  // =========================================================================
  function handlePlay(surahNum, ayahNum, key) {
    if (playingKey === key) {
      audioRef.current?.pause();
      setPlayingKey(null);
      return;
    }
    const src = `https://verses.quran.com/Alafasy/mp3/${pad(surahNum)}${pad(ayahNum)}.mp3`;
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
    } else {
      audioRef.current.pause();
      audioRef.current.src = src;
    }
    audioRef.current.onended = () => setPlayingKey(null);
    audioRef.current.play().catch(() => {});
    setPlayingKey(key);
  }

  // =========================================================================
  // Bookmarks
  // =========================================================================
  function toggleBookmark(key) {
    const isBookmarked = !!bookmarks[key];
    setBookmark(key, !isBookmarked);
    setBookmarks((prev) => {
      const next = { ...prev };
      if (isBookmarked) delete next[key];
      else next[key] = true;
      return next;
    });
  }

  // =========================================================================
  // Notes
  // =========================================================================
  function toggleNotes(key) {
    setOpenNotes((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSaveNote(key, text) {
    saveNote(key, text);
    setNotes((prev) => {
      const next = { ...prev };
      if (text.trim()) next[key] = text.trim();
      else delete next[key];
      return next;
    });
  }

  // =========================================================================
  // Tafsir
  // =========================================================================
  function toggleTafsir(key) {
    setOpenTafsirs((prev) => ({ ...prev, [key]: !prev[key] }));
    if (!tafsirTab[key]) {
      setTafsirTab((prev) => ({ ...prev, [key]: TAFSIR_TABS[0].id }));
    }
  }

  function loadTafsir(tafsirId, key) {
    const cacheKey = `${tafsirId}:${key}`;
    if (tafsirData[cacheKey]) return;
    setTafsirData((prev) => ({ ...prev, [cacheKey]: { loading: true } }));
    fetchFromQuranCom(`/tafsirs/${tafsirId}/by_ayah/${key}`)
      .then((res) => {
        const text =
          res?.tafsir?.text || res?.text || 'No tafsir available for this ayah.';
        setTafsirData((prev) => ({
          ...prev,
          [cacheKey]: { loading: false, text },
        }));
      })
      .catch(() => {
        setTafsirData((prev) => ({
          ...prev,
          [cacheKey]: { loading: false, text: 'Failed to load tafsir.' },
        }));
      });
  }

  function selectTafsirTab(key, tafsirId) {
    setTafsirTab((prev) => ({ ...prev, [key]: tafsirId }));
    loadTafsir(tafsirId, key);
  }

  // =========================================================================
  // Word-by-word
  // =========================================================================
  const fetchWbw = useCallback(
    (surahNum, ayahNum) => {
      const wKey = `${surahNum}:${ayahNum}`;
      if (wbwCache[wKey]) return;
      setWbwCache((prev) => ({ ...prev, [wKey]: { loading: true } }));
      fetchFromUmmah(`/quran/words/${surahNum}/${ayahNum}`)
        .then((res) => {
          const words = (res?.data?.words || res?.words || []).filter(
            (w) => w.type !== 'end'
          );
          setWbwCache((prev) => ({
            ...prev,
            [wKey]: { loading: false, words },
          }));
        })
        .catch(() => {
          setWbwCache((prev) => ({
            ...prev,
            [wKey]: { loading: false, words: [] },
          }));
        });
    },
    [wbwCache]
  );

  // When switching to wbw mode, fetch words for all verses
  useEffect(() => {
    if (readingMode !== 'wbw' || !selectedSurah || verses.length === 0) return;
    verses.forEach((v) => {
      fetchWbw(selectedSurah.id, v.num);
    });
  }, [readingMode, selectedSurah, verses, fetchWbw]);

  // =========================================================================
  // Open surah
  // =========================================================================
  function openSurah(ch) {
    setSelectedSurah(ch);
    setReadingMode('reading');
    setWbwCache({});
    setOpenTafsirs({});
    setOpenNotes({});
    setTafsirData({});
    setTafsirTab({});
    window.scrollTo(0, 0);
  }

  function goBack() {
    setSelectedSurah(null);
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingKey(null);
    }
  }

  // =========================================================================
  // RENDER — Surah detail
  // =========================================================================
  if (selectedSurah) {
    const num = selectedSurah.id;
    const showBismillah = num !== 1 && num !== 9;
    const showFatiha = num === 1;

    return (
      <div className="inner-page">
        <ThemeToggle />
        <div className="top-bar">
          <button className="back-button" onClick={goBack}>← All Surahs</button>
        </div>

        {/* Surah header */}
        <div className="surah-detail-header">
          <div className="surah-detail-arabic">{selectedSurah.name_arabic}</div>
          <div className="surah-detail-name">{selectedSurah.name_simple}</div>
          <div className="surah-detail-meta">
            {selectedSurah.translated_name?.name} &middot;{' '}
            {selectedSurah.revelation_place} &middot;{' '}
            {selectedSurah.verses_count} verses
          </div>
        </div>

        {/* Surah info toggle */}
        {surahInfo && (
          <>
            <button
              className="surah-info-toggle"
              onClick={() => setShowSurahInfo(!showSurahInfo)}
            >
              {showSurahInfo ? 'Hide Surah Info ▲' : 'Show Surah Info ▼'}
            </button>
            {showSurahInfo && (
              <div
                className="surah-info-box"
                dangerouslySetInnerHTML={{
                  __html: surahInfo.text || surahInfo.short_text || '',
                }}
              />
            )}
          </>
        )}

        {/* Reading mode tabs */}
        <div className="reading-tabs">
          {['arabic', 'reading', 'wbw'].map((mode) => (
            <button
              key={mode}
              className={`reading-tab${readingMode === mode ? ' active' : ''}`}
              onClick={() => setReadingMode(mode)}
            >
              {mode === 'arabic'
                ? 'Arabic Only'
                : mode === 'reading'
                  ? 'Reading'
                  : 'Word by Word'}
            </button>
          ))}
        </div>

        {/* Bismillah */}
        {showBismillah && (
          <div className="bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>
        )}
        {showFatiha && (
          <div className="bismillah">
            In the Name of Allah, the Most Compassionate, the Most Merciful
          </div>
        )}

        {/* Verses */}
        {versesLoading ? (
          <div className="loading-text">Loading verses...</div>
        ) : (
          verses.map((v) => (
            <AyahBlock
              key={v.key}
              verse={v}
              surahNum={num}
              readingMode={readingMode}
              playingKey={playingKey}
              bookmarks={bookmarks}
              notes={notes}
              openNotes={openNotes}
              openTafsirs={openTafsirs}
              tafsirData={tafsirData}
              tafsirTab={tafsirTab}
              wbwCache={wbwCache}
              onPlay={handlePlay}
              onToggleBookmark={toggleBookmark}
              onToggleNotes={toggleNotes}
              onSaveNote={handleSaveNote}
              onToggleTafsir={toggleTafsir}
              onSelectTafsirTab={selectTafsirTab}
              onLoadTafsir={loadTafsir}
            />
          ))
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDER — Browse mode (surah list)
  // =========================================================================
  return (
    <div className="inner-page">
      <ThemeToggle />
      <div className="top-bar">
        <Link href="/hall" className="back-button">← Return to the Hall</Link>
      </div>
      <div className="page-header">
        <h1>القرآن الكريم</h1>
        <p>The Noble Quran</p>
      </div>

      <div className="inner-content">
      {/* Mode toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-btn${browseMode === 'browse' ? ' active' : ''}`}
          onClick={() => setBrowseMode('browse')}
        >
          Browse
        </button>
        <button
          className={`mode-btn${browseMode === 'learn' ? ' active' : ''}`}
          onClick={() => setBrowseMode('learn')}
        >
          Learn
        </button>
      </div>

      {browseMode === 'learn' ? (
        <div className="loading-text">
          The sequential learning path begins here. This room is being prepared.
        </div>
      ) : chaptersLoading ? (
        <div className="loading-text">Loading surahs...</div>
      ) : (
        <div className="surah-list">
          {chapters.map((ch) => (
            <div
              key={ch.id}
              className="surah-card"
              onClick={() => openSurah(ch)}
            >
              <div className="surah-number">{ch.id}</div>
              <div className="surah-info">
                <div className="surah-name-en">{ch.name_simple}</div>
                <div className="surah-meta">
                  {ch.translated_name?.name} &middot; {ch.revelation_place}{' '}
                  &middot; {ch.verses_count} ayat
                </div>
              </div>
              <div className="surah-right">
                <div className="surah-name-ar">{ch.name_arabic}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

// ===========================================================================
// AyahBlock sub-component
// ===========================================================================
function AyahBlock({
  verse,
  surahNum,
  readingMode,
  playingKey,
  bookmarks,
  notes,
  openNotes,
  openTafsirs,
  tafsirData,
  tafsirTab,
  wbwCache,
  onPlay,
  onToggleBookmark,
  onToggleNotes,
  onSaveNote,
  onToggleTafsir,
  onSelectTafsirTab,
  onLoadTafsir,
}) {
  const { key, num: ayahNum, arabic, translation } = verse;
  const isPlaying = playingKey === key;
  const isBookmarked = !!bookmarks[key];
  const noteText = notes[key] || '';
  const notesOpen = !!openNotes[key];
  const tafsirOpen = !!openTafsirs[key];
  const activeTafsirId = tafsirTab[key] || TAFSIR_TABS[0].id;
  const wbw = wbwCache[key];

  // Auto-load tafsir when opening
  useEffect(() => {
    if (tafsirOpen) {
      onLoadTafsir(activeTafsirId, key);
    }
  }, [tafsirOpen, activeTafsirId, key, onLoadTafsir]);

  const tafsirCacheKey = `${activeTafsirId}:${key}`;
  const currentTafsir = tafsirData[tafsirCacheKey];

  return (
    <div className="ayah-block">
      {/* Toolbar */}
      <div className="ayah-toolbar">
        <div className="ayah-toolbar-left">
          <span className="ayah-num-badge">{key}</span>
          <button
            className={`ayah-tool-btn${isPlaying ? ' playing' : ''}`}
            title={isPlaying ? 'Pause' : 'Play'}
            onClick={() => onPlay(surahNum, ayahNum, key)}
            dangerouslySetInnerHTML={{ __html: isPlaying ? SVG_PAUSE : SVG_PLAY }}
          />
          <button
            className={`ayah-tool-btn${isBookmarked ? ' bookmarked' : ''}`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            onClick={() => onToggleBookmark(key)}
            dangerouslySetInnerHTML={{
              __html: isBookmarked ? SVG_BOOKMARK_FILLED : SVG_BOOKMARK,
            }}
          />
        </div>
        <div className="ayah-toolbar-right">
          <button
            className="ayah-tool-btn"
            title="Notes"
            onClick={() => onToggleNotes(key)}
            dangerouslySetInnerHTML={{ __html: SVG_EDIT }}
          />
        </div>
      </div>

      {/* Arabic text */}
      {readingMode === 'wbw' ? (
        <div className="ayah-wbw">
          {wbw?.loading ? (
            <span className="loading-text">Loading words...</span>
          ) : wbw?.words && wbw.words.length > 0 ? (
            wbw.words.map((w, i) => (
              <div key={i} className="wbw-word">
                <span className="wbw-arabic">{w.arabic}</span>
                <span className="wbw-transliteration">
                  {w.transliteration?.text || ''}
                </span>
                <span className="wbw-translation">{w.translation || ''}</span>
              </div>
            ))
          ) : (
            <div className="ayah-arabic">{arabic}</div>
          )}
        </div>
      ) : (
        <div className="ayah-arabic">{arabic}</div>
      )}

      {/* Translation */}
      {readingMode === 'reading' && (
        <div className="ayah-translation">{translation}</div>
      )}

      {/* Footer */}
      <div className="ayah-footer">
        <button className="ayah-footer-link" onClick={() => onToggleTafsir(key)}>
          <span
            dangerouslySetInnerHTML={{ __html: SVG_BOOK }}
          />{' '}
          Tafsirs
        </button>
        <span className="ayah-footer-sep">|</span>
        <button className="ayah-footer-link" onClick={() => onToggleNotes(key)}>
          <span
            dangerouslySetInnerHTML={{ __html: SVG_MSG }}
          />{' '}
          Reflect
        </button>
      </div>

      {/* Tafsir container */}
      {tafsirOpen && (
        <div className="tafsir-popup">
          <div className="tafsir-popup-tabs">
            {TAFSIR_TABS.map((t) => (
              <button
                key={t.id}
                className={`tafsir-popup-tab${activeTafsirId === t.id ? ' active' : ''}`}
                onClick={() => onSelectTafsirTab(key, t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="tafsir-popup-text">
            {currentTafsir?.loading ? (
              <p className="loading-text">Loading tafsir...</p>
            ) : currentTafsir?.text ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: currentTafsir.text,
                }}
              />
            ) : (
              <p>Select a tafsir to read.</p>
            )}
          </div>
        </div>
      )}

      {/* Notes container */}
      {notesOpen && (
        <div className="ayah-note-box">
          <textarea
            className="ayah-note-input"
            defaultValue={noteText}
            placeholder="Write your reflections..."
            rows={4}
            id={`note-${key}`}
          />
          <div className="ayah-note-actions">
            <button
              className="ayah-note-save"
              onClick={() => {
                const el = document.getElementById(`note-${key}`);
                if (el) onSaveNote(key, el.value);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
