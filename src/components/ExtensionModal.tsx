import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Sparkles } from 'lucide-react';

export function ExtensionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-3 text-gray-800 font-medium">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <Download size={20} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-xl">Get Your Chrome Extension</span>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto">
              <div className="mb-8 text-center">
                <p className="text-gray-600 font-medium mb-6">Download the extension files below and install it manually to get started.</p>
                <a 
                  href="/api/extension.zip" 
                  download="ContextDock-Extension.zip"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg transition-all transform hover:scale-105"
                >
                  <Download size={20} />
                  Download Chrome Extension
                </a>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 sm:p-8">
                <h4 className="text-blue-900 font-extrabold text-lg mb-6">How to install & use ContextDock</h4>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">1</div>
                    <p className="text-blue-800 font-medium pt-1">
                      <strong className="text-blue-900">Add to Chrome.</strong> Unzip the downloaded <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-700 font-mono text-sm">ContextDock-Extension.zip</code> file. Open Chrome Extensions (<code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-700 font-mono text-sm select-all">chrome://extensions/</code>), enable <strong>Developer mode</strong>, click <strong>Load unpacked</strong> and select the unzipped folder.
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">2</div>
                    <p className="text-blue-800 font-medium pt-1">
                      <strong className="text-blue-900">Auto Save under Chrome.</strong> Once installed, ContextDock will automatically save your tabs and windows under Chrome as you browse. No need to click save manually!
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">3</div>
                    <p className="text-blue-800 font-medium pt-1">
                      <strong className="text-blue-900">Name and Copy JSON.</strong> Open the extension, give your workspace a name (e.g. "Project Alpha"), and click <strong>Copy JSON</strong> to copy the saved data.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">4</div>
                    <p className="text-blue-800 font-medium pt-1">
                      <strong className="text-blue-900">Paste in Import JSON.</strong> Go back to this website, click on <strong>Import Data</strong> in the dashboard, and paste the JSON to restore your workspace.
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-white rounded-xl border border-blue-100 flex items-center gap-3">
                  <div className="text-blue-500"><Sparkles size={20} /></div>
                  <p className="text-blue-800 font-medium text-sm">
                    <strong>All set!</strong> You are ready to manage your workspaces.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
