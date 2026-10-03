import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Mail, Zap, AlertTriangle } from 'lucide-react';

export function SupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-gray-100 my-8 flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-3 text-gray-900 font-bold text-xl">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <MessageSquare size={20} />
                </div>
                Support
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <p className="text-gray-600 mb-8 max-w-2xl text-lg">
                Most questions are answered in the FAQ above. For anything else, here's how to reach us.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Card 1 */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <Mail size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">Email Support</h4>
                  <p className="text-sm text-gray-500 mb-4 h-10">For Starter users: general questions, bug reports, and feature requests.</p>
                  <a href="mailto:build.w.vinayak@gmail.com" className="inline-flex text-sm font-bold text-indigo-600 hover:text-indigo-700 mb-2">
                    build.w.vinayak@gmail.com
                  </a>
                  <p className="text-xs text-gray-400 font-medium mt-auto">Typical response time: 2-3 business days</p>
                </div>

                {/* Card 2 */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 p-4">
                     <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase rounded">Pro</div>
                  </div>
                  <div className="w-10 h-10 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center mb-4">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">Priority Support</h4>
                  <p className="text-sm text-gray-500 mb-4 h-10">For Pro & Early Access users: faster response times and direct access to the team building ContextDock.</p>
                  <a href="mailto:build.w.vinayak@gmail.com" className="inline-flex text-sm font-bold text-indigo-600 hover:text-indigo-700 mb-2">
                    build.w.vinayak@gmail.com
                  </a>
                  <p className="text-xs text-gray-400 font-medium mt-auto">Typical response time: within 24 hours</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 lg:p-8">
                <div className="flex flex-col md:flex-row items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-900 mb-2 text-lg">Something Broken?</h4>
                    <p className="text-sm text-red-800 mb-4 leading-relaxed">
                      If the extension isn't saving sessions, or import/export isn't working, check these first:
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-red-800 mb-6 marker:text-red-400 font-medium">
                      <li>Confirm the extension has permission to run in the background (chrome://extensions)</li>
                      <li>Confirm the window you closed had 2+ tabs open</li>
                      <li>Try re-exporting the JSON file — a partial export is the most common cause of import errors</li>
                    </ul>
                    <div className="text-sm text-red-900 font-medium bg-white/60 p-4 rounded-xl border border-red-100 shadow-sm inline-block">
                      Still stuck? Reach out via the email above with your browser version and what you were doing when it broke.
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
