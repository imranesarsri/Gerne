'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Volume2, Lightbulb, Trophy, RotateCcw, LayoutPanelLeft, PlayCircle, ChevronRight } from 'lucide-react';

interface Card {
  id: string;
  german: string;
  arabic: string;
  hint?: string;
  category?: string;
  hasAudio?: boolean;
}

interface ErrorLog {
  card: Card;
  userAnswer: string;
}

export default function PracticePage() {
  const [view, setView] = useState<'setup' | 'test' | 'results'>('setup');
  const [cards, setCards] = useState<Card[]>([]);
  const [shuffledQueue, setShuffledQueue] = useState<Card[]>([]);
  const [sessionLimit, setSessionLimit] = useState(10);
  const [customLimit, setCustomLimit] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [hasAttemptedCurrent, setHasAttemptedCurrent] = useState(false);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const shuffleArray = <T,>(array: T[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch('/api/cards');
      if (res.ok) {
        const data = await res.json();
        setCards(data);
      }
    } catch (err) {
      console.error('Failed to fetch cards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    if (view === 'test' && feedback === 'none') {
      inputRef.current?.focus();
    }
  }, [feedback, currentIdx, view]);

  const startSession = (limit: number) => {
    const shuffled = shuffleArray(cards);
    const finalLimit = Math.min(limit, cards.length);
    setShuffledQueue(shuffled.slice(0, finalLimit));
    setCurrentIdx(0);
    setScore({ correct: 0, total: 0 });
    setErrors([]);
    setHasAttemptedCurrent(false);
    setFeedback('none');
    setUserInput('');
    setView('test');
  };

  const handleCustomStart = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseInt(customLimit);
    if (limit > 0) {
      startSession(limit);
    }
  };

  const currentCard = shuffledQueue[currentIdx] || null;

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentCard || feedback !== 'none') return;

    const isCorrect = userInput.trim().toLowerCase() === currentCard.german.trim().toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    if (!hasAttemptedCurrent) {
      setScore(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1
      }));
      
      if (!isCorrect) {
        setErrors(prev => [...prev, { card: currentCard, userAnswer: userInput.trim() }]);
      }
      setHasAttemptedCurrent(true);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < shuffledQueue.length) {
      setFeedback('none');
      setUserInput('');
      setShowHint(false);
      setHasAttemptedCurrent(false);
      setCurrentIdx(prev => prev + 1);
    } else {
      setView('results');
    }
  };

  const handleRetype = () => {
    setFeedback('none');
    setUserInput('');
    setShowHint(false);
  };

  const playAudio = (cardId: string) => {
    const audio = new Audio(`/api/audio/${cardId}?t=${Date.now()}`);
    audio.play();
  };

  if (loading) {
    return (
      <main className="practice-container flex-center">
        <div className="loader">Loading Practice Mode...</div>
      </main>
    );
  }

  if (cards.length === 0) {
    return (
      <main className="practice-container flex-center">
        <div className="empty-state">
          <h2>No cards available for practice!</h2>
          <p>Go back to the dashboard and add some words first.</p>
          <button onClick={() => router.push('/')} className="btn-back-choice mt-4">
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  // --- SETUP VIEW ---
  if (view === 'setup') {
    return (
      <main className="h-screen max-h-screen w-full flex flex-col items-center justify-center p-6 relative z-10 overflow-hidden">
        <div className="absolute top-6 left-6 animate-[fadeIn_0.8s_ease-out]">
          <button onClick={() => router.push('/')} className="flex items-center gap-2.5 text-text-secondary bg-white/5 border border-glass-border px-5 py-2.5 rounded-2xl cursor-pointer font-semibold transition-all duration-200 hover:text-white hover:bg-white/10 hover:border-white/20">
            <ArrowLeft size={20} />
            <span>Dashboard</span>
          </button>
        </div>

        <div className="bg-card-bg backdrop-blur-3xl border border-glass-border rounded-[3rem] px-12 py-16 text-center max-w-[650px] w-full shadow-[0_40px_100px_-20px_rgba(139,92,246,0.2)] animate-[slideUp_0.8s_cubic-bezier(0.34,1.56,0.64,1)] relative flex flex-col items-center max-h-[85vh]">
          <div className="w-[80px] h-[80px] bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8 text-primary shadow-[inset_0_0_30px_rgba(139,92,246,0.15)] shrink-0">
             <LayoutPanelLeft size={40} className="text-primary" />
          </div>
          <h1 className="text-4xl mb-3 font-black tracking-tighter bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent shrink-0">Practice Setup</h1>
          <p className="text-text-secondary mb-10 text-lg font-light max-w-[400px] mx-auto shrink-0">Choose how many words you want to practice today.</p>
          
          <div className="w-full overflow-y-auto custom-scrollbar px-4 flex flex-col items-center">
            <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-[400px]">
              {[10, 20, 50].map(num => (
                <button 
                  key={num} 
                  onClick={() => startSession(num)} 
                  className="p-5 bg-white/5 border border-glass-border rounded-3xl text-white font-bold cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] text-lg hover:bg-white/10 hover:border-white/30 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] disabled:opacity-15 disabled:cursor-not-allowed disabled:grayscale"
                  disabled={cards.length < num && num !== 10}
                >
                  {num} Words
                </button>
              ))}
              <button 
                  onClick={() => startSession(cards.length)} 
                  className="p-5 border rounded-3xl font-bold cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] text-lg bg-primary/15 border-primary/50 text-[#a78bfa] hover:bg-primary hover:text-white hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)]"
              >
                All ({cards.length})
              </button>
            </div>

            <form onSubmit={handleCustomStart} className="w-full max-w-[400px]">
              <span className="flex items-center gap-6 text-text-secondary text-xs font-extrabold my-8 tracking-[0.25em] opacity-40 before:content-[''] before:flex-1 before:h-px before:bg-gradient-to-r before:from-transparent before:via-glass-border before:to-transparent after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-transparent after:via-glass-border after:to-transparent shrink-0">OR</span>
              <div className="flex gap-3">
                <input 
                  type="number" 
                  placeholder="Custom..." 
                  value={customLimit}
                  onChange={(e) => setCustomLimit(e.target.value)}
                  min="1"
                  max={cards.length}
                  className="flex-1 bg-slate-900/40 border border-glass-border rounded-3xl px-6 py-3 text-white font-inherit text-lg transition-all duration-300 text-center focus:outline-none focus:border-primary focus:bg-slate-900/60 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)]"
                />
                <button 
                  type="submit" 
                  className="flex items-center gap-3 px-8 py-3 bg-gradient-to-br from-primary to-secondary border-none rounded-3xl text-white font-extrabold cursor-pointer transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(139,92,246,0.5)] hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_15px_35px_-5px_rgba(139,92,246,0.6)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                  disabled={!customLimit}
                >
                   <PlayCircle size={20} />
                   Start
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // --- RESULTS VIEW ---
  if (view === 'results') {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
       <main className="h-screen max-h-screen w-full flex flex-col items-center justify-center p-6 relative z-10 overflow-hidden">
          <div className="w-full max-w-[1000px] h-full flex flex-col gap-6 animate-[fadeIn_1s_ease-out] py-4">
             {/* Header / Summary Card */}
             <div className="bg-card-bg backdrop-blur-[32px] border border-glass-border rounded-[3rem] p-8 text-center shadow-lg relative shrink-0 flex items-center justify-between gap-8 overflow-hidden">
                <div className="flex items-center gap-8 text-left">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Trophy size={40} className="text-[#fbbf24] drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] animate-bounce" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold mb-1">Session Complete!</h1>
                    <div className="text-text-secondary text-lg">{percentage}% Correct Accuracy</div>
                  </div>
                </div>

                <div className="flex items-center gap-12">
                   <div className="text-center">
                      <span className="text-5xl font-black block leading-none bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent">{score.correct} <span className="text-2xl text-slate-500">/ {score.total}</span></span>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 block">Score</span>
                   </div>
                   
                   <div className="flex flex-col gap-3">
                      <button onClick={() => setView('setup')} className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-bg-dark border-none rounded-2xl font-bold cursor-pointer transition-all duration-300 text-sm hover:-translate-y-0.5 hover:shadow-lg">
                         <RefreshCw size={16} /> Practice Again
                      </button>
                      <button onClick={() => router.push('/')} className="px-8 py-3 bg-white/5 border border-glass-border rounded-2xl text-white font-bold cursor-pointer transition-all duration-200 text-sm hover:bg-white/10 hover:border-white/20">
                         Back to Dashboard
                      </button>
                   </div>
                </div>
             </div>

             {/* Errors List */}
             <div className="flex-1 min-h-0 bg-slate-900/20 backdrop-blur-sm border border-glass-border rounded-[3rem] p-6 overflow-hidden flex flex-col">
                {errors.length > 0 ? (
                   <>
                      <h2 className="text-2xl font-bold mb-6 pl-4 flex items-center gap-3 shrink-0">
                        Review Your Errors 
                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm">{errors.length}</span>
                      </h2>
                      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 content-start">
                         {errors.map((error, idx) => (
                            <div key={idx} className="bg-slate-900/40 backdrop-blur-md border border-glass-border rounded-[2rem] p-6 transition-all hover:bg-slate-900/60">
                               <div className="flex justify-between items-center mb-4 pb-4 border-b border-glass-border">
                                  <div className="text-2xl font-extrabold truncate" dir="rtl">{error.card.arabic}</div>
                                  {error.card.hasAudio && (
                                     <button onClick={() => playAudio(error.card.id)} className="bg-primary/10 border border-primary/20 text-[#a78bfa] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary hover:text-white shrink-0">
                                        <Volume2 size={14} />
                                     </button>
                                  )}
                               </div>
                               <div className="space-y-3">
                                  <div>
                                     <div className="text-[10px] uppercase tracking-widest font-extrabold text-text-secondary opacity-70 mb-1">You wrote</div>
                                     <div className="font-bold text-lg text-[#fb7185] line-through decoration-2 opacity-80 break-words">{error.userAnswer || '(Empty)'}</div>
                                  </div>
                                  <div>
                                     <div className="text-[10px] uppercase tracking-widest font-extrabold text-text-secondary opacity-70 mb-1">Correct Answer</div>
                                     <div className="font-bold text-lg text-success drop-shadow-[0_0_10px_rgba(16,185,129,0.2)] break-words">{error.card.german}</div>
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </>
                ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-success">
                      <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 size={48} />
                      </div>
                      <h2 className="text-3xl font-bold mb-2">Perfect Score!</h2>
                      <p className="text-slate-400">You didn't make any mistakes in this session.</p>
                   </div>
                )}
             </div>
          </div>
       </main>
    );
  }

  // --- TEST VIEW ---
  return (
    <main className="h-screen max-h-screen w-full flex flex-col p-6 relative z-10 overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0 z-20">
        <button onClick={() => setView('setup')} className="flex items-center gap-2 text-text-secondary bg-white/5 border border-glass-border px-4 py-2 rounded-xl cursor-pointer font-bold text-sm transition-all hover:text-white hover:bg-white/10 hover:border-white/20">
          <ArrowLeft size={16} />
          <span>Exit</span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#fbbf24]/10 border border-[#fbbf24]/25 rounded-xl text-[#fbbf24] text-sm font-bold">
            <Trophy size={14} />
            <span>Score: {score.correct} / {score.total}</span>
          </div>
          <div className="text-xs text-text-secondary font-extrabold tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-glass-border">
             {currentIdx + 1} / {shuffledQueue.length}
          </div>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center min-h-0">
        <div className={`w-full max-w-[550px] bg-card-bg backdrop-blur-[32px] border border-glass-border rounded-[3.5rem] p-10 text-center shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] relative flex flex-col justify-center transition-all duration-500 ${feedback === 'correct' ? 'border-success shadow-[0_0_50px_rgba(16,185,129,0.1)]' : feedback === 'incorrect' ? 'border-error shadow-[0_0_50px_rgba(244,63,94,0.1)]' : ''}`}>
          
          <div className="shrink-0 mb-8">
            <h1 className={`font-black leading-tight bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent break-words ${currentCard?.arabic && currentCard.arabic.length > 20 ? 'text-5xl' : 'text-7xl'}`} dir="rtl">
              {currentCard?.arabic}
            </h1>
            <span className="text-xs tracking-[0.2em] font-bold text-text-secondary uppercase mt-4 block opacity-60">Translate to German</span>
          </div>

          {showHint && currentCard?.hint && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#fbbf24]/10 text-[#fbbf24] px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
              <Lightbulb size={14} />
              <span>{currentCard.hint}</span>
            </div>
          )}

          <form onSubmit={handleCheck} className="w-full mt-4">
            <div className="relative mb-6">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your answer..."
                disabled={feedback !== 'none'}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                className="w-full px-6 py-5 bg-slate-900/50 border-2 border-glass-border rounded-2xl text-white text-xl text-center transition-all focus:outline-none focus:border-primary focus:bg-slate-900/80 shadow-inner"
              />
              {!showHint && currentCard?.hint && feedback === 'none' && (
                <button 
                  type="button" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-50 hover:opacity-100 hover:text-[#fbbf24] transition-all"
                  onClick={() => setShowHint(true)}
                  title="Show Hint"
                >
                  <Lightbulb size={20} />
                </button>
              )}
            </div>

            {feedback === 'none' ? (
              <button 
                type="submit" 
                className="w-full py-4 bg-gradient-to-br from-primary to-secondary rounded-2xl text-white font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={!userInput.trim()}
              >
                Check Answer
              </button>
            ) : (
              <div className="animate-[slideUp_0.3s_ease-out]">
                <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-glass-border">
                  {feedback === 'correct' ? (
                    <div className="text-success flex items-center justify-center gap-2 text-xl font-bold">
                      <CheckCircle2 size={24} />
                      <span>Correct!</span>
                    </div>
                  ) : (
                    <div className="text-center">
                       <div className="text-error flex items-center justify-center gap-2 font-bold mb-2">
                          <XCircle size={20} /> Incorrect
                       </div>
                       <div className="text-white text-2xl font-bold">{currentCard?.german}</div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 h-14">
                  <button type="button" onClick={handleRetype} className="w-14 flex items-center justify-center bg-white/5 border border-glass-border rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-all" title="Retype">
                    <RotateCcw size={20} />
                  </button>
                  
                  <button type="button" onClick={handleNext} className="flex-1 bg-white text-bg-dark border-none rounded-xl font-bold text-lg hover:bg-slate-200 transition-all shadow-lg flex items-center justify-center gap-2">
                    {currentIdx + 1 === shuffledQueue.length ? 'Finish' : 'Next'}
                    <ChevronRight size={20} />
                  </button>
                  
                  {currentCard?.hasAudio && (
                    <button type="button" onClick={() => playAudio(currentCard.id)} className="w-14 flex items-center justify-center bg-primary/10 border border-primary/20 rounded-xl text-primary hover:bg-primary hover:text-white transition-all" title="Listen">
                      <Volume2 size={20} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
