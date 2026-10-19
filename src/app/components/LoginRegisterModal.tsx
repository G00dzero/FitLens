import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../../lib/firebase";

interface LoginRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginRegisterModal({ isOpen, onClose }: LoginRegisterModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const email = formData.email.trim();
    if (!email || !formData.password) {
      setError("Enter your email address and password.");
      return;
    }

    if (!isLoginMode && formData.password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, formData.password);
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email, formData.password);
        if (formData.name.trim()) {
          await updateProfile(credential.user, { displayName: formData.name.trim() });
        }
      }
      setFormData({ email: "", password: "", name: "" });
      onClose();
    } catch (submissionError) {
      if (submissionError instanceof FirebaseError) {
        const messages: Record<string, string> = {
          "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
          "auth/invalid-credential": "The email or password is incorrect.",
          "auth/invalid-email": "Enter a valid email address.",
          "auth/operation-not-allowed": "Email and password sign-in is not enabled in Firebase yet.",
          "auth/unauthorized-domain": "This website is not authorized in Firebase. Add its hostname under Authentication settings.",
          "auth/app-not-authorized": "This app is not authorized to use Firebase Authentication. Check the Firebase app configuration.",
          "auth/invalid-api-key": "Firebase rejected the API key. Check the Firebase project configuration.",
          "auth/network-request-failed": "Could not reach Firebase. Check your internet connection and try again.",
          "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
          "auth/weak-password": "Choose a stronger password with at least 6 characters.",
        };
        setError(messages[submissionError.code] ?? `Unable to complete authentication (${submissionError.code}). Check Firebase settings and try again.`);
      } else {
        setError("Unable to complete authentication. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Gradient background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-cyan-500/10 pointer-events-none" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-all duration-300 z-10 text-foreground"
              >
                <X size={20} />
              </button>

              {/* Content */}
              <div className="relative p-8 pt-12">
                <motion.h2
                  key={isLoginMode ? "login" : "register"}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-bold mb-2 text-foreground"
                >
                  {isLoginMode ? "Welcome Back" : "Join FitLens"}
                </motion.h2>
                <p className="text-muted-foreground mb-8">
                  {isLoginMode ? "Sign in to your account to continue" : "Create your account to get started"}
                </p>

                {/* Form */}
                <motion.form
                  key={isLoginMode ? "login-form" : "register-form"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {!isLoginMode && (
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2 text-foreground">
                        Full Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                    />
                  </div>

                  {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group mt-6"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-30 animate-[shimmer-pulse_1s_ease-in-out_infinite] transition-opacity duration-1000" />
                    <span className="relative">{isSubmitting ? "Working..." : (isLoginMode ? "Sign In" : "Create Account")}</span>
                  </motion.button>
                </motion.form>

                {/* Toggle between login and register */}
                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-muted-foreground">
                    {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                    <button
                      onClick={() => setIsLoginMode(!isLoginMode)}
                      className="text-transparent bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 bg-clip-text font-semibold hover:opacity-80 transition-opacity"
                    >
                      {isLoginMode ? "Register" : "Sign In"}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
