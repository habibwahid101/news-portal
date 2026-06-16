export interface Profile {
  id: string; // matches auth.users.id
  name: string;
  username: string;
  password?: string;
  email: string | null;
  role: 'admin' | 'editor' | 'reporter' | 'user';
  active: boolean;
  created_at?: string;
}

export interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  category: string; // legacy field for single-category displays (corresponds to first item)
  categories: string[]; // multi-category support
  authorId: number | string;
  author: string;
  image: string | null;
  status: 'published' | 'draft';
  featured: boolean;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Comment {
  id: number;
  articleId: number;
  profileId?: string;
  name: string;
  email: string;
  content: string;
  status: 'approved' | 'pending' | 'spam';
  created_at: string;
}

export interface Bookmark {
  id: number;
  profileId: string;
  articleId: number;
  created_at: string;
}

export interface Advertisement {
  name: string;
  image: string;
  link: string;
  enabled: boolean;
}

export interface AdSystem {
  header: Advertisement;
  sidebar: Advertisement;
  mid: Advertisement;
}

export interface EpaperSettings {
  enabled: boolean;
  url: string;
  label: string;
}

export interface Settings {
  siteName: string;
  tagline: string;
  regNo: string;
  editorName: string;
  execEditor: string;
  specialRep: string;
  phone1: string;
  phone2: string;
  phone3: string;
  email: string;
  breakingNews: string;
  ads: {
    header: Advertisement;
    sidebar: Advertisement;
    mid: Advertisement;
  };
  epaper: {
    enabled: boolean;
    url: string;
    label: string;
  };
}
