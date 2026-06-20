import React from 'react';
import { Calendar, User, Eye } from 'lucide-react';
import { Article } from '../types';

interface NewsCardProps {
  post: Article;
  onClick: () => void;
  variant?: 'grid' | 'list' | 'mini';
}

export const NewsCard: React.FC<NewsCardProps> = ({ post, onClick, variant = 'grid' }) => {
  const defaultImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#999">অপরাধ ঘোষণা</text></svg>`
  )}`;

  const imgUrl = post.image && post.image.trim() !== '' ? post.image : defaultImage;

  if (variant === 'list') {
    return (
      <div 
        onClick={onClick}
        className="flex flex-col sm:flex-row gap-4 py-4 border-b border-gray-100 last:border-b-0 cursor-pointer group hover:bg-gray-50/50 p-2 rounded-lg transition-all duration-150"
      >
        <div className="w-full sm:w-44 h-32 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 border border-gray-100 relative">
          <img 
            src={imgUrl} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h3 className="font-serif-bengali text-lg font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
              {post.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 mt-1.5 leading-relaxed hidden sm:block">
              {post.excerpt}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-2 font-medium">
            <span className="flex items-center gap-1">
              <Calendar size={12} className="text-gray-300" />
              {post.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <User size={12} className="text-gray-300" />
              {post.author}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'mini') {
    return (
      <div 
        onClick={onClick}
        className="flex gap-3 py-3 border-b border-gray-100 last:border-none cursor-pointer group hover:pl-1 transition-all duration-150"
      >
        <div className="w-20 h-16 flex-shrink-0 overflow-hidden rounded bg-gray-100 border border-gray-100">
          <img 
            src={imgUrl} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-serif-bengali text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h4>
          <div className="text-[10px] text-gray-400 mt-1">{post.date}</div>
        </div>
      </div>
    );
  }

  // DEFAULT GRID PORTRAIT CARD
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow group flex flex-row md:flex-col justify-between"
    >
      {/* Image — left on mobile, top on desktop */}
      <div className="w-28 flex-shrink-0 md:w-full overflow-hidden relative md:pb-[56.25%] bg-gray-100 border-r-2 md:border-r-0 md:border-b-2 border-primary">
        <img 
          src={imgUrl} 
          alt={post.title} 
          className="w-full h-full md:absolute md:inset-0 object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      {/* Text — right on mobile, below on desktop */}
      <div className="p-3 md:p-4 flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-serif-bengali text-sm md:text-lg font-bold text-gray-900 line-clamp-3 leading-snug group-hover:text-primary transition-colors duration-150">
            {post.title}
          </h3>
          <p className="hidden md:block text-xs sm:text-sm text-gray-500 line-clamp-2 mt-2 leading-relaxed">
            {post.excerpt}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-2 md:mt-4 md:pt-3 md:border-t md:border-gray-100">
          <span className="flex items-center gap-1 font-medium">
            <Calendar size={11} className="text-gray-300" />
            {post.date}
          </span>
          <span className="text-gray-200 hidden md:inline">•</span>
          <span className="hidden md:flex items-center gap-1 font-medium">
            <User size={11} className="text-gray-300" />
            {post.author}
          </span>
        </div>
      </div>
    </div>
  );
};
