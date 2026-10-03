import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    q: "Does ContextDock see what I'm browsing?",
    a: "No. ContextDock only tracks tab titles and URLs for windows you choose to save, and it's all stored locally in your browser. It doesn't read page content, and nothing is sent anywhere unless you manually export it."
  },
  {
    q: "What counts as an \"import\"?",
    a: "Each time you export sessions from the extension and bring them into your dashboard counts as one import. Starter includes 30 free; Pro and Early Access are unlimited."
  },
  {
    q: "Will a single stray tab trigger an auto-save?",
    a: "No. ContextDock only auto-saves a window if it had 2 or more tabs open when closed, so you won't end up with dozens of one-tab \"sessions\" cluttering your list."
  },
  {
    q: "Is sync between the extension and dashboard automatic?",
    a: "Not yet — right now it's a manual export (from the extension) and import (into the dashboard) step. Automatic sync is on the Pro roadmap."
  },
  {
    q: "Can I cancel Pro or Early Access anytime?",
    a: "Yes. Both are monthly plans with no lock-in — cancel anytime and you'll keep access until the end of your current billing period."
  },
  {
    q: "What happens to my workspaces if I downgrade to Starter?",
    a: "Your saved data isn't deleted, but Starter's 1-workspace limit means you'll need to choose which workspace stays active. Exported JSON files are always yours to keep regardless of plan."
  },
  {
    q: "Which browsers does ContextDock support?",
    a: "Chrome today. Firefox and Edge support are being explored based on demand."
  }
];

export function FaqModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 my-8 flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-3 text-gray-900 font-bold text-xl">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <HelpCircle size={20} />
                </div>
                Frequently Asked Questions
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors text-left"
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    >
                      <span className="font-bold text-gray-900">{faq.q}</span>
                      {openIndex === index ? (
                        <ChevronUp size={20} className="text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400 shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {openIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-4 pt-2 text-gray-600 text-sm leading-relaxed border-t border-gray-50">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
