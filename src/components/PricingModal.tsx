import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Diamond, Crown, CheckCircle2, Shield, Lock, Ban, UploadCloud, Search, Rocket } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PricingModal({ isOpen, onClose, onStarterSelect }: { isOpen: boolean; onClose: () => void; onStarterSelect?: () => void }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePayment = async (amount: number, planName: string) => {
    try {
      setLoadingPlan(planName);

      // Create Order
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      // Initialize Razorpay
      const options = {
        key: data.key_id || (import.meta as any).env.VITE_RAZORPAY_KEY_ID, // Use backend or frontend environment variable
        amount: data.amount,
        currency: data.currency,
        name: "ContextDock",
        description: `Upgrade to ${planName} Plan`,
        order_id: data.order_id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            
            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok && verifyData.success) {
              alert("Payment successful! Welcome to " + planName);
              onClose();
            } else {
              alert("Payment verification failed. " + (verifyData.error || ""));
            }
          } catch (e) {
            console.error("Verification error", e);
            alert("Error verifying payment");
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
        },
        theme: {
          color: "#4F46E5",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        alert("Payment failed: " + response.error.description);
      });
      rzp1.open();
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      alert(error.message || "Failed to initialize payment");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <AnimatePresence>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-gray-50/95 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[95vh]"
      >
        <div className="absolute top-6 right-6 z-10">
          <button onClick={onClose} className="p-2 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 sm:p-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 mt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold mb-6 border border-indigo-100/50 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Simple pricing. Powerful value.
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Choose the Plan That Fits <span className="text-indigo-600">Your Flow</span>
            </h2>
            <p className="text-lg text-gray-600 font-medium">
              Start free and upgrade anytime. All plans include core features
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            
            {/* Starter */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-gray-200/40 flex flex-col relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Gift size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Starter</h3>
                  <p className="text-sm text-gray-500 font-medium">Perfect for getting started</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline text-indigo-600">
                  <span className="text-5xl font-extrabold tracking-tight">₹0</span>
                </div>
                <p className="text-sm text-gray-500 font-medium mt-2">15 Credits Included</p>
              </div>
              
              <button 
                onClick={() => {
                  if (onStarterSelect) onStarterSelect();
                  onClose();
                }}
                className="w-full py-3.5 px-6 rounded-xl border border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50 transition-colors mb-8 shadow-sm">
                Get Access
              </button>
              
              <div className="flex-1">
                <p className="text-sm font-bold text-indigo-600 mb-4">What you get:</p>
                <ul className="space-y-4 text-sm font-medium text-gray-700">
                  {[
                    "15 Credits Included",
                    "Auto-save tabs, documents & windows",
                    "Restore previous sessions in one click",
                    "Organize with 1 workspace",
                    "Export data (JSON)",
                    "Basic session search",
                    "100% Local & Private"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 text-indigo-600"><CheckCircle2 size={16} className="fill-indigo-100 text-indigo-600" /></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Bottom Graphic */}
              <div className="mt-8 pt-8 border-t border-gray-50 flex justify-center opacity-60">
                 <div className="w-full h-32 bg-indigo-50/50 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <div className="w-3/4 h-24 bg-white shadow-sm rounded-xl border border-indigo-50 absolute bottom-0 translate-y-4 flex flex-col p-2 gap-2">
                       <div className="flex gap-2 mb-2">
                         <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                         <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                         <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                       </div>
                       <div className="flex gap-2">
                         <div className="w-1/3 h-2 bg-indigo-100 rounded-full"></div>
                         <div className="w-1/2 h-2 bg-indigo-50 rounded-full"></div>
                       </div>
                       <div className="flex gap-2">
                         <div className="w-full h-12 bg-indigo-50 rounded-lg"></div>
                         <div className="w-full h-12 bg-indigo-50 rounded-lg"></div>
                       </div>
                    </div>
                    <div className="absolute right-4 bottom-4 w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg z-10 shadow-indigo-200">
                      <UploadCloud size={24} />
                    </div>
                 </div>
              </div>
            </div>

            {/* Pro */}
            <div className="bg-white border-2 border-indigo-600 rounded-3xl p-8 shadow-2xl shadow-indigo-600/10 flex flex-col relative overflow-hidden transition-transform hover:-translate-y-1 duration-300 transform md:-translate-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Diamond size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Pro</h3>
                  <p className="text-sm text-gray-500 font-medium">For power users & professionals</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline text-indigo-600">
                  <span className="text-5xl font-extrabold tracking-tight">₹99</span>
                </div>
                <p className="text-sm text-gray-500 font-medium mt-2">per month</p>
              </div>
              
              <button 
                onClick={() => handlePayment(9900, "Pro")}
                disabled={loadingPlan === "Pro"}
                className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/10 transition-colors mb-8 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                {loadingPlan === "Pro" ? "Processing..." : "Get Access"}
              </button>
              
              <div className="flex-1">
                <p className="text-sm font-bold text-indigo-600 mb-4">Everything in Starter, plus:</p>
                <ul className="space-y-4 text-sm font-medium text-gray-700">
                  {[
                    "Unlimited Imports",
                    "Unlimited Workspaces",
                    "Advanced Session Search",
                    "Export & Import (JSON)",
                    "Auto-backup & Sync (coming soon)",
                    "Priority Support",
                    "Early Access to New Features"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 text-indigo-600"><CheckCircle2 size={16} className="fill-indigo-100 text-indigo-600" /></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8 pt-8 border-t border-indigo-50 flex justify-center opacity-80">
                 <div className="w-full h-32 bg-indigo-50/80 rounded-2xl flex items-center justify-center relative overflow-hidden border border-indigo-100">
                    <div className="w-3/4 h-24 bg-white shadow-sm rounded-xl border border-indigo-200 absolute bottom-0 translate-y-4 flex flex-col p-2 gap-2">
                       <div className="flex gap-2 mb-2 items-center">
                         <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                         <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                         <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                         <div className="w-1/2 h-3 ml-2 bg-indigo-50 rounded-full"></div>
                       </div>
                       <div className="flex gap-2 h-full pb-4">
                         <div className="w-1/3 bg-indigo-400 rounded-lg h-full opacity-60"></div>
                         <div className="w-1/3 bg-indigo-400 rounded-lg h-full opacity-60"></div>
                         <div className="w-1/3 bg-indigo-400 rounded-lg h-full opacity-60"></div>
                       </div>
                    </div>
                    <div className="absolute right-3 top-10 w-8 h-8 bg-indigo-400 rounded-full flex items-center justify-center text-white shadow-sm z-10 border-2 border-white">
                      <Search size={14} strokeWidth={3} />
                    </div>
                 </div>
              </div>
            </div>

            {/* Early Access */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-gray-200/40 flex flex-col relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Crown size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Early Access</h3>
                  <p className="text-sm text-gray-500 font-medium">Access upcoming advanced features</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline text-indigo-600">
                  <span className="text-5xl font-extrabold tracking-tight">₹199</span>
                </div>
                <p className="text-sm text-gray-500 font-medium mt-2">per month</p>
              </div>
              
              <button 
                onClick={() => handlePayment(19900, "Early Access")}
                disabled={loadingPlan === "Early Access"}
                className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/10 transition-colors mb-8 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                {loadingPlan === "Early Access" ? "Processing..." : "Get Access"}
              </button>
              
              <div className="flex-1">
                <p className="text-sm font-bold text-indigo-600 mb-4">Everything in Pro, plus:</p>
                <ul className="space-y-4 text-sm font-medium text-gray-700">
                  {[
                    "Access to Upcoming Advanced Features",
                    "AI-Powered Session Insights (coming soon)",
                    "Smart Auto-Organization (coming soon)",
                    "Cloud Sync Across Devices (coming soon)",
                    "Beta Features & Experiments",
                    "Exclusive Early Access",
                    "Shape the Future of VaultDock"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 text-indigo-600"><CheckCircle2 size={16} className="fill-indigo-100 text-indigo-600" /></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-50 flex justify-center opacity-70">
                 <div className="w-full h-32 bg-indigo-50/60 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <div className="w-3/4 h-24 bg-white shadow-sm rounded-xl border border-indigo-50 absolute bottom-0 translate-y-4 flex flex-col p-2 gap-2">
                       <div className="flex gap-2 mb-2">
                         <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                         <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                         <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                       </div>
                       <div className="flex justify-center items-center h-full pb-4">
                          <div className="px-4 py-2 bg-indigo-50 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100 border-dashed">
                             Upcoming Features
                          </div>
                       </div>
                    </div>
                    <div className="absolute right-4 bottom-4 w-12 h-12 bg-indigo-500 rounded-xl rotate-12 flex items-center justify-center text-white shadow-lg z-10 shadow-indigo-200">
                      <Rocket size={24} />
                    </div>
                 </div>
              </div>
            </div>

          </div>

          {/* Bottom Banner */}
          <div className="max-w-5xl mx-auto bg-gray-50/80 border border-gray-100 rounded-2xl p-6 sm:px-8 sm:py-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <Shield size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 mb-1 text-lg">Your data is always safe.</h4>
                <p className="text-sm text-gray-600 font-medium">All your data stays on your device. We never store or share your information.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 shrink-0">
               <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <Lock size={16} className="text-indigo-600" />
                  100% Local
               </div>
               <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <Shield size={16} className="text-indigo-600" />
                  No Tracking
               </div>
               <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                  <Ban size={16} className="text-indigo-600" />
                  No Ads
               </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
    </AnimatePresence>
  );
}
