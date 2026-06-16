import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, Settings as GearIcon, Users, Megaphone, 
  BookOpen, Plus, Search, Edit3, Trash2, ShieldAlert, CheckCircle, 
  UploadCloud, Sparkles, RefreshCw, Layers, Database, X, Lock,
  Monitor, Smartphone, Tablet, ArrowLeft, Eye, LogOut
} from 'lucide-react';
import { Article, Profile, Settings, Comment, Category } from '../types';
import { DBService, supabase, isUsingCloud } from '../services/db';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Hero } from './Hero';
import { NewsCard } from './NewsCard';

const CATS = ['লিড', 'সিটি কর্পোরেশন', 'বন্দর', 'হাসপাতাল', 'মহানগর', 'জেলা উপজেলা', 'প্রেস রিলিজ'];

interface AdminPanelProps {
  onClose: () => void;
  onLogout: () => void;
  loggedInUser: Profile;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onLogout, loggedInUser }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'articles' | 'categories' | 'users' | 'ads' | 'epaper' | 'settings' | 'database' | 'password'>('dashboard');
  const [posts, setPosts] = useState<Article[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  
  // Password change states
  const [newOwnPassword, setNewOwnPassword] = useState('');
  const [confirmOwnPassword, setConfirmOwnPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [editingUserPasswordId, setEditingUserPasswordId] = useState<string | null>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');

  // States for CRUD
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<Article>>({});
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<Profile>>({});
  
  const [newCatId, setNewCatId] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  
  // States for Team Management (Admin only)
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor' | 'reporter' | 'user'>('reporter');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  const [postsSearch, setPostsSearch] = useState('');
  const [alert, setAlert] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      notify('অনুগ্রহ করে সম্পূর্ণ নাম, ইমেল এবং পাসওয়ার্ড টাইপ করুন।', 'err');
      return;
    }
    
    setIsCreatingUser(true);
    try {
      const emailLower = newUserEmail.trim().toLowerCase();
      const userRawName = newUserName.trim();
      const userRole = newUserRole;
      const pass = newUserPassword.trim();
      const username = emailLower.split('@')[0];

      let createdId = String(Date.now()); // Fallback / local id

      // Import database services and configurations dynamically to verify cloud db
      const { isUsingCloud, supabase } = await import('../services/db');
      if (isUsingCloud() && supabase) {
        // Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: emailLower,
          password: pass,
          options: {
            data: {
              name: userRawName,
              username: username,
              role: userRole
            }
          }
        });

        if (error) {
          throw new Error('Supabase Auth SignUp failed: ' + error.message);
        }

        if (data.user) {
          createdId = data.user.id;
        }
      }

      // Upsert into profiles (using DBService or manual insert for robustness)
      const newProfile: Profile = {
        id: createdId,
        name: userRawName,
        username: username,
        password: pass, // Keep password metadata
        email: emailLower,
        role: userRole,
        active: true
      };

      await DBService.saveUser(newProfile);
      notify('✅ নতুন সদস্য সফলভাবে টিম ডিরেক্টরিতে যুক্ত হয়েছে!');
      
      // Reset form fields
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('reporter');
      
      // Reload user list
      loadData();
    } catch (err: any) {
      console.error(err);
      notify('সদস্য তৈরি ব্যর্থ হয়েছে: ' + err.message, 'err');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const loadData = async () => {
    const p = await DBService.getArticles();
    const u = await DBService.getUsers();
    const s = await DBService.getSettings();
    setPosts(p);
    setUsers(u);
    setSettings(s);
    
    // Map categories from available post info
    const catList = Array.from(new Set(p.map(x => x.category))).map(cName => ({
      id: cName,
      name: cName,
      description: 'সংবাদ বিভাগ'
    }));
    setCats(catList);
  };

  const notify = (text: string, type: 'ok' | 'err' = 'ok') => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleUpdateOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnPassword || newOwnPassword.length < 6) {
      notify('পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে!', 'err');
      return;
    }
    if (newOwnPassword !== confirmOwnPassword) {
      notify('পাসওয়ার্ড দুটি মেলেনি!', 'err');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { isUsingCloud, supabase } = await import('../services/db');
      if (isUsingCloud() && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newOwnPassword });
        if (error) throw new Error(error.message);
      }
      
      const currentProfiles = await DBService.getUsers();
      const myProfile = currentProfiles.find(u => u.username === loggedInUser.username || u.id === loggedInUser.id);
      if (myProfile) {
        myProfile.password = newOwnPassword;
        await DBService.saveUser(myProfile);
      }
      notify('✅ আপনার পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!');
      setNewOwnPassword('');
      setConfirmOwnPassword('');
    } catch (err: any) {
      console.error(err);
      notify('পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে: ' + err.message, 'err');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateUserPassword = async (userId: string, newPass: string) => {
    if (!newPass || newPass.trim().length < 6) {
      notify('পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে!', 'err');
      return;
    }
    try {
      const currentProfiles = await DBService.getUsers();
      const targetProfile = currentProfiles.find(u => u.id === userId);
      if (targetProfile) {
        targetProfile.password = newPass;
        await DBService.saveUser(targetProfile);
        notify(`✅ ${targetProfile.name}-এর পাসওয়ার্ড সঠিকভাবে আপডেট করা হয়েছে!`);
        loadData();
      } else {
        notify('ব্যবহারকারী খুঁজে পাওয়া যায়নি!', 'err');
      }
    } catch (err: any) {
      console.error(err);
      notify('পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে: ' + err.message, 'err');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'editor' | 'reporter' | 'user') => {
    try {
      const currentProfiles = await DBService.getUsers();
      const targetProfile = currentProfiles.find(u => u.id === userId);
      if (targetProfile) {
        targetProfile.role = newRole;
        await DBService.saveUser(targetProfile);
        notify(`✅ ${targetProfile.name}-এর ভূমিকা সফলভাবে '${newRole === 'admin' ? 'এডমিন' : newRole === 'editor' ? 'সম্পাদক' : newRole === 'reporter' ? 'সাংবাদিক' : 'ইউজার'}' এ পরিবর্তন করা হয়েছে!`);
        loadData();
      } else {
        notify('ব্যবহারকারী খুঁজে পাওয়া যায়নি!', 'err');
      }
    } catch (err: any) {
      console.error(err);
      notify('ভূমিকা পরিবর্তন ব্যর্থ হয়েছে: ' + err.message, 'err');
    }
  };

  // --- 1. AI-POWERED EDITORIAL ACTIONS (Gemini API Integration) ---
  const handleAIAssistant = async (actionType: 'summarize' | 'tags' | 'rewrite') => {
    const textTarget = actionType === 'rewrite' ? currentPost.content : currentPost.content || currentPost.title;
    if (!textTarget) {
      notify('অনুগ্রহ করে আগে সংবাদের বিষয়বস্তু বা শিরোনাম লিখুন।', 'err');
      return;
    }

    setIsAIProcessing(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textTarget, type: actionType })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (actionType === 'summarize') {
        setCurrentPost(prev => ({ ...prev, excerpt: data.text }));
        notify('✅ এআই সারসংক্ষেপ সফলভাবে জেনারেট হয়েছে!');
      } else if (actionType === 'rewrite') {
        setCurrentPost(prev => ({ ...prev, content: data.text }));
        notify('✅ এআই কলামটি সফলভাবে প্রুফরিড ও পরিমার্জন করেছে!');
      } else if (actionType === 'tags') {
        // Render tags inside content or append them
        notify(`✅ প্রস্তাবিত এআই ট্যাগ: ${data.text}`);
      }
    } catch (e: any) {
      console.error(e);
      notify('এআই টাস্ক সম্পূর্ণ করা যায়নি: ' + e.message, 'err');
    } finally {
      setIsAIProcessing(false);
    }
  };

  // --- 2. ARTICLE SAVE / DELETE ACTIONS ---
  const savePost = async () => {
    if (!currentPost.title?.trim()) {
      notify('শিরোনাম আবশ্যক।', 'err');
      return;
    }
    try {
      const saved = await DBService.saveArticle({
        ...currentPost,
        author: currentPost.author || loggedInUser.name,
        authorId: currentPost.authorId || loggedInUser.id
      });
      notify('✅ সংবাদটি সফলভাবে সংরক্ষিত হয়েছে!');
      setIsEditingPost(false);
      loadData();
    } catch (e: any) {
      notify('সংরক্ষণ ব্যর্থ হয়েছে: ' + e.message, 'err');
    }
  };

  const deletePost = async (id: number) => {
    if (confirm('নিশ্চিতভাবে এই সংবাদটি মুছে ফেলতে চান?')) {
      await DBService.deleteArticle(id);
      notify('সংবাদটি সফলভাবে মুছে ফেলা হয়েছে।');
      loadData();
    }
  };

  const handleImgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus('❌ ৫MB এর কম ছবি দিন।');
      return;
    }
    
    setUploadStatus('⌛ আপলোড হচ্ছে...');
    try {
      // For local development mockup we can use FileReader readAsDataURL so it immediately previews nicely!
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setCurrentPost(prev => ({ ...prev, image: base64 }));
        setUploadStatus('✅ সম্পন্ন!');
      };
      reader.readAsDataURL(file);
    } catch(err: any) {
      setUploadStatus('❌ ব্যর্থ হয়েছে।');
    }
  };

  // --- 3. SETTINGS & EPAPER ---
  const saveSettings = async () => {
    if (settings) {
      await DBService.saveSettings(settings);
      notify('✅ সেটিংস সফলভাবে আপডেট হয়েছে!');
      loadData();
    }
  };

  // --- 4. CATEGORIES ---
  const addCategory = () => {
    if (!newCatId.trim() || !newCatName.trim()) {
      notify('বিভাগ কোড এবং নাম দুটিই লিখুন।', 'err');
      return;
    }
    const exists = cats.find(c => c.id === newCatId.trim());
    if (exists) {
      notify('এই বিভাগ ইতিমধ্যে বিদ্যমান।', 'err');
      return;
    }
    const updated = [...cats, { id: newCatId.trim(), name: newCatName.trim(), description: newCatDesc.trim() }];
    setCats(updated);
    setNewCatId('');
    setNewCatName('');
    setNewCatDesc('');
    notify('✅ নতুন বিভাগ যুক্ত হয়েছে!');
  };

  const deleteCategory = (id: string) => {
    if (confirm('এই বিভাগটি কি মুছতে চান?')) {
      setCats(cats.filter(c => c.id !== id));
      notify('বিভাগ সরানো হয়েছে।');
    }
  };

  // FILTERED ARTICLES
  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(postsSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(postsSearch.toLowerCase())
  );

  // OPTIMIZED CHART DATA GENERATOR
  const generateChartData = () => {
    return [
      { name: 'শনিবার', পাঠ: 2400, পঠিত: 1800 },
      { name: 'রবিবার', পাঠ: 3200, পঠিত: 2400 },
      { name: 'সোমবার', পাঠ: 4500, পঠিত: 2900 },
      { name: 'মঙ্গলবার', পাঠ: 3800, পঠিত: 3000 },
      { name: 'বুধবার', পাঠ: 5100, পঠিত: 4300 },
      { name: 'বৃহস্পতিবার', পাঠ: 6200, পঠিত: 5000 },
      { name: 'শুক্রবার', পাঠ: 7500, পঠিত: 6100 }
    ];
  };

  return (
    <div id="admin-panel-overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex flex-col justify-end lg:justify-center p-0 lg:p-6 font-bengali-sans">
      <div className="bg-white w-full lg:max-w-7xl lg:mx-auto h-[100vh] lg:h-[90vh] lg:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* UPPER TITLE BAR */}
        <div className="bg-primary-dark text-white px-6 py-4 flex justify-between items-center shrink-0 border-b border-red-950">
          <div className="flex items-center gap-3">
            <h1 className="font-serif-bengali text-xl sm:text-2xl font-black">অপরাধ ঘোষণা — সংবাদপত্র প্রকাশনা ইঞ্জিন</h1>
            <span className="hidden sm:inline-block bg-amber-500 text-slate-950 text-xs font-bold px-2.5 py-1 rounded-full">{loggedInUser.role.toUpperCase()} প্যানেল</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onLogout} 
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg transition-all cursor-pointer border border-red-500/30 shadow-sm"
              title="লগআউট"
            >
              <LogOut size={16} />
              <span>লগআউট</span>
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="বন্ধ করুন">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CORE GRID LAYOUT */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* SIDEBAR NAVIGATION TAB SWITCHER */}
          <nav className="lg:col-span-2 bg-slate-50 border-r border-gray-200 p-3 lg:p-4 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto shrink-0 no-scrollbar">
            <button
              onClick={() => { setActiveTab('dashboard'); setIsEditingPost(false); }}
              className={`flex items-center gap-2.5 w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors duration-150 whitespace-nowrap ${
                activeTab === 'dashboard' ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              <LayoutDashboard size={18} />
              ড্যাশবোর্ড
            </button>
            <button
              onClick={() => { setActiveTab('articles'); setIsEditingPost(false); }}
              className={`flex items-center gap-2.5 w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors duration-150 whitespace-nowrap ${
                activeTab === 'articles' ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              <FileText size={18} />
              সংবাদসমূহ
            </button>
            <button
              onClick={() => { setActiveTab('password'); setIsEditingPost(false); }}
              className={`flex items-center gap-2.5 w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors duration-150 whitespace-nowrap ${
                activeTab === 'password' ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              <Lock size={18} />
              পাসওয়ার্ড পরিবর্তন
            </button>
            {loggedInUser.role === 'admin' && (
              <>
                <button
                  onClick={() => { setActiveTab('categories'); setIsEditingPost(false); }}
                  className={`flex items-center gap-2.5 w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors duration-150 whitespace-nowrap ${
                    activeTab === 'categories' ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  <Layers size={18} />
                  ক্যাটাগরি
                </button>
                <button
                  onClick={() => { setActiveTab('users'); setIsEditingPost(false); }}
                  className={`flex items-center gap-2.5 w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors duration-150 whitespace-nowrap ${
                    activeTab === 'users' ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  <Users size={18} />
                  ব্যবহারকারী
                </button>
                <button
                  onClick={() => { setActiveTab('ads'); setIsEditingPost(false); }}
                  className={`flex items-center gap-2.5 w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors duration-150 whitespace-nowrap ${
                    activeTab === 'ads' ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  <Megaphone size={18} />
                  বিজ্ঞাপন স্লাইডার
                </button>
                <button
                  onClick={() => { setActiveTab('epaper'); setIsEditingPost(false); }}
                  className={`flex items-center gap-2.5 w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors duration-150 whitespace-nowrap ${
                    activeTab === 'epaper' ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  <BookOpen size={18} />
                  ই-পেপার PDF
                </button>
                <button
                  onClick={() => { setActiveTab('settings'); setIsEditingPost(false); }}
                  className={`flex items-center gap-2.5 w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors duration-150 whitespace-nowrap ${
                    activeTab === 'settings' ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  <GearIcon size={18} />
                  সেটিংস কনফিগ
                </button>
                <button
                  onClick={() => { setActiveTab('database'); setIsEditingPost(false); }}
                  className={`flex items-center gap-2.5 w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors duration-150 whitespace-nowrap ${
                    activeTab === 'database' ? 'bg-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  <Database size={18} />
                  ক্লাউড ডেটাবেস
                </button>
              </>
            )}
          </nav>

          {/* MAIN INTERNAL DISPLAY BLOCK */}
          <main className="lg:col-span-10 p-5 sm:p-6 overflow-y-auto bg-slate-50/50 flex-1">
            {alert && (
              <div className={`p-4 rounded-lg text-sm mb-5 shadow-sm transition-all ${
                alert.type === 'ok' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 'bg-red-50 text-red-800 border-l-4 border-red-500'
              }`}>
                {alert.text}
              </div>
            )}

            {/* TAB-1: DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && !isEditingPost && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-primary">{posts.length}</span>
                    <span className="text-xs font-semibold text-gray-500 mt-1">সর্বমোট সংবাদ</span>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-green-700">{posts.filter(x=>x.status==='published').length}</span>
                    <span className="text-xs font-semibold text-gray-500 mt-1">প্রকাশিত</span>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-amber-600">{posts.filter(x=>x.status==='draft').length}</span>
                    <span className="text-xs font-semibold text-gray-500 mt-1">খসড়া নিউজ</span>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-blue-700">{users.length}</span>
                    <span className="text-xs font-semibold text-gray-500 mt-1">অ্যাক্টিভ দল</span>
                  </div>
                </div>

                {/* VISUAL ANALYTICS GRAPH */}
                <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm">
                  <h3 className="text-base font-bold text-gray-800 mb-4 font-serif-bengali">সাপ্তাহিক পাঠক ও পরিদর্শন গ্রাফ</h3>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={generateChartData()}>
                        <defs>
                          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#b71c1c" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#b71c1c" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: '11px' }} />
                        <YAxis stroke="#6b7280" style={{ fontSize: '11px' }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="পাঠ" stroke="#b71c1c" fillOpacity={1} fill="url(#colorPv)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB-2: NEWS ARTICLES DIRECTORY (CRUD) */}
            {activeTab === 'articles' && !isEditingPost && (
              <div className="flex flex-col gap-5 bg-white p-5 rounded-xl border border-gray-150 shadow-sm">
                <div className="flex justify-between items-center gap-4 flex-wrap border-b border-gray-100 pb-4">
                  <h2 className="text-lg font-bold text-gray-800 font-serif-bengali">সংবাদ নিয়ন্ত্রণ কেন্দ্র</h2>
                  <button 
                    onClick={() => { setCurrentPost({}); setIsEditingPost(true); }}
                    className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                    নতুন সংবাদ
                  </button>
                </div>

                {/* SEARCH FILTER */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    value={postsSearch}
                    onChange={e => setPostsSearch(e.target.value)}
                    placeholder="সংবাদ খুঁজুন..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-primary text-sm bg-white"
                  />
                </div>

                {/* DATA TABLE */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-200 text-gray-600">
                        <th className="p-3 font-semibold text-center">আইডি</th>
                        <th className="p-3 font-semibold">শিরোনাম</th>
                        <th className="p-3 font-semibold">ক্যাটাগরি</th>
                        <th className="p-3 font-semibold">তারিখ</th>
                        <th className="p-3 font-semibold text-center">অবস্থা</th>
                        <th className="p-3 font-semibold text-right">পদক্ষেপ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPosts.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center text-gray-400">#{p.id}</td>
                          <td className="p-3 font-semibold text-gray-900 max-w-sm truncate">{p.title}</td>
                          <td className="p-3">
                            <span className="bg-red-50 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-red-100 font-sans">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500 whitespace-nowrap">{p.date}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === 'published' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {p.status === 'published' ? 'প্রকাশিত' : 'খসড়া'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => { setCurrentPost(p); setIsEditingPost(true); }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                title="সম্পাদনা"
                              >
                                <Edit3 size={16} />
                              </button>
                              {loggedInUser.role === 'admin' && (
                                <button 
                                  onClick={() => deletePost(p.id)}
                                  className="p-1.5 text-primary hover:bg-red-50 rounded cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB-3: DYNAMIC ARTICLE EDITOR (With Gemini AI Assistant!) */}
            {isEditingPost && (() => {
              const previewPosts = (() => {
                const editingItem: Article = {
                  id: currentPost.id || 9999,
                  title: currentPost.title || 'শিরোনাম ছাড়া সংবাদ...',
                  excerpt: currentPost.excerpt || 'সংক্ষিপ্ত বিবরণী এখানে প্রদর্শিত হবে...',
                  content: currentPost.content || '',
                  category: currentPost.category || 'লিড',
                  categories: currentPost.categories && currentPost.categories.length > 0 ? currentPost.categories : [currentPost.category || 'লিড'],
                  authorId: currentPost.authorId || loggedInUser.id,
                  author: currentPost.author || loggedInUser.name,
                  image: currentPost.image || '',
                  status: 'published', // Force published in preview so it always renders on the home page preview!
                  featured: currentPost.featured !== undefined ? currentPost.featured : true, // default featured so it stays prominently visible
                  date: currentPost.date || 'এইমাত্র আপডেট করা হয়েছে'
                };

                if (currentPost.id) {
                  return posts.map(p => p.id === currentPost.id ? editingItem : p);
                } else {
                  return [editingItem, ...posts];
                }
              })();

              const publishedArticlesForPreview = previewPosts.filter(p => p.status === 'published');

              return (
                <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-5">
                  
                  {/* Header Title with clearly visible exit/back buttons */}
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsEditingPost(false)}
                        className="p-1.5 hover:bg-slate-100 rounded text-gray-500 transition-colors"
                        title="লিস্টে ফিরে যান"
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <h3 className="text-lg font-bold text-gray-800 font-serif-bengali">
                        {currentPost.id ? `নিউজ নং #${currentPost.id} সম্পাদনা ও লাইভ প্রাকদর্শন` : 'নতুন সংবাদ রচনা ও লাইভ প্রাকদর্শন'}
                      </h3>
                    </div>
                    
                    {/* Clear back-to-home options requested by user */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onClose}
                        className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-primary hover:text-primary-dark font-semibold text-xs px-3 py-1.5 rounded-lg border border-red-200 shadow-sm transition-colors cursor-pointer"
                        title="সম্পূর্ণ প্যানেল বন্ধ করে ওয়েবসাইট হোমপেজে চলে যান"
                      >
                        <X size={14} />
                        হোমপেজে ফিরে যান (ফিরে যান)
                      </button>
                      <button
                        onClick={() => setIsEditingPost(false)}
                        className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        title="তালিকা ভিউতে ফিরে যান"
                      >
                        <ArrowLeft size={14} />
                        লিস্টে ফিরে যান
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Responsive Split */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT PANEL: The article form input (7/12 width on XL) */}
                    <div className="xl:col-span-7 flex flex-col gap-4">
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-700">সংবাদের শিরোনাম *</label>
                        <input
                          type="text"
                          value={currentPost.title || ''}
                          onChange={e => setCurrentPost(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white text-gray-900"
                          placeholder="আকর্ষণীয় শিরোনাম লিখুন..."
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-700 font-serif-bengali">মূল সংবাদ কন্টেন্ট (HTML সমর্থিত)</label>
                        <textarea
                          rows={12}
                          value={currentPost.content || ''}
                          onChange={e => setCurrentPost(prev => ({ ...prev, content: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary font-mono bg-white text-gray-900"
                          placeholder="এখানে সংবাদের বিস্তারিত তথ্য লিখুন..."
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-700">সংবাদের সংক্ষিপ্ত সারসংক্ষেপ</label>
                        <textarea
                          rows={3}
                          value={currentPost.excerpt || ''}
                          onChange={e => setCurrentPost(prev => ({ ...prev, excerpt: e.target.value }))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white text-gray-900"
                          placeholder="সংক্ষিপ্ত বিবরণী (হোমপেজ কার্ডের জন্য)..."
                        />
                      </div>

                      {/* Meta information & AI assistant side by side on left */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-gray-150">
                        {/* Column 1: AI Assitant */}
                        <div className="flex flex-col gap-3">
                          <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Sparkles size={16} className="text-amber-500 animate-spin" />
                            এআই সম্পাদকীয় সহকারী
                          </h4>
                          <p className="text-[11px] text-gray-500 leading-normal">
                            গুগল জেমিনি এআই সংবাদটির স্বয়ংক্রিয় সারসংক্ষেপ বা প্রুফরিড সেবা প্রদান করতে পারে।
                          </p>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleAIAssistant('summarize')}
                              disabled={isAIProcessing}
                              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white text-xs font-bold py-2 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                            >
                              <Sparkles size={13} />
                              {isAIProcessing ? 'প্রসেসিং...' : '⚡ এআই অটো-সারসংক্ষেপ'}
                            </button>
                            <button
                              onClick={() => handleAIAssistant('rewrite')}
                              disabled={isAIProcessing}
                              className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                            >
                              <RefreshCw size={13} />
                              {isAIProcessing ? 'প্রসেসিং...' : '🖊️ প্রুফরিডার ও পরিমার্জন'}
                            </button>
                          </div>
                        </div>

                        {/* Column 2: Categories, Image & status */}
                        <div className="flex flex-col gap-2.5">
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-gray-700 font-serif-bengali font-black">ক্যাটাগরি সমূহ *</label>
                            <div className="grid grid-cols-2 gap-1.5 border border-gray-150 rounded-lg p-2 max-h-32 overflow-y-auto bg-white">
                              {CATS.map(c => {
                                const isChecked = currentPost.categories?.includes(c) || currentPost.category === c;
                                return (
                                  <label key={c} id={`cat-chk-label-${c}`} className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-700 cursor-pointer select-none">
                                    <input
                                      id={`cat-chk-${c}`}
                                      type="checkbox"
                                      checked={!!isChecked}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        let currentCats = [...(currentPost.categories || [])];
                                        if (checked) {
                                          if (!currentCats.includes(c)) currentCats.push(c);
                                        } else {
                                          currentCats = currentCats.filter(item => item !== c);
                                        }
                                        const firstCat = currentCats[0] || '';
                                        setCurrentPost(prev => ({
                                          ...prev,
                                          category: firstCat,
                                          categories: currentCats
                                        }));
                                      }}
                                      className="w-3.5 h-3.5 text-primary bg-white border-gray-300 rounded focus:ring-primary accent-primary"
                                    />
                                    {c}
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-gray-700 font-serif-bengali font-black">ছবি আপলোড</label>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-2.5 py-1.5 rounded cursor-pointer transition-colors shrink-0">
                                <UploadCloud size={13} />
                                গ্যাডজেট থেকে ছবি নিন
                                <input type="file" accept="image/*" className="hidden" onChange={handleImgUpload} />
                              </label>
                              <span className="text-[10px] text-gray-500 truncate max-w-[100px]">{uploadStatus || 'নেওয়া হয়নি'}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-gray-700">সরাসরি ছবির URL</label>
                            <input
                              type="text"
                              value={currentPost.image || ''}
                              onChange={e => setCurrentPost(prev => ({ ...prev, image: e.target.value }))}
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-primary bg-white text-gray-900"
                              placeholder="https://..."
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-1">
                            <div className="flex-1">
                              <select
                                value={currentPost.status || 'published'}
                                onChange={e => setCurrentPost(prev => ({ ...prev, status: e.target.value as 'published' | 'draft' }))}
                                className="w-full border border-gray-200 bg-white rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary font-bold text-gray-700"
                              >
                                <option value="published">প্রকাশ করুন</option>
                                <option value="draft">ড্রাফট / খসড়া</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="checkbox"
                                id="form-featured-check"
                                checked={!!currentPost.featured}
                                onChange={e => setCurrentPost(prev => ({ ...prev, featured: e.target.checked }))}
                                className="w-3.5 h-3.5 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary accent-primary"
                              />
                              <label htmlFor="form-featured-check" className="text-[10px] font-bold text-gray-700 cursor-pointer pb-0.5">ফিচার</label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons for Left Block */}
                      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                        <button 
                          onClick={() => setIsEditingPost(false)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                        >
                          ফিরে যান
                        </button>
                        <button 
                          onClick={savePost}
                          className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                          ভ্যালিডেট ও সংরক্ষণ করুন
                        </button>
                      </div>

                    </div>

                    {/* RIGHT PANEL: LIVE HOME PAGE PREVIEW (5/12 width on XL) */}
                    <div className="xl:col-span-5 bg-slate-100 p-4 rounded-xl border border-gray-200 flex flex-col gap-4 self-stretch lg:sticky lg:top-4 overflow-y-auto max-h-[85vh] shadow-inner font-sans">
                      
                      {/* Device Selector / Browser Controls */}
                      <nav className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <Eye size={16} className="text-primary animate-pulse" />
                          <span className="text-xs font-bold text-gray-700 font-serif-bengali">লাইভ হোমপেজ প্রিভিউ</span>
                        </div>
                        <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
                          <button
                            onClick={() => setPreviewDevice('desktop')}
                            className={`p-1.5 rounded transition-all flex items-center gap-1 text-[10px] font-bold ${
                              previewDevice === 'desktop' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                            title="ڈেস্কটপ ভিউ"
                          >
                            <Monitor size={12} />
                            ডেস্কটপ
                          </button>
                          <button
                            onClick={() => setPreviewDevice('tablet')}
                            className={`p-1.5 rounded transition-all flex items-center gap-1 text-[10px] font-bold ${
                              previewDevice === 'tablet' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                            title="ট্যাবলেট ভিউ"
                          >
                            <Tablet size={12} />
                            ট্যাবলেট
                          </button>
                          <button
                            onClick={() => setPreviewDevice('mobile')}
                            className={`p-1.5 rounded transition-all flex items-center gap-1 text-[10px] font-bold ${
                              previewDevice === 'mobile' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                            title="মোবাইল ভিউ"
                          >
                            <Smartphone size={12} />
                            মোবাইল
                          </button>
                        </div>
                      </nav>

                      {/* Device Simulator Shell container */}
                      <div className="flex-1 flex justify-center bg-slate-200 rounded-lg p-2 overflow-hidden border border-slate-300 min-h-[450px]">
                        <div 
                          className="bg-white rounded border border-gray-300 shadow-md flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-300 bg-slate-50 relative"
                          style={{
                            width: previewDevice === 'mobile' ? '360px' : previewDevice === 'tablet' ? '640px' : '100%',
                            maxHeight: '650px',
                            fontSize: previewDevice === 'mobile' ? '12px' : '14px'
                          }}
                        >
                          {/* Simulated Browser URL bar */}
                          <div className="sticky top-0 bg-slate-100 border-b border-gray-200 px-3 py-1.5 flex items-center gap-2 select-none shrink-0 z-50">
                            <div className="flex gap-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span>
                            </div>
                            <div className="flex-1 bg-white border border-gray-200 rounded text-[9px] text-gray-500 px-2 py-0.5 truncate text-center select-all font-mono">
                              https://oporadhghoshona.com/home
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping inline-block"></span>
                          </div>

                          {/* Simulated Homepage Body */}
                          <div className="p-3 flex flex-col gap-4 font-sans text-gray-800 bg-white min-h-[600px] select-none">
                            
                            {/* Newspaper Brand Banner */}
                            <div className="text-center border-b-4 border-double border-slate-900 pb-2">
                              <h1 className="font-serif-bengali font-black text-2xl text-slate-900 tracking-tight text-shadow-sm">
                                {settings?.siteName || 'অপরাধ ঘোষণা'}
                              </h1>
                              <p className="text-[10px] text-gray-500 font-medium tracking-wide">
                                {settings?.tagline || 'সত্যের পক্ষে হেলে পড়া, মিথ্যার বিরুদ্ধে লড়াই করা...'}
                              </p>
                              <div className="border-t border-slate-300 mt-1 pt-1 flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-widest px-2 font-mono">
                                <span className="truncate max-w-[120px]">সম্পাদক: {settings?.editorName || 'মোঃ আসিফ হোসাইন'}</span>
                                <span>তারিখ: {new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                            </div>

                            {/* Breaking Ticker displaying the title being modified in real time */}
                            <div className="bg-red-600 text-white py-1 px-2.5 rounded text-[10px] flex gap-2 items-center overflow-hidden">
                              <span className="bg-white text-red-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded animate-pulse shrink-0 tracking-widest uppercase">ব্রেকিং নিউজ</span>
                              <div className="whitespace-nowrap font-semibold border-none bg-transparent text-white w-full animate-pulse truncate text-[9px]">
                                {currentPost.title || settings?.breakingNews || 'খবর সবিস্তারে দেখতে সঙ্গে থাকুন...'}
                              </div>
                            </div>

                            {/* Main Section Header */}
                            <h4 className="text-[11px] font-bold text-gray-800 border-b border-primary pb-0.5 flex justify-between items-center font-serif-bengali">
                              <span>📰 আজকের তাজা খবর (লাইভ আপডেট)</span>
                              <span className="text-[8px] bg-red-100 text-primary font-bold px-1 rounded">লাইভ</span>
                            </h4>

                            {/* The Real-Time Hero Grid Section */}
                            <div className="pointer-events-none transform scale-95 origin-top select-none border border-slate-100 rounded-lg p-1 bg-slate-50">
                              <Hero posts={publishedArticlesForPreview} onArticleClick={() => {}} />
                            </div>

                            {/* Category Blocks of Homepage */}
                            <div className="flex flex-col gap-4 font-serif-bengali">
                              {['লিড', 'সিটি কর্পোরেশন', 'বন্দর', 'হাসপাতাল', 'মহানগর', 'জেলা উপজেলা', 'District & Sub-district', 'District Info', 'প্রেস রিলিজ'].map(cat => {
                                // Fallback / matching both English and Bengali labels
                                const bngCat = cat === 'District Info' || cat === 'District & Sub-district' || cat === 'জেলা উপজেলা' ? 'জেলা উপজেলা' : cat;
                                const catPosts = publishedArticlesForPreview.filter(p => p.categories?.includes(bngCat) || p.categories?.includes(cat) || p.category === bngCat || p.category === cat).slice(0, 3);
                                if (catPosts.length === 0) return null;
                                return (
                                  <div key={cat} className="bg-slate-50 p-2.5 rounded border border-gray-150 text-[11px]">
                                    <div className="flex justify-between items-center pb-1 border-b border-rose-300 mb-2">
                                      <span className="font-serif-bengali text-xs font-black text-rose-950">{bngCat}</span>
                                      <span className="text-[8px] font-sans text-gray-400">৩টি সংবাদ খণ্ড</span>
                                    </div>
                                    <div className={`grid gap-3 ${previewDevice === 'mobile' ? 'grid-cols-1' : 'grid-cols-3'} pointer-events-none transform scale-95 origin-top`}>
                                      {catPosts.map(p => (
                                        <NewsCard key={p.id} post={p} onClick={() => {}} />
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Mock Footer */}
                            <div className="text-center font-mono text-[8px] text-gray-400 border-t border-gray-100 pt-3 mt-2">
                              © {settings?.siteName || 'অপরাধ ঘোষণা'} — সর্বস্বত্ব সংরক্ষিত ও সুরক্ষিত
                            </div>

                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              );
            })()}

            {/* TAB-4: NEWS CATEGORIES DIRECTORY (CRUD) */}
            {activeTab === 'categories' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-4">
                  <h3 className="text-base font-bold text-gray-800 font-serif-bengali pb-2 border-b border-gray-100">নতুন ক্যাটাগরি তৈরি</h3>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">ক্যাটাগরি কোড (ইংরেজিতে, অনন্য)</label>
                    <input
                      type="text"
                      value={newCatId}
                      onChange={e => setNewCatId(e.target.value)}
                      placeholder="e.g. metropolitan"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">প্রদর্শিত নাম (বাংলায়)</label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="e.g. মহানগর"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">সংক্ষিপ্ত বিবরণ</label>
                    <textarea
                      rows={2}
                      value={newCatDesc}
                      onChange={e => setNewCatDesc(e.target.value)}
                      placeholder="ক্যাটাগরির বিবরণী..."
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button 
                    onClick={addCategory}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-bold py-2.5 rounded-lg shadow-sm w-full transition-colors mt-2 cursor-pointer"
                  >
                    নতুন ক্যাটাগরি যুক্ত করুন
                  </button>
                </div>

                <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-gray-150 shadow-sm">
                  <h3 className="text-base font-bold text-gray-800 font-serif-bengali pb-2 border-b border-gray-100 mb-4">বিদ্যাস ক্যাটাগরি তালিকা</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-gray-600">
                          <th className="p-3 font-semibold">কোড</th>
                          <th className="p-3 font-semibold">নাম</th>
                          <th className="p-3 font-semibold">বিবরণ</th>
                          <th className="p-3 font-semibold text-right">পদক্ষেপ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cats.map(c => (
                          <tr key={c.id}>
                            <td className="p-3 font-mono text-gray-400">{c.id}</td>
                            <td className="p-3 font-bold text-gray-900">{c.name}</td>
                            <td className="p-3 text-gray-500 text-xs">{c.description || '—'}</td>
                            <td className="p-3 text-right">
                              <button 
                                onClick={() => deleteCategory(c.id)}
                                className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-primary text-[10px] font-bold rounded"
                              >
                                মুছুন
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB-5: SYSTEM SETTINGS MANAGEMENT */}
            {activeTab === 'settings' && settings && (
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-5">
                <h2 className="text-lg font-bold text-gray-800 font-serif-bengali border-b border-gray-100 pb-3">সিস্টেম কনফিগারেশন</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">পত্রিকার নাম</label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">রেজিস্ট্রেশন নম্বর</label>
                    <input
                      type="text"
                      value={settings.regNo}
                      onChange={e => setSettings({ ...settings, regNo: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">সম্পাদক ও প্রকাশক</label>
                    <input
                      type="text"
                      value={settings.editorName}
                      onChange={e => setSettings({ ...settings, editorName: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">নির্বাহী সম্পাদক</label>
                    <input
                      type="text"
                      value={settings.execEditor}
                      onChange={e => setSettings({ ...settings, execEditor: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">টেলিফোন নম্বর (হেল্পলাইন)</label>
                    <input
                      type="text"
                      value={settings.phone1}
                      onChange={e => setSettings({ ...settings, phone1: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">অফিসিয়াল ইমেইল</label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={e => setSettings({ ...settings, email: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">ব্রেকিং নিউজ টিকার লাইন</label>
                    <textarea
                      rows={3}
                      value={settings.breakingNews}
                      onChange={e => setSettings({ ...settings, breakingNews: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <button 
                    onClick={saveSettings}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    কনফিগারেশন আপডেট করুন
                  </button>
                </div>
              </div>
            )}

            {/* TAB-6: ADVERTISING MODULE (CRUD SLOTS) */}
            {activeTab === 'ads' && settings && (
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-6">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-gray-800 font-serif-bengali">বিজ্ঞাপন স্লাইডার ও ব্যানার ম্যানেজার</h2>
                  <p className="text-xs text-gray-500 mt-1">হোমপেজ ও সাইডবারের গুরুত্বপূর্ণ বিজ্ঞাপন স্লটসমূহ ব্যানিং করুন।</p>
                </div>

                {['header', 'sidebar', 'mid'].map(slot => {
                  const ad = settings.ads[slot as keyof typeof settings.ads];
                  return (
                    <div key={slot} className="bg-slate-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-4">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <h4 className="text-sm font-bold text-slate-800 capitalize">
                          {slot === 'header' ? 'ব্যানার ১ - সাইটের শীর্ষ (৭৮০X৯০)' : slot === 'sidebar' ? 'ব্যানার ২ - সাইডবার (৩০০X২৫০)' : 'ব্যানার ৩ - মধ্যম কন্টেন্ট (৭৮০X৯০)'}
                        </h4>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id={`ad-${slot}-active`}
                            checked={!!ad.enabled}
                            onChange={e => {
                              const updatedAds = { ...settings.ads, [slot]: { ...ad, enabled: e.target.checked } };
                              setSettings({ ...settings, ads: updatedAds });
                            }}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary accent-primary"
                          />
                          <label htmlFor={`ad-${slot}-active`} className="text-xs font-bold text-slate-700 cursor-pointer">অনলাইন রাখুন</label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-600">বিজ্ঞাপন চিত্র URL (PNG, JPG)</label>
                          <input 
                            type="text"
                            value={ad.image || ''}
                            onChange={e => {
                              const updatedAds = { ...settings.ads, [slot]: { ...ad, image: e.target.value } };
                              setSettings({ ...settings, ads: updatedAds });
                            }}
                            className="border border-gray-200 rounded px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary bg-white"
                            placeholder="https://..."
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-600">ক্লিক রুট বা বাহ্যিক লিংক</label>
                          <input 
                            type="text"
                            value={ad.link || ''}
                            onChange={e => {
                              const updatedAds = { ...settings.ads, [slot]: { ...ad, link: e.target.value } };
                              setSettings({ ...settings, ads: updatedAds });
                            }}
                            className="border border-gray-100 rounded px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary bg-white"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <button 
                    onClick={saveSettings}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    বিজ্ঞাপন আপডেট করুন
                  </button>
                </div>
              </div>
            )}

            {/* TAB-7: SUPABASE DATABASE MIGRATION SCRIPT INFO DOWNLOAD */}
            {activeTab === 'database' && (
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-5">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-gray-800 font-serif-bengali flex items-center gap-2">
                    <Database size={24} className="text-blue-600" />
                    উৎপাদন-প্রস্তুত সুপাবেস ডাটাবেস স্কিমা
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">কপি করে সুপাবেসের SQL এডিটর রান করুন।</p>
                </div>

                <div className="info-box">
                  ✅ এই অ্যাপ্লিকেশনটি একটি শক্তিশালী ডুয়াল-স্টোরেজ কন্ট্রোলার ব্যবহার করছে। কোনো কনফিগারেশন না থাকলেও এটি নির্বিঘ্নে LocalStorage এ চলবে। কিন্তু ক্লাউড সমৃদ্ধি ও আরএলএস নিরাপত্তার জন্য নিচের স্ক্রিপ্টটি আপনার সুপাবেস প্রজেক্টে চালান।
                </div>

                <div className="relative">
                  <button 
                    onClick={() => {
                      const schemaFile = document.getElementById('sql-code-block')?.textContent;
                      if (schemaFile) {
                        navigator.clipboard.writeText(schemaFile);
                        notify('✅ সুপাবেস SQL সম্পূর্ণ কপি হয়েছে!');
                      }
                    }}
                    className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded transition-all cursor-pointer"
                  >
                    কপি কোড
                  </button>
                  <pre 
                    id="sql-code-block"
                    className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-auto max-h-72 leading-relaxed"
                  >
{`-- =====================================================================
-- 📢 APORADH GHOSHONA (অপরাধ ঘোষণা) - PRODUCTION DATABASE SCHEMA
-- Target Database: Supabase PostgreSQL
-- Recommended execution: Copy and paste this script into the Supabase SQL Editor.
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE SCHEMAS / FUNCTIONS
-- Create updated_at trigger helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. PROFILES TABLE (Extends Supabase Auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'reporter', 'user')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Trigger for updated_at
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY, -- e.g., 'লিড', 'সিটি কর্পোরেশন'
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Categories
INSERT INTO public.categories (id, name, description) VALUES
('লিড', 'লিড', 'প্রধান সংবাদ ও বিশেষ প্রতিবেদন'),
('সিটি কর্পোরেশন', 'সিটি কর্পোরেশন', 'সিটি কর্পোরেশনের কার্যক্রম'),
('বন্দর', 'বন্দর', 'চট্টগ্রাম বন্দরের সংবাদ'),
('হাসপাতাল', 'হাসপাতাল', 'স্বাস্থ্য ও চিকিৎসা সংক্রান্ত'),
('মহানগর', 'মহানগর', 'মহানগরীর ঘটনাবলী'),
('জেলা উপজেলা', 'জেলা উপজেলা', 'জেলা ও উপজেলার খবর'),
('প্রেস রিলিজ', 'প্রেস রিলিজ', 'অফিসিয়াল প্রেস বিজ্ঞপ্তি')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;


-- 5. POSTS / ARTICLES TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    category TEXT REFERENCES public.categories(id) ON DELETE SET NULL, -- primary category for legacy UI
    categories_json TEXT DEFAULT '[]', -- array of categories for multi-category support
    author_id BIGINT, -- references app_users.id (legacy mock users) or a generic key
    author_name TEXT NOT NULL, -- cache author name for fast loads
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    featured BOOLEAN NOT NULL DEFAULT false,
    published_date TEXT, -- human readable date format preserved (e.g. '১১ মে ২০২৬')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON public.posts(featured);

CREATE TRIGGER update_posts_modtime
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();


-- 5b. ARTICLE_CATEGORIES JUNCTION TABLE (Many-to-Many Relationship)
CREATE TABLE IF NOT EXISTS public.article_categories (
    article_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    category_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, category_id)
);

-- Enable RLS on junction table
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view article category associations
CREATE POLICY "Article associations are viewable by everyone" ON public.article_categories
    FOR SELECT USING (true);

-- Allow admins, editors to manage article category associations
CREATE POLICY "Admins and editors can manage article categories" ON public.article_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
        )
    );


-- 6. APP_USERS TABLE
-- Legacy table used to track internal mock roles / local login, but made durable
CREATE TABLE IF NOT EXISTS public.app_users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'reporter' CHECK (role IN ('admin', 'editor', 'reporter')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial system users
INSERT INTO public.app_users (id, name, username, password, email, role, active) VALUES
(1, 'এম নুরুল কবির', 'admin', 'admin321', 'editor@aporadhghoshona.com', 'admin', true),
(2, 'মোঃ গাজী মোরশেদুল আলম', 'editor', 'editor123', 'exec@aporadhghoshona.com', 'editor', true),
(3, 'জিয়াউল হক', 'reporter1', 'reporter123', 'reporter@aporadhghoshona.com', 'reporter', true)
ON CONFLICT (username) DO NOTHING;


-- 7. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'spam')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_article ON public.comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON public.comments(status);


-- 8. BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id BIGSERIAL PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    article_id BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, article_id)
);


-- 9. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name TEXT NOT NULL DEFAULT 'অপরাধ ঘোষণা',
    tagline TEXT DEFAULT 'সত্যের পথে, ন্যায়ের সাথে',
    reg_no TEXT DEFAULT '২৫২',
    editor_name TEXT DEFAULT 'এম নুরুল কবির',
    exec_editor TEXT DEFAULT 'মোঃ গাজী মোরশেদুল আলম',
    special_rep TEXT DEFAULT 'জিয়াউল হক',
    phone1 TEXT DEFAULT '০১৭৭৮-৮১১১১১',
    phone2 TEXT DEFAULT '০১৬৩৩-১২৫২৫০',
    phone3 TEXT DEFAULT '০১৮১২৫৭৩৫৪৬',
    email TEXT DEFAULT 'aporadhghoshona@gmail.com',
    breaking_news TEXT DEFAULT 'চট্টগ্রামে ডাকাতি চক্রের মূলহোতাসহ সাতজন গ্রেপ্তার, উদ্ধার কোটি টাকার মালামাল',
    ads_json TEXT DEFAULT '{"header":{},"sidebar":{},"mid":{}}',
    epaper_json TEXT DEFAULT '{"enabled":false,"url":"","label":"সর্বশেষ সংখ্যা"}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed single settings row
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;


-- =====================================================================
-- 🔒 ROW LEVEL SECURITY (RLS) & ACCESS CONTROL POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. CATEGORIES POLICIES
CREATE POLICY "Categories are viewable by everyone" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 3. POSTS/ARTICLES POLICIES
CREATE POLICY "Published posts are viewable by everyone" ON public.posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins, editors, and authors can view all posts" ON public.posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor', 'reporter')
        )
    );

CREATE POLICY "Admins and editors can insert posts" ON public.posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Admins and editors can update posts" ON public.posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Only admins can delete posts" ON public.posts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Reporters can insert their own posts" ON public.posts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'reporter'
        )
    );

-- 4. APP_USERS POLICIES (internal table of publisher users)
CREATE POLICY "Viewable by admins, editors" ON public.app_users
    FOR SELECT USING (true); -- allowed for public anon, but we secure with RLS on production if preferred

CREATE POLICY "Only admins can manage app_users" ON public.app_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 5. COMMENTS POLICIES
CREATE POLICY "Approved comments are viewable by everyone" ON public.comments
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can post a comment" ON public.comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins and editors can moderate comments" ON public.comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor')
        )
    );

-- 6. BOOKMARKS POLICIES
CREATE POLICY "Users can manage their own bookmarks" ON public.bookmarks
    FOR ALL USING (auth.uid() = profile_id);

-- 7. SETTINGS POLICIES
CREATE POLICY "Settings are viewable by everyone" ON public.settings
    FOR SELECT USING (true);

CREATE POLICY "Only admins can update settings" ON public.settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- =====================================================================
-- 🚀 GRANTS AND STORAGE CREATION
-- =====================================================================

-- Allow anonymous access to public tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;`}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB-8: INTERACTIVE E-PAPER MANAGER */}
            {activeTab === 'epaper' && (
              <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-5">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-gray-800 font-serif-bengali">📄 ই-পেপার সংস্করণ আপলোড ও প্রকাশনা</h2>
                  <p className="text-xs text-gray-500 mt-1">পিডিএফ আপলোড করুন বা সরাসরি লিংক প্রদান করুন।</p>
                </div>

                <div className="info-box">
                  এখানে ই-পেপারের পিডিএফ ফাইল (সর্বোচ্চ ২০MB) আপলোড করুন। "চালু" সেট করলে হোমপেজের লোগোর পাশে "ই-পেপার" সংস্করণের লিংক দৃশ্যমান হবে।
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-700">PDF ফাইল আপলোড</label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer transition-colors">
                        <UploadCloud size={14} />
                        পিডিএফ বেছে নিন
                        <input type="file" accept="application/pdf" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          setUploadStatus('⌛ পিডিএফ আপলোড হচ্ছে...');
                          try {
                            if (isUsingCloud() && supabase) {
                              try {
                                const fileExt = file.name.split('.').pop() || 'pdf';
                                const fileName = `epaper_${Date.now()}.${fileExt}`;
                                const { data, error } = await supabase.storage
                                  .from('news-images')
                                  .upload(fileName, file, { cacheControl: '3600', upsert: true });
                                
                                if (error) {
                                  throw error;
                                }
                                if (data) {
                                  const { data: publicUrlData } = supabase.storage
                                    .from('news-images')
                                    .getPublicUrl(fileName);
                                  
                                  if (publicUrlData?.publicUrl) {
                                    setSettings(prev => prev ? { ...prev, epaper: { ...prev.epaper, url: publicUrlData.publicUrl } } : null);
                                    setUploadStatus('✅ পিডিএফ আপলোড সম্পন্ন!');
                                    return;
                                  }
                                }
                              } catch (storageErr: any) {
                                console.warn('Supabase Storage upload failed, trying base64 fallback:', storageErr);
                              }
                            }

                            // Fallback to Base64 FileReader
                            const reader = new FileReader();
                            reader.onload = () => {
                              const base64 = reader.result as string;
                              setSettings(prev => prev ? { ...prev, epaper: { ...prev.epaper, url: base64 } } : null);
                              setUploadStatus('✅ পিডিএফ আপলোড সম্পন্ন!');
                            };
                            reader.readAsDataURL(file);
                          } catch(err) {
                            setUploadStatus('❌ আপলোড ব্যর্থ।');
                          }
                        }} />
                      </label>
                      <span className="text-xs text-gray-500 font-medium">{uploadStatus || 'আপলোড করা হয়নি'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">অথবা সরাসরি পিডিএফ এর লিংক</label>
                    <input
                      type="text"
                      value={settings?.epaper?.url || ''}
                      onChange={e => setSettings(prev => prev ? { ...prev, epaper: { ...prev.epaper, url: e.target.value } } : null)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700">লিংক লেবেল (যেমন: ‘মে ২০২৬’)</label>
                    <input
                      type="text"
                      value={settings?.epaper?.label || 'সর্বশেষ সংস্করণ'}
                      onChange={e => setSettings(prev => prev ? { ...prev, epaper: { ...prev.epaper, label: e.target.value } } : null)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <input
                      type="checkbox"
                      id="epaper-on-check"
                      checked={!!settings?.epaper?.enabled}
                      onChange={e => setSettings(prev => prev ? { ...prev, epaper: { ...prev.epaper, enabled: e.target.checked } } : null)}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary accent-primary"
                    />
                    <label htmlFor="epaper-on-check" className="text-xs font-bold text-gray-700 cursor-pointer">ই-পেপার অপশনটি সবার জন্য দৃশ্যমান করুন</label>
                  </div>
                </div>

                {settings?.epaper?.url && (
                  <div className="bg-green-50 text-green-800 p-3 rounded-md text-xs border border-green-200">
                    ✅ বর্তমান সচল ফাইল: <a href={settings.epaper.url} target="_blank" rel="noopener noreferrer" className="underline font-bold text-green-900">{settings.epaper.label} ডাউনলোড করুন</a>
                  </div>
                )}

                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <button 
                    onClick={saveSettings}
                    className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    ই-পেপার তথ্য সংরক্ষণ করুন
                  </button>
                </div>
              </div>
            )}

            {/* TAB-9: TEAM MANAGEMENT */}
            {activeTab === 'users' && loggedInUser.role === 'admin' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full overflow-y-auto max-h-[80vh] p-1">
                {/* CREATE TEAM ACTION CARD */}
                <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-4 h-fit">
                  <div className="border-b border-gray-100 pb-2.5">
                    <h3 className="text-base font-bold text-gray-800 font-serif-bengali">👥 নতুন টিম সদস্য যুক্ত করুন</h3>
                    <p className="text-xs text-gray-400 mt-0.5">নতুন এডমিন, সম্পাদক বা রিপোর্টার যুক্ত করার ফর্ম।</p>
                  </div>
                  <form onSubmit={handleCreateUser} className="flex flex-col gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="new-user-name" className="text-xs font-bold text-gray-700">সম্পূর্ণ নাম *</label>
                      <input
                        id="new-user-name"
                        type="text"
                        value={newUserName}
                        onChange={e => setNewUserName(e.target.value)}
                        placeholder="যেমন: মোঃ সাকিব হোসেন"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white text-gray-800"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="new-user-email" className="text-xs font-bold text-gray-700">ইমেইল ঠিকানা *</label>
                      <input
                        id="new-user-email"
                        type="email"
                        value={newUserEmail}
                        onChange={e => setNewUserEmail(e.target.value)}
                        placeholder="asif@aporadhghoshona.com"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white text-gray-800"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="new-user-password" className="text-xs font-bold text-gray-700">প্রাথমিক পাসওয়ার্ড *</label>
                      <input
                        id="new-user-password"
                        type="password"
                        value={newUserPassword}
                        onChange={e => setNewUserPassword(e.target.value)}
                        placeholder="৬+ অক্ষরের পাসওয়ার্ড টেম্পারারি"
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white text-gray-800"
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="new-user-role" className="text-xs font-bold text-gray-700">নির্ধারিত রোল/ভূমিকা *</label>
                      <select
                        id="new-user-role"
                        value={newUserRole}
                        onChange={e => setNewUserRole(e.target.value as any)}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white text-gray-800"
                      >
                        <option value="editor">সম্পাদক (Editor)</option>
                        <option value="reporter">রিপোর্টার (Reporter)</option>
                        <option value="admin">এডমিন (Admin)</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      disabled={isCreatingUser}
                      className="bg-primary hover:bg-primary-dark text-white text-xs font-bold py-2.5 rounded-lg shadow-sm w-full transition-colors mt-2 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isCreatingUser ? 'তৈরি হচ্ছে...' : 'নতুন মেম্বার যুক্ত করুন'}
                    </button>
                  </form>
                </div>

                {/* TEAM DIRECTORY VIEW CARD */}
                <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-3 min-w-0">
                  <div className="border-b border-gray-100 pb-2.5">
                    <h3 className="text-base font-bold text-gray-800 font-serif-bengali">🛡️ অপরাধ ঘোষণা কর্মীবাবলী ডিরেক্টরি</h3>
                    <p className="text-xs text-gray-400 mt-0.5">বর্তমান নিবন্ধিত পরিচালকদের তালিকা, ভূমিকা ও যোগদানের তারিখ।</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-gray-200 text-gray-600">
                          <th className="p-3 font-semibold whitespace-nowrap">নাম</th>
                          <th className="p-3 font-semibold whitespace-nowrap">ইমেইল / ইউজারনেম</th>
                          <th className="p-3 font-semibold whitespace-nowrap">ভূমিকা (Role)</th>
                          <th className="p-3 font-semibold whitespace-nowrap">যোগদানের তারিখ</th>
                          <th className="p-3 font-semibold text-right whitespace-nowrap">পদক্ষেপ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            {/* 1. Name Column */}
                            <td className="p-3">
                              <div className="flex flex-col min-w-[120px]">
                                <span className="font-bold text-gray-950 text-xs sm:text-sm">{u.name}</span>
                                <span className="text-[10px] text-gray-400">ID: {u.id}</span>
                              </div>
                            </td>
                            {/* 2. Email Column */}
                            <td className="p-3">
                              <div className="flex flex-col min-w-[140px] text-xs font-mono text-gray-500">
                                <span className="font-semibold text-gray-700">@{u.username}</span>
                                <span className="text-[10px] truncate max-w-[180px]">{u.email || '—'}</span>
                              </div>
                            </td>
                            {/* 3. Role Column (Changeable select dropdown) */}
                            <td className="p-3">
                              <div className="flex items-center min-w-[110px]">
                                {u.id !== loggedInUser.id ? (
                                  <select
                                    value={u.role}
                                    onChange={(e) => handleUpdateUserRole(u.id, e.target.value as any)}
                                    className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-white text-gray-800 font-medium outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                  >
                                    <option value="editor">সম্পাদক (Editor)</option>
                                    <option value="reporter">প্রতিবেদক (Reporter)</option>
                                    <option value="admin">এডমিন (Admin)</option>
                                    <option value="user">ইউজার (User)</option>
                                  </select>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-700 border border-red-100">
                                    এডমিন (স্বয়ং)
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* 4. Creation Date Column */}
                            <td className="p-3 text-slate-600 font-medium whitespace-nowrap">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' }) : '১৬ জুন, ২০২৬'}
                            </td>
                            {/* 5. Action Column */}
                            <td className="p-3 text-right">
                              {u.id !== loggedInUser.id ? (
                                <div className="flex flex-col gap-1.5 items-end justify-end min-w-[120px]">
                                  {editingUserPasswordId === u.id ? (
                                    <div className="flex flex-col gap-1 bg-slate-100 p-1.5 rounded border border-gray-200">
                                      <input
                                        type="text"
                                        placeholder="পাসওয়ার্ড লিখুন (৬+)"
                                        value={newPasswordForUser}
                                        onChange={e => setNewPasswordForUser(e.target.value)}
                                        className="text-xs px-2 py-1 bg-white border border-gray-300 rounded text-gray-800 outline-none focus:ring-1 focus:ring-primary w-28 sm:w-36 font-mono"
                                        minLength={6}
                                      />
                                      <div className="flex gap-1 justify-end">
                                        <button
                                          onClick={() => {
                                            if (newPasswordForUser.trim().length < 6) {
                                              notify('পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে!', 'err');
                                              return;
                                            }
                                            handleUpdateUserPassword(u.id, newPasswordForUser.trim());
                                            setEditingUserPasswordId(null);
                                            setNewPasswordForUser('');
                                          }}
                                          className="p-1 px-2 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold"
                                        >
                                          সেভ
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingUserPasswordId(null);
                                            setNewPasswordForUser('');
                                          }}
                                          className="p-1 px-2 bg-gray-400 hover:bg-gray-500 text-white rounded text-[10px] font-bold"
                                        >
                                          বাতিল
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-row gap-1 items-center justify-end">
                                      <button
                                        onClick={() => {
                                          setEditingUserPasswordId(u.id);
                                          setNewPasswordForUser('');
                                        }}
                                        className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded"
                                      >
                                        পাসওয়ার্ড রিসেট
                                      </button>
                                      <button
                                        id={`delete-user-${u.id}`}
                                        onClick={async () => {
                                          if (confirm(`নিশ্চিতভাবে এই সদস্যকে (${u.name}) কর্মীবাহিনী থেকে অপসারণ করতে চান?`)) {
                                            await DBService.deleteUser(u.id);
                                            notify('টিম থেকে সদস্য অপসারিত হয়েছে।');
                                            loadData();
                                          }
                                        }}
                                        className="p-1 px-2.5 bg-red-50 hover:bg-red-100 text-primary text-[10px] font-bold rounded"
                                      >
                                        অপসারণ
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-bold italic">সক্রিয় সেশন</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB-10: PASSWORD CHANGE (Visible to anyone logged in) */}
            {activeTab === 'password' && (
              <div className="max-w-2xl bg-white p-6 sm:p-8 rounded-xl border border-gray-150 shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 font-serif-bengali flex items-center gap-2">🔑 পাসওয়ার্ড পরিবর্তন করুন</h3>
                  <p className="text-xs text-gray-400 mt-1">আপনার অ্যাকাউন্ট সুরক্ষায় নতুন গোপন পাসওয়ার্ড সেট করুন।</p>
                </div>
                
                <form onSubmit={handleUpdateOwnPassword} className="flex flex-col gap-5 max-w-md">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-500">ইউজারনেম</span>
                    <span className="font-mono text-sm text-gray-700 bg-slate-50 px-3 py-2 rounded-lg border border-gray-100 select-all">@{loggedInUser.username}</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="own-new-password" className="text-xs font-bold text-gray-700">নতুন পাসওয়ার্ড লিখুন *</label>
                    <input
                      id="own-new-password"
                      type="password"
                      value={newOwnPassword}
                      onChange={e => setNewOwnPassword(e.target.value)}
                      placeholder="অন্তত ৬টি অক্ষর বা সংখ্যা দিন"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white text-gray-800"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="own-confirm-password" className="text-xs font-bold text-gray-700">নতুন পাসওয়ার্ড নিশ্চিত করুন *</label>
                    <input
                      id="own-confirm-password"
                      type="password"
                      value={confirmOwnPassword}
                      onChange={e => setConfirmOwnPassword(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ড আবার টাইপ করুন"
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white text-gray-800"
                      required
                      minLength={6}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="bg-primary hover:bg-primary-dark text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-sm w-full sm:w-fit transition-colors mt-2 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isUpdatingPassword ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড নিশ্চিত করুন'}
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
