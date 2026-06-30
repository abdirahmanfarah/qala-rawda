'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import Modal from '@/components/Modal';
import { fetchFromUmmah, fetchFromAlAdhan } from '@/lib/api';

function getDailySeed() {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

function getTodayFormatted() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

const ROOMS = [
  { arabic: 'القرآن', name: 'The Quran Path', desc: '', href: '/quran' },
  { arabic: 'الحديث', name: 'The Hadith Path', desc: '', href: '/hadith' },
  { arabic: 'الدعاء', name: 'Duas', desc: '', href: '/duas' },
  { arabic: 'أسماء الله الحسنى', name: 'The 99 Names', desc: '', href: '/names' },
  { arabic: 'التقويم الهجري', name: 'Hijri Calendar', desc: '', href: '/calendar' },
];

export default function HallPage() {
  const router = useRouter();

  const [hijriData, setHijriData] = useState(null);
  const [dua, setDua] = useState(null);
  const [hadith, setHadith] = useState(null);

  const [duaModalOpen, setDuaModalOpen] = useState(false);
  const [hadithModalOpen, setHadithModalOpen] = useState(false);

  useEffect(() => {
    const seed = getDailySeed();

    // Fetch Hijri date
    fetchFromAlAdhan(`/gToH/${getTodayFormatted()}`)
      .then((res) => {
        if (res?.data) setHijriData(res.data);
      })
      .catch(() => {});

    // Fetch Dua of the Day
    fetchFromUmmah('/duas')
      .then((res) => {
        if (res && Array.isArray(res) && res.length > 0) {
          const index = seed % res.length;
          setDua(res[index]);
        }
      })
      .catch(() => {});

    // Fetch Hadith of the Day
    const collections = ['bukhari', 'muslim'];
    const col = collections[seed % collections.length];
    const num = (seed % 300) + 1;
    fetchFromUmmah(`/hadith/${col}/${num}`)
      .then((res) => {
        if (res) setHadith({ ...res, collection: col });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="hall">
      <ThemeToggle />

      <div className="hall-header">
        <h1>قلعة روضة</h1>
        <p>Qala Rawda</p>
      </div>

      <div className="hall-content">
        {/* Today Section */}
        <div className="section-label">Today</div>
        <div className="daily-widgets">
          {/* Calendar Card */}
          <div className="daily-card" onClick={() => router.push('/calendar')}>
            {hijriData ? (
              <>
                <div className="daily-card-arabic">{hijriData.hijri?.day} {hijriData.hijri?.month?.ar} {hijriData.hijri?.year}</div>
                <div className="daily-card-title">{hijriData.hijri?.month?.en} {hijriData.hijri?.year}</div>
                <div className="daily-card-sub">{hijriData.gregorian?.date}</div>
              </>
            ) : (
              <div className="daily-card-sub">Loading...</div>
            )}
            <div className="daily-card-link">Open Calendar →</div>
          </div>

          {/* Dua of the Day Card */}
          <div className="daily-card" onClick={() => dua && setDuaModalOpen(true)}>
            {dua ? (
              <>
                <div className="daily-card-arabic">{dua.arabic ? dua.arabic.slice(0, 80) + (dua.arabic.length > 80 ? '...' : '') : ''}</div>
                <div className="daily-card-title">{dua.title || 'Dua of the Day'}</div>
                <div className="daily-card-sub">{dua.translation ? dua.translation.slice(0, 80) + '...' : ''}</div>
              </>
            ) : (
              <div className="daily-card-sub">Loading...</div>
            )}
            <div className="daily-card-link">Read Full Dua →</div>
          </div>

          {/* Hadith of the Day Card */}
          <div className="daily-card" onClick={() => hadith && setHadithModalOpen(true)}>
            {hadith ? (
              <>
                <div className="daily-card-arabic">{hadith.arabic ? hadith.arabic.slice(0, 80) + (hadith.arabic.length > 80 ? '...' : '') : ''}</div>
                <div className="daily-card-title">Hadith of the Day</div>
                <div className="daily-card-sub">{hadith.english ? hadith.english.slice(0, 80) + '...' : ''}</div>
              </>
            ) : (
              <div className="daily-card-sub">Loading...</div>
            )}
            <div className="daily-card-link">Read Full Hadith →</div>
          </div>
        </div>

        {/* Dua Modal */}
        <Modal isOpen={duaModalOpen} onClose={() => setDuaModalOpen(false)}>
          {dua && (
            <>
              <div className="daily-modal-arabic">{dua.arabic}</div>
              <div className="daily-modal-translit">{dua.transliteration}</div>
              <div className="daily-modal-translation">{dua.translation}</div>
              <div className="daily-modal-source">{dua.source}</div>
              <div className="daily-modal-footer">
                <button onClick={() => router.push('/')}>Return to Landing</button>
                <button onClick={() => router.push('/duas')}>All Duas →</button>
              </div>
            </>
          )}
        </Modal>

        {/* Hadith Modal */}
        <Modal isOpen={hadithModalOpen} onClose={() => setHadithModalOpen(false)}>
          {hadith && (
            <>
              <div className="daily-modal-arabic">{hadith.arabic}</div>
              <div className="daily-modal-translit">{hadith.transliteration}</div>
              <div className="daily-modal-translation">{hadith.english}</div>
              <div className="daily-modal-source">{hadith.source || hadith.collection}</div>
              <div className="daily-modal-footer">
                <button onClick={() => router.push('/')}>Return to Landing</button>
                <button onClick={() => router.push('/hadith')}>The Hadith Path →</button>
              </div>
            </>
          )}
        </Modal>

        {/* The Library Section */}
        <div className="section-label">The Library</div>
        <div className="rooms-grid">
          {ROOMS.map((room) => (
            <Link key={room.href} href={room.href} className="room-door">
              <span className="room-arabic">{room.arabic}</span>
              <span className="room-name">{room.name}</span>
              <span className="room-desc">{room.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
