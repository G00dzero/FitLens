import { motion } from "motion/react";
import { Upload, Plus, X } from "lucide-react";
import { useState } from "react";

export function StylePage() {
  const [item1, setItem1] = useState<string | null>(null);
  const [item2, setItem2] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, itemNum: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (itemNum === 1) {
          setItem1(result);
        } else {
          setItem2(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2">Style Creator</h1>
          <p className="text-muted-foreground mb-12">Combine two clothing items to create a unique style</p>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {/* First Item */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">First Item</h2>
              <label className="block">
                <div className="relative h-56 rounded-lg bg-card border-2 border-dashed border-border hover:border-purple-500 transition-colors cursor-pointer flex items-center justify-center group">
                  {item1 ? (
                    <>
                      <img
                        src={item1}
                        alt="First item"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setItem1(null);
                        }}
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-all"
                      >
                        <X size={20} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <Upload size={32} className="mx-auto mb-2 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                      <p className="text-sm text-muted-foreground">Upload item</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 1)}
                  className="hidden"
                />
              </label>
            </div>

            {/* Plus Sign */}
            <div className="flex items-center justify-center h-56">
              <div className="text-4xl text-muted-foreground">
                <Plus size={48} />
              </div>
            </div>

            {/* Second Item */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Second Item</h2>
              <label className="block">
                <div className="relative h-56 rounded-lg bg-card border-2 border-dashed border-border hover:border-purple-500 transition-colors cursor-pointer flex items-center justify-center group">
                  {item2 ? (
                    <>
                      <img
                        src={item2}
                        alt="Second item"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setItem2(null);
                        }}
                        className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-all"
                      >
                        <X size={20} className="text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <Upload size={32} className="mx-auto mb-2 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                      <p className="text-sm text-muted-foreground">Upload item</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 2)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {item1 && item2 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="mt-12 px-8 py-4 rounded-lg bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Create Style
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
