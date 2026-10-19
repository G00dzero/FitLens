import { Navbar } from "./components/Navbar";
import { AuthNavbar } from "./components/AuthNavbar";
import { ScrollReveal } from "./components/ScrollReveal";
import { FloatingClothes } from "./components/FloatingClothes";
import { ThemeProvider } from "./components/ThemeProvider";
import { LoginRegisterModal } from "./components/LoginRegisterModal";
import { TryOnPage } from "./pages/TryOnPage";
import { HistoryPage } from "./pages/HistoryPage";
import { StylePage } from "./pages/StylePage";
import { motion } from "motion/react";
import { onAuthStateChanged, signInAnonymously, signOut, User } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { auth } from "../lib/firebase";

type AuthPage = "tryon" | "history" | "style";

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<AuthPage>("tryon");
  const signOutRequested = useRef(false);

  useEffect(() => onAuthStateChanged(
    auth,
    (nextUser) => {
      if (nextUser) {
        setUser(nextUser);
        setAuthReady(true);
        return;
      }

      if (signOutRequested.current) {
        setUser(null);
        setAuthReady(true);
        return;
      }

      signInAnonymously(auth)
        .catch(() => {
          setAuthError("Guest mode is unavailable. Enable Anonymous sign-in in Firebase to use FitLens without an account.");
          setAuthReady(true);
        });
    },
    () => {
      setAuthError("Guest mode is unavailable. Enable Anonymous sign-in in Firebase to use FitLens without an account.");
      setAuthReady(true);
    },
  ), []);

  const handleLogout = async () => {
    signOutRequested.current = true;
    try {
      await signOut(auth);
      setUser(null);
      setAuthReady(true);
    } catch {
      signOutRequested.current = false;
      setAuthError("Unable to sign out. Please try again.");
    }
    setCurrentPage("tryon");
  };

  if (!authReady) return null;

  if (user) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background relative">
          <FloatingClothes />
          <div className="relative z-10">
            <AuthNavbar onLogout={handleLogout} onPageChange={setCurrentPage} />
            {currentPage === "tryon" && <TryOnPage userId={user.uid} />}
            {currentPage === "history" && <HistoryPage userId={user.uid} />}
            {currentPage === "style" && <StylePage />}
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background relative">
        <FloatingClothes />
        <Navbar />

        {authError && (
          <div role="alert" className="relative z-20 mx-auto max-w-2xl px-6 pt-6 text-center text-sm text-red-400">
            {authError}
          </div>
        )}

      {/* Hero Section */}
      <section id="home" className="h-screen flex items-center justify-center px-6 relative z-10">
        <div className="max-w-6xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: [0, -15, 0] }}
            transition={{ 
              opacity: { duration: 1, ease: "easeOut" },
              y: { duration: 2, ease: "easeInOut", repeat: Infinity }
            }}
            className="font-bold mb-6 text-6xl md:text-8xl uppercase tracking-tight shimmer-text"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            fitlens
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="max-w-2xl mx-auto text-muted-foreground text-lg"
          >
            Transform your vision into reality with our powerful platform. Create, design, and build amazing experiences.
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="min-h-screen py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <h2 className="text-center mb-16">Features</h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <ScrollReveal delay={0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="p-8 rounded-lg bg-card border border-border relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-20 animate-[shimmer-pulse_1s_ease-in-out_infinite] transition-opacity duration-1000" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="mb-2">Virtual Try-On</h3>
                  <p className="text-muted-foreground">Virtually try on clothes instantly and see how they look on you before you buy.</p>
                </div>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="p-8 rounded-lg bg-card border border-border relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-20 animate-[shimmer-pulse_1s_ease-in-out_infinite] transition-opacity duration-1000" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="mb-2">Creative Designs</h3>
                  <p className="text-muted-foreground">Create unique designs with our innovative tools and bring your fashion vision to life.</p>
                </div>
              </motion.div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="p-8 rounded-lg bg-card border border-border relative overflow-hidden group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-20 animate-[shimmer-pulse_1s_ease-in-out_infinite] transition-opacity duration-1000" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 010 2H6v10h10v-3a1 1 0 112 0v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                    </svg>
                  </div>
                  <h3 className="mb-2">Complete Wardrobe</h3>
                  <p className="text-muted-foreground">Explore endless possibilities with your vast collection and personalized style .</p>
                </div>
              </motion.div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Get Started CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-cyan-600/20 border-y border-purple-300/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Fashion Experience?</h3>
            <p className="text-muted-foreground text-lg mb-8">Join thousands of users already discovering their perfect fit with FitLens</p>
            <motion.button
              onClick={() => setIsModalOpen(true)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-2xl transition-all duration-1000 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-50 animate-[shimmer-pulse_1s_ease-in-out_infinite] transition-opacity duration-1000" />
              <span className="relative">Get Started Now</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="min-h-screen py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <h2 className="text-center mb-8">About Us</h2>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="max-w-3xl mx-auto">
              <p className="text-muted-foreground mb-6">
                Our services help people not just find clothes,  but find clothes that fit your ever growing prefernce exploring how different garments may look and fit on a personalized 3D body model.
                 leverage advanced technology to ensure every customer gets a proper representation of how garments will look and feel before making a purchase. 
                 FitLens provides an approximate visualization and should not be interpreted as a guarantee of physical garment fit
              </p>
              <p className="text-muted-foreground">
                With our virtual try-on and  sizing verification, you can shop with confidene that you madde the right choice for your wardrobe. We're committed to eliminating the uncertainty in online fashion shopping and making every purchase a great match.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="min-h-screen py-24 px-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <ScrollReveal>
            <h2 className="text-center mb-12">Get in Touch</h2>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block mb-2">Name</label>
                <input
                  id="name"
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block mb-2">Message</label>
                <textarea
                  id="message"
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Your message..."
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-shadow duration-1000 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-100 animate-[shimmer-pulse_1s_ease-in-out_infinite] transition-opacity duration-1000" />
                <span className="relative">Send Message</span>
              </motion.button>
            </div>
          </ScrollReveal>
        </div>
      </section>
      <LoginRegisterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </ThemeProvider>
  );
}
