import React, { useState } from 'react';
import { Share2, Facebook, MessageSquare, Link, Check } from 'lucide-react';

interface ShareButtonsProps {
  url?: string;
  title?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ url, title }) => {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = url || window.location.href;
  const shareTitle = title || document.title;
  
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl
        });
      } catch (err) {
        console.log('Error sharing via native API:', err);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  // Safe checks for SSR or non-browser environments
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="flex flex-col gap-2 mt-4 pb-4 border-b border-gray-100">
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider font-sans">📢 সংবাদটি শেয়ার করুন:</span>
      <div className="flex flex-wrap items-center gap-2">
        {/* Native mobile share if supported */}
        {hasNativeShare && (
          <button
            onClick={handleNativeShare}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-2 rounded-lg transition-all border border-rose-100 cursor-pointer"
          >
            <Share2 size={14} />
            শেয়ার করুন
          </button>
        )}

        {/* Facebook Sharing */}
        <a
          href={facebookHref}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all border border-blue-100 cursor-pointer"
        >
          <Facebook size={14} />
          ফেইসবুক
        </a>

        {/* WhatsApp Sharing */}
        <a
          href={whatsappHref}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all border border-green-100 cursor-pointer"
        >
          <MessageSquare size={14} />
          হোয়াটসঅ্যাপ
        </a>

        {/* "Copy Link to Clipboard" */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all border border-slate-200 cursor-pointer"
        >
          {copied ? <Check size={14} className="text-green-600 animate-bounce" /> : <Link size={14} />}
          {copied ? 'কপি হয়েছে!' : 'লিংক কপি'}
        </button>
      </div>
    </div>
  );
};
