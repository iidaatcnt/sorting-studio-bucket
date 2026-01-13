'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  StepBack,
  Github,
  Info,
  Code2,
  Zap,
  Lightbulb,
  Container,
  LayoutGrid
} from 'lucide-react';

// --- Types ---
type SortState = 'distribute' | 'sort_buckets' | 'collect' | 'init' | 'complete';

interface SortingStep {
  array: (number | null)[];
  buckets: number[][]; // 5 buckets
  currentIndex?: number;
  currentBucket?: number;
  type: SortState;
  description: string;
  codeLine?: number;
}

// --- Constants ---
const ARRAY_SIZE = 12;
const NUM_BUCKETS = 5;
const INITIAL_SPEED = 800;

const CODE_PYTHON = [
  "def bucket_sort(arr):",
  "    n = len(arr)",
  "    buckets = [[] for _ in range(5)]",
  "    for x in arr:",
  "        idx = int(x / 20) # 0-100 to 0-4",
  "        if idx == 5: idx = 4",
  "        buckets[idx].append(x)",
  "    ",
  "    for bucket in buckets:",
  "        bucket.sort()",
  "    ",
  "    # Concatenate results",
  "    k = 0",
  "    for bucket in buckets:",
  "        for val in bucket:",
  "            arr[k] = val",
  "            k += 1"
];

// --- Algorithm Logic ---
const generateSteps = (initialArray: number[]): SortingStep[] => {
  const steps: SortingStep[] = [];
  let arr: (number | null)[] = [...initialArray];
  const buckets: number[][] = Array.from({ length: NUM_BUCKETS }, () => []);

  steps.push({
    array: [...arr],
    buckets: buckets.map(b => [...b]),
    type: 'init',
    description: 'バケツソートを開始します。範囲ごとに「バケツ」を用意し、仕分けしてから合体させます。',
    codeLine: 0
  });

  // Distribute
  for (let i = 0; i < arr.length; i++) {
    const val = arr[i]!;
    let bIdx = Math.floor(val / 20);
    if (bIdx >= NUM_BUCKETS) bIdx = NUM_BUCKETS - 1;

    steps.push({
      array: [...arr],
      buckets: buckets.map(b => [...b]),
      currentIndex: i,
      type: 'distribute',
      description: `${val} は範囲 ${bIdx * 20}〜${(bIdx + 1) * 20} なので、バケツ ${bIdx} に入れます。`,
      codeLine: 4
    });

    buckets[bIdx].push(val);
    arr[i] = null;

    steps.push({
      array: [...arr],
      buckets: buckets.map(b => [...b]),
      currentIndex: i,
      type: 'distribute',
      description: `バケツ ${bIdx} に放り込みました。`,
      codeLine: 6
    });
  }

  // Sort each bucket (we use built-in sort for simplicity in visual, but show the step)
  for (let i = 0; i < NUM_BUCKETS; i++) {
    if (buckets[i].length > 1) {
      steps.push({
        array: [...arr],
        buckets: buckets.map(b => [...b]),
        currentBucket: i,
        type: 'sort_buckets',
        description: `バケツ ${i} の中身を整列します。`,
        codeLine: 9
      });
      buckets[i].sort((a, b) => a - b);
      steps.push({
        array: [...arr],
        buckets: buckets.map(b => [...b]),
        currentBucket: i,
        type: 'sort_buckets',
        description: `バケツ ${i} の中身が整列されました。`,
        codeLine: 10
      });
    }
  }

  // Collect
  let k = 0;
  for (let i = 0; i < NUM_BUCKETS; i++) {
    while (buckets[i].length > 0) {
      const val = buckets[i].shift()!;
      steps.push({
        array: [...arr],
        buckets: buckets.map(b => [...b]),
        currentBucket: i,
        type: 'collect',
        description: `バケツ ${i} から整列済みの値 ${val} を取り出し、配列に戻します。`,
        codeLine: 15
      });
      arr[k] = val;
      k++;
    }
  }

  steps.push({
    array: [...arr],
    buckets: Array.from({ length: NUM_BUCKETS }, () => []),
    type: 'complete',
    description: 'すべてのバケツが空になり、全体の並び替えが完了しました！',
    codeLine: 0
  });

  return steps;
};


// --- Main App ---
export default function BucketSortStudio() {
  const [array, setArray] = useState<(number | null)[]>([]);
  const [steps, setSteps] = useState<SortingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    const newArray = Array.from({ length: ARRAY_SIZE }, () => Math.floor(Math.random() * 95) + 5);
    const newSteps = generateSteps(newArray);
    setArray(newArray);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  const stepForward = useCallback(() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1)), [steps.length]);
  const stepBackward = useCallback(() => setCurrentStep(prev => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1001 - speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, currentStep, steps.length, speed]);

  const step = steps[currentStep] || { array: [], buckets: [], type: 'init', description: '' };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-violet-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
              <LayoutGrid className="text-slate-950 w-5 h-5" />
            </div>
            <h1 className="font-black italic tracking-tighter text-xl uppercase tracking-widest text-violet-400">Bucket_Sort_Studio</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-[10px] mono uppercase text-slate-500 font-black tracking-widest">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-violet-400 animate-pulse' : 'bg-slate-700'}`} />
                {isPlaying ? 'Filtering' : 'Idle'}
              </div>
              <span className="opacity-20">|</span>
              <span>Buckets: {NUM_BUCKETS}</span>
            </div>
            <a href="https://github.com/iidaatcnt/sorting-studio-bucket" target="_blank" rel="noreferrer" className="text-slate-600 hover:text-white transition-colors">
              <Github size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Visualization */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          <div className="relative aspect-video lg:aspect-square max-h-[500px] bg-[#030712] rounded-[3rem] border border-white/5 p-12 flex flex-col gap-12 overflow-hidden shadow-2xl">
            <div className="absolute top-8 left-12 flex items-center gap-3 mono text-[9px] text-slate-600 uppercase font-black tracking-[0.2em] z-10">
              <Container size={14} className="text-violet-500" />
              Range-Based Partitioning // Bucket Logistics
            </div>

            {/* Main Array Slot */}
            <div className="flex-1 flex items-end justify-center gap-3 px-10 pb-8 border-b border-white/5 relative">
              <div className="absolute top-0 left-0 text-[10px] mono text-slate-800 font-black uppercase tracking-widest">Main Buffer</div>
              <AnimatePresence mode="popLayout" initial={false}>
                {step.array.map((val, idx) => {
                  const isProcessing = step.currentIndex === idx;
                  const height = val === null ? 0 : (val / 100) * 100;

                  return (
                    <motion.div
                      key={`${idx}-${val}`}
                      layout
                      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                      style={{ height: `${height}%` }}
                      className={`flex-1 min-w-[30px] rounded-t-xl relative ${val === null ? 'bg-transparent border-dashed border-white/5 border-2' : 'bg-slate-800'} ${isProcessing ? 'bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)]' : ''} transition-all duration-300`}
                    >
                      {val !== null && (
                        <div className={`absolute -top-8 left-1/2 -translate-x-1/2 mono text-[10px] font-black ${isProcessing ? 'text-white' : 'text-slate-700'}`}>
                          {val}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Buckets */}
            <div className="grid grid-cols-5 gap-3 h-40 relative">
              <div className="absolute -top-6 left-0 text-[10px] mono text-slate-800 font-black uppercase tracking-widest">Active Buckets</div>
              {step.buckets.map((bucket, i) => {
                const isActive = step.currentBucket === i;
                return (
                  <div key={i} className={`flex flex-col-reverse items-center gap-1 bg-white/5 rounded-2xl border transition-all duration-500 ${isActive ? 'border-violet-500/50 bg-violet-500/5 pt-2' : 'border-white/5'} p-2 overflow-hidden relative`}>
                    <div className="text-[10px] mono font-black text-slate-800 border-b border-white/5 w-full text-center pb-2 mb-1">
                      {i * 20}-{((i + 1) * 20)}
                    </div>
                    <AnimatePresence>
                      {bucket.map((val, bIdx) => (
                        <motion.div
                          key={`${val}-${bIdx}`}
                          initial={{ y: -50, scale: 0.8, opacity: 0 }}
                          animate={{ y: 0, scale: 1, opacity: 1 }}
                          exit={{ y: 100, opacity: 0 }}
                          className="w-full bg-violet-600/20 py-1.5 rounded-lg text-[10px] mono font-black text-violet-300 text-center border border-violet-500/10 shadow-sm"
                        >
                          {val}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="bucket-active"
                        className="absolute inset-0 border-2 border-violet-500/30 rounded-2xl pointer-events-none"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="px-10 py-8 bg-slate-900/50 rounded-[2.5rem] border border-white/10 flex flex-col gap-8 shadow-inner">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex items-center gap-2">
                <button onClick={stepBackward} className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors text-slate-400"><StepBack size={20} /></button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 bg-violet-600 text-white rounded-[2rem] flex items-center justify-center hover:bg-violet-400 transition-all active:scale-95 shadow-xl shadow-violet-500/20"
                >
                  {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="ml-1" />}
                </button>
                <button onClick={stepForward} className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors text-slate-400"><StepForward size={20} /></button>
                <button onClick={reset} className="p-4 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-colors text-slate-400 ml-4"><RotateCcw size={20} /></button>
              </div>

              <div className="flex-1 w-full text-center md:text-left">
                <div className="flex items-center justify-between mono text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3">
                  <span>Logic Speed</span>
                  <span className="text-violet-400">{speed}ms</span>
                </div>
                <div className="flex gap-4 items-center">
                  <input type="range" min="100" max="980" value={speed} onChange={(e) => setSpeed(parseInt(e.target.value))} className="flex-1 appearance-none bg-slate-800 h-1.5 rounded-full accent-violet-500 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="p-6 bg-violet-500/5 rounded-2xl border border-violet-500/10 flex gap-4">
              <div className="mt-1 p-2 bg-violet-500/10 rounded-xl shrink-0">
                <Zap size={16} className="text-violet-400" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium italic">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Code & Theory */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="p-8 bg-zinc-900/80 border border-white/5 rounded-[3rem] shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Lightbulb className="text-amber-400 w-5 h-5" />
              <h2 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Concept_Data</h2>
            </div>
            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 mb-8">
              <h3 className="text-violet-400 font-black mb-3 text-sm">Bucket Sort</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                データをいくつかの範囲（バケツ）に振り分け、バケツの中で整列してから最後に戻すアルゴリズム。データの分布が均一な場合に、驚異的なスピードを発揮します。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 mono text-[9px] font-black uppercase tracking-tighter">
              <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5 hover:border-violet-500/20 transition-colors">
                <span className="text-slate-600 block mb-1">Avg Case</span>
                <span className="text-violet-300">O(N + K)</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/5 hover:border-violet-500/20 transition-colors">
                <span className="text-slate-600 block mb-1">Space</span>
                <span className="text-pink-400">O(N)</span>
              </div>
            </div>
          </div>

          <div className="p-8 bg-black border border-white/5 rounded-[3rem] flex-1 flex flex-col min-h-[450px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Code2 className="text-slate-600 w-5 h-5" />
                <h2 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Exec_Kernel</h2>
              </div>
              <div className="w-2 h-2 rounded-full bg-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
            </div>

            <div className="flex-1 bg-zinc-950/30 p-8 rounded-3xl mono text-[10px] leading-loose overflow-auto border border-white/5 scrollbar-hide">
              {CODE_PYTHON.map((line, i) => (
                <div
                  key={i}
                  className={`flex gap-6 transition-all duration-300 ${step.codeLine === i ? 'text-violet-400 bg-violet-400/10 -mx-8 px-8 border-l-2 border-violet-400 font-bold' : 'text-slate-800'}`}
                >
                  <span className="text-slate-900 tabular-nums w-4 select-none opacity-50">{i + 1}</span>
                  <pre className="whitespace-pre">{line}</pre>
                </div>
              ))}
            </div>
            <div className="mt-8 text-center opacity-20">
              <span className="text-[8px] mono text-slate-500 uppercase tracking-[0.5em]">range_distribution_logic</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-white/5 py-16 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <LayoutGrid className="text-slate-900 w-8 h-8 opacity-20" />
          <p className="text-[8px] mono text-slate-700 uppercase tracking-[0.8em]">Interactive_Learning_Series // Informatics_I</p>
        </div>
      </footer>
    </div>
  );
}
