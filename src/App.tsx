/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Play, Plus, Trash2, X, Sparkles, Loader2, ChevronDown, Check, Star,
  Search, Archive, Folder, ExternalLink, Activity, Settings, Download, Pin, PinOff,
  FolderSync, MousePointerClick, Tag, FileJson, ShieldCheck, Lock, Ban
} from 'lucide-react';
import { auth } from "./lib/firebase";
import { syncWorkspacesToCloud, fetchWorkspacesFromCloud, syncCreditsToCloud, fetchCreditsFromCloud } from "./lib/sync";
import { onAuthStateChanged } from "firebase/auth";

import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PricingModal } from './components/PricingModal';
import { ExtensionModal } from './components/ExtensionModal';
import { FaqModal } from './components/FaqModal';
import { SupportModal } from './components/SupportModal';
import { AuthPage } from './pages/AuthPage';

// --- TYPES ---
export interface Tab {
  id: string;
  title: string;
  url: string;
}

export interface Workspace {
  id: string;
  name: string;
  purpose: string;
  tag: string;
  color: string;
  tabs: Tab[];
  createdAt: string;
  lastOpenedAt: string | null;
  isPinned?: boolean;
  openCount?: number;
}

// --- CONSTANTS ---
const TAGS = ['Project', 'Research', 'Study', 'Personal', 'Work'];
const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Rose', value: '#ef4444' },
  { name: 'Slate', value: '#64748b' }
];

const STALENESS_DAYS = 5;

// --- HELPERS ---
const generateId = () => Math.random().toString(36).substring(2, 9);

const parseBulkUrls = (text: string): Tab[] => {
  const lines = text.split('\n');
  const newTabs: Tab[] = [];
  lines.forEach(line => {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const match = line.match(urlPattern);
    if (match) {
      const url = match[0];
      let title = line.replace(url, '').trim();
      if (!title) {
        try {
          const u = new URL(url);
          title = u.hostname;
        } catch {
          title = url;
        }
      }
      // Remove leading hyphens or bullets if they copy-pasted a list
      title = title.replace(/^[-*•\s]+/, '').trim() || title;
      newTabs.push({ id: generateId(), title, url });
    }
  });
  return newTabs;
};

// --- COMPONENTS ---

function LandingPage({ onCreateWorkspace, onStarterSelect, onShowExtensionModal }: { onCreateWorkspace: () => void; onStarterSelect: () => void; onShowExtensionModal: () => void }) {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-[#1A1A1A] selection:bg-indigo-100 selection:text-indigo-900 flex flex-col">
      {/* HEADER */}
      <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/src/assets/images/contextdock_logo_1783388416642.jpg" alt="ContextDock Logo" className="w-[68px] h-[68px] mix-blend-multiply object-contain rounded-xl" />
            <h1 className="text-2xl font-extrabold tracking-tight"><span className="text-gray-900">Context</span><span className="text-indigo-600">Dock</span></h1>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <button onClick={() => setIsPricingModalOpen(true)} className="hover:text-indigo-600 transition-colors">Pricing</button>
            <button onClick={() => setIsFaqModalOpen(true)} className="hover:text-indigo-600 transition-colors">FAQ</button>
            <button onClick={() => setIsSupportModalOpen(true)} className="hover:text-indigo-600 transition-colors">Support</button>
          </div>

          <button 
            onClick={() => {
              if (auth?.currentUser) {
                setIsPricingModalOpen(true);
              } else {
                navigate('/auth');
              }
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md transition-colors"
          >
            Create Workspace
          </button>
        </div>
      </nav>

      <main className="flex-1">
        {/* HERO SECTION */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-6xl lg:text-8xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]">
              Never Lose <br/><span className="text-indigo-600">Context</span> Again.
            </h2>
            <p className="text-xl lg:text-2xl text-gray-500 leading-relaxed mb-6 max-w-xl font-medium">
              Automatically save, organize, and restore your tabs, documents, and browsing sessions.
            </p>
            <p className="text-xl lg:text-2xl font-bold text-indigo-600 mb-10 max-w-xl">
              Your work. Your flow. Always protected.
            </p>

            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-indigo-50/80 text-indigo-800 text-sm font-bold mb-10 shadow-sm border border-indigo-100">
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                 <Check size={12} strokeWidth={3} />
              </div>
              Smart Saving &bull; One-Click Restore &bull; 100% Private
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <button onClick={() => {
                if (auth?.currentUser) {
                  setIsPricingModalOpen(true);
                } else {
                  navigate('/auth');
                }
              }} className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full text-base font-bold text-gray-800 transition-all shadow-sm">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg" alt="Chrome" className="w-6 h-6" />
                Get your Chrome Extension
              </button>
              <button onClick={() => {
                if (auth?.currentUser) {
                  setIsPricingModalOpen(true);
                } else {
                  navigate('/auth');
                }
              }} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-base font-bold shadow-xl transition-all">
                Create Your Workspace
              </button>
            </div>
          </div>
          
          <div className="relative lg:h-[600px] flex items-center justify-center">
            {/* The Dashboard Mockup Image */}
            <div className="relative w-full h-full flex items-center justify-center">
               <img src="/src/assets/images/my-vault-image.png" alt="Hero Illustration" className="w-full h-auto object-contain rounded-3xl" />
            </div>
          </div>
        </div>

        {/* FEATURES SECTION */}
        <div id="features" className="bg-[#F8F9FA] py-24 lg:py-32 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6">
                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                What ContextDock does
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                Close your laptop. <br/>Keep your <span className="text-indigo-600">context.</span>
              </h2>
              <p className="text-lg text-gray-500 font-medium leading-relaxed mb-12">
                Every tab, every open document, every window — saved the moment you close them, restored the moment you need them back.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <FolderSync size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Auto-Save, Not Manual Save</h4>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">Close a window with 2 or more tabs open, and ContextDock saves it in the background. No button to remember. No form to fill in when you're exhausted at 11pm.</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <MousePointerClick size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Restore in One Click</h4>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">Open a saved session and every tab comes back — same titles, same order. Pick up exactly where you left off, instead of rebuilding it from memory.</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <Tag size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Organize by Purpose, Not Just Time</h4>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">Turn an auto-saved session into a named workspace — "E-Cell Resume Push," "AI Architect Build" — so you remember why those tabs were open, not just when.</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <FileJson size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Export & Import (JSON)</h4>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">Your sessions live in your browser extension. Export them as a JSON file and import it into your ContextDock dashboard to view, search, and manage them anywhere.</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <Search size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">Session Search</h4>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">Find any saved workspace by name or by what was in it. Starter includes basic search; Pro adds advanced search across tab titles and URLs.</p>
                </div>
                <div>
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">100% Local & Private</h4>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium">Your tabs and sessions are stored locally in your browser, not on a server watching what you read. Nothing leaves your machine unless you choose to export it.</p>
                </div>
              </div>
            </div>
            
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="absolute inset-0 bg-indigo-200 rounded-[3rem] blur-3xl opacity-40 transform translate-x-10 translate-y-10"></div>
                <div className="relative bg-[#1A1A1A] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden text-white p-6">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center"><Folder size={14} /></div>
                     <span className="font-bold">ContextDock</span>
                     <div className="ml-auto text-xs bg-gray-800 px-2 py-1 rounded">Export JSON</div>
                   </div>
                   
                   <div className="mb-6">
                     <h5 className="font-bold text-sm mb-3">Current Window</h5>
                     <div className="bg-gray-800 rounded-lg p-3">
                       <div className="text-xs font-medium text-gray-400 mb-2">3 tabs</div>
                       <div className="flex items-center gap-2 mb-2">
                         <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                         <span className="text-xs truncate">Stripe - Dashboard</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                         <span className="text-xs truncate">YouTube - Music</span>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <input type="text" placeholder="Workspace Name" className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-xs text-white outline-none" />
                     <button className="w-full bg-white text-black font-bold text-xs py-2 rounded">Save Workspace</button>
                   </div>
                </div>
                {/* Decorative Chrome Icon */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-gray-50">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg" alt="Chrome" className="w-12 h-12" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS SECTION */}
        <div id="how-it-works" className="py-24 lg:py-32 max-w-7xl mx-auto px-6 lg:px-8 text-center overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6">
            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
            How it works
          </div>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Three steps. Zero typing.
          </h2>
          <p className="text-lg text-gray-500 font-medium leading-relaxed mb-20 max-w-2xl mx-auto">
            You don't save anything. ContextDock watches your windows and saves them for you — you just tell it when a session is worth naming.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
             {/* Step 1 */}
             <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-sm border border-indigo-100 z-10">1</div>
                <h4 className="font-bold text-xl text-gray-900 mb-4 z-10">Add the Chrome Extension</h4>
                <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-xs mx-auto mb-10 z-10">
                  Install ContextDock from the Chrome Web Store in one click. It runs quietly in the background from the moment it's added — no setup, no account required to start.
                </p>
                {/* Mockup 1 */}
                <div className="w-full h-72 bg-gradient-to-br from-indigo-100/50 to-purple-50 rounded-3xl p-6 relative overflow-hidden border border-indigo-50 flex items-center justify-center group hover:shadow-lg transition-all">
                   <div className="absolute top-4 left-4 flex gap-1.5 opacity-50">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                   </div>
                   <div className="absolute top-4 right-4 flex gap-3 text-indigo-300 opacity-50">
                     <Star size={14} />
                     <Folder size={14} />
                   </div>
                   
                   <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-[80%] max-w-[240px] text-center relative z-10 transform transition-transform group-hover:scale-105">
                     <div className="flex items-center justify-center gap-2 mb-2">
                       <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white"><Folder size={12}/></div>
                       <span className="font-bold text-gray-900 text-sm">ContextDock</span>
                     </div>
                     <p className="text-xs text-gray-500 mb-4">Save tabs. Restore anytime.</p>
                     <button className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-xs font-bold shadow-md hover:bg-indigo-700 transition-colors">Add to Chrome</button>
                     {/* Cursor arrow pointing to button */}
                     <div className="absolute -bottom-4 -right-2 text-indigo-900 transform -rotate-12 z-20">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
                     </div>
                   </div>
                   {/* Decorative puzzle piece */}
                   <div className="absolute bottom-6 left-6 text-indigo-500 opacity-80 transform -rotate-12">
                     <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><path d="M19.439 7.842c-.52-.39-1.127-.674-1.786-.81a4 4 0 0 0-4.81-4.81c-.136-.659-.42-1.266-.81-1.786A3 3 0 0 0 6.643 3.643c-.452.452-.77.994-.937 1.576A3.993 3.993 0 0 0 4 9v6a4 4 0 0 0 4 4h6a3.993 3.993 0 0 0 3.781-1.706c.582-.167 1.124-.485 1.576-.937a3 3 0 0 0-1.206-4.996c.659-.136 1.266-.42 1.786-.81a3 3 0 0 0-4.998-1.209Z"/><path d="M14 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" fill="white"/></svg>
                   </div>
                   {/* Decorative arrow from puzzle to extension */}
                   <div className="absolute right-6 top-1/2 text-indigo-400 opacity-60">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                   </div>
                </div>
             </div>

             {/* Step 2 */}
             <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-sm border border-indigo-100 z-10">2</div>
                <h4 className="font-bold text-xl text-gray-900 mb-4 z-10">Browse as Usual</h4>
                <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-xs mx-auto mb-10 z-10">
                  Work across as many tabs and windows as you need. When you close a window with 2+ tabs open, ContextDock saves it automatically. Nothing to click, nothing to remember.
                </p>
                {/* Mockup 2 */}
                <div className="w-full h-72 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-3xl p-6 relative overflow-hidden border border-blue-100/50 flex flex-col group hover:shadow-lg transition-all">
                   {/* Browser Tabs Mockup */}
                   <div className="flex gap-2 mb-4 opacity-80 mt-2 px-2">
                     <div className="bg-white shadow-sm border border-gray-100 rounded-t-lg px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold text-gray-600 truncate w-1/3">
                       <Play size={10} className="text-red-500" fill="currentColor"/> YouTube
                     </div>
                     <div className="bg-white/60 shadow-sm border border-gray-100/50 rounded-t-lg px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold text-gray-500 truncate w-1/3">
                       <span className="w-3 h-3 bg-black text-white flex items-center justify-center rounded-[2px] font-serif">N</span> Notion
                     </div>
                     <div className="bg-white/60 shadow-sm border border-gray-100/50 rounded-t-lg px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold text-gray-500 truncate w-1/3">
                       <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-green-500"></div> Drive
                     </div>
                   </div>
                   
                   <div className="flex-1 bg-white/40 backdrop-blur rounded-xl border border-white/60 flex items-center justify-center relative">
                      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-[70%] text-center z-10 transform transition-transform group-hover:scale-105">
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <div className="w-5 h-5 bg-indigo-600 rounded-sm flex items-center justify-center text-white"><Folder size={10}/></div>
                          <span className="font-bold text-gray-900 text-sm">ContextDock</span>
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-indigo-100 flex items-center justify-center mx-auto mb-3">
                           <Check size={20} className="text-indigo-600" strokeWidth={3} />
                        </div>
                        <p className="text-xs font-bold text-indigo-600">Saving in background...</p>
                      </div>
                      
                      {/* Floating icons */}
                      <div className="absolute left-2 top-1/3 w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg transform -rotate-12 opacity-90"><Folder size={20} fill="currentColor"/></div>
                      <div className="absolute right-2 bottom-6 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-100 transform rotate-12 opacity-90">
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center"><Sparkles size={12} className="text-yellow-600"/></div>
                      </div>
                      <div className="absolute left-6 bottom-4 w-8 h-8 bg-white rounded-lg shadow-md border border-gray-100 flex flex-col gap-1 p-1.5 opacity-80 rotate-6">
                        <div className="w-full h-1 bg-gray-200 rounded-full"></div>
                        <div className="w-2/3 h-1 bg-gray-200 rounded-full"></div>
                        <div className="w-full h-1 bg-gray-200 rounded-full"></div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Step 3 */}
             <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-sm border border-indigo-100 z-10">3</div>
                <h4 className="font-bold text-xl text-gray-900 mb-4 z-10">Export JSON & Import</h4>
                <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-xs mx-auto mb-10 z-10">
                  Open the extension, export your saved sessions as a JSON file, then import it into your ContextDock dashboard. From there, name your workspaces, search past sessions, and restore any of them in one click.
                </p>
                {/* Mockup 3 */}
                <div className="w-full h-72 bg-gradient-to-bl from-purple-50 to-white rounded-3xl p-6 relative overflow-hidden border border-gray-100 flex items-center justify-center group hover:shadow-lg transition-all">
                   {/* Left Window - Export */}
                   <div className="absolute left-4 top-4 bottom-4 w-2/3 bg-white rounded-xl shadow-md border border-gray-100 p-4 flex flex-col z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center text-white"><Folder size={10}/></div>
                          <span className="font-bold text-gray-900 text-xs">ContextDock</span>
                        </div>
                      </div>
                      <button className="bg-indigo-50 text-indigo-600 border border-indigo-100 rounded px-2 py-1 text-[10px] font-bold w-fit mb-4">Export JSON</button>
                      
                      <h5 className="font-bold text-[10px] text-gray-800 mb-1">Current Window</h5>
                      <span className="text-[9px] text-gray-400 mb-2">3 tabs</span>
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded-sm shrink-0"></div><span className="text-[9px] truncate">Razorpay - Best Payment</span></div>
                        <div className="flex items-center gap-1.5"><Play size={12} className="text-red-500 shrink-0"/><span className="text-[9px] truncate">(9886) YouTube</span></div>
                      </div>

                      <h5 className="font-bold text-[10px] text-gray-800 mb-1">My Workspaces</h5>
                      <div className="bg-gray-50 rounded p-1.5 flex justify-between items-center border border-gray-100 mt-auto">
                        <span className="text-[8px] font-bold text-gray-600">MY WORKSPACE</span>
                        <button className="text-[8px] bg-white border border-gray-200 rounded px-1.5 py-0.5 font-bold">Launch</button>
                      </div>
                   </div>

                   {/* Right Modal - Import */}
                   <div className="absolute right-4 top-10 bottom-6 w-2/3 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 flex flex-col z-20 transform transition-transform group-hover:scale-105 group-hover:-translate-x-2">
                     <div className="flex justify-between items-center mb-2">
                       <div className="flex items-center gap-1.5">
                         <Download size={10} className="text-indigo-600" />
                         <span className="font-bold text-gray-900 text-[10px]">Import Data</span>
                       </div>
                       <X size={10} className="text-gray-400" />
                     </div>
                     <p className="text-[8px] text-gray-500 leading-tight mb-2">Paste the JSON data exported from the extension to sync your workspaces.</p>
                     <div className="flex-1 bg-gray-50 border border-gray-100 rounded p-2 text-[10px] text-gray-400 font-mono mb-2">
                       {`{...}`}
                     </div>
                     <button className="w-full bg-indigo-600 text-white text-[10px] font-bold rounded py-1.5 mt-auto">Import Data</button>
                   </div>
                   
                   {/* Dashed arrow */}
                   <svg className="absolute left-[45%] top-[25%] z-15 w-16 h-12 text-indigo-300 overflow-visible" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3">
                     <path d="M0 0 Q 30 10 40 30" />
                     <path d="M 35 25 L 40 30 L 35 35" strokeDasharray="none" />
                   </svg>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0A0F1F] text-white py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-indigo-500 rounded text-white flex items-center justify-center"><Folder size={18} /></div>
                <span className="font-bold text-xl">ContextDock</span>
              </div>
              <p className="text-sm text-gray-400 font-medium mb-6">
                Your browsing. Saved intelligently.<br/>Your context. Always with you.
              </p>
              <div className="flex gap-4 text-gray-400">
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors"><span className="text-xs">𝕏</span></div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors"><span className="text-xs">in</span></div>
                <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors"><span className="text-xs">git</span></div>
              </div>
            </div>
            
            <div>
              <h5 className="font-bold text-white mb-6">Product</h5>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><button onClick={() => setIsPricingModalOpen(true)} className="hover:text-white transition-colors">Pricing</button></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold text-white mb-6">Company</h5>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold text-white mb-6">Support</h5>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li><button onClick={() => setIsFaqModalOpen(true)} className="hover:text-white transition-colors">Help Center</button></li>
                <li><button onClick={() => setIsSupportModalOpen(true)} className="hover:text-white transition-colors">Contact Us</button></li>
                <li><button onClick={() => setIsFaqModalOpen(true)} className="hover:text-white transition-colors">FAQ</button></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-gray-500 font-medium">© 2026 ContextDock. All rights reserved.</p>
            <button onClick={() => {
              if (auth?.currentUser) {
                setIsPricingModalOpen(true);
              } else {
                navigate('/auth');
              }
            }} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-lg border border-gray-700 transition-colors">
              Create Workspace
            </button>
          </div>
        </div>
      </footer>
      
      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} onStarterSelect={onStarterSelect} />
      <FaqModal isOpen={isFaqModalOpen} onClose={() => setIsFaqModalOpen(false)} />
      <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />
      

    </div>
  );
}

function SmartAssistantModal({ 

  isOpen, 
  onClose, 
  workspaces 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  workspaces: Workspace[];
}) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setInsight(null);
    setError(null);
    try {
      const res = await fetch('/api/analyze-workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaces })
      });
      const data = await res.json();
      if (res.ok) {
        setInsight(data.result);
      } else {
        setError(data.error || 'Failed to analyze workspaces');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3 text-gray-800 font-medium">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <Sparkles size={18} />
                </div>
                AI Workspace Analyst
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {insight ? (
                <div className="prose prose-slate prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-600 leading-relaxed">{insight}</div>
                </div>
              ) : error ? (
                <div className="text-red-500 bg-red-50 p-4 rounded-lg text-sm">{error}</div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={24} className="text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Needs a fresh perspective?</h3>
                  <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                    Let AI analyze your active and dormant workspaces to suggest what to focus on and what to clean up.
                  </p>
                  <button 
                    onClick={analyze}
                    disabled={loading || workspaces.length === 0}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {loading ? 'Analyzing...' : 'Analyze Workspaces'}
                  </button>
                  {workspaces.length === 0 && (
                    <p className="text-xs text-gray-400 mt-3">Add some workspaces first to get insights.</p>
                  )}
                </div>
              )}
            </div>
            {insight && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button onClick={() => setInsight(null)} className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mr-4">
                  Reset
                </button>
                <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors">
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function LaunchpadModal({ 
  workspace, 
  onClose,
  onDeleteTab
}: { 
  workspace: Workspace | null; 
  onClose: () => void; 
  onDeleteTab: (workspaceId: string, tabId: string) => void;
}) {
  if (!workspace) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
          <div>
            <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <ExternalLink size={18} /> Launchpad
            </h2>
            <p className="text-indigo-700 text-sm mt-1">Your context is ready. Click below to open your tabs.</p>
          </div>
          <button onClick={onClose} className="p-2 text-indigo-500 hover:text-indigo-700 transition-colors rounded-full hover:bg-indigo-100/50">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-3">
          <p className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2">Context for {workspace.name}</p>
          {workspace.tabs.map((tab, idx) => {
             let domain = '';
             try {
               domain = new URL(tab.url).hostname;
             } catch(e) {}
             return (
               <div key={tab.id} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-100 rounded-xl group transition-all">
                 <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                   {domain ? (
                     <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} className="w-5 h-5 object-cover" alt="" />
                   ) : (
                     <span className="text-xs font-bold text-gray-500">{idx + 1}</span>
                   )}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">{tab.title}</div>
                   <div className="text-xs text-gray-500 truncate">{tab.url}</div>
                 </div>
                 <div className="flex items-center gap-2">
                   <button 
                     onClick={() => onDeleteTab(workspace.id, tab.id)}
                     className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg opacity-0 group-hover:opacity-100"
                     title="Delete Tab"
                   >
                     <Trash2 size={16} />
                   </button>
                   <a 
                     href={tab.url}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg"
                     title="Launch Tab"
                   >
                     <ExternalLink size={18} />
                   </a>
                 </div>
               </div>
             );
          })}
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <button 
            onClick={() => {
              let blocked = false;
              workspace.tabs.forEach(tab => {
                const newWin = window.open(tab.url, '_blank');
                if (!newWin) blocked = true;
              });
              if (blocked) {
                alert("Popup Blocker: Your browser blocked some tabs from opening. Please allow popups for this site (usually an icon in your address bar) to open multiple tabs at once.");
              }
            }} 
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-full shadow-md transition-colors"
          >
            Launch All
          </button>
          <button onClick={onClose} className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-full transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function WorkspaceCard({ 
  workspace, 
  onOpen, 
  onEdit, 
  onArchive,
  onPin,
  isDormant
}: { 
  key?: React.Key;
  workspace: Workspace; 
  onOpen: (w: Workspace) => void;
  onEdit: (w: Workspace) => void;
  onArchive: (id: string) => void;
  onPin: (id: string) => void;
  isDormant?: boolean;
}) {
  const [opening, setOpening] = useState(false);

  const handleOpen = () => {
    setOpening(true);
    onOpen(workspace);
    setTimeout(() => setOpening(false), 2000);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex flex-col transition-all duration-200 
        ${isDormant 
          ? 'bg-[#F9FAFB] border border-dashed border-[#D1D5DB] rounded-2xl p-6 relative' 
          : 'bg-white border border-[#E5E7EB] hover:border-indigo-100 rounded-2xl p-6 shadow-sm'
        }`}
    >
      {isDormant && (
        <div className="absolute -top-3 left-6">
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200 uppercase tracking-tighter">
            Stale: {Math.floor((new Date().getTime() - new Date(workspace.lastOpenedAt || workspace.createdAt).getTime()) / (1000 * 60 * 60 * 24))} Days
          </span>
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div>
          <span 
            className="px-2 py-1 text-[10px] font-bold uppercase rounded mb-2 inline-block opacity-90"
            style={{ backgroundColor: `${workspace.color}15`, color: workspace.color }}
          >
            {workspace.tag}
          </span>
          <h3 className={`text-xl font-bold line-clamp-1 ${isDormant ? 'text-gray-500' : 'text-[#1A1A1A]'}`}>
            {workspace.name}
          </h3>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <span className={`text-sm font-semibold block ${isDormant ? 'text-gray-400' : 'text-gray-900'}`}>{workspace.tabs.length} Tabs</span>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {workspace.lastOpenedAt 
              ? 'Opened ' + new Date(workspace.lastOpenedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
              : 'Never opened'}
          </p>
        </div>
      </div>
      
      <p className={`text-sm italic mb-6 flex-1 leading-relaxed line-clamp-2 ${isDormant ? 'text-gray-400' : 'text-gray-600'}`}>
        "{workspace.purpose || "No specific purpose recorded."}"
      </p>

      {isDormant ? (
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button onClick={() => onArchive(workspace.id)} className="px-3 py-1.5 bg-white border border-gray-200 text-xs text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors">Delete</button>
            <button onClick={() => onEdit(workspace)} className="px-3 py-1.5 bg-white border border-gray-200 text-xs text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors">Edit</button>
          </div>
          <button onClick={handleOpen} disabled={opening || workspace.tabs.length === 0} className="px-4 py-1.5 text-gray-500 text-xs underline font-medium hover:text-gray-700 transition-colors">
            {opening ? 'Opening...' : 'Keep anyway'}
          </button>
        </div>
      ) : (
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {workspace.tabs.slice(0, 3).map((t) => {
                let domain = '';
                try {
                  domain = new URL(t.url).hostname;
                } catch(e) {}
                return (
                <div key={t.id} className="w-6 h-6 rounded-full bg-white border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase overflow-hidden shadow-sm">
                  {domain ? (
                    <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} className="w-full h-full object-cover" alt="" />
                  ) : (
                    t.title.charAt(0).toUpperCase()
                  )}
                </div>
              )})}
              {workspace.tabs.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-400">
                  +{workspace.tabs.length - 3}
                </div>
              )}
            </div>
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
              <button onClick={() => onPin(workspace.id)} className="p-1.5 text-gray-400 hover:text-amber-500 transition-colors rounded-lg" title={workspace.isPinned ? "Unpin" : "Pin"}>
                {workspace.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
              </button>
              <button onClick={() => onEdit(workspace)} className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg" title="Edit Workspace">
                <Settings size={14} />
              </button>
              <button onClick={() => onArchive(workspace.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg" title="Archive / Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleOpen}
            disabled={opening || workspace.tabs.length === 0}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-bold shadow-md disabled:opacity-70 transition-all flex items-center justify-center gap-2"
          >
            {opening ? <Loader2 size={16} className="animate-spin" /> : 'Restore Context'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

function WorkspaceForm({ 
  initialData, 
  onSave, 
  onCancel 
}: { 
  initialData?: Workspace | null; 
  onSave: (w: Workspace) => void; 
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [purpose, setPurpose] = useState(initialData?.purpose || '');
  const [tag, setTag] = useState(initialData?.tag || TAGS[0]);
  const [color, setColor] = useState(initialData?.color || COLORS[0].value);
  const [tabs, setTabs] = useState<Tab[]>(initialData?.tabs || []);
  
  const [bulkInput, setBulkInput] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Single tab input
  const [newTabTitle, setNewTabTitle] = useState('');
  const [newTabUrl, setNewTabUrl] = useState('');

  const handleAddTab = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTabUrl) return;
    
    let url = newTabUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    
    setTabs([...tabs, { id: generateId(), title: newTabTitle.trim() || url, url }]);
    setNewTabTitle('');
    setNewTabUrl('');
  };

  const handleBulkAdd = () => {
    if (!bulkInput.trim()) return;
    const parsed = parseBulkUrls(bulkInput);
    setTabs([...tabs, ...parsed]);
    setBulkInput('');
    setIsBulkMode(false);
  };

  const removeTab = (id: string) => {
    setTabs(tabs.filter(t => t.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    let finalTabs = [...tabs];
    
    if (isBulkMode && bulkInput.trim()) {
      finalTabs = [...finalTabs, ...parseBulkUrls(bulkInput)];
    } else if (!isBulkMode && newTabUrl.trim()) {
      let url = newTabUrl.trim();
      if (!url.startsWith('http')) url = 'https://' + url;
      finalTabs.push({ id: generateId(), title: newTabTitle.trim() || url, url });
    }
    
    const workspace: Workspace = {
      id: initialData?.id || generateId(),
      name: name.trim(),
      purpose: purpose.trim(),
      tag,
      color,
      tabs: finalTabs,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      lastOpenedAt: initialData?.lastOpenedAt || null
    };
    onSave(workspace);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800 tracking-tight">
            {initialData ? 'Edit Workspace' : 'Capture New Workspace'}
          </h2>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6">
            {/* Core Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Workspace Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Design Audit"
                  className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none font-medium text-[#1A1A1A] placeholder:text-gray-400 transition-colors"
                  autoFocus
                  required
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                  Purpose
                </label>
                <input 
                  type="text" 
                  value={purpose} 
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="What's the context for this session?"
                  className="w-full border-b border-gray-200 py-2 focus:border-indigo-500 outline-none text-sm text-[#1A1A1A] placeholder:text-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Categorization */}
            <div className="flex flex-wrap gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Category Tag</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${tag === t ? 'bg-white shadow-sm border border-gray-200 text-[#1A1A1A]' : 'text-gray-500 hover:bg-gray-200/50'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Color Accent</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${color === c.value ? 'scale-110 ring-2 ring-offset-2 ring-gray-300' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs Management */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] font-bold uppercase text-gray-400">
                  Tabs to Capture ({tabs.length})
                </label>
                <button 
                  type="button"
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className="text-[10px] font-bold uppercase text-indigo-600 hover:text-indigo-700"
                >
                  {isBulkMode ? 'Switch to Single Add' : 'Bulk Paste URLs'}
                </button>
              </div>

              {isBulkMode ? (
                <div className="mb-4">
                  <textarea
                    value={bulkInput}
                    onChange={e => setBulkInput(e.target.value)}
                    placeholder="Paste multiple URLs here (one per line)..."
                    className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none text-sm font-mono placeholder:font-sans"
                  />
                  <div className="flex justify-end mt-2">
                    <button 
                      type="button"
                      onClick={handleBulkAdd}
                      disabled={!bulkInput.trim()}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Parse & Add
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    value={newTabTitle}
                    onChange={e => setNewTabTitle(e.target.value)}
                    placeholder="Title (optional)"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none text-sm text-[#1A1A1A]"
                    onKeyDown={e => e.key === 'Enter' && handleAddTab()}
                  />
                  <input 
                    type="text" 
                    value={newTabUrl}
                    onChange={e => setNewTabUrl(e.target.value)}
                    placeholder="URL (https://...)"
                    className="flex-[2] px-3 py-2 rounded-lg border border-gray-200 focus:border-indigo-500 outline-none text-sm text-[#1A1A1A]"
                    onKeyDown={e => e.key === 'Enter' && handleAddTab()}
                  />
                  <button 
                    type="button"
                    onClick={() => handleAddTab()}
                    disabled={!newTabUrl}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              )}

              {/* Tab List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {tabs.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                    No tabs added yet.
                  </div>
                ) : (
                  <AnimatePresence>
                    {tabs.map((tab, idx) => {
                      let domain = '';
                      try {
                        domain = new URL(tab.url).hostname;
                      } catch(e) {}
                      return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={tab.id}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg group"
                      >
                        <div className="w-6 h-6 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center flex-shrink-0 cursor-grab active:cursor-grabbing shadow-sm">
                          {domain ? (
                            <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="text-[10px] font-bold text-gray-600">{idx + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-600 truncate font-medium" title={tab.title}>{tab.title}</div>
                          <div className="text-[10px] text-gray-400 truncate hidden" title={tab.url}>{tab.url}</div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeTab(tab.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#E5E7EB] flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-full shadow-md transition-colors"
          >
            {initialData ? 'Save Changes' : 'Save Workspace'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ImportModal({
  isOpen,
  onClose,
  onImport
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
}) {
  const [inputData, setInputData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsedWorkspaces, setParsedWorkspaces] = useState<any[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleParse = () => {
    setError(null);
    if (!inputData.trim()) {
      setError("Please paste the JSON data.");
      return;
    }
    try {
      const parsed = JSON.parse(inputData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setParsedWorkspaces(parsed);
        setSelectedIds(new Set());
      } else if (Array.isArray(parsed) && parsed.length === 0) {
        setError("The JSON data does not contain any workspaces.");
      } else {
        setError("Invalid data format. Expected a JSON array.");
      }
    } catch (e) {
      setError("Invalid JSON format. Please ensure you copied the entire text.");
    }
  };

  const handleImportSelected = () => {
    if (!parsedWorkspaces) return;
    const toImport = parsedWorkspaces.filter((w, idx) => selectedIds.has(w.id || w.name || String(idx)));
    onImport(toImport);
    setInputData("");
    setParsedWorkspaces(null);
    setSelectedIds(new Set());
  };
  
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setInputData("");
      setParsedWorkspaces(null);
      setError(null);
      setSelectedIds(new Set());
    }, 200);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3 text-gray-800 font-medium">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Download size={18} />
            </div>
            {parsedWorkspaces ? 'Select Workspaces' : 'Import Data'}
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {!parsedWorkspaces ? (
            <>
              <p className="text-sm text-gray-500">
                Paste the JSON data exported from the ContextDock browser extension to sync your workspaces.
              </p>
              
              <textarea
                value={inputData}
                onChange={e => {
                  setInputData(e.target.value);
                  setError(null);
                }}
                placeholder="[{...}]"
                className="w-full h-48 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none text-sm font-mono placeholder:font-sans"
              />
              
              {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                Choose the workspaces you want to import.
              </p>
              
              <div className="space-y-2 border border-gray-100 rounded-xl p-2 bg-gray-50/50 max-h-60 overflow-y-auto">
                {parsedWorkspaces.map((w, idx) => {
                  const id = w.id || w.name || String(idx);
                  const isSelected = selectedIds.has(id);
                  return (
                    <div 
                      key={id}
                      onClick={() => toggleSelection(id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-indigo-600' : 'bg-white border border-gray-300'
                      }`}>
                        {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{w.name || 'Unnamed Workspace'}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{w.tabs?.length || 0} tabs</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={parsedWorkspaces ? () => setParsedWorkspaces(null) : handleClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {parsedWorkspaces ? 'Back' : 'Cancel'}
          </button>
          {!parsedWorkspaces ? (
            <button 
              onClick={handleParse}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-full shadow-md transition-colors"
            >
              Parse Data
            </button>
          ) : (
            <button 
              onClick={handleImportSelected}
              disabled={selectedIds.size === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-full shadow-md transition-colors"
            >
              Import Selected ({selectedIds.size})
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}



// --- MAIN APP ---
function MainApp() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    try {
      const saved = localStorage.getItem('contextdock_workspaces');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load workspaces from localStorage", e);
    }
    return [];
  });

  const [credits, setCredits] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('contextdock_credits');
      if (saved !== null) {
        return parseInt(saved, 10);
      }
    } catch (e) {
      console.error("Failed to load credits from localStorage", e);
    }
    return 15;
  });

  const [creditError, setCreditError] = useState<string | null>(null);

  const checkCreditsAndRun = (action: () => void) => {
    if (credits <= 0) {
      setCreditError("Not enough credit, purchase more for unlimited credit");
      return;
    }
    action();
  };

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setViewMode('dashboard');
        setIsSyncing(true);
        const cloudWorkspaces = await fetchWorkspacesFromCloud();
        const cloudCredits = await fetchCreditsFromCloud();
        
        if (cloudWorkspaces && cloudWorkspaces.length > 0) {
          setWorkspaces(cloudWorkspaces);
          localStorage.setItem('contextdock_workspaces', JSON.stringify(cloudWorkspaces));
        }
        
        if (cloudCredits !== null) {
          setCredits(cloudCredits);
          localStorage.setItem('contextdock_credits', cloudCredits.toString());
        }
        
        setIsSyncing(false);
      } else {
        setViewMode('landing');
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('contextdock_workspaces', JSON.stringify(workspaces));
      localStorage.setItem('contextdock_credits', credits.toString());
      if (auth?.currentUser && !isSyncing) {
        syncWorkspacesToCloud(workspaces);
        syncCreditsToCloud(credits);
      }
    } catch (e) {
      console.error("Failed to save data", e);
    }
  }, [workspaces, credits, isSyncing]);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(
    new URLSearchParams(window.location.search).get('pricing') === 'true'
  );
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pricing') === 'true') {
      setIsPricingModalOpen(true);
      params.delete('pricing');
      const newSearch = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`);
    }
  }, []);
  const [launchpadWorkspace, setLaunchpadWorkspace] = useState<Workspace | null>(null);
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>(
    new URLSearchParams(window.location.search).get('view') === 'dashboard' ? 'dashboard' : 'landing'
  );
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [filterTab, setFilterTab] = useState<'All' | 'Auto Saved' | 'Pinned'>('All');
  const [sortBy, setSortBy] = useState<'Recent' | 'Name' | 'Created'>('Recent');

  // Load from demo if requested (we don't persist to localstorage as per requirements, 
  // but keep in React state)
  const addExampleWorkspace = () => {
    checkCreditsAndRun(() => {
      const example: Workspace = {
        id: generateId(),
        name: "Q3 Roadmap Planning",
        purpose: "Finish the strategy doc and review competitor analysis before tomorrow's sync.",
        tag: "Work",
        color: "#3b82f6",
        createdAt: new Date().toISOString(),
        lastOpenedAt: null,
        tabs: [
          { id: generateId(), title: "Q3 Strategy Doc", url: "https://docs.google.com" },
          { id: generateId(), title: "Competitor Analysis 2026", url: "https://sheets.google.com" },
          { id: generateId(), title: "Linear - Issue Tracker", url: "https://linear.app" },
        ]
      };
      setWorkspaces([example, ...workspaces]);
      setCredits(prev => Math.max(0, prev - 1));
    });
  };

  const handleSaveWorkspace = (w: Workspace) => {
    if (editingWorkspace) {
      setWorkspaces(workspaces.map(existing => existing.id === w.id ? w : existing));
    } else {
      setWorkspaces([w, ...workspaces]);
      setCredits(prev => Math.max(0, prev - 1));
    }
    setIsFormOpen(false);
    setEditingWorkspace(null);
  };

  const handleDeleteWorkspace = (id: string) => {
    setWorkspaces(workspaces.filter(w => w.id !== id));
  };

  const handleDeleteTabFromLaunchpad = (workspaceId: string, tabId: string) => {
    setWorkspaces(workspaces.map(w => {
      if (w.id === workspaceId) {
        return {
          ...w,
          tabs: w.tabs.filter(t => t.id !== tabId)
        };
      }
      return w;
    }));
    
    // Also update launchpadWorkspace state so it reflects immediately in the modal
    if (launchpadWorkspace && launchpadWorkspace.id === workspaceId) {
      setLaunchpadWorkspace({
        ...launchpadWorkspace,
        tabs: launchpadWorkspace.tabs.filter(t => t.id !== tabId)
      });
    }
  };

  const handleOpenWorkspace = (w: Workspace) => {
    checkCreditsAndRun(() => {
      // Update lastOpenedAt and openCount
      const updated = { 
        ...w, 
        lastOpenedAt: new Date().toISOString(),
        openCount: (w.openCount || 0) + 1
      };
      setWorkspaces(workspaces.map(existing => existing.id === w.id ? updated : existing));
      
      // Always show launchpad
      setLaunchpadWorkspace(updated);
    });
  };

  const handleTogglePin = (id: string) => {
    setWorkspaces(workspaces.map(w => w.id === id ? { ...w, isPinned: !w.isPinned } : w));
  };

  // Derived state
  const filteredWorkspaces = useMemo(() => {
    let result = workspaces.filter(w => {
      const q = searchQuery.toLowerCase();
      if (q && !(w.name.toLowerCase().includes(q) || w.purpose.toLowerCase().includes(q) || w.tag.toLowerCase().includes(q))) {
        return false;
      }
      
      if (filterTab === 'Pinned') {
        return w.isPinned;
      }
      if (filterTab === 'Auto Saved') {
        return (w.openCount || 0) >= 3;
      }
      return true; // 'All'
    });
    
    // Sort
    result.sort((a, b) => {
      if (sortBy === 'Name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'Created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        // Recent
        const aTime = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : new Date(a.createdAt).getTime();
        const bTime = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      }
    });
    
    return result;
  }, [workspaces, searchQuery, filterTab, sortBy]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (viewMode === 'landing') {
    return <LandingPage onCreateWorkspace={() => setViewMode('dashboard')} onStarterSelect={() => { setCredits(15); setViewMode('dashboard'); setIsExtensionModalOpen(true); }} onShowExtensionModal={() => setIsExtensionModalOpen(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A] selection:bg-indigo-100 selection:text-indigo-900 pb-20 flex flex-col">
      {/* HEADER */}
      <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <button 
            onClick={() => setViewMode('landing')}
            className="flex shrink-0 items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer text-left"
          >
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Folder size={19} />
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
              <span className="text-gray-900">Context</span><span className="text-indigo-600">Dock</span>
            </h1>
          </button>
          
          <div className="flex items-center gap-2.5 lg:gap-3.5 justify-end">
            <button 
              onClick={() => checkCreditsAndRun(() => setIsImportOpen(true))}
              className="flex shrink-0 items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-600 rounded-full shadow-sm transition-all cursor-pointer"
            >
              <Download size={15} className="text-indigo-600" strokeWidth={2.5} />
              <span>Import Data</span>
            </button>
            <div className="flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100 rounded-full shadow-sm">
              <Star size={15} className="fill-indigo-500 text-indigo-500" />
              <span>{credits} Credits</span>
            </div>
            <div className="relative hidden md:block shrink-0">
              <input 
                type="text" 
                placeholder="Search purposes or names..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-44 lg:w-56 pl-9 pr-4 py-2 bg-[#F3F4F6] border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-400 transition-all"
              />
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button 
              onClick={() => checkCreditsAndRun(() => setIsFormOpen(true))}
              className="flex shrink-0 items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">New Workspace</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-8 w-full flex-1">
        
        {/* MOBILE SEARCH */}
        <div className="mb-6 md:hidden">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search purposes or names..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F3F4F6] border-transparent rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-400 transition-all"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* EMPTY STATE */}
        {workspaces.length === 0 && !searchQuery ? (
          <div className="mt-12 flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="w-20 h-20 bg-white border border-[#E5E7EB] shadow-sm rounded-2xl flex items-center justify-center mb-6">
              <Folder size={32} className="text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-3 tracking-tight">Welcome back.</h2>
            <p className="text-gray-500 leading-relaxed mb-8">
              ContextDock captures your open tabs along with their <strong>purpose</strong>. 
              Instead of a massive bookmark folder, you get a clean launchpad that remembers exactly what you were doing.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => checkCreditsAndRun(() => setIsFormOpen(true))}
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Capture Workspace
              </button>
              <button 
                onClick={addExampleWorkspace}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium rounded-full transition-all"
              >
                Try an example
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold">Welcome back{auth?.currentUser ? `, ${auth.currentUser.displayName || ''}` : ''}.</h1>
                <p className="text-gray-500">Rebuild your mental model in one click.</p>
              </div>
              <div className="flex items-center gap-4">
                {auth?.currentUser && (
                  <button
                    onClick={() => auth.signOut()}
                    className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    Sign Out
                  </button>
                )}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {['All', 'Auto Saved', 'Pinned'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setFilterTab(tab as any)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        filterTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="relative group">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none bg-white border border-gray-200 text-gray-700 py-1.5 pl-3 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Recent">Recent</option>
                    <option value="Name">Name</option>
                    <option value="Created">Created</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* WORKSPACES SECTION */}
            <div>
              {filteredWorkspaces.length === 0 ? (
                <div className="text-gray-500 text-sm py-8 text-center bg-white border border-gray-100 rounded-2xl border-dashed">
                  {searchQuery ? 'No workspaces match your search.' : `No workspaces in ${filterTab}.`}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence>
                    {filteredWorkspaces.map(w => (
                      <WorkspaceCard 
                        key={w.id} 
                        workspace={w} 
                        onOpen={handleOpenWorkspace}
                        onEdit={w => { setEditingWorkspace(w); setIsFormOpen(true); }}
                        onArchive={handleDeleteWorkspace}
                        onPin={handleTogglePin}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* FORMS & MODALS */}
      {creditError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
          >
            <div className="flex justify-center mb-4 text-red-500">
              <Ban size={48} />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Access Denied</h3>
            <p className="text-center text-gray-600 mb-6">{creditError}</p>
            <button 
              onClick={() => { setCreditError(null); setIsPricingModalOpen(true); }}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Purchase More
            </button>
            <button 
              onClick={() => setCreditError(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}

      {isFormOpen && (
        <WorkspaceForm 
          initialData={editingWorkspace} 
          onSave={handleSaveWorkspace} 
          onCancel={() => { setIsFormOpen(false); setEditingWorkspace(null); }} 
        />
      )}

      <SmartAssistantModal 
        isOpen={isAssistantOpen} 
        onClose={() => setIsAssistantOpen(false)} 
        workspaces={workspaces} 
      />

      <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} onStarterSelect={() => { setCredits(15); setIsExtensionModalOpen(true); }} />
      <ExtensionModal isOpen={isExtensionModalOpen} onClose={() => setIsExtensionModalOpen(false)} />

      <ImportModal 
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={(importedWorkspaces) => {
          setWorkspaces(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newWorkspaces = importedWorkspaces.map(w => ({
              ...w,
              id: w.id && !existingIds.has(w.id) ? w.id : Date.now().toString() + Math.random().toString(36).substr(2, 9),
              createdAt: w.createdAt || new Date().toISOString(),
              lastOpenedAt: w.lastOpenedAt || null,
              color: w.color || 'bg-gray-100 text-gray-800',
              tag: w.tag || 'IMPORTED',
              purpose: w.purpose || 'Imported from extension'
            }));
            return [...newWorkspaces, ...prev];
          });
          setCredits(prev => Math.max(0, prev - importedWorkspaces.length));
          setIsImportOpen(false);
        }}
      />

      <LaunchpadModal 
        workspace={launchpadWorkspace} 
        onClose={() => setLaunchpadWorkspace(null)} 
        onDeleteTab={handleDeleteTabFromLaunchpad}
      />
    </div>
  );
}


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/auth" element={<AuthPage />} />
    </Routes>
  );
}
