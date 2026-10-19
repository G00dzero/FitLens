import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface AuthNavbarProps {
  onLogout: () => void;
  onPageChange: (page: "tryon" | "history" | "style") => void;
}

export function AuthNavbar({ onLogout, onPageChange }: AuthNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
        <div className="relative">
          {/* Gradient backdrop blur background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl border border-purple-300/30 shadow-2xl" />
          
          <div className="relative px-8 py-5">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 1 }}
                className="font-bold text-xl bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                FITLENS
              </motion.div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex gap-1 items-center">
                <motion.button 
                  onClick={() => onPageChange("tryon")}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 1 }}
                  className="relative group px-4 py-2 rounded-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-100 rounded-lg blur transition-opacity duration-1000 group-hover:animate-pulse" />
                  <span className="relative block px-2">Try-On</span>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-cyan-400 group-hover:w-3/4 transition-all duration-1000" />
                </motion.button>
                <motion.button 
                  onClick={() => onPageChange("history")}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 1 }}
                  className="relative group px-4 py-2 rounded-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-100 rounded-lg blur transition-opacity duration-1000 group-hover:animate-pulse" />
                  <span className="relative block px-2">History</span>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-cyan-400 group-hover:w-3/4 transition-all duration-1000" />
                </motion.button>
                <motion.button 
                  onClick={() => onPageChange("style")}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 1 }}
                  className="relative group px-4 py-2 rounded-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-100 rounded-lg blur transition-opacity duration-1000 group-hover:animate-pulse" />
                  <span className="relative block px-2">Style</span>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-cyan-400 group-hover:w-3/4 transition-all duration-1000" />
                </motion.button>
              </div>

              {/* Theme Toggle and Mobile Menu */}
              <div className="flex md:hidden items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={`p-2 hover:bg-white/10 rounded-lg transition-all duration-1000 relative group ${
                    isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
                  }`}
                  aria-label="Toggle menu"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-30 rounded-lg blur transition-opacity duration-1000" />
                  <div className="relative">
                    <Menu size={24} />
                  </div>
                </button>
              </div>

              {/* Desktop Actions */}
              <div className="hidden md:flex items-center gap-4">
                <ThemeToggle />
                <motion.button
                  onClick={onLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-all duration-300 flex items-center gap-2 text-red-500 hover:text-red-400"
                >
                  <LogOut size={20} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />

            {/* Sliding Menu */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-gradient-to-b from-purple-500/30 via-indigo-500/20 to-cyan-500/20 backdrop-blur-xl border-l border-purple-300/30 z-50 md:hidden"
            >
              {/* Close Button */}
              <button
                onClick={closeMenu}
                className="absolute top-4 right-4 z-20 p-2 hover:bg-white/10 rounded-lg transition-all duration-300 group"
                aria-label="Close menu"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-30 rounded-lg blur transition-opacity duration-1000" />
                <div className="relative">
                  <X size={24} />
                </div>
              </button>

              <div className="flex flex-col gap-6 p-8 pt-20">
                <motion.button
                  onClick={() => {
                    onPageChange("tryon");
                    closeMenu();
                  }}
                  whileHover={{ x: 8 }}
                  transition={{ duration: 1 }}
                  className="text-2xl relative group"
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-30 blur rounded-lg transition-opacity duration-1000" />
                  <span className="relative px-2">Try-On</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-cyan-400 group-hover:w-full transition-all duration-1000" />
                </motion.button>
                <motion.button
                  onClick={() => {
                    onPageChange("history");
                    closeMenu();
                  }}
                  whileHover={{ x: 8 }}
                  transition={{ duration: 1 }}
                  className="text-2xl relative group"
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-30 blur rounded-lg transition-opacity duration-1000" />
                  <span className="relative px-2">History</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-cyan-400 group-hover:w-full transition-all duration-1000" />
                </motion.button>
                <motion.button
                  onClick={() => {
                    onPageChange("style");
                    closeMenu();
                  }}
                  whileHover={{ x: 8 }}
                  transition={{ duration: 1 }}
                  className="text-2xl relative group"
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-30 blur rounded-lg transition-opacity duration-1000" />
                  <span className="relative px-2">Style</span>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-cyan-400 group-hover:w-full transition-all duration-1000" />
                </motion.button>
                <motion.button
                  onClick={() => {
                    onLogout();
                    closeMenu();
                  }}
                  whileHover={{ x: 8 }}
                  transition={{ duration: 1 }}
                  className="text-2xl relative group mt-4 text-red-500"
                >
                  <div className="absolute -inset-2 bg-red-500/30 opacity-0 group-hover:opacity-30 blur rounded-lg transition-opacity duration-1000" />
                  <span className="relative px-2 flex items-center gap-2">
                    <LogOut size={24} /> Logout
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
