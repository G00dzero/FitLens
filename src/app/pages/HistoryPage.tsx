import { motion } from "motion/react";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";
import { database } from "../../lib/firebase";

interface TryOnItem {
  id: string;
  createdAt: number;
  selectedSize: "S" | "M" | "L";
  fitEstimate: {
    label: string;
    detail: string;
    score: number;
  };
}

export function HistoryPage({ userId }: { userId: string }) {
  const [tryOns, setTryOns] = useState<TryOnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const historyRef = ref(database, `users/${userId}/tryOns`);
    return onValue(
      historyRef,
      (snapshot) => {
        const records = snapshot.val() as Record<string, Omit<TryOnItem, "id">> | null;
        const nextTryOns = records
          ? Object.entries(records)
            .map(([id, record]) => ({ id, ...record }))
            .sort((first, second) => second.createdAt - first.createdAt)
          : [];
        setTryOns(nextTryOns);
        setIsLoading(false);
      },
      () => {
        setError("Unable to load your try-on history.");
        setIsLoading(false);
      },
    );
  }, [userId]);

  return (
    <div className="min-h-screen bg-background pt-24 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2">Try-On History</h1>
          <p className="text-muted-foreground mb-12">View all your previous virtual try-ons</p>

          {error ? (
            <div role="alert" className="py-16 text-center">
              <p className="text-destructive">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">Loading your saved fits...</p>
            </div>
          ) : tryOns.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No saved fits yet. Render a fit to add it here.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {tryOns.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="rounded-lg bg-card border border-border overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
                >
                  <div className="h-48 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex flex-col items-center justify-center gap-2 group-hover:from-purple-500/30 group-hover:to-cyan-500/30 transition-colors">
                    <span className="text-3xl font-bold text-primary">{item.fitEstimate.score}%</span>
                    <span className="text-muted-foreground">Fit estimate</span>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold">{new Date(item.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Size {item.selectedSize} · {item.fitEstimate.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
