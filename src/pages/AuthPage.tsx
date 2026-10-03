import React, { useState } from 'react';
import { Eye, Check, Star, ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/?view=dashboard&pricing=true');
    } catch (err: any) {
      if (err.message && err.message.includes('Pending promise was never set')) {
        setError('Popup blocked by preview window. Please open the app in a new tab using the arrow icon in the top right, or check if you have registered a Web App in Firebase and enabled Google Sign-In.');
      } else if (err.message && err.message.includes('auth/unauthorized-domain')) {
        setError('Firebase: Error (auth/unauthorized-domain). Please add this preview domain to your Firebase Console under Authentication -> Settings -> Authorized domains.');
      } else {
        setError(err.message || 'An error occurred during Google authentication.');
      }
    }
  };

  const handleGithubLogin = async () => {
    if (!auth) return;
    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/?view=dashboard&pricing=true');
    } catch (err: any) {
      if (err.message && err.message.includes('Pending promise was never set')) {
        setError('Popup blocked by preview window. Please open the app in a new tab using the arrow icon in the top right, or check if you have registered a Web App in Firebase and enabled GitHub Sign-In.');
      } else if (err.message && err.message.includes('auth/unauthorized-domain')) {
        setError('Firebase: Error (auth/unauthorized-domain). Please add this preview domain to your Firebase Console under Authentication -> Settings -> Authorized domains.');
      } else {
        setError(err.message || 'An error occurred during GitHub authentication.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setError('Authentication is not configured.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (!terms) {
          throw new Error("You must agree to the Terms of Service and Privacy Policy");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: fullName });
        
        // Optionally save to supabase here if required
        if (supabase) {
          try {
            await supabase.from('users').insert([{ id: userCredential.user.uid, full_name: fullName, email }]);
          } catch {
            // Ignore cloud insert errors if table or network is unavailable
          }
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/?view=dashboard&pricing=true');
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="flex-1 flex bg-white m-2 sm:m-4 md:m-6 lg:m-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        
        {/* Left Side - Auth Form */}
        <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col px-8 sm:px-16 lg:px-20 py-12 overflow-y-auto">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 mb-16 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <span className="font-bold text-2xl">C</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">ContextDock</h1>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
            <div className="text-center mb-8">
              {mode === 'signin' ? (
                <>
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome Back 👋</h2>
                  <p className="text-gray-500 font-medium">Sign in to continue to your workspace</p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Create Your Account ✨</h2>
                  <p className="text-gray-500 font-medium">Start organizing your context smarter.</p>
                </>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8">
              <button 
                onClick={() => setMode('signin')}
                className={`flex-1 pb-4 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${mode === 'signin' ? 'text-[#5534F4] border-b-2 border-[#5534F4]' : 'text-gray-400 hover:text-gray-600'}`}>
                <LogIn size={18} className={mode === 'signin' ? 'text-[#5534F4]' : 'text-gray-400'} />
                Sign In
              </button>
              <button 
                onClick={() => setMode('signup')}
                className={`flex-1 pb-4 text-sm font-bold flex justify-center items-center gap-2 transition-colors ${mode === 'signup' ? 'text-[#5534F4] border-b-2 border-[#5534F4]' : 'text-gray-400 hover:text-gray-600'}`}>
                <UserPlus size={18} className={mode === 'signup' ? 'text-[#5534F4]' : 'text-gray-400'} />
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#5534F4] focus:border-transparent transition-all sm:text-sm font-medium"
                      placeholder="Enter your full name"
                      required={mode === 'signup'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Email {mode === 'signup' ? 'Address' : 'address'}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#5534F4] focus:border-transparent transition-all sm:text-sm font-medium"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#5534F4] focus:border-transparent transition-all sm:text-sm font-medium"
                    placeholder={mode === 'signup' ? "Create a password" : "Enter your password"}
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer">
                    <Eye size={20} />
                  </div>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-11 pr-12 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#5534F4] focus:border-transparent transition-all sm:text-sm font-medium"
                      placeholder="Confirm your password"
                      required={mode === 'signup'}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer">
                      <Eye size={20} />
                    </div>
                  </div>
                </div>
              )}

              {mode === 'signin' ? (
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-[#5534F4] border-gray-300 rounded cursor-pointer"
                      defaultChecked
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 font-medium cursor-pointer">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <a href="#" className="font-bold text-indigo-600 hover:text-indigo-500">
                      Forgot password?
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-start pt-2">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={terms}
                      onChange={(e) => setTerms(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-[#5534F4] border-gray-300 rounded cursor-pointer mt-0.5"
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <label htmlFor="terms" className="font-medium text-gray-700 cursor-pointer">
                      I agree to the <a href="#" className="font-bold text-indigo-600 hover:text-indigo-500">Terms of Service</a> and <a href="#" className="font-bold text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#5534F4] hover:bg-[#4320E0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5534F4] transition-colors mt-6 disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center">Processing...</span>
                ) : mode === 'signin' ? (
                  <>Sign In <span className="ml-2">→</span></>
                ) : (
                  <>Create Account <span className="ml-2">→</span></>
                )}
              </button>
            </form>

            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-sm font-medium text-gray-500">
                  or continue with
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={handleGoogleLogin}
              >
                <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
                Google
              </button>
              <button
                type="button"
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={handleGithubLogin}
              >
                <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub logo" />
                GitHub
              </button>
            </div>
            
            {mode === 'signup' && (
              <p className="mt-8 text-center text-sm font-medium text-gray-500">
                Already have an account?{' '}
                <button 
                  onClick={() => setMode('signin')}
                  className="font-bold text-indigo-600 hover:text-indigo-500"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          <div className="mt-auto pt-8">
            <p className="text-center text-xs text-gray-500 font-medium">
              By continuing, you agree to our <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>

        {/* Right Side - Hero */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#3b43db] to-[#1e239e] text-white p-16 flex-col relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          
          <div className="relative z-10 max-w-xl">
            <h2 className="text-5xl font-extrabold mb-6 leading-tight">
              Save Today.<br />
              <span className="text-indigo-200">Restore Anytime.</span>
            </h2>
            <p className="text-lg text-indigo-100 font-medium leading-relaxed opacity-90 mb-12 max-w-md">
              ContextDock helps you capture, organize, and restore your tabs, windows, and documents effortlessly.
            </p>
          </div>

          {/* Feature Illustration */}
          <div className="relative z-10 my-8 self-end mr-8">
             <div className="w-[450px] h-[300px] bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 p-6 flex flex-col relative shadow-2xl">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-white/30"></div>
                  <div className="w-3 h-3 rounded-full bg-white/30"></div>
                  <div className="w-3 h-3 rounded-full bg-white/30"></div>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center relative">
                   {/* Main Icon */}
                   <div className="w-32 h-32 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/50 flex items-center justify-center text-white border-2 border-indigo-400 absolute z-20">
                      <span className="font-bold text-6xl">C</span>
                   </div>
                   
                   {/* Floating Elements */}
                   <div className="absolute -left-12 top-10 w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center p-3 z-10 -rotate-6">
                      <div className="w-full h-full rounded-full border-4 border-indigo-100 border-t-indigo-600"></div>
                   </div>
                   
                   <div className="absolute -right-16 bottom-10 w-28 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center p-3 z-10 rotate-6">
                      <svg className="w-full h-full text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M17 7h4v4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                   </div>
                </div>
             </div>
          </div>

          <div className="mt-auto relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Star className="text-yellow-400 fill-yellow-400" size={20} />
              <span className="font-bold text-lg">Loved by productive people</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              {/* Testimonial 1 */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
                <div className="flex items-center gap-1 text-yellow-400 mb-3">
                  <Star size={14} className="fill-yellow-400" /><Star size={14} className="fill-yellow-400" /><Star size={14} className="fill-yellow-400" /><Star size={14} className="fill-yellow-400" /><Star size={14} className="fill-yellow-400" />
                </div>
                <p className="text-sm font-medium leading-relaxed mb-4 text-indigo-50">
                  "ContextDock has completely changed the way I work. No more lost tabs or forgotten research!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-300"></div>
                  <div>
                    <p className="text-xs font-bold text-white">Rohit Sharma</p>
                    <p className="text-[10px] text-indigo-200">Developer</p>
                  </div>
                </div>
              </div>
              
              {/* Testimonial 2 */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
                <div className="flex items-center gap-1 text-yellow-400 mb-3">
                  <Star size={14} className="fill-yellow-400" /><Star size={14} className="fill-yellow-400" /><Star size={14} className="fill-yellow-400" /><Star size={14} className="fill-yellow-400" /><Star size={14} className="fill-yellow-400" />
                </div>
                <p className="text-sm font-medium leading-relaxed mb-4 text-indigo-50">
                  "I can now focus on my work knowing everything is saved and organized. Super intuitive and fast!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-300"></div>
                  <div>
                    <p className="text-xs font-bold text-white">Ananya Verma</p>
                    <p className="text-[10px] text-indigo-200">Product Designer</p>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
                <div className="flex items-center gap-1 text-yellow-400 mb-3">
                  <Star size={14} className="fill-yellow-400" /><Star size={14} className="fill-yellow-400" /><Star size={14} className="fill-yellow-400" /><Star size={14} className="fill-yellow-400" /><Star size={14} className="fill-yellow-400" />
                </div>
                <p className="text-sm font-medium leading-relaxed mb-4 text-indigo-50">
                  "Finally, a tool that does exactly what it promises. Simple, beautiful and extremely useful."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-300"></div>
                  <div>
                    <p className="text-xs font-bold text-white">Karan Singh</p>
                    <p className="text-[10px] text-indigo-200">Student</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} className="text-indigo-200" />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">100%</h4>
                  <p className="text-xs text-indigo-200 leading-tight">Your data stays private & secure</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-200"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">1-Click</h4>
                  <p className="text-xs text-indigo-200 leading-tight">Save and restore your entire context</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-200"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">Seamless</h4>
                  <p className="text-xs text-indigo-200 leading-tight">Works across devices and sessions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
