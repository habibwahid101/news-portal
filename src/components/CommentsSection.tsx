import React, { useEffect, useState } from 'react';
import { Send, User, MessageSquare } from 'lucide-react';
import { Comment } from '../types';
import { DBService } from '../services/db';

const esc = (s: string) => s;

interface CommentsSectionProps {
  articleId: number;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ articleId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      const liveComments = await DBService.getComments(articleId);
      setComments(liveComments);
    };
    fetchComments();
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      setAlert({ type: 'err', text: 'নাম এবং মন্তব্য দুটোই পূরণ করা আবশ্যক।' });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      const newComment = await DBService.saveComment({
        articleId,
        name: name.trim(),
        email: email.trim(),
        content: content.trim(),
        status: 'approved' // Auto approved for direct visual feedback in prototype/applet
      });

      setComments(prev => [newComment, ...prev]);
      setName('');
      setEmail('');
      setContent('');
      setAlert({ type: 'success', text: '✅ আপনার মন্তব্যটি সফলভাবে প্রকাশিত হয়েছে!' });
    } catch (err: any) {
      setAlert({ type: 'err', text: 'দুঃখিত, মন্তব্য প্রকাশ করা সম্ভব হয়নি। আবার চেষ্টা করুন।' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  return (
    <div id="comments-section" className="mt-8 pt-8 border-t border-gray-100 font-bengali-sans">
      <h3 className="font-serif-bengali text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2">
        <MessageSquare className="text-primary" size={24} />
        পাঠকের মন্তব্য ({comments.length})
      </h3>

      {/* COMMENTING FORM */}
      <form onSubmit={handleSubmit} className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 mb-8">
        <h4 className="text-sm font-bold text-gray-800 mb-3">মন্তব্য লিখুন</h4>
        {alert && (
          <div className={`p-3 rounded text-xs ms-2 mb-3 ${alert.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {alert.text}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">আপনার নাম *</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="নাম লিখুন"
              className="bg-white border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">ইমেইল ঠিকানা</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ইমেইল লিখুন"
              className="bg-white border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-xs font-semibold text-gray-600">মন্তব্য *</label>
          <textarea 
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            placeholder="আপনার মতামত প্রকাশ করুন..."
            className="bg-white border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-y"
          ></textarea>
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2.5 rounded transition-all duration-150 ml-auto disabled:opacity-50"
        >
          <Send size={12} />
          {isSubmitting ? 'পাঠানো হচ্ছে...' : 'মন্তব্য সাবমিট করুন'}
        </button>
      </form>

      {/* COMMENTS LIST */}
      <div className="flex flex-col gap-4">
        {comments.length > 0 ? (
          comments.map(c => (
            <div key={c.id} className="flex gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-red-50 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                <User size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 text-sm">{esc(c.name)}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(c.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mt-1.5 leading-relaxed bg-gray-50/30 p-2.5 rounded-md border-l-2 border-primary">
                  {esc(c.content)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">
            এখনো কেউ মন্তব্য করেনি। প্রথম মন্তব্যকারী হোন!
          </div>
        )}
      </div>
    </div>
  );
};
