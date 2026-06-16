import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Article, Category, Profile, Settings, Comment, Profile as AppUser } from '../types';

// Safe proxy to shadow the global localStorage property for sandboxed browser compatibility
const memoryStorage: Record<string, string> = {};
const localStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('LocalStorage is blocked or not available:', e);
    }
    return memoryStorage[key] || null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn('LocalStorage setItem is blocked or not available:', e);
    }
    memoryStorage[key] = value;
  }
};

// 1. LAZY INITIALIZATION FOR SUPABASE (Prevents crash if environment variables are missing)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export let supabase: SupabaseClient | null = null;
let isCloudDB = false;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    isCloudDB = true;
    console.log('☁️ Supabase Cloud Database initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Supabase, falling back to local database:', err);
  }
} else {
  console.log('📦 Supabase environment variables missing. Operating in LocalStorage Fallback mode.');
}

export function isUsingCloud(): boolean {
  return isCloudDB;
}

// 2. MOCK / LOCALSTORAGE DATABASE FOR PREVIEW
// Pre-seeded Bengali articles matching the editorial branding exactly
const DEFAULT_POSTS: Article[] = [
  {
    id: 1,
    title: 'চট্টগ্রামে ডাকাতি চক্রের মূলহোতাসহ সাতজন গ্রেপ্তার, উদ্ধার কোটি টাকার মালামাল',
    excerpt: 'র‌্যাব-৭ এর বিশেষ অভিযানে চট্টগ্রামের কুখ্যাত ডাকাতি চক্রের মূলহোতাসহ সাতজনকে গ্রেপ্তার। অস্ত্র, স্বর্ণালংকার ও কোটি টাকার নগদ অর্থ উদ্ধার।',
    content: '<p>র‌্যাব-৭ এর বিশেষ অভিযানে চট্টগ্রামের কুখ্যাত ডাকাতি চক্রের মূলহোতাসহ সাতজনকে গ্রেপ্তার করা হয়েছে। তাদের কাছ से উদ্ধার করা হয়েছে বিপুল পরিমাণ অস্ত্র, স্বর্ণালংকার ও কোটি টাকার নগদ অর্থ।</p><p>র‌্যাব-৭ এর অধিনায়ক জানান, দীর্ঘ তিন মাসের নিরলস তদন্ত ও অভিযানের পর এই ভয়ংকর চক্রটিকে নির্মূল করা সম্ভব হয়েছে।</p>',
    category: 'লিড',
    categories: ['লিড'],
    authorId: 1,
    author: 'এম নুরুল কবির',
    image: null,
    status: 'published',
    featured: true,
    date: '১১ মে ২০২৬'
  },
  {
    id: 2,
    title: 'পুলিশের উপর হামলা: চট্টগ্রামে সন্ত্রাসী গোষ্ঠীর তিন সদস্য আটক',
    excerpt: 'চট্টগ্রাম নগরীর বাকলিয়া এলাকায় টহলরত police সদস্যদের উপর বোমা ও ধারালো অস্ত্র নিয়ে হামলা। পরবর্তী অভিযানে তিনজনকে আটক, অস্ত্র জব্দ।',
    content: '<p>চট্টগ্রাম নগরীর বাকলিয়া এলাকায় পুলিশ সদস্যদের উপর হামলা চালায় সন্ত্রাসীরা। পরবর্তী অভিযানে তিনজনকে আটক করা হয়।</p>',
    category: 'লিড',
    categories: ['লিড', 'মহানগর'],
    authorId: 2,
    author: 'মোঃ গাজী মোরশেদুল আলম',
    image: null,
    status: 'published',
    featured: true,
    date: '১০ মে ২০২৬'
  },
  {
    id: 3,
    title: 'সাইবার প্রতারণায় বিশ কোটি টাকা হাতিয়ে নেওয়া চক্রের পাঁচ সদস্য গ্রেপ্তার',
    excerpt: 'ঢাকা ও চট্টগ্রামে একযোগে সিআইডির অভিযানে সাইবার প্রতারণায় বিশ কোটি টাকা হাতিয়ে নেওয়া সংঘবদ্ধ চক্রের পাঁচ সদস্যকে গ্রেপ্তার।',
    content: '<p>সিআইডির সাইবার পুলিশ সেন্টার একযোগে অভিযান চালিয়ে প্রতারণা চক্রকে গ্রেপ্তার করেছে।</p>',
    category: 'লিড',
    categories: ['লিড'],
    authorId: 3,
    author: 'জিয়াউল হক',
    image: null,
    status: 'published',
    featured: true,
    date: '০৯ মে ২০২৬'
  },
  {
    id: 4,
    title: 'সিটি কর্পোরেশনের ঠিকাদারের বিরুদ্ধে কোটি টাকার দুর্নীতি',
    excerpt: 'চট্টগ্রাম সিটি কর্পোরেশনের উন্নয়ন প্রকল্পে অনিয়ম ও দুর্নীতির অভিযোগ।',
    content: '<p>সিটি কর্পোরেশনের রাস্তা সংস্কার প্রকল্পে দুর্নীতির অভিযোগ উঠেছে। দুদক তদন্ত।</p>',
    category: 'সিটি কর্পোরেশন',
    categories: ['সিটি কর্পোরেশন'],
    authorId: 2,
    author: 'মোঃ গাজী মোরশেদুল আলম',
    image: null,
    status: 'published',
    featured: false,
    date: '১১ মে ২০২৬'
  },
  {
    id: 5,
    title: 'চট্টগ্রাম বন্দরে পাঁচ কোটি টাকার চোরাচালান আটক',
    excerpt: 'চট্টগ্রাম বন্দরের ১২নং বার্থে কনটেইনার থেকে পাঁচ কোটি টাকার অবৈধ পণ্য, মদ ও মাদক উদ্ধার। কাস্টমস কর্মকর্তা বরখাস্ত।',
    content: '<p>কাস্টমস গোয়েন্দা দল পাঁচ কোটি টাকার অবৈধ পণ্য উদ্ধার করেছে।</p>',
    category: 'বন্দর',
    categories: ['বন্দর'],
    authorId: 3,
    author: 'জিয়াউল হক',
    image: null,
    status: 'published',
    featured: false,
    date: '১১ মে ২০২৬'
  },
  {
    id: 6,
    title: 'চট্টগ্রাম মেডিকেলে ভুয়া চিকিৎসক আটক',
    excerpt: 'ভুয়া পরিচয়ে দুই বছর ধরে রোগীদের সাথে প্রতারণার অভিযোগে শামসুল আলম (৪২) কে আটক।',
    content: '<p>চট্টগ্রাম মেডিকেল কলেজ হাসপাতালে ভুয়া চিকিৎসক আটক হয়েছে।</p>',
    category: 'হাসপাতাল',
    categories: ['হাসপাতাল'],
    authorId: 1,
    author: 'এম নুরুল কবির',
    image: null,
    status: 'published',
    featured: false,
    date: '১০ মে ২০২৬'
  },
  {
    id: 7,
    title: 'আগ্রাবাদে ব্যবসায়ীকে অপহরণ, কোটি টাকা মুক্তিপণ দাবি',
    excerpt: 'আগ্রাবাদ থেকে পোশাক ব্যবসায়ী রেজাউল করিম (৪৮) কে অপহরণ করে এক কোটি টাকা মুক্তিপণ দাবি। পুলিশের তীব্র অভিযান চলছে।',
    content: '<p>অপহৃতাকে উদ্ধারে পুলিশের অভিযান চলছে।</p>',
    category: 'মহানগর',
    categories: ['মহানগর'],
    authorId: 3,
    author: 'জিয়াউল হক',
    image: null,
    status: 'published',
    featured: false,
    date: '১১ মে ২০২৬'
  },
  {
    id: 8,
    title: 'হাটহাজারীতে ইয়াবা কারবারির গুদাম উদ্ধার',
    excerpt: 'হাটহাজারীতে গোপন তথ্যের ভিত্তিতে অভিযান চালিয়ে গুদামঘর থেকে ৫০ লাখ টাকার ইয়াবা ও ফেনসিডিল উদ্ধার। মূলহোতাসহ তিনজন গ্রেপ্তার।',
    content: '<p>পুলিশ বিপুল মাদক সামগ্রী জব্দ করেছে।</p>',
    category: 'জেলা উপজেলা',
    categories: ['জেলা উপজেলা'],
    authorId: 2,
    author: 'মোঃ গাজী মোরশেদুল আলম',
    image: null,
    status: 'published',
    featured: false,
    date: '০৮ মে ২০২৬'
  },
  {
    id: 9,
    title: 'চট্টগ্রাম পুলিশের প্রেস ব্রিফিং: এপ্রিলে রেকর্ড ২৬৮টি মামলা নিষ্পত্তি',
    excerpt: 'মাসিক প্রেস ব্রিফিংয়ে জানানো হয়, এপ্রিলে রেকর্ড ২৬৮টি মামলা নিষ্পত্তি — বিগত ৫ বছরে সর্বোচ্চ।',
    content: '<p>আইনশৃঙ্খলা পরিস্থিতি নিয়ন্ত্রণে পুলিশ প্রশাসনের সাফল্য।</p>',
    category: 'প্রেস রিলিজ',
    categories: ['প্রেস রিলিজ'],
    authorId: 1,
    author: 'এম নুরুল কবির',
    image: null,
    status: 'published',
    featured: false,
    date: '০৭ মে ২০২৬'
  }
];

const DEFAULT_USERS: Profile[] = [
  { id: '1', name: 'এম নুরুল কবির', username: 'admin', password: 'admin321', email: 'editor@aporadhghoshona.com', role: 'admin', active: true },
  { id: '2', name: 'মোঃ গাজী মোরশেদুল আলম', username: 'editor', password: 'editor123', email: 'exec@aporadhghoshona.com', role: 'editor', active: true },
  { id: '3', name: 'জিয়াউল হক', username: 'reporter1', password: 'reporter123', email: 'reporter@aporadhghoshona.com', role: 'reporter', active: true }
];

const DEFAULT_SETTINGS: Settings = {
  siteName: 'অপরাধ ঘোষণা',
  tagline: 'সত্যের পথে, ন্যায়ের সাথে',
  regNo: '২৫২',
  editorName: 'এম নুরুল কবির',
  execEditor: 'মোঃ গাজী মোরশেদুল আলম',
  specialRep: 'জিয়াউল হক',
  phone1: '০১৭৭৮-৮১১১১১',
  phone2: '০১৬৩৩-১২৫২৫০',
  phone3: '০১৮১২৫৭৩৫৪৬',
  email: 'aporadhghoshona@gmail.com',
  breakingNews: 'চট্টগ্রামে ডাকাতি চক্রের মূলহোতাসহ সাতজন গ্রেপ্তার, উদ্ধার কোটি টাকার মালামাল। আগ্রাবাদে অপহৃত পোশাক ব্যবসায়ীকে উদ্ধার করল পুলিশ।',
  ads: {
    header: { name: 'হেডার', image: '', link: '', enabled: false },
    sidebar: { name: 'সাইডবার', image: '', link: '', enabled: false },
    mid: { name: 'মিড-কন্টেন্ট', image: '', link: '', enabled: false }
  },
  epaper: {
    enabled: false,
    url: '',
    label: 'সর্বশেষ সংখ্যা'
  }
};

const STORAGE_KEYS = {
  POSTS: 'aporadh_posts_v1',
  USERS: 'aporadh_users_v1',
  SETTINGS: 'aporadh_settings_v1',
  COMMENTS: 'aporadh_comments_v1'
};

// Initialize localStorage if unseeded
function initLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(DEFAULT_POSTS));
  }
  const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!savedUsers) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  } else {
    try {
      const users: Profile[] = JSON.parse(savedUsers);
      let updated = false;
      const revised = users.map(u => {
        if (u.username === 'admin') {
          if (!u.password || u.password === 'admin123') {
            u.password = 'admin321';
            updated = true;
          }
        } else if (u.username === 'editor' && !u.password) {
          u.password = 'editor123';
          updated = true;
        } else if (u.username === 'reporter1' && !u.password) {
          u.password = 'reporter123';
          updated = true;
        }
        return u;
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(revised));
      }
    } catch (e) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify([]));
  }
}
initLocalStorage();

// 3. UNIFIED DB SERVICE CONTROLLER (Falls back automatically, completely bulletproof)
export const DBService = {
  // --- USER PROFILES / WORKERS CONTROL ---
  async getUsers(): Promise<Profile[]> {
    if (isCloudDB && supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) return data as Profile[];
    }
    const lu = localStorage.getItem(STORAGE_KEYS.USERS);
    return lu ? JSON.parse(lu) : DEFAULT_USERS;
  },

  async saveUser(user: Profile): Promise<Profile> {
    if (isCloudDB && supabase) {
      const { data, error } = await supabase.from('profiles').upsert(user).select().single();
      if (error) {
        throw new Error('Supabase save failed: ' + error.message);
      }
      if (data) {
        user = data as Profile;
      }
    }
    const users = await this.getUsers();
    if (user.id) {
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...user };
      } else {
        users.push(user);
      }
    } else {
      user.id = String(Date.now());
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return user;
  },

  async deleteUser(id: string): Promise<boolean> {
    if (isCloudDB && supabase) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        throw new Error('Supabase delete failed: ' + error.message);
      }
    }
    const users = await this.getUsers();
    const updated = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    return true;
  },

  // --- ARTICLES CONTROL ---
  async getArticles(): Promise<Article[]> {
    if (isCloudDB && supabase) {
      const { data, error } = await supabase.from('posts').select('*').order('id', { ascending: false });
      if (!error && data) {
        return data.map((r: any) => {
          let cats = [];
          try {
            cats = r.categories_json ? JSON.parse(r.categories_json) : [r.category || ''];
          } catch (e) {
            cats = [r.category || ''];
          }
          return {
            id: r.id,
            title: r.title,
            excerpt: r.excerpt || '',
            content: r.content || '',
            category: r.category || cats[0] || 'লিড',
            categories: cats.length > 0 ? cats : ['লিড'],
            authorId: r.author_id || 1,
            author: r.author_name || 'এম নুরুল কবির',
            image: r.image_url || null,
            status: r.status as 'published' | 'draft',
            featured: !!r.featured,
            date: r.published_date || '১০ মে ২০২৬'
          };
        });
      }
    }
    const lp = localStorage.getItem(STORAGE_KEYS.POSTS);
    return lp ? JSON.parse(lp) : DEFAULT_POSTS;
  },

  async saveArticle(article: Partial<Article>): Promise<Article> {
    const defaultAuthor = DEFAULT_USERS[0];
    const item: Partial<Article> = {
      title: article.title || 'শিরোনামহীন সংবাদ',
      excerpt: article.excerpt || '',
      content: article.content || '',
      category: article.categories && article.categories.length > 0 ? article.categories[0] : (article.category || 'লিড'),
      categories: article.categories || [article.category || 'লিড'],
      authorId: article.authorId || defaultAuthor.id,
      author: article.author || defaultAuthor.name,
      image: article.image || null,
      status: article.status || 'published',
      featured: !!article.featured,
      date: article.date || new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    if (isCloudDB && supabase) {
      const dbRow = {
        title: item.title,
        excerpt: item.excerpt,
        content: item.content,
        category: item.category,
        categories_json: JSON.stringify(item.categories),
        author_id: typeof item.authorId === 'number' ? item.authorId : null,
        author_name: item.author,
        image_url: item.image,
        status: item.status,
        featured: item.featured,
        published_date: item.date
      };

      if (article.id) {
        const { data, error } = await supabase.from('posts').update(dbRow).eq('id', article.id).select().single();
        if (!error && data) return article as Article;
        if (error) console.error('Cloud Article Save Error:', error.message);
      } else {
        const { data, error } = await supabase.from('posts').insert(dbRow).select().single();
        if (!error && data) return { ...item, id: data.id } as Article;
        if (error) console.error('Cloud Article Insert Error:', error.message);
      }
    }

    // Local Fallback
    const posts = await this.getArticles();
    if (article.id) {
      const idx = posts.findIndex(p => p.id === article.id);
      if (idx !== -1) {
        posts[idx] = { ...posts[idx], ...item } as Article;
      }
    } else {
      const nextId = posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1;
      const newPost = { ...item, id: nextId } as Article;
      posts.unshift(newPost);
      article.id = nextId;
    }
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return article as Article;
  },

  async deleteArticle(id: number): Promise<boolean> {
    if (isCloudDB && supabase) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (!error) return true;
    }
    const posts = await this.getArticles();
    const updated = posts.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(updated));
    return true;
  },

  // --- COMMENTS MANAGEMENT ---
  async getComments(articleId?: number): Promise<Comment[]> {
    if (isCloudDB && supabase) {
      let query = supabase.from('comments').select('*');
      if (articleId !== undefined) {
        query = query.eq('article_id', articleId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.map((c: any) => ({
          id: c.id,
          articleId: c.article_id,
          profileId: c.profile_id,
          name: c.name,
          email: c.email,
          content: c.content,
          status: c.status,
          created_at: c.created_at
        }));
      }
    }
    const lc = localStorage.getItem(STORAGE_KEYS.COMMENTS);
    const commentsList: Comment[] = lc ? JSON.parse(lc) : [];
    if (articleId !== undefined) {
      return commentsList.filter(c => c.articleId === articleId);
    }
    return commentsList;
  },

  async saveComment(comment: Partial<Comment>): Promise<Comment> {
    const item: Comment = {
      id: comment.id || Date.now(),
      articleId: comment.articleId || 0,
      profileId: comment.profileId,
      name: comment.name || 'অজ্ঞাত',
      email: comment.email || '',
      content: comment.content || '',
      status: comment.status || 'approved',
      created_at: comment.created_at || new Date().toISOString()
    };

    if (isCloudDB && supabase) {
      const dbRow = {
        article_id: item.articleId,
        profile_id: item.profileId || null,
        name: item.name,
        email: item.email,
        content: item.content,
        status: item.status
      };
      const { data, error } = await supabase.from('comments').insert(dbRow).select().single();
      if (!error && data) {
        return { ...item, id: data.id };
      }
    }

    const comments = await this.getComments();
    comments.unshift(item);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    return item;
  },

  // --- SETTINGS CONTROL ---
  async getSettings(): Promise<Settings> {
    if (isCloudDB && supabase) {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (!error && data) {
        let ads = { header: { name: '헤ডার', image: '', link: '', enabled: false }, sidebar: { name: 'সাইডবার', image: '', link: '', enabled: false }, mid: { name: 'מיড-কন্টেন্ট', image: '', link: '', enabled: false } };
        try { if (data.ads_json) ads = JSON.parse(data.ads_json); } catch (e) {}
        let epaper = { enabled: false, url: '', label: 'সর্বশেষ সংখ্যা' };
        try { if (data.epaper_json) epaper = JSON.parse(data.epaper_json); } catch (e) {}
        return {
          siteName: data.site_name,
          tagline: data.tagline,
          regNo: data.reg_no,
          editorName: data.editor_name,
          execEditor: data.exec_editor,
          specialRep: data.special_rep,
          phone1: data.phone1,
          phone2: data.phone2,
          phone3: data.phone3,
          email: data.email,
          breakingNews: data.breaking_news,
          ads,
          epaper
        };
      }
    }
    const ls = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return ls ? JSON.parse(ls) : DEFAULT_SETTINGS;
  },

  async saveSettings(settings: Settings): Promise<boolean> {
    if (isCloudDB && supabase) {
      const dbRow = {
        site_name: settings.siteName,
        tagline: settings.tagline,
        reg_no: settings.regNo,
        editor_name: settings.editorName,
        exec_editor: settings.execEditor,
        special_rep: settings.specialRep,
        phone1: settings.phone1,
        phone2: settings.phone2,
        phone3: settings.phone3,
        email: settings.email,
        breaking_news: settings.breakingNews,
        ads_json: JSON.stringify(settings.ads),
        epaper_json: JSON.stringify(settings.epaper)
      };
      const { error } = await supabase.from('settings').update(dbRow).eq('id', 1);
      if (!error) return true;
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  }
};
