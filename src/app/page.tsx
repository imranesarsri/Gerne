"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  X,
  Languages,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Brain,
} from "lucide-react";
import Flashcard from "@/components/Flashcard";
import AudioRecorder from "@/components/AudioRecorder";

interface Card {
  id: string;
  german: string;
  arabic: string;
  hint?: string;
  category?: string;
  tags?: string[];
  hasAudio?: boolean;
  type?: 'word' | 'phrase';
}

export default function Home() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [focusAudioOnEdit, setFocusAudioOnEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  
  const [userEmail, setUserEmail] = useState<string>("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 50;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authChecked) {
      fetchCards();
    }
  }, [authChecked]);

  useEffect(() => {
    // defaults to newest first by reversing the original array
    let result = [...cards].reverse();

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (card) =>
          card.german.toLowerCase().includes(lower) ||
          card.arabic.toLowerCase().includes(lower) ||
          card.tags?.some((t) => t.toLowerCase().includes(lower))
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter((card) => card.category === categoryFilter);
    }

    setFilteredCards(result);
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [searchTerm, categoryFilter, cards]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setAuthChecked(true);
          setUserEmail(data.user?.username || "student@example.com");
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  };

  const fetchCards = async () => {
    try {
      const res = await fetch("/api/cards");
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch (error) {
      console.error("Failed to fetch cards", error);
    } finally {
      setLoading(false);
    }
  };

  // Temp state for new card audio
  const [tempId, setTempId] = useState<string | null>(null);
  const [tempHasAudio, setTempHasAudio] = useState(false);
  
  // Custom Category State
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategoryValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("General"); // New state to control dropdown

  const presetCategories = [
    "A1-1", "A1-2", "A2-1", "A2-2",
    "B1-1", "B1-2", "B2-1", "B2-2",
    "C1", "C2", "General"
  ];

  const openAddModal = () => {
    setTempId(crypto.randomUUID());
    setTempHasAudio(false);
    setIsCustomCategory(false);
    setCustomCategoryValue("");
    setSelectedCategory("General");
    setIsAddModalOpen(true);
  };

  const openEditModal = (card: Card, extra?: { focusAudio?: boolean }) => {
    setCurrentCard(card);
    setFocusAudioOnEdit(!!extra?.focusAudio);
    
    // Check if the card's category is one of the presets
    if (card.category && !presetCategories.includes(card.category)) {
      setIsCustomCategory(true);
      setCustomCategoryValue(card.category);
      setSelectedCategory("custom");
    } else {
      setIsCustomCategory(false);
      setCustomCategoryValue("");
      setSelectedCategory(card.category || "General");
    }
    
    setIsEditModalOpen(true);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value);
    if (value === "custom") {
      setIsCustomCategory(true);
    } else {
      setIsCustomCategory(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const german = (form.elements.namedItem("german") as HTMLInputElement).value;
    const arabic = (form.elements.namedItem("arabic") as HTMLInputElement).value;
    
    let category = selectedCategory;
    if (category === "custom") {
      category = (form.elements.namedItem("customCategory") as HTMLInputElement).value || "General";
    }

    const type = (form.elements.namedItem("type") as RadioNodeList).value || "word";

    const hint = (form.elements.namedItem("hint") as HTMLInputElement).value;
    const tagsStr = (form.elements.namedItem("tags") as HTMLInputElement).value;

    const tags = tagsStr
      .split(",")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((t: any) => t.trim())
      .filter((t: string) => t);

    // Use the tempId if we recorded audio, otherwise let backend generate one (or just pass it anyway)
    // We pass hasAudio: tempHasAudio
    const newCard = { 
      id: tempId,
      german, 
      arabic, 
      category,
      type,
      hint, 
      tags,
      hasAudio: tempHasAudio
    };

    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCard),
    });

    if (res.ok) {
      fetchCards();
      setIsAddModalOpen(false);
      setTempId(null);
      setTempHasAudio(false);
      form.reset();
    }
  };

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard) return;

    const form = e.target as HTMLFormElement;
    const german = (form.elements.namedItem("german") as HTMLInputElement).value;
    const arabic = (form.elements.namedItem("arabic") as HTMLInputElement).value;
    
    let category = selectedCategory;
    if (category === "custom") {
      category = (form.elements.namedItem("customCategory") as HTMLInputElement).value || "General";
    }

    const type = (form.elements.namedItem("type") as RadioNodeList).value || "word";

    const hint = (form.elements.namedItem("hint") as HTMLInputElement).value;
    const tagsStr = (form.elements.namedItem("tags") as HTMLInputElement).value;

    const tags = tagsStr
      .split(",")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((t: any) => t.trim())
      .filter((t: string) => t);

    const updated = { ...currentCard, german, arabic, category, type, hint, tags };

    const res = await fetch("/api/cards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    if (res.ok) {
      fetchCards();
      setIsEditModalOpen(false);
      setCurrentCard(null);
    }
  };

  const handleAudioUpdate = (cardId: string, hasAudio: boolean) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, hasAudio } : c));
    if (currentCard && currentCard.id === cardId) {
      setCurrentCard(prev => prev ? { ...prev, hasAudio } : null);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch("/api/cards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      fetchCards();
    }
  };

  const handleShuffle = () => {
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
    setFilteredCards(shuffled);
    setCurrentPage(1); // Reset to page 1
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!authChecked || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 font-light text-xl tracking-widest animate-pulse">
        LOADING...
      </div>
    );
  }

  // Categories for filter
  const categories = Array.from(new Set(cards.map((c) => c.category || "General")));

  // Pagination Logic
  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const currentCards = filteredCards.slice(startIndex, startIndex + cardsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main className="w-full max-w-[1200px] mx-auto px-6 py-8 relative">
      <div className="max-w-[1000px] w-full mx-auto">
        <header className="flex justify-between items-center mb-10 p-4 bg-card-bg backdrop-blur-xl border border-glass-border rounded-[1.25rem] shadow-lg relative">
          
          {/* Left: Navigation */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 text-slate-300 hover:text-white font-medium hover:bg-white/5 rounded-lg transition-colors"
            >
              Home
            </button>
            <button 
              onClick={() => router.push('/practice')}
              className="px-4 py-2 text-slate-300 hover:text-white font-medium hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
            >
              Practice
            </button>
          </div>

          {/* Center: Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400 cursor-default select-none">
              Gerne
            </h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <button 
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all text-sm"
              onClick={openAddModal}
            >
              <Plus size={18} />
              Create
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center text-white hover:border-white/20 transition-all shadow-lg"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                <span className="font-bold text-sm">{userEmail.charAt(0).toUpperCase()}</span>
              </button>

              {isProfileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Signed in as</p>
                      <p className="text-sm text-white truncate font-medium" title={userEmail}>
                        {userEmail}
                      </p>
                    </div>
                    <div className="p-2">
                      <button 
                        className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors text-sm font-medium"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <section className="mb-10 flex flex-col gap-6">
          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              <input
                type="text"
                placeholder="Search words or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-3.5 px-5 pl-12 bg-slate-900/50 border border-glass-border rounded-2xl text-white text-base transition-all focus:outline-none focus:border-primary focus:bg-slate-900/70 focus:ring-4 focus:ring-primary/10 placeholder:text-slate-500"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-w-[150px] py-3.5 px-5 bg-slate-900/50 border border-glass-border rounded-2xl text-white text-base transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer hover:bg-slate-900/70"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat || "Uncategorized"}
                </option>
              ))}
            </select>

            <button 
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 border border-glass-border rounded-2xl text-slate-300 font-semibold transition-all hover:bg-white/10 hover:text-white hover:border-white/20 active:scale-95 w-full sm:w-auto" 
              onClick={handleShuffle}
              title="Shuffle Cards"
            >
              <Shuffle size={20} />
              <span className="sr-only sm:not-sr-only">Shuffle</span>
            </button>
          </div>
        </section>

        {filteredCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-glass-border rounded-3xl bg-white/5">
            <Languages size={48} className="mb-4 opacity-50" />
            <p className="text-xl font-light">No cards found.</p>
            <button 
              className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover hover:-translate-y-1 transition-all" 
              onClick={openAddModal}
            >
              Create your first card
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8 perspective-[1000px]">
              {currentCards.map((card) => (
                <Flashcard
                  key={card.id}
                  card={card}
                  onDelete={handleDeleteCard}
                  onEdit={openEditModal}
                  // isReversed={true} // Uncomment to test reversed mode (Arabic front)
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12 mb-8">
                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-glass-border text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={20} />
                </button>
                
                <span className="text-slate-400 font-mono text-sm">
                  Page <strong className="text-white">{currentPage}</strong> of {totalPages}
                </span>

                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-glass-border text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODALS */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="absolute inset-0"
            onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setCurrentCard(null);
            }}
          />
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-glass-border rounded-3xl w-full max-w-2xl relative shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 pb-4 flex justify-between items-center bg-slate-900/50 border-b border-white/5">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                {isEditModalOpen ? "Edit Flashcard" : "New Flashcard"}
              </h2>
              <button
                className="p-2 rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  setCurrentCard(null);
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pt-6 custom-scrollbar">
              <form onSubmit={isEditModalOpen ? handleUpdateCard : handleAddCard} className="space-y-6">
                
                {/* Type Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Type</label>
                  <div className="flex gap-4 p-1 bg-black/20 rounded-xl border border-white/10 w-fit">
                    <label className="cursor-pointer">
                      <input 
                        type="radio" 
                        name="type" 
                        value="word" 
                        defaultChecked={!currentCard || currentCard.type === 'word'} 
                        className="peer sr-only" 
                      />
                      <div className="px-5 py-2 rounded-lg text-slate-400 font-semibold transition-all peer-checked:bg-primary/20 peer-checked:text-primary peer-checked:shadow-sm hover:text-white">
                        Word
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input 
                        type="radio" 
                        name="type" 
                        value="phrase" 
                        defaultChecked={currentCard?.type === 'phrase'} 
                        className="peer sr-only" 
                      />
                      <div className="px-5 py-2 rounded-lg text-slate-400 font-semibold transition-all peer-checked:bg-secondary/20 peer-checked:text-secondary peer-checked:shadow-sm hover:text-white">
                        Phrase
                      </div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">German</label>
                    <input
                      name="german"
                      defaultValue={currentCard?.german}
                      required
                      placeholder="e.g. Apfel"
                      className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:bg-black/40 focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Arabic Meaning</label>
                    <input
                      name="arabic"
                      defaultValue={currentCard?.arabic}
                      required
                      placeholder="e.g. تفاحة"
                      dir="rtl"
                      className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-secondary focus:bg-black/40 focus:ring-4 focus:ring-secondary/10 transition-all font-arabic text-right"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                    <div className="relative">
                      <select
                        name="category"
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-primary focus:bg-black/40 focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                      >
                          {presetCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="custom">Selection (Enter word or phrase...)</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronRight size={18} className="rotate-90 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  {isCustomCategory && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Enter Custom Category</label>
                      <input
                        name="customCategory"
                        defaultValue={customCategory}
                        placeholder="e.g. Kitchen Utensils"
                        className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-primary focus:bg-black/40 focus:ring-4 focus:ring-primary/10 transition-all"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Hint (Optional)</label>
                  <input
                    name="hint"
                    defaultValue={currentCard?.hint}
                    placeholder="e.g. Starts with A..."
                    className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-accent focus:bg-black/40 focus:ring-4 focus:ring-accent/10 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Tags (comma separated)</label>
                  <input
                    name="tags"
                    defaultValue={currentCard?.tags?.join(", ")}
                    placeholder="food, basic, fruit"
                    className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {( (isEditModalOpen && currentCard) || (isAddModalOpen && tempId) ) && (
                  <div className="pt-4 border-t border-white/10">
                    <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider ml-1 mb-4">Voice Recording</label>
                    <AudioRecorder 
                      cardId={isEditModalOpen && currentCard ? currentCard.id : tempId!} 
                      onSave={() => isEditModalOpen && currentCard ? handleAudioUpdate(currentCard.id, true) : setTempHasAudio(true)}
                      existingAudio={isEditModalOpen && currentCard ? currentCard.hasAudio : tempHasAudio}
                    />
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsEditModalOpen(false);
                      setCurrentCard(null);
                    }}
                    className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-primary to-secondary rounded-xl font-bold text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
                  >
                    {isEditModalOpen ? "Save Changes" : "Create Card"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
