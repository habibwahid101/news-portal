import React from 'react';
import { Calendar, User } from 'lucide-react';
import { Article } from '../types';

interface HeroProps {
  posts: Article[];
  onArticleClick: (id: number) => void;
}

export const Hero: React.FC<HeroProps> = ({ posts, onArticleClick }) => {
  const published = posts.filter(p => p.status === 'published');
  const featured = published.filter(p => p.featured);
  
  // Use featured as priority; fall back to general latest news
  const main = featured[0] || published[0];
  const sideList = featured.length > 1 ? featured.slice(1, 3) : published.filter(p => p.id !== main?.id).slice(0, 2);

  const defaultImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="100%" height="100%" fill="#7f0000"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="30" fill="white">অপরাধ ঘোষণা</text></svg>`
  )}`;

  const mainImg = main?.image && main.image.trim() !== '' ? main.image : defaultImage;

  if (!main) {
    return (
      <div className="w-full h-44 bg-gray-50 flex items-center justify-center rounded-lg border border-dashed border-gray-200">
        <p className="text-gray-400 font-medium">কোনো সংবাদ পাওয়া যায়নি।</p>
      </div>
    );
  }

  return (
    <div id="hero-grid-el" className="grid grid-cols-1 lg:grid-cols-3 gap-1 bg-gray-200 rounded-lg overflow-hidden border border-gray-200 shadow-sm mb-6">
      {/* 1. CORE HEADLINE HERO (Two-Thirds width) */}
      <div 
        onClick={() => onArticleClick(main.id)}
        className="lg:col-span-2 relative h-[300px] sm:h-[400px] overflow-hidden group cursor-pointer"
      >
        <img 
          src={mainImg} 
          alt={main.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-5 sm:p-8">
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {(main.categories || [main.category]).map(cat => (
              <span key={cat} className="bg-primary text-white text-xs font-bold px-3 py-1 rounded">
                {cat}
              </span>
            ))}
          </div>
          <h2 className="font-serif-bengali text-2xl sm:text-3xl lg:text-4xl text-white font-extrabold leading-snug tracking-tight text-shadow-md group-hover:text-amber-200 transition-colors duration-150">
            {main.title}
          </h2>
          <div className="flex items-center gap-3 text-xs text-gray-300 mt-3 pt-3 border-t border-white/10 w-fit">
            <span className="flex items-center gap-1 font-medium">
              <Calendar size={12} />
              {main.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium">
              <User size={12} />
              {main.author}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SIDE HERO BAR (One-Third width, dual stacking) */}
      <div className="lg:col-span-1 flex flex-col gap-1">
        {sideList.map(side => {
          const sideImg = side.image && side.image.trim() !== '' ? side.image : defaultImage;
          return (
            <div 
              key={side.id}
              onClick={() => onArticleClick(side.id)}
              className="flex-1 relative h-[150px] sm:h-[199px] overflow-hidden group cursor-pointer"
            >
              <img 
                src={sideImg} 
                alt={side.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4">
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {(side.categories || [side.category]).map(cat => (
                    <span key={cat} className="bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded">
                      {cat}
                    </span>
                  ))}
                </div>
                <h3 className="font-serif-bengali text-sm sm:text-base text-white font-bold leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors duration-150">
                  {side.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
