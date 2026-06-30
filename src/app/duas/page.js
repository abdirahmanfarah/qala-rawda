'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { fetchFromUmmah } from '@/lib/api';

export default function DuasPage() {
  const [view, setView] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [duas, setDuas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch all duas data on mount
  useEffect(() => {
    fetchFromUmmah('/duas')
      .then((res) => {
        setCategories(res.data.categories || []);
        setDuas(res.data.duas || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  function selectCategory(cat) {
    setSelectedCategory(cat);
    setView('detail');
  }

  function backToCategories() {
    setSelectedCategory(null);
    setView('categories');
  }

  // Get duas count for a category
  function getDuaCount(categoryId) {
    return duas.filter((d) => String(d.category) === String(categoryId)).length;
  }

  // Get filtered duas for selected category
  function getFilteredDuas() {
    if (!selectedCategory) return [];
    return duas.filter((d) => String(d.category) === String(selectedCategory.id));
  }

  // ─── RENDER ───

  if (loading) {
    return (
      <div className="page-container">
        <ThemeToggle />
        <p>Loading...</p>
      </div>
    );
  }

  // View 1: Categories Grid
  if (view === 'categories') {
    return (
      <div className="page-container">
        <ThemeToggle />
        <div className="top-bar">
          <Link href="/hall" className="back-btn">← Return to the Hall</Link>
        </div>

        <div className="page-header">
          <h1>الدعاء</h1>
          <p>Authentic Duas from Quran &amp; Sunnah</p>
        </div>

        <div className="duas-categories-grid">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="dua-category-card"
              onClick={() => selectCategory(cat)}
            >
              <div className="dc-name">{cat.name}</div>
              {cat.description && <div className="dc-desc">{cat.description}</div>}
              <div className="dc-count">{getDuaCount(cat.id)} duas</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // View 2: Category Detail
  if (view === 'detail') {
    const filteredDuas = getFilteredDuas();

    return (
      <div className="page-container">
        <ThemeToggle />
        <div className="top-bar">
          <button className="back-btn" onClick={backToCategories}>
            ← All Categories
          </button>
        </div>

        <div className="page-header">
          <h1>{selectedCategory.name}</h1>
          {selectedCategory.description && <p>{selectedCategory.description}</p>}
        </div>

        <div className="duas-list">
          {filteredDuas.map((dua, i) => (
            <div key={dua.id || i} className="dua-item">
              {dua.title && <div className="dua-item-title">{dua.title}</div>}
              {dua.arabic && <div className="dua-item-arabic">{dua.arabic}</div>}
              {dua.transliteration && <div className="dua-item-translit">{dua.transliteration}</div>}
              {dua.translation && <div className="dua-item-translation">{dua.translation}</div>}
              {dua.source && <div className="dua-item-source">{dua.source}</div>}
              {dua.repeat && <div className="dua-item-repeat">{dua.repeat}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
