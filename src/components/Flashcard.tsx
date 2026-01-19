'use client';

import { useState } from 'react';
import { Lightbulb, BookOpen, Trash2, ArrowLeft, MoreVertical, Pencil, Volume2, Mic, Monitor } from 'lucide-react';

interface FlashcardProps {
  card: {
    id: string;
    german: string;
    arabic: string;
    hint?: string;
    category?: string;
    tags?: string[];
    hasAudio?: boolean;
  };
  onDelete: (id: string) => void;
  onEdit: (card: any, extra?: { focusAudio?: boolean }) => void;
  isReversed?: boolean;
}

export default function Flashcard({ card, onDelete, onEdit, isReversed }: FlashcardProps) {
  const [view, setView] = useState<'choice' | 'hint' | 'meaning'>('choice');
  const [isFlipped, setIsFlipped] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(card.id);
    setShowMenu(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(card);
    setShowMenu(false);
  };

  const handleSelect = (e: React.MouseEvent, selectedView: 'hint' | 'meaning') => {
    e.stopPropagation();
    setView(selectedView);
    setIsFlipped(true);
  };

  const handleFlipBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    // Reset view after animation completes
    setTimeout(() => setView('choice'), 600);
  };

  return (
    <div 
      className="group relative w-full aspect-[4/3] perspective-[1000px] cursor-pointer"
    >
      <div 
        className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : 'group-hover:-translate-y-2'}`}
      >
        {/* Front */}
        <div 
          className={`absolute inset-0 w-full h-full z-20 overflow-hidden rounded-[2rem] shadow-lg hover:shadow-2xl border border-glass-border bg-card-bg backdrop-blur-2xl ${isFlipped ? 'z-10' : 'z-20'}`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="absolute top-5 left-0 px-6 w-full flex justify-between items-center z-50">
            <div className="flex items-center gap-2">
              <span className="bg-primary/15 border border-primary/20 px-3 py-1 rounded-full text-[0.7rem] font-bold text-primary-300 uppercase tracking-wider backdrop-blur-sm">
                {card.category || 'category'}
              </span>
              {card.tags && card.tags.slice(0, 2).map(tag => (
                <span key={tag} className="bg-secondary/10 border border-secondary/20 px-2.5 py-1 rounded-full text-[0.65rem] font-semibold text-secondary-400 lowercase tracking-wide backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="relative">
              <button 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${showMenu ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 text-slate-400 border-glass-border hover:bg-white/10 hover:text-white'}`}
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              >
                <MoreVertical size={18} />
              </button>
              
              {showMenu && (
                <div 
                  className="absolute top-full right-0 mt-2 min-w-[140px] bg-slate-900/90 backdrop-blur-xl border border-glass-border rounded-xl p-2 z-50 shadow-xl animate-in fade-in zoom-in-95 duration-200" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left" onClick={handleEdit}>
                    <Pencil size={14} />
                    Edit Details
                  </button>
                  <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors text-left" onClick={handleDelete}>
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center h-full pt-12 pb-8 px-8">
            <span className="text-[0.7rem] uppercase font-bold tracking-[0.15em] text-slate-400 mb-4 opacity-80">
              {isReversed ? 'Arabic' : 'German'}
            </span>
            <div className={`text-4xl font-bold text-center tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400 ${isReversed ? 'font-arabic' : ''}`} dir={isReversed ? 'rtl' : 'ltr'}>
              {isReversed ? card.arabic : card.german}
            </div>

            {card.hasAudio && (
              <button 
                className="mt-6 w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary-400 hover:bg-primary hover:text-white transition-all duration-300 hover:scale-110 relative z-50"
                onClick={(e) => {
                  e.stopPropagation();
                  const audio = new Audio(`/api/audio/${card.id}?t=${Date.now()}`);
                  audio.play();
                }}
                title="Play Pronunciation"
              >
                <Volume2 size={24} />
              </button>
            )}
          </div>
        
          <div className={`absolute inset-0 flex transition-all duration-300 z-40 rounded-[2rem] overflow-hidden ${!isFlipped ? 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div 
              className="flex-1 flex items-center justify-center bg-slate-900/90 backdrop-blur-md border-r border-white/5 relative overflow-hidden group/zone cursor-pointer"
              onClick={(e) => handleSelect(e, 'hint')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/90 to-orange-600/90 opacity-0 group-hover/zone:opacity-100 transition-opacity duration-300" />
              <span className="flex flex-col items-center gap-2 text-white font-semibold transform translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100 relative z-10">
                <Lightbulb size={24} />
                Hint
              </span>
            </div>
            <div 
              className="flex-1 flex items-center justify-center bg-slate-900/90 backdrop-blur-md relative overflow-hidden group/zone cursor-pointer"
              onClick={(e) => handleSelect(e, 'meaning')}
            >
               <div className="absolute inset-0 bg-gradient-to-br from-violet-500/90 to-indigo-600/90 opacity-0 group-hover/zone:opacity-100 transition-opacity duration-300" />
               <span className="flex flex-col items-center gap-2 text-white font-semibold transform translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 delay-100 relative z-10">
                 <BookOpen size={24} />
                 Meaning
               </span>
            </div>
          </div>
        </div>

        {/* Back */}
        <div 
          className={`absolute inset-0 w-full h-full [transform:rotateY(180deg)] rounded-[2rem] overflow-hidden shadow-lg border border-glass-border bg-card-bg backdrop-blur-2xl flex flex-col ${isFlipped ? 'z-20' : 'z-10'}`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            {view === 'hint' && (
              <>
                <span className="text-[0.7rem] uppercase font-bold tracking-[0.15em] text-amber-400 mb-4 opacity-80">Hint</span>
                <div className="text-xl text-center text-slate-200 font-medium leading-relaxed">{card.hint || "No hint provided"}</div>
              </>
            )}

            {view === 'meaning' && (
              <>
                <span className="text-[0.7rem] uppercase font-bold tracking-[0.15em] text-violet-400 mb-4 opacity-80">{isReversed ? 'German' : 'Arabic'}</span>
                <div className="text-3xl text-center font-bold text-white leading-tight" dir={isReversed ? 'ltr' : 'rtl'}>
                  {isReversed ? card.german : card.arabic}
                </div>
              </>
            )}
  
            {card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {card.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-medium hover:bg-white/10 hover:text-white hover:border-white/20 transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-6 flex justify-center">
            <button 
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/20 hover:text-white transition-colors" 
              onClick={handleFlipBack}
            >
              <ArrowLeft size={14} />
              Back to front
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
