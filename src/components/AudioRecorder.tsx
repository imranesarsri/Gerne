'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Volume2, Monitor } from 'lucide-react';

interface AudioRecorderProps {
  cardId: string;
  onSave: () => void;
  existingAudio?: boolean;
}

export default function AudioRecorder({ cardId, onSave, existingAudio }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(existingAudio ? `/api/audio/${cardId}?t=${Date.now()}` : null);
  const [recordingType, setRecordingType] = useState<'mic' | 'system' | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async (type: 'mic' | 'system') => {
    try {
      let stream: MediaStream;
      if (type === 'mic') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        // For system audio, we use getDisplayMedia
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1 }, // Required for some browsers
          audio: true,
        });
        
        // Ensure we stop video tracks if they were added (since we only want audio)
        stream.getVideoTracks().forEach(track => track.stop());
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
        
        // Automatically save
        await saveAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingType(type);
    } catch (err) {
      console.error('Error accessing hardware:', err);
      alert('Could not access microphone or system audio. Make sure you granted permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingType(null);
    }
  };

  const saveAudio = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('audio', blob, `${cardId}.webm`);

    try {
      const res = await fetch(`/api/audio/${cardId}`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        onSave();
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const deleteAudio = async () => {
    if (!confirm('Are you sure you want to delete this recording?')) return;

    try {
      const res = await fetch(`/api/audio/${cardId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAudioURL(null);
        onSave();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center gap-4 p-5 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/5 shadow-xl transition-all duration-300 hover:border-white/10">
        {!isRecording ? (
          <div className="flex w-full gap-3 sm:flex-row flex-col">
            <button 
              type="button"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium hover:bg-primary/20 hover:text-primary-300 hover:border-primary/30 transition-all duration-200 active:scale-95 group" 
              onClick={() => startRecording('mic')}
              title="Record from Microphone"
            >
              <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors">
                <Mic size={16} className="group-hover:text-primary-400" />
              </div>
              <span>Microphone</span>
            </button>
            <button 
              type="button"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium hover:bg-secondary/20 hover:text-secondary-300 hover:border-secondary/30 transition-all duration-200 active:scale-95 group" 
              onClick={() => startRecording('system')}
              title="Record System Audio"
            >
              <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-secondary/20 transition-colors">
                 <Monitor size={16} className="group-hover:text-secondary-400" />
              </div>
              <span>System Audio</span>
            </button>
          </div>
        ) : (
          <button 
            type="button"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-300 animate-pulse active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.2)] hover:shadow-[0_0_30px_rgba(244,63,94,0.4)]" 
            onClick={stopRecording}
          >
            <Square size={18} fill="currentColor" />
            <span>Stop Recording {recordingType === 'mic' ? '(Mic)' : '(System)'}</span>
          </button>
        )}

        {audioURL && !isRecording && (
          <div className="w-full flex items-center justify-between gap-3 p-3 bg-black/20 rounded-xl border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <Volume2 size={16} />
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audio Recorded</span>
                 <span className="text-[10px] text-slate-500">Ready to play</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500 hover:text-white text-slate-300 text-xs font-semibold border border-white/5 hover:border-emerald-500/50 transition-all" 
                onClick={() => {
                  const audio = new Audio(audioURL);
                  audio.play();
                }}
              >
                <Play size={12} fill="currentColor" />
                Listen
              </button>
              <button 
                type="button"
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" 
                onClick={deleteAudio}
                title="Delete Recording"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
