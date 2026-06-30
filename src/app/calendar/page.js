'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { fetchFromAlAdhan } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

const HIJRI_MONTHS = [
  { num: 1, ar: 'مُحَرَّم', en: 'Muharram', sacred: true, desc: 'Sacred month. The first month of the Islamic year. The day of Ashura (10th) commemorates many events. Fasting is highly encouraged, especially the 9th and 10th. The Hijrah of the Prophet \uFDFA marks the start of the Islamic calendar.' },
  { num: 2, ar: 'صَفَر', en: 'Safar', sacred: false, desc: 'The pre-Islamic Arabs considered Safar unlucky — Islam rejected this superstition entirely. The Prophet \uFDFA said: "There is no bad omen in Safar." A month like any other in the sight of Allah.' },
  { num: 3, ar: 'رَبِيع الأَوَّل', en: 'Rabi al-Awwal', sacred: false, desc: 'The month of the birth of the Prophet Muhammad \uFDFA (12th). Also the month of his migration\'s arrival in Medina, and the month of his passing. A month deeply tied to his life \uFDFA.' },
  { num: 4, ar: 'رَبِيع الثَّانِي', en: 'Rabi al-Thani', sacred: false, desc: 'The second month of spring. A continuation of the period after the Prophet\'s \uFDFA birth month.' },
  { num: 5, ar: 'جُمَادَىٰ الأُولَىٰ', en: 'Jumada al-Ula', sacred: false, desc: 'The first month of the dry/frozen season. Named because water would freeze in this period in pre-Islamic Arabia.' },
  { num: 6, ar: 'جُمَادَىٰ الثَّانِيَة', en: 'Jumada al-Thani', sacred: false, desc: 'The second month of the dry season. A quiet month in the Islamic calendar.' },
  { num: 7, ar: 'رَجَب', en: 'Rajab', sacred: true, desc: 'Sacred month. One of the four inviolable months. The night of Al-Isra wal-Mi\'raj (27th) — the Prophet\'s \uFDFA night journey to Jerusalem and ascension through the heavens. Stands alone among the sacred months as the only one not consecutive with the others.' },
  { num: 8, ar: 'شَعْبَان', en: 'Sha\'ban', sacred: false, desc: 'The month of preparation for Ramadan. The Prophet \uFDFA fasted most of this month. He said: "It is a month people neglect, between Rajab and Ramadan." The Night of the 15th (Laylat al-Bara\'ah) is observed by many scholars as a night of forgiveness.' },
  { num: 9, ar: 'رَمَضَان', en: 'Ramadan', sacred: false, desc: 'The month of fasting — the fourth pillar of Islam. The Quran was first revealed in this month. Contains Laylat al-Qadr (the Night of Power), better than a thousand months. The best month of the year. Fasting from dawn to sunset, increased prayer, charity, and Quran recitation.' },
  { num: 10, ar: 'شَوَّال', en: 'Shawwal', sacred: false, desc: 'The month of Eid al-Fitr (1st) — the celebration marking the end of Ramadan. Fasting six days of Shawwal after Eid is highly recommended. The Prophet \uFDFA said: "Whoever fasts Ramadan and follows it with six days of Shawwal, it is as if he fasted the entire year."' },
  { num: 11, ar: 'ذُو القَعْدَة', en: 'Dhul Qi\'dah', sacred: true, desc: 'Sacred month. The month of "sitting" — the Arabs would cease fighting and sit in preparation for the Hajj pilgrimage. One of three consecutive sacred months.' },
  { num: 12, ar: 'ذُو الحِجَّة', en: 'Dhul Hijjah', sacred: true, desc: 'Sacred month. The month of Hajj (8th–12th). The Day of Arafah (9th) — the best day of the year, when Allah frees more people from the Fire than any other day. Eid al-Adha (10th). The first ten days are the best days of the year — the Prophet \uFDFA said no good deeds are more beloved to Allah than those done in these days.' }
];

const SUNNI_EVENTS = [
  'ashura', '10th of muharram', 'mawlid', 'birth of the prophet', 'prophet muhammad',
  'isra', "mi'raj", 'miraj', 'night journey', 'shab-e-barat', 'laylat al-bara',
  "nisf sha'ban", '15th of sha', 'ramadan', 'beginning of ramadan', 'start of ramadan',
  'laylat al-qadr', 'night of power', 'night of decree', 'eid al-fitr', 'eid ul-fitr',
  'eid-ul-fitr', 'eid al-adha', 'eid ul-adha', 'eid-ul-adha', 'day of arafah',
  'day of arafat', 'arafa', 'hajj', 'wuquf', 'islamic new year', 'hijri new year',
  '1st of muharram', 'conquest of makkah', 'conquest of mecca', 'battle of badr',
  'revelation of the quran'
];

function isSunniEvent(name) {
  const lower = name.toLowerCase();
  return SUNNI_EVENTS.some(kw => lower.includes(kw));
}

export default function CalendarPage() {
  const [todayData, setTodayData] = useState(null);
  const [todayHijri, setTodayHijri] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [currentYear, setCurrentYear] = useState(null);
  const [monthDays, setMonthDays] = useState([]);
  const [events, setEvents] = useState([]);
  const calCache = useRef({});
  const monthTitleRef = useRef(null);

  useEffect(() => {
    async function init() {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      try {
        const data = await fetchFromAlAdhan(`/gToH/${dd}-${mm}-${yyyy}`);
        setTodayData(data.data);
        setTodayHijri(data.data.hijri);
        const m = parseInt(data.data.hijri.month.number);
        const y = parseInt(data.data.hijri.year);
        setCurrentMonth(m);
        setCurrentYear(y);
      } catch (e) {}
    }
    init();
  }, []);

  useEffect(() => {
    if (currentMonth && currentYear) {
      loadMonth(currentMonth, currentYear);
    }
  }, [currentMonth, currentYear]);

  async function loadMonth(month, year) {
    const key = `${month}-${year}`;
    if (!calCache.current[key]) {
      try {
        const data = await fetchFromAlAdhan(`/hToGCalendar/${month}/${year}`);
        calCache.current[key] = data.data;
      } catch (e) { return; }
    }
    const days = calCache.current[key];
    if (!days || days.length === 0) return;
    setMonthDays(days);

    const evts = [];
    const monthInfo = HIJRI_MONTHS[month - 1];
    days.forEach(dayData => {
      const h = dayData.hijri;
      const g = dayData.gregorian;
      const holidays = (h.holidays || []).filter(isSunniEvent);
      holidays.forEach(hol => {
        evts.push({ day: h.day, greg: `${g.day} ${g.month.en}`, name: hol });
      });
    });
    setEvents(evts);
  }

  function prevMonth() {
    setCurrentMonth(m => {
      if (m <= 1) { setCurrentYear(y => y - 1); return 12; }
      return m - 1;
    });
  }

  function nextMonth() {
    setCurrentMonth(m => {
      if (m >= 12) { setCurrentYear(y => y + 1); return 1; }
      return m + 1;
    });
  }

  function selectMonth(num) {
    setCurrentMonth(num);
    if (monthTitleRef.current) {
      window.scrollTo({ top: monthTitleRef.current.offsetTop - 100, behavior: 'smooth' });
    }
  }

  const monthInfo = currentMonth ? HIJRI_MONTHS[currentMonth - 1] : null;

  // Calculate grid offset
  let startDow = 0;
  if (monthDays.length > 0) {
    const fg = monthDays[0].gregorian;
    const firstDate = new Date(parseInt(fg.year), parseInt(fg.month.number) - 1, parseInt(fg.day));
    startDow = firstDate.getDay();
  }

  return (
    <div className="inner-page">
      <ThemeToggle />
      <div className="top-bar">
        <Link href="/hall" className="back-button">← Return to the Hall</Link>
      </div>
      <div className="page-header">
        <h1>التقويم الهجري</h1>
        <p>The Islamic Calendar</p>
      </div>
      <div className="inner-content">
        {/* Today */}
        <div className="cal-today-box">
          {todayData ? (
            <>
              <div className="cal-today-weekday">{todayData.hijri.weekday.ar} — {todayData.gregorian.weekday.en}</div>
              <div className="cal-today-hijri">{todayData.hijri.day} {todayData.hijri.month.ar} {todayData.hijri.year} هـ</div>
              <div className="cal-today-gregorian">{todayData.gregorian.day} {todayData.gregorian.month.en} {todayData.gregorian.year}</div>
            </>
          ) : (
            <p className="loading-text">Loading...</p>
          )}
        </div>

        {/* Month nav */}
        {monthInfo && (
          <>
            <div className="cal-nav">
              <button className="cal-nav-btn" onClick={prevMonth}>←</button>
              <div className="cal-nav-title" ref={monthTitleRef}>
                <div className="cal-hijri-month">{monthInfo.ar}</div>
                <div className="cal-hijri-month-en">{monthInfo.en} {currentYear} AH</div>
              </div>
              <button className="cal-nav-btn" onClick={nextMonth}>→</button>
            </div>

            {/* Month info */}
            <div className={`cal-month-info visible`}>
              {monthInfo.sacred && <div className="sacred-badge">Sacred Month</div>}
              <h3>{monthInfo.en} — {monthInfo.ar}</h3>
              <p>{monthInfo.desc}</p>
            </div>
          </>
        )}

        {/* Calendar grid */}
        {monthDays.length > 0 && (
          <div className="cal-grid-wrapper">
            <div className="cal-weekdays">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>
            <div className="cal-grid">
              {Array.from({ length: startDow }).map((_, i) => (
                <div key={`empty-${i}`} className="cal-day empty" />
              ))}
              {monthDays.map((dayData, i) => {
                const h = dayData.hijri;
                const g = dayData.gregorian;
                const isToday = todayHijri &&
                  h.day === todayHijri.day &&
                  h.month.number === todayHijri.month.number &&
                  h.year === todayHijri.year;
                const holidays = (h.holidays || []).filter(isSunniEvent);
                const hasHoliday = holidays.length > 0;

                return (
                  <div
                    key={i}
                    className={`cal-day${isToday ? ' today' : ''}${hasHoliday ? ' has-holiday' : ''}`}
                  >
                    <div className="cal-day-hijri">{h.day}</div>
                    <div className="cal-day-greg">{g.day} {g.month.en.substring(0, 3)}</div>
                    {hasHoliday && <div className="cal-day-dot" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Events */}
        {events.length > 0 && (
          <div className="cal-events">
            <div className="cal-event-title">Events this month</div>
            {events.map((ev, i) => (
              <div key={i} className="cal-event-item">
                <span className="event-date">{ev.day} {monthInfo?.en.substring(0, 3)} / {ev.greg}</span>
                <span className="event-name">{ev.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* 12 months overview */}
        <div className="section-label" style={{ marginTop: '3rem' }}>The Twelve Months</div>
        <div className="cal-months-grid">
          {HIJRI_MONTHS.map(m => (
            <div
              key={m.num}
              className={`cal-month-card${m.sacred ? ' sacred' : ''}`}
              onClick={() => selectMonth(m.num)}
            >
              <div className="month-num">{m.num}</div>
              <div className="month-ar">{m.ar}</div>
              <div className="month-en">{m.en}</div>
              <div className="month-desc">
                {m.desc.length > 120 ? m.desc.substring(0, 120) + '...' : m.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
