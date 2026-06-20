import React, { useEffect, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { Settings, Article } from '../types';
import logoImg from '../assets/images/aporadh_logo.png';

interface HeaderProps {
  settings: Settings;
  onPageChange: (page: string) => void;
  onCatChange: (cat: string) => void;
  currentPage: string;
  currentCat: string;
  posts: Article[];
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onPageChange,
  onCatChange,
  currentPage,
  currentCat,
  posts
}) => {
  const [bengaliDate, setBengaliDate] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const getBnDate = () => {
      const d = new Date();
      const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
      const months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
      const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const toBnNum = (num: number) => String(num).split('').map(x => bnNums[parseInt(x)] || x).join('');
      return `${days[d.getDay()]}, ${toBnNum(d.getDate())} ${months[d.getMonth()]} ${toBnNum(d.getFullYear())}`;
    };
    setBengaliDate(getBnDate());
  }, []);

  const categories = ['লিড', 'জাতীয়', 'মহানগর', 'বিনোদন', 'রাজনীতি', 'অর্থনীতি', 'আন্তজার্তিক', 'খেলাধূলা', 'জেলা উপজেলা', 'কক্সবাজার', 'পার্বত্য চট্টগ্রাম', 'চাকুরী', 'তথ্য প্রযুক্তি', 'শিক্ষা', 'সম্পাদকীয়', 'উপ-সম্পাদকীয়', 'সারাদেশ', 'স্বাস্থ্য', 'হাসপাতাল', 'সিটি কর্পোরেশন', 'বন্দর', 'প্রেস রিলিজ'];

  const hasEpaper = settings.epaper?.enabled && settings.epaper?.url;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onCatChange(`search:${searchQuery.trim()}`);
    }
  };

  const openEpaper = async () => {
    if (!hasEpaper) { alert('ই-পেপার সংস্করণ শীঘ্রই প্রকাশিত হবে!'); return; }
    const url = settings.epaper.url;
    const fallback = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    window.open(url || fallback, '_blank');
  };

  // Shared category pills used in both mobile and desktop
  const CategoryPills = () => (
    <div className="flex overflow-x-auto no-scrollbar px-2 py-2 gap-1.5 bg-white border-b border-red-100">
      <button
        onClick={() => { onPageChange('home'); setIsMobileMenuOpen(false); }}
        className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
          currentPage === 'home' ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-primary/40 hover:border-primary'
        }`}
      >
        সব খবর
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => { onCatChange(cat); setIsMobileMenuOpen(false); }}
          className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
            currentPage === 'category' && currentCat === cat ? 'bg-primary text-white border-primary' : 'bg-white text-primary border-primary/40 hover:border-primary'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );

  return (
    <header id="header-root" className="w-full bg-white z-40">

      {/* ── MOBILE ONLY: top date/epaper bar ── hidden on desktop */}
      <div className="flex md:hidden bg-primary-dark text-red-100 text-xs px-4 py-2 justify-between items-center">
        <span className="font-medium">{bengaliDate}</span>
        <button onClick={openEpaper} className="font-semibold hover:text-white transition-colors">
          ই-পেপার (E-Paper)
        </button>
      </div>

      {/* ── STICKY NAVBAR (both mobile + desktop) ── */}
      <div id="navbar-el" className="sticky top-0 z-50 shadow-md">

        {/* ROW 1 — white background */}
        <div className="bg-white border-b border-red-100 px-3 md:px-6 py-2 flex items-center gap-3">

          {/* Mobile: hamburger (left) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-primary hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo — center on mobile, left on desktop */}
          <div
            onClick={() => onPageChange('home')}
            className="cursor-pointer flex-1 md:flex-none flex md:justify-start justify-center"
          >
            <img
              src={logoImg}
              alt="অপরাধ ঘোষণা"
              className="h-7 md:h-10 w-auto object-contain"
            />
          </div>

          {/* Desktop: search field inline */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-sm border border-primary/30 rounded-full overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="খবর খুঁজুন..."
              className="flex-1 px-4 py-1.5 text-sm outline-none text-gray-800 placeholder-gray-400"
            />
            <button type="submit" className="bg-primary text-white px-3 py-1.5 hover:bg-primary/90 transition-colors">
              <Search size={15} />
            </button>
          </form>

          {/* Desktop: date */}
          <span className="hidden md:inline text-xs font-medium text-gray-600 whitespace-nowrap">{bengaliDate}</span>

          {/* Desktop: e-paper */}
          <button
            onClick={openEpaper}
            className="hidden md:inline text-xs font-semibold text-primary hover:text-primary/70 transition-colors whitespace-nowrap border border-primary/30 px-3 py-1.5 rounded-full"
          >
            ই-পেপার (E-Paper)
          </button>

          {/* Mobile: search icon (right) */}
          <button
            onClick={() => onCatChange(`search:${searchQuery}`)}
            className="md:hidden p-1.5 text-primary hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          >
            <Search size={22} />
          </button>
        </div>

        {/* ROW 2 — category pills */}
        <CategoryPills />

        {/* Mobile hamburger drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-primary-dark border-t border-red-950 px-4 py-3 flex flex-col gap-1 animate-in slide-in-from-top duration-300 max-h-[70vh] overflow-y-auto">
            <button onClick={() => { onPageChange('home'); setIsMobileMenuOpen(false); }} className="w-full text-left py-2.5 px-3 text-white font-medium hover:bg-black/10 rounded">
              সব খবর
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => { onCatChange(cat); setIsMobileMenuOpen(false); }} className="w-full text-left py-2.5 px-3 text-white font-medium hover:bg-black/10 rounded">
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BREAKING NEWS TICKER */}
      {settings.breakingNews && (
        <div id="breaking-ticker-el" className="bg-red-50 border-b border-red-100 py-2.5">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm animate-pulse whitespace-nowrap">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white"></span>
              ব্রেকিং নিউজ
            </span>
            <div className="overflow-hidden relative flex-1 h-5">
              <div className="absolute w-[300%] animate-marquee">
                <span className="text-primary-dark font-medium text-sm sm:text-base">{settings.breakingNews}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes marquee { 0% { transform: translateX(33%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 35s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </header>
  );
};
