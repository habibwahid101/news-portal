import React, { useEffect, useState } from 'react';
import { Menu, Search, X, BookOpen, AlertTriangle } from 'lucide-react';
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const getBnDate = () => {
      const d = new Date();
      const days = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
      const months = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      // Convert English numerals to Bengali
      const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const toBnNum = (num: number) => String(num).split('').map(x => bnNums[parseInt(x)] || x).join('');
      
      const dayName = days[d.getDay()];
      const dayNum = toBnNum(d.getDate());
      const monthName = months[d.getMonth()];
      const yearNum = toBnNum(d.getFullYear());
      
      return `${dayName}, ${dayNum} ${monthName} ${yearNum}`;
    };
    setBengaliDate(getBnDate());
  }, []);

  const categories = ['লিড', 'জাতীয়', 'মহানগর', 'বিনোদন', 'রাজনীতি', 'অর্থনীতি', 'আন্তজার্তিক', 'খেলাধূলা', 'জেলা উপজেলা', 'কক্সবাজার', 'পার্বত্য চট্টগ্রাম', 'চাকুরী', 'তথ্য প্রযুক্তি', 'শিক্ষা', 'সম্পাদকীয়', 'উপ-সম্পাদকীয়', 'সারাদেশ', 'স্বাস্থ্য', 'হাসপাতাল', 'সিটি কর্পোরেশন', 'বন্দর', 'প্রেস রিলিজ'];

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onCatChange(`search:${searchQuery.trim()}`);
      setIsSearchOpen(false);
    }
  };

  const hasEpaper = settings.epaper?.enabled && settings.epaper?.url;

  return (
    <header id="header-root" className="w-full bg-white z-40">
      {/* 1. TOP BAR */}
      <div id="top-bar-el" className="bg-primary-dark text-red-50 py-2 border-b border-red-950 font-bengali-sans text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="font-medium text-red-100">{bengaliDate}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              id="top-epaper-link"
              onClick={async () => {
                if (hasEpaper) {
                  const url = settings.epaper.url;
                  const fallbackPdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

                  if (!url || url.includes('epaper_may_2026.pdf')) {
                    window.open(fallbackPdf, '_blank');
                    return;
                  }

                  if (url.startsWith('http://') || url.startsWith('https://')) {
                    // Pre-verify with HEAD or GET to avoid opening a page that returns a 404 error
                    try {
                      const response = await fetch(url, { method: 'HEAD' });
                      if (response.status === 404) {
                        window.open(fallbackPdf, '_blank');
                        return;
                      }
                    } catch (err) {
                      try {
                        const response = await fetch(url, { method: 'GET' });
                        if (response.status === 404) {
                          window.open(fallbackPdf, '_blank');
                          return;
                        }
                      } catch (e) {
                        // Network/CORS check failed, proceed with original url since it could be valid but CORS restricted
                      }
                    }
                    window.open(url, '_blank');
                  } else if (url.startsWith('data:')) {
                    try {
                      const base64Parts = url.split(',');
                      const contentType = base64Parts[0].split(':')[1].split(';')[0];
                      const byteCharacters = atob(base64Parts[1]);
                      const byteNumbers = new Array(byteCharacters.length);
                      for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                      }
                      const byteArray = new Uint8Array(byteNumbers);
                      const blob = new Blob([byteArray], { type: contentType });
                      const blobUrl = URL.createObjectURL(blob);
                      window.open(blobUrl, '_blank');
                    } catch (e) {
                      console.error('Failed to parse base64 PDF', e);
                      // Fallback
                      window.open(fallbackPdf, '_blank');
                    }
                  } else {
                    window.open(url || fallbackPdf, '_blank');
                  }
                } else {
                  alert('ই-পেপার সংস্করণ শীঘ্রই প্রকাশিত হবে!');
                }
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-all px-3 py-1 rounded cursor-pointer text-white font-bold ${
                !hasEpaper ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
              }`}
            >
              ই-পেপার (E-Paper)
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (BRANDING & BANNER ADS) — hidden on mobile since logo is in navbar */}
      <div id="main-header-el" className="hidden md:grid max-w-7xl mx-auto px-4 py-5 grid-cols-1 lg:grid-cols-12 gap-6 items-center border-b border-gray-100">
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col items-center lg:items-center xl:items-start text-center">
          <div
            onClick={() => onPageChange('home')}
            className="group cursor-pointer select-none max-w-full flex justify-center xl:justify-start"
          >
            <img
              src={logoImg}
              alt="অপরাধ ঘোষণা"
              className="h-[68px] sm:h-20 lg:h-[84px] w-auto max-w-full object-contain transition-transform duration-200 hover:scale-[1.01] block"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* HEADER AD BANNER (Luxury fluid design) */}
        <div className="lg:col-span-12 xl:col-span-7 w-full flex justify-center xl:justify-end">
          {settings.ads?.header?.enabled && settings.ads?.header?.image ? (
            <a
              href={settings.ads.header.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full max-w-[728px] overflow-hidden rounded-md border border-gray-100 shadow-sm transition-transform duration-200 hover:scale-[1.01]"
            >
              <img
                src={settings.ads.header.image}
                alt={settings.ads.header.name || 'বিজ্ঞাপন'}
                className="w-full h-auto max-h-[90px] object-cover"
              />
            </a>
          ) : (
            <div className="w-full max-w-[728px] bg-gradient-to-r from-red-50 to-amber-50 rounded-lg p-3 sm:p-5 flex justify-between items-center border border-dashed border-red-200">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-red-100 px-2 py-0.5 rounded-full">বিজ্ঞাপন</span>
                <h4 className="text-sm font-bold text-gray-800 mt-1">এখানে আপনার বিজ্ঞাপন দিন</h4>
                <p className="text-xs text-gray-500">অনলাইন ও প্রিন্ট সংস্করণে প্রচারের জন্য যোগাযোগ করুন</p>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-primary">📞 {settings.phone1}</div>
                <div className="text-gray-500 mt-0.5">{settings.email}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. RESPONSIVE NAVIGATION BAR */}
      <div id="navbar-el" className="bg-primary sticky top-0 z-50 shadow-md">

        {/* MOBILE TOP ROW: hamburger | logo | search */}
        <div className="flex md:hidden items-center justify-between px-3 py-2 border-b border-red-100 bg-white">
          {/* Left: Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-primary hover:bg-red-50 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Center: Logo */}
          <div
            onClick={() => onPageChange('home')}
            className="cursor-pointer flex-1 flex justify-center"
          >
            <img
              src={logoImg}
              alt="অপরাধ ঘোষণা"
              className="h-9 w-auto object-contain"
            />
          </div>

          {/* Right: Search */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 text-primary hover:bg-red-50 rounded-lg transition-colors"
          >
            <Search size={22} />
          </button>
        </div>

        {/* MOBILE CATEGORY SCROLL ROW */}
        <div className="flex md:hidden overflow-x-auto no-scrollbar px-2 py-2 gap-1.5 bg-white border-b border-red-100">
          <button
            onClick={() => onPageChange('home')}
            className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
              currentPage === 'home'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-primary border-primary/40 hover:border-primary'
            }`}
          >
            সব খবর
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => onCatChange(cat)}
              className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                currentPage === 'category' && currentCat === cat
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-primary border-primary/40 hover:border-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* DESKTOP NAV ROW (unchanged) */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 items-center justify-between">
          <div className="flex items-center overflow-x-auto no-scrollbar py-0.5 flex-1">
            <button
              onClick={() => onPageChange('home')}
              className={`py-4 px-4 text-sm font-semibold text-white border-b-4 whitespace-nowrap transition-colors duration-150 ${
                currentPage === 'home' ? 'border-amber-400 bg-black/10' : 'border-transparent hover:bg-black/5'
              }`}
            >
              সব খবর
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => onCatChange(cat)}
                className={`py-4 px-4 text-sm font-semibold text-white border-b-4 whitespace-nowrap transition-colors duration-150 ${
                  currentPage === 'category' && currentCat === cat ? 'border-amber-400 bg-black/10' : 'border-transparent hover:bg-black/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-3 text-white hover:bg-black/10 rounded-full transition-colors"
          >
            <Search size={20} />
          </button>
        </div>

        {/* SEARCH DRAWER */}
        {isSearchOpen && (
          <div className="bg-primary-dark border-t border-red-950 p-4 animate-in slide-in-from-top duration-200">
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex gap-2">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="খবর খুঁজুন (যেমন: ডাকাতি, চট্টগ্রাম)..."
                className="flex-1 bg-white text-gray-900 placeholder-gray-500 rounded px-4 py-2.5 outline-none focus:ring-2 focus:ring-amber-400 text-sm"
              />
              <button type="submit" className="bg-accent hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded transition-colors text-sm">
                খুঁজুন
              </button>
              <button type="button" onClick={() => setIsSearchOpen(false)} className="text-white hover:bg-black/20 p-2.5 rounded">
                ✕
              </button>
            </form>
          </div>
        )}

        {/* MOBILE HAMBURGER DRAWER */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-primary-dark border-t border-red-950 px-4 py-3 flex flex-col gap-1 animate-in slide-in-from-top duration-300 max-h-[70vh] overflow-y-auto">
            <button
              onClick={() => { onPageChange('home'); setIsMobileMenuOpen(false); }}
              className="w-full text-left py-2.5 px-3 text-white font-medium hover:bg-black/10 rounded"
            >
              সব খবর
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { onCatChange(cat); setIsMobileMenuOpen(false); }}
                className="w-full text-left py-2.5 px-3 text-white font-medium hover:bg-black/10 rounded"
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. BREAKING NEWS TICKER */}
      {settings.breakingNews && (
        <div id="breaking-ticker-el" className="bg-red-50 border-b border-red-100 py-2.5">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm animate-pulse whitespace-nowrap">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-white"></span>
              ব্রেকিং নিউজ
            </span>
            <div className="overflow-hidden relative flex-1 h-5">
              <div className="absolute w-[300%] animate-marquee">
                <span className="text-primary-dark font-medium text-sm sm:text-base">
                  {settings.breakingNews}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INJECT CUSTOM TAILWIND ANIMATION IN CSS INLINE FOR THE TICKER */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(33%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </header>
  );
};
