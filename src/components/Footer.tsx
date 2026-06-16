import React from 'react';
import { Settings } from '../types';

interface FooterProps {
  settings: Settings;
  onPageChange: (page: string) => void;
  onCatChange: (cat: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onPageChange, onCatChange }) => {
  const currentYear = new Date().getFullYear();
  const categories = ['লিড', 'সিটি কর্পোরেশন', 'বন্দর', 'হাসপাতাল', 'মহানগর', 'জেলা উপজেলা', 'প্রেস রিলিজ'];

  return (
    <footer id="footer-root" className="bg-[#111111] text-gray-300 font-bengali-sans border-t-4 border-primary mt-12">
      {/* 1. UPPER FOOTER */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* BRAND & DESCRIPTION COLUMN */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="cursor-pointer" onClick={() => onPageChange('home')}>
            <h2 className="font-serif-bengali text-3xl font-black text-white hover:text-primary transition-colors">
              অপরাধ ঘোষণা
            </h2>
            <span className="text-[10px] tracking-widest text-[#ef5350] bg-red-950 px-2.5 py-0.5 rounded-full font-bold uppercase mt-1 inline-block">
              জাতীয় সাপ্তাহিক
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed max-w-md">
            অপরাধ ঘোষণা একটি জাতীয় সাপ্তাহিক পত্রিকা (রেজিস্ট্রেশন নং: ২৫২)। এটি এম নুরুল কবির এর সম্পাদনা ও প্রকাশনায় প্রকাশিত হয় এবং সত্যের পথে ও ন্যায়ের সাথে থেকে অপরাধ সংক্রান্ত বস্তুনিষ্ঠ সংবাদ প্রকাশ করতে অঙ্গীকারবদ্ধ।
          </p>
          <div className="flex gap-3 text-xs mt-2 text-gray-400">
            <span className="bg-[#1a1a1a] px-3 py-1.5 rounded border border-gray-800">
              <strong>রেজিস্ট্রেশন:</strong> {settings.regNo || '২৫২'}
            </span>
            <span className="bg-[#1a1a1a] px-3 py-1.5 rounded border border-gray-800">
              <strong>সম্পাদক ও প্রকাশক:</strong> {settings.editorName}
            </span>
          </div>
        </div>

        {/* QUICK NAVIGATION COLUMN */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <h4 className="text-base text-white font-bold pb-2 border-b-2 border-primary w-fit">
            সংবাদ বিভাগসমূহ
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => onCatChange(cat)}
                className="text-left py-1 text-gray-400 hover:text-white transition-colors duration-150"
              >
                • {cat}
              </button>
            ))}
          </div>
        </div>

        {/* PUBLISHER & EDITORS COLUMN */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h4 className="text-base text-white font-bold pb-2 border-b-2 border-primary w-fit">
            সম্পাদকীয় ও কার্যালয়
          </h4>
          <div className="text-sm flex flex-col gap-2.5 leading-relaxed text-gray-400">
            <div>
              <strong className="text-white">সম্পাদক ও প্রকাশক:</strong> {settings.editorName || 'এম নুরুল কবির'}<br />
              <strong className="text-white">নির্বাহী সম্পাদক:</strong> {settings.execEditor || 'মোঃ গাজী মোরশেদুল আলম'}<br />
              <strong className="text-white">বিশেষ প্রতিনিধি:</strong> {settings.specialRep || 'জিয়াউল হক'}
            </div>
            
            <div className="mt-2 text-xs border-t border-gray-800 pt-3">
              <strong className="text-gray-200">ঢাকা অফিস:</strong> মনিসিংহ ফরহাদ ভবন (নীচ তলা), ২১/২ পুরানা পল্টন, ঢাকা-১০০০
            </div>
            <div className="text-xs">
              <strong className="text-gray-200">চট্টগ্রাম অফিস (অস্থায়ী):</strong> ৩২১, দিদার মার্কেট (৪র্থ তলা), নবাব সিরাজউদ্দৌলা রোড, কোতোয়ালি, চট্টগ্রাম
            </div>
            <div className="text-xs">
              <strong>ফোন:</strong> {settings.phone1 || '০১৭৭৮-৮১১১১১'}, {settings.phone2}, {settings.phone3}<br />
              <strong>ইমেইল:</strong> <a href={`mailto:${settings.email}`} className="text-[#ffebee] hover:underline">{settings.email}</a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LOWER BOTTOM FOOTER */}
      <div className="bg-[#0c0c0c] text-center py-4 px-4 text-xs sm:text-sm text-gray-500 border-t border-gray-900 leading-6">
        © {currentYear} অপরাধ ঘোষণা। সর্বস্বত্ব সংরক্ষিত। | রেজিস্ট্রেশন নং: {settings.regNo || '২৫২'} | সম্পাদক ও প্রকাশক: {settings.editorName || 'এম নুরুল কবির'}
      </div>
    </footer>
  );
};
