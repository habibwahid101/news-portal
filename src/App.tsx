import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { NewsCard } from './components/NewsCard';
import { CommentsSection } from './components/CommentsSection';
import { AdminPanel } from './components/AdminPanel';
import { ShareButtons } from './components/ShareButtons';
import { Article, Profile, Settings } from './types';
import { DBService } from './services/db';
import { Calendar, User, Eye, ArrowLeft, Send } from 'lucide-react';

export default function App() {
  const [posts, setPosts] = useState<Article[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [currentPage, setCurrentPage] = useState<'home' | 'category' | 'article' | 'search'>('home');
  const [currentCat, setCurrentCat] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null);
  
  // Authorization States
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginErr, setLoginError] = useState('');

  // Page Scroll Progress Bar for immersive reading
  const [readProgress, setReadProgress] = useState(0);

  const [currentUrlPath, setCurrentUrlPath] = useState(
    typeof window !== 'undefined' 
      ? window.location.pathname 
      : '/'
  );

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentUrlPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    
    // Intercept manual history state pushes as well
    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  useEffect(() => {
    loadData();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Resolve a shared /news/:id link (or browser back/forward) to the right view,
  // once posts are loaded. Without this, every shared article link just opens
  // the homepage instead of that specific article.
  useEffect(() => {
    if (posts.length === 0) return;
    const newsMatch = currentUrlPath.match(/^\/news\/(\d+)$/);
    if (newsMatch) {
      const id = parseInt(newsMatch[1], 10);
      const found = posts.find(p => p.id === id);
      if (found) {
        setActiveArticleId(id);
        setCurrentPage('article');
      }
    } else if (currentUrlPath === '/') {
      setCurrentPage('home');
      setActiveArticleId(null);
    }
  }, [posts, currentUrlPath]);

  const loadData = async () => {
    const p = await DBService.getArticles();
    const s = await DBService.getSettings();
    setPosts(p);
    setSettings(s);
  };

  const handleScroll = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      setReadProgress((window.scrollY / docHeight) * 100);
    }
  };

  // Nav actions
  const handlePageChange = (page: string) => {
    if (page === 'admin-login') {
      if (currentUser) {
        setIsAdminPanelOpen(true);
      } else {
        setIsLoginModalOpen(true);
        setLoginError('');
      }
    } else {
      setCurrentPage('home');
      setActiveArticleId(null);
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/');
      }
    }
  };

  const handleCatChange = (cat: string) => {
    if (cat.startsWith('search:')) {
      const q = cat.split('search:')[1];
      setSearchQuery(q);
      setCurrentPage('search');
    } else {
      setCurrentCat(cat);
      setCurrentPage('category');
    }
    setActiveArticleId(null);
  };

  const handleArticleClick = (id: number) => {
    setActiveArticleId(id);
    setCurrentPage('article');
    window.scrollTo(0, 0);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/news/${id}`);
    }
  };

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const users = await DBService.getUsers();
    const inputUser = loginUser.trim().toLowerCase();
    const found = users.find(u => 
      (u.username?.toLowerCase() === inputUser || u.email?.toLowerCase() === inputUser) && 
      u.password === loginPass
    );
    if (found && found.active) {
      setCurrentUser(found);
      setIsLoginModalOpen(false);
      setIsAdminPanelOpen(true);
    } else {
      setLoginError('ইউজারনেম বা পাসওয়ার্ড সঠিক নয়।');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdminPanelOpen(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      setCurrentUrlPath('/');
    }
    loadData();
  };

  const handleAdminLogout = () => {
    setCurrentUser(null);
    setIsAdminPanelOpen(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/admin');
      setCurrentUrlPath('/admin');
    }
    loadData();
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bengali-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <span className="text-gray-500 font-semibold">অপরাধ ঘোষণা লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  const isAdminRoute = currentUrlPath === '/admin' || currentUrlPath === '/portal';

  if (isAdminRoute) {
    if (currentUser) {
      return (
        <AdminPanel
          onClose={handleLogout}
          onLogout={handleAdminLogout}
          loggedInUser={currentUser}
        />
      );
    }

    return (
      <div id="portal-login-root" className="min-h-screen bg-slate-950 flex items-center justify-center font-bengali-sans p-4 selection:bg-red-200">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-gray-100 flex flex-col gap-6 relative overflow-hidden">
          {/* Top aesthetic red bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
          
          <div className="text-center">
            <h1 className="font-serif-bengali text-3xl font-black text-primary tracking-tight">
              অপরাধ ঘোষণা
            </h1>
            <p className="text-xs uppercase tracking-[0.15em] font-semibold text-gray-400 mt-1.5 font-sans">
              সম্পাদকীয় পরিচালন পোর্টাল
            </p>
          </div>

          <form onSubmit={doLogin} className="flex flex-col gap-4">
            <div className="bg-slate-50 border border-gray-200 rounded-lg p-3 text-xs text-slate-600 leading-relaxed">
              🔑 এই অংশটি শুধুমাত্র "অপরাধ ঘোষণা" পত্রিকার নিবন্ধিত সম্পাদক ও সাংবাদিকদের প্যানেল অ্যাক্সেসের জন্য সংরক্ষিত।
            </div>

            {loginErr && (
              <div id="login-error-msg" className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 flex items-center gap-1.5 font-semibold">
                ⚠️ {loginErr}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="portal-username" className="text-xs font-bold text-gray-700 font-serif-bengali">ইউজারনেম অথবা ইমেল</label>
              <input
                id="portal-username"
                type="text"
                autoComplete="username"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                placeholder="যেমন: editor_asif অথবা email@domain.com"
                className="border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="portal-password" className="text-xs font-bold text-gray-700 font-serif-bengali">পাসওয়ার্ড</label>
              <input
                id="portal-password"
                type="password"
                autoComplete="current-password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary w-full"
                required
              />
            </div>

            <button 
              type="submit" 
              className="mt-2 bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm font-bold py-3 rounded-lg shadow-md transition-all text-center cursor-pointer hover:shadow-lg"
            >
              নিরাপদ প্রবেশ (Login)
            </button>
          </form>

          <div className="text-center border-t border-gray-100 pt-4">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({}, '', '/');
                  setCurrentUrlPath('/');
                }
              }}
              className="text-xs font-semibold text-gray-500 hover:text-primary transition-colors flex items-center gap-1 justify-center mx-auto cursor-pointer"
            >
              ← মূল সংবাদ মাধ্যমে ফিরে যান
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeArticle = posts.find(p => p.id === activeArticleId);
  const publishedArticles = posts.filter(p => p.status === 'published');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between selection:bg-red-200">
      
      {/* IMMERSIVE READING PROGRESS INDICATOR */}
      {currentPage === 'article' && (
        <div 
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-red-600 to-amber-500 z-[999] transition-all duration-75"
          style={{ width: `${readProgress}%` }}
        />
      )}

      {/* HEADER COMPONENT */}
      <Header
        settings={settings}
        onPageChange={handlePageChange}
        onCatChange={handleCatChange}
        currentPage={currentPage}
        currentCat={currentCat}
        posts={publishedArticles}
      />

      {/* MAIN CONTAINER PLATFORM */}
      <div className="flex-1 max-w-7xl mx-auto px-4 w-full py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* PRIMARY COLUMN */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* A. HOME VIEW */}
            {currentPage === 'home' && (
              <>
                <Hero posts={publishedArticles} onArticleClick={handleArticleClick} />
                
                {/* Categorized Stack Blocks */}
                {['লিড', 'জাতীয়', 'মহানগর', 'বিনোদন', 'রাজনীতি', 'অর্থনীতি', 'আন্তজার্তিক', 'খেলাধূলা', 'জেলা উপজেলা', 'কক্সবাজার', 'পার্বত্য চট্টগ্রাম', 'চাকুরী', 'তথ্য প্রযুক্তি', 'শিক্ষা', 'সম্পাদকীয়', 'উপ-সম্পাদকীয়', 'সারাদেশ', 'স্বাস্থ্য', 'হাসপাতাল', 'সিটি কর্পোরেশন', 'বন্দর', 'প্রেস রিলিজ'].map(cat => {
                  const catPosts = publishedArticles.filter(p => p.categories?.includes(cat) || p.category === cat).slice(0, 3);
                  if (catPosts.length === 0) return null;
                  return (
                    <section key={cat} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center pb-3 border-b-2 border-primary mb-4">
                        <h3 className="font-serif-bengali text-lg sm:text-xl font-extrabold text-primary-dark">{cat}</h3>
                        <button 
                          onClick={() => handleCatChange(cat)}
                          className="text-xs font-bold text-primary hover:text-primary-dark transition-colors border border-primary px-3 py-1.5 rounded hover:bg-red-50/50"
                        >
                          সব খবর →
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {catPosts.map(p => (
                          <NewsCard key={p.id} post={p} onClick={() => handleArticleClick(p.id)} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </>
            )}

            {/* B. CATEGORY VIEW */}
            {currentPage === 'category' && (
              <div className="bg-white p-5 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="bg-gradient-to-r from-primary-dark to-primary text-white p-5 rounded-lg mb-6 shadow-inner">
                  <h2 className="font-serif-bengali text-2xl sm:text-3xl font-extrabold">{currentCat}</h2>
                  <p className="text-xs sm:text-sm text-red-100 mt-1">অপরাধ ঘোষণা জাতীয় সংবাদপত্রের বিশেষ ক্যাটালগ</p>
                </div>
                <div className="flex flex-col gap-1">
                  {publishedArticles.filter(p => p.categories?.includes(currentCat) || p.category === currentCat).length > 0 ? (
                    publishedArticles
                      .filter(p => p.categories?.includes(currentCat) || p.category === currentCat)
                      .map(p => <NewsCard key={p.id} post={p} onClick={() => handleArticleClick(p.id)} variant="list" />)
                  ) : (
                    <div className="text-center py-12 text-gray-400">এই ক্যাটাগরিতে কোনো খবর পাওয়া যায়নি।</div>
                  )}
                </div>
              </div>
            )}

            {/* C. SEARCH RESULTS VIEW */}
            {currentPage === 'search' && (
              <div className="bg-white p-5 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="bg-slate-800 text-white p-5 rounded-lg mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold">অনুসন্ধান ফলাফল: "{searchQuery}"</h2>
                  <p className="text-xs text-slate-300 mt-1">অপরাধ ঘোষণা আর্কাইভে সংগৃহীত সমস্ত ফলাফল</p>
                </div>
                <div className="flex flex-col gap-1">
                  {publishedArticles.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                    publishedArticles
                      .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(p => <NewsCard key={p.id} post={p} onClick={() => handleArticleClick(p.id)} variant="list" />)
                  ) : (
                    <div className="text-center py-12 text-gray-400">আপনার অনুসন্ধানের প্রেক্ষিতে কোনো খবর পাওয়া যায়নি।</div>
                  )}
                </div>
              </div>
            )}

            {/* D. ARTICLE FULL DETAILED READING VIEW */}
            {currentPage === 'article' && activeArticle && (
              <article className="bg-white p-5 sm:p-8 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-5">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <button 
                    onClick={() => handlePageChange('home')}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    <ArrowLeft size={14} /> হোমপেজে ফিরুন
                  </button>
                  <span className="text-[10px] font-bold bg-red-100 text-primary px-2.5 py-1 rounded">
                    {activeArticle.category}
                  </span>
                </div>

                <h1 className="font-serif-bengali text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-snug">
                  {activeArticle.title}
                </h1>

                <div className="flex items-center gap-4 text-xs text-gray-400 font-medium bg-slate-50 p-2.5 rounded-lg border border-gray-100">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-gray-300" />
                    {activeArticle.date}
                  </span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <User size={13} className="text-gray-300" />
                    {activeArticle.author}
                  </span>
                </div>

                <div className="w-full overflow-hidden rounded-lg bg-gray-100 border border-gray-150 relative pb-[56.25%]">
                  <img 
                    src={(activeArticle.image && activeArticle.image.trim()) ? activeArticle.image : `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="100%" height="100%" fill="#7f0000"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="30" fill="white">অপরাধ ঘোষণা</text></svg>`)}`} 
                    alt={activeArticle.title} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>

                {/* MAIN CONTENT TEXT */}
                <div 
                  className="text-gray-800 text-base sm:text-lg leading-relaxed space-y-4 pt-4 border-t border-gray-100"
                  dangerouslySetInnerHTML={{ __html: activeArticle.content || `<p>${activeArticle.excerpt}</p>` }}
                />

                {/* SOCIAL SHARING SUITE */}
                <ShareButtons url={typeof window !== 'undefined' ? window.location.href : ''} title={activeArticle.title} />

                {/* INTERNAL COMMENT MODULE */}
                <CommentsSection articleId={activeArticle.id} />
              </article>
            )}
          </div>

          {/* SECONDARY SIDEBAR COLUMN (WIDGET AD CLUSTERING) */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            
            {/* INLINE BANNER AD */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
              {settings.ads?.sidebar?.enabled && settings.ads?.sidebar?.image ? (
                <a
                  href={settings.ads.sidebar.link || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full overflow-hidden rounded border border-gray-100"
                >
                  <img src={settings.ads.sidebar.image} alt="বিজ্ঞাপন" className="w-full h-auto max-h-[300px] object-cover" />
                </a>
              ) : (
                <div className="bg-gradient-to-br from-red-950 to-primary p-6 rounded-lg text-white">
                  <span className="text-[10px] bg-white/20 text-white font-extrabold px-3 py-1 rounded-full uppercase">বিজ্ঞাপন অফার</span>
                  <h4 className="font-serif-bengali text-lg font-black mt-3">সহজ শর্তে আপনার পোস্ট বা বিজ্ঞাপন দিন</h4>
                  <p className="text-xs text-red-200 mt-2 leading-relaxed">অপরাধ ঘোষণা ও আমাদের জাতীয় সাপ্তাহিক পত্রিকায় বিজ্ঞাপন দিতে আজই আমাদের সাথে যুক্ত হোন।</p>
                  <div className="bg-white/10 p-3 rounded-md mt-4 text-xs font-semibold">
                    যোগাযোগ: {settings.phone1}
                  </div>
                </div>
              )}
            </div>

            {/* RECENTS NEWS LISTS LISTER */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-3">
              <h3 className="font-serif-bengali text-base font-extrabold pb-2 border-b-2 border-primary text-gray-800">সর্বশেষ সংবাদসমগ্র</h3>
              <div className="flex flex-col gap-1">
                {publishedArticles.slice(0, 5).map(p => (
                  <NewsCard key={p.id} post={p} onClick={() => handleArticleClick(p.id)} variant="mini" />
                ))}
              </div>
            </div>

            {/* ATTRACTIVE FEATURED CHANNELS WIDGET */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-3">
              <h3 className="font-serif-bengali text-base font-extrabold pb-2 border-b-2 border-primary text-gray-800">আলোচিত খবর</h3>
              <div className="flex flex-col gap-1">
                {[...publishedArticles].reverse().slice(0, 4).map((p, idx) => (
                  <div 
                    key={p.id}
                    onClick={() => handleArticleClick(p.id)}
                    className="flex gap-3 items-center py-2.5 border-b border-gray-100 last:border-b-0 cursor-pointer group"
                  >
                    <span className="font-black text-2xl text-primary/30 group-hover:text-primary transition-colors pr-1">0{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 leading-tight">{p.title}</h4>
                      <span className="text-[10px] text-gray-400">{p.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* FOOTER METADATA ELEMENT */}
      <Footer
        settings={settings}
        onPageChange={handlePageChange}
        onCatChange={handleCatChange}
      />

      {/* DYNAMIC MODALS MANAGER: 1. AUTH LOGIN */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <form onSubmit={doLogin} className="bg-white w-full max-w-sm p-6 rounded-xl shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-200 flex flex-col gap-4">
            <div className="text-center pb-2 border-b border-gray-100">
              <h3 className="font-serif-bengali text-lg font-bold text-gray-800">সম্পাদকীয় প্যানেল লগইন</h3>
              <p className="text-xs text-gray-500 mt-0.5">ম্যানেজমেন্ট কনসোলে প্রবেশের জন্য অথেন্টিকেট করুন</p>
            </div>
            
            {loginErr && (
              <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded border border-red-200">
                ⚠️ {loginErr}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">ইউজারনেম</label>
              <input
                type="text"
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                placeholder="username"
                className="border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700">পাসওয়ার্ড</label>
              <input
                type="password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                placeholder="password"
                className="border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2.5 mt-2">
              <button 
                type="button" 
                onClick={() => setIsLoginModalOpen(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold py-2.5 rounded transition-colors text-center"
              >
                বাতিল
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary-dark text-white text-xs font-bold py-2.5 rounded shadow-sm transition-colors text-center"
              >
                প্রবেশ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DYNAMIC MODALS MANAGER: 2. BACKEND ADMIN SYSTEM BOARD */}
      {isAdminPanelOpen && currentUser && (
        <AdminPanel
          onClose={handleLogout}
          onLogout={handleAdminLogout}
          loggedInUser={currentUser}
        />
      )}
    </div>
  );
}
