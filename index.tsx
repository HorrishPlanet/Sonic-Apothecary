import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Activity, 
  ChevronRight, 
  RefreshCcw,
  Sparkles,
  Stethoscope,
  AudioWaveform as Waveform,
  CheckCircle2,
  Lock,
  Unlock,
  RotateCw,
  Info
} from 'lucide-react';

// --- Types & Constants ---
type Phase = 'diagnosis' | 'pharmacology' | 'alchemy' | 'prescription' | 'result';

const INTRO_SLIDES = [
  "在数字世界的喧嚣中...",
  "你的内在频率现在是如何振动的？",
  "请闭上眼感受，点亮属于你此刻的那个光点。"
];

const ELEMENTS_DATA = [
  { 
    name: '木', element: 'Wood', organ: '肝', color: '#4ade80', tone: '角', emotion: '怒', 
    effect: '肝主疏泄，在志为怒。角音（Jue）清脆悠扬，属木，能调达肝气，缓解抑郁与暴躁。' 
  },
  { 
    name: '火', element: 'Fire', organ: '心', color: '#f87171', tone: '徵', emotion: '喜', 
    effect: '心主血脉，在志为喜。徵音（Zhi）热烈奔放，属火，能振奋心阳，通畅血脉。' 
  },
  { 
    name: '土', element: 'Earth', organ: '脾', color: '#ffd700', tone: '宫', emotion: '思', 
    effect: '脾主运化，在志为思。宫音（Kung）极其稳重，属土，能健脾和胃，助人静心安神。' 
  },
  { 
    name: '金', element: 'Metal', organ: '肺', color: '#ffffff', tone: '商', emotion: '忧', 
    effect: '肺主呼吸，在志为忧。商音（Shang）清越刚烈，属金，能宣肺平喘，排遣内心哀伤。' 
  },
  { 
    name: '水', element: 'Water', organ: '肾', color: '#60a5fa', tone: '羽', emotion: '恐', 
    effect: '肾主封藏，在志为恐。羽音（Yu）柔和清冷，属水，能滋阴补肾，平复焦虑与深层恐惧。' 
  },
];

const SYMPTOMS = ["#失眠", "#工作焦虑", "#心神不宁", "#长期疲惫"];
const INSTRUMENTS = ["古琴", "笛箫", "编钟", "琵琶"];

// --- App Component ---

const App = () => {
  const [phase, setPhase] = useState<Phase>('diagnosis');
  const [introSlide, setIntroSlide] = useState(0);
  const [introMode, setIntroMode] = useState(true);
  const [diagnosisFeedback, setDiagnosisFeedback] = useState<string | null>(null);
  
  // Section 2: Master State
  const [activeElementIndex, setActiveElementIndex] = useState(2); // Start with Earth/Tu

  // Section 3: Alchemy State
  const [selectedInst, setSelectedInst] = useState("古琴");
  const [selectedTone, setSelectedTone] = useState("宫");
  const [alchemyActive, setAlchemyActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const attractorRef = useRef({ a: 1.4, b: -2.3, c: 2.4, d: -2.1 });

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY || '' }), []);

  // --- Keyboard Navigation ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (introMode) {
          if (introSlide < INTRO_SLIDES.length - 1) setIntroSlide(s => s + 1);
          else setIntroMode(false);
        } else {
          const phases: Phase[] = ['diagnosis', 'pharmacology', 'alchemy', 'prescription'];
          const idx = phases.indexOf(phase);
          if (idx < phases.length - 1) setPhase(phases[idx + 1]);
        }
      } else if (e.key === 'ArrowLeft') {
        if (introMode) {
          if (introSlide > 0) setIntroSlide(s => s - 1);
        } else {
          const phases: Phase[] = ['diagnosis', 'pharmacology', 'alchemy', 'prescription'];
          const idx = phases.indexOf(phase);
          if (idx > 0) setPhase(phases[idx - 1]);
          else setIntroMode(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [introMode, introSlide, phase]);

  const rotateIndex = (direction: number) => {
    // Increment or decrement the global index (0-4)
    setActiveElementIndex(prev => {
        let next = prev + direction;
        if (next < 0) next = 4;
        if (next > 4) next = 0;
        return next;
    });
  };

  const currentElement = ELEMENTS_DATA[activeElementIndex];

  // --- Section 3: Alchemy Canvas Loop ---
  useEffect(() => {
    if (phase !== 'alchemy') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let x = 0.1, y = 0.1;
    let frameId: number;

    const loop = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(150, 150);

      const colorIdx = ELEMENTS_DATA.findIndex(e => e.tone === selectedTone);
      ctx.strokeStyle = alchemyActive 
        ? `hsla(${(colorIdx * 60 + Date.now() / 50) % 360}, 100%, 60%, 0.3)` 
        : `hsla(${colorIdx * 60}, 100%, 60%, 0.1)`;
      
      ctx.beginPath();
      const { a, b, c, d } = attractorRef.current;
      
      const steps = alchemyActive ? 4000 : 1000;
      for (let i = 0; i < steps; i++) {
        const xNew = Math.sin(a * y) - Math.cos(b * x);
        const yNew = Math.sin(c * x) - Math.cos(d * y);
        x = xNew;
        y = yNew;
        ctx.moveTo(x, y);
        ctx.lineTo(x + 0.001, y + 0.001);
      }
      ctx.stroke();
      ctx.restore();

      if (alchemyActive) {
        attractorRef.current.a += Math.sin(Date.now() / 1000) * 0.001;
        attractorRef.current.b += Math.cos(Date.now() / 1500) * 0.001;
      }

      frameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(frameId);
  }, [phase, alchemyActive, selectedTone]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505]">
      {/* Global Header */}
      <div className="fixed top-8 left-8 z-[2000] flex flex-col gap-1 pointer-events-none">
        <h1 className="text-3xl font-bold tracking-[0.2em] text-white tcm-font">以声调心</h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">Sonic Apothecary / v5.0.0</p>
      </div>

      {/* Intro Overlay */}
      {introMode && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black px-6">
          <div className="text-center space-y-8 animate-in fade-in duration-1000">
            <p className="text-3xl font-light tracking-[0.5em] text-white breathing tcm-font">
              {INTRO_SLIDES[introSlide]}
            </p>
            <div className="flex justify-center gap-4">
              {INTRO_SLIDES.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === introSlide ? 'bg-yellow-500 scale-125' : 'bg-white/10'}`} />
              ))}
            </div>
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] pt-12">使用键盘左右方向键切换阶段</p>
          </div>
        </div>
      )}

      {/* Section 0: Diagnosis */}
      <div className={`section ${phase === 'diagnosis' ? 'active' : phase === 'pharmacology' || phase === 'alchemy' ? 'prev' : 'next'}`}>
        <div className="flex flex-col items-center gap-12 w-full max-w-4xl">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tcm-font text-yellow-500">闻诊 · 情绪脉象</h2>
            <p className="text-white/40 tracking-[0.5em]">锁定您当下的内在波形</p>
          </div>
          
          <div 
            className="relative w-80 h-80 glass rounded-full flex items-center justify-center cursor-crosshair group transition-all hover:border-yellow-500/30"
            onClick={(e) => {
              const emotions = ["焦虑", "低落", "亢奋", "淤堵", "虚耗"];
              setDiagnosisFeedback(`已感知您的脉象：${emotions[Math.floor(Math.random() * emotions.length)]}`);
              setTimeout(() => setPhase('pharmacology'), 2000);
            }}
          >
            <div className="absolute inset-0 rounded-full border border-white/10"></div>
            <div className="absolute -top-8 text-[10px] tracking-widest text-white/20 uppercase">唤醒度 (+) 亢奋</div>
            <div className="absolute -bottom-8 text-[10px] tracking-widest text-white/20 uppercase">唤醒度 (-) 平静</div>
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] tracking-widest text-white/20 uppercase">愉悦度 (-) 忧郁</div>
            <div className="absolute -right-16 top-1/2 -translate-y-1/2 rotate-90 text-[10px] tracking-widest text-white/20 uppercase">愉悦度 (+) 欢欣</div>
            <div className="w-1 h-1 bg-white rounded-full glow-gold shadow-[0_0_20px_white]"></div>
          </div>

          <div className="h-12 text-center">
            {diagnosisFeedback && (
              <p className="text-yellow-500 tcm-font text-xl animate-pulse">{diagnosisFeedback}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 1: Pharmacology (Synchronized 4-Layer Compass) */}
      <div className={`section ${phase === 'pharmacology' ? 'active' : phase === 'diagnosis' ? 'next' : 'prev'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full max-w-7xl items-center">
          
          {/* Left: 4-Layer Synchronized Compass */}
          <div className="flex flex-col items-center gap-8">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold tcm-font tracking-widest text-cyan-400">四轨同心全息罗盘</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.3em]">万物共振，顺时而动</p>
            </div>

            <div className="relative w-[500px] h-[500px] flex items-center justify-center">
              <div className="alignment-indicator"></div>
              
              {/* Common Angle for Sync Rotation */}
              {/* When activeElementIndex is 0, angle is 0. Index 1, -72. etc. */}
              {(() => {
                const globalAngle = -(activeElementIndex * 72);
                return (
                  <>
                    {/* Ring 4: Emotions (Silver/Outermost) */}
                    <div className="compass-ring ring-emotions w-[480px] h-[480px]" style={{ transform: `rotate(${globalAngle}deg)` }}>
                      {ELEMENTS_DATA.map((d, i) => (
                        <div key={i} className="ring-label" style={{ transform: `rotate(${i * 72}deg) translateY(-220px)`, color: i === activeElementIndex ? '#e0e0e0' : '#444', opacity: i === activeElementIndex ? 1 : 0.4 }}>{d.emotion}</div>
                      ))}
                    </div>

                    {/* Ring 3: Organs (Yellow) */}
                    <div className="compass-ring ring-outer w-[380px] h-[380px]" style={{ transform: `rotate(${globalAngle}deg)` }}>
                      {ELEMENTS_DATA.map((d, i) => (
                        <div key={i} className="ring-label" style={{ transform: `rotate(${i * 72}deg) translateY(-170px)`, color: i === activeElementIndex ? '#ffd700' : '#444', opacity: i === activeElementIndex ? 1 : 0.4 }}>{d.organ}</div>
                      ))}
                    </div>

                    {/* Ring 2: Tones (Purple) */}
                    <div className="compass-ring ring-middle w-[280px] h-[280px]" style={{ transform: `rotate(${globalAngle}deg)` }}>
                      {ELEMENTS_DATA.map((d, i) => (
                        <div key={i} className="ring-label" style={{ transform: `rotate(${i * 72}deg) translateY(-120px)`, color: i === activeElementIndex ? '#bc13fe' : '#444', opacity: i === activeElementIndex ? 1 : 0.4 }}>{d.tone}</div>
                      ))}
                    </div>

                    {/* Ring 1: Elements (Cyan/Inner) */}
                    <div className="compass-ring ring-inner w-[180px] h-[180px]" style={{ transform: `rotate(${globalAngle}deg)` }}>
                      {ELEMENTS_DATA.map((d, i) => (
                        <div key={i} className="ring-label" style={{ transform: `rotate(${i * 72}deg) translateY(-70px)`, color: i === activeElementIndex ? '#00f3ff' : '#444', opacity: i === activeElementIndex ? 1 : 0.4 }}>{d.name}</div>
                      ))}
                    </div>
                  </>
                );
              })()}

              {/* Center Core */}
              <div className="w-16 h-16 rounded-full glass border-2 border-white/10 flex items-center justify-center glow-gold">
                <div className="w-8 h-8 rounded-full bg-white/5 animate-ping"></div>
              </div>
            </div>

            {/* Controls (Color-Coded) */}
            <div className="flex gap-6">
              <button 
                onClick={() => rotateIndex(-1)} 
                className="btn-cyber glass px-6 py-2 rounded border border-cyan-500/50 text-cyan-400 text-xs font-bold flex items-center gap-2"
              >
                <RotateCw size={14} className="rotate-180" /> 逆旋
              </button>
              <button 
                onClick={() => rotateIndex(1)} 
                className="btn-cyber glass px-6 py-2 rounded border border-purple-500/50 text-purple-400 text-xs font-bold flex items-center gap-2"
              >
                顺旋 <RotateCw size={14} />
              </button>
            </div>
          </div>

          {/* Right: Body Map & Knowledge Card */}
          <div className="space-y-8 h-full flex flex-col justify-center">
            <div className="glass p-10 rounded-2xl border-l-4 border-cyan-500/20 flex flex-row items-center gap-8">
              {/* Body SVG */}
              <div className="relative">
                <svg viewBox="0 0 200 400" className="h-[350px] w-auto">
                   <path d="M100 20 C 115 20, 130 35, 130 55 C 130 75, 115 90, 100 90 C 85 90, 70 75, 70 55 C 70 35, 85 20, 100 20" fill="none" stroke="white" strokeWidth="1" opacity="0.1"/>
                   <path d="M70 100 L 130 100 L 145 250 L 125 400 L 100 400 L 75 400 L 55 250 Z" fill="none" stroke="white" strokeWidth="1" opacity="0.05"/>
                   
                   {/* Background Glow */}
                   <circle cx="100" cy="180" r="100" fill={currentElement.color} opacity="0.03" className="transition-all duration-1000" />
                   
                   {ELEMENTS_DATA.map((d, i) => {
                     const isCurrent = i === activeElementIndex;
                     const organMap: Record<string, [number, number]> = {
                        '肝': [85, 220],
                        '心': [100, 140],
                        '脾': [115, 220],
                        '肺': [100, 170],
                        '肾': [100, 270]
                     };
                     const [cx, cy] = organMap[d.organ];
                     return (
                       <circle 
                          key={i} 
                          cx={cx} 
                          cy={cy} 
                          r={isCurrent ? 14 : 6} 
                          fill={isCurrent ? d.color : 'white'} 
                          opacity={isCurrent ? 1 : 0.1}
                          className={`transition-all duration-700 ${isCurrent ? 'organ-pulse' : ''}`}
                          style={{ color: d.color }}
                        />
                     );
                   })}
                </svg>
              </div>

              {/* New Knowledge Card */}
              <div className="flex-1 knowledge-card p-6 space-y-4 animate-in fade-in slide-in-from-right-10 duration-500">
                <header className="flex items-center gap-3">
                    <Info className="text-yellow-500" size={20} />
                    <h4 className="text-2xl font-bold tcm-font text-white">{currentElement.organ} ({currentElement.name})</h4>
                </header>
                <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] rounded border border-cyan-500/20">五行: {currentElement.element}</span>
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] rounded border border-purple-500/20">五音: {currentElement.tone}</span>
                    <span className="px-2 py-0.5 bg-white/10 text-white/60 text-[10px] rounded border border-white/20">情志: {currentElement.emotion}</span>
                </div>
                <p className="text-sm leading-relaxed text-white/70 italic">
                    {currentElement.effect}
                </p>
                <button 
                  onClick={() => setPhase('alchemy')} 
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs font-bold hover:bg-yellow-500 hover:text-black transition-all rounded"
                >
                  确认为主治方向 <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Alchemy */}
      <div className={`section ${phase === 'alchemy' ? 'active' : phase === 'prescription' ? 'prev' : 'next'}`}>
        <canvas ref={canvasRef} id="alchemy-canvas" />
        
        <div className="sidebar-controls absolute left-12 top-1/2 -translate-y-1/2 w-80 glass p-8 space-y-10 cyber-corner border-purple-500/30">
          <header className="space-y-2">
            <h2 className="text-3xl font-bold tcm-font text-purple-400">炼制 · 声纹显影</h2>
            <p className="text-white/30 text-[10px] tracking-widest uppercase">Digital Strange Attractor Generator</p>
          </header>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] text-white/50 uppercase tracking-widest block">选择药引乐器</label>
              <div className="grid grid-cols-2 gap-2">
                {INSTRUMENTS.map(i => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedInst(i)}
                    className={`btn-cyber py-2 text-sm rounded border ${selectedInst === i ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-white/5 border-white/10 text-white/40'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-white/50 uppercase tracking-widest block">主导音频选择</label>
              <div className="flex gap-2">
                {ELEMENTS_DATA.map(d => (
                  <button 
                    key={d.tone} 
                    onClick={() => setSelectedTone(d.tone)}
                    className={`w-10 h-10 border rounded-full text-xs transition-all ${selectedTone === d.tone ? 'border-purple-500 bg-purple-500/20 text-purple-400' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                  >
                    {d.tone}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setAlchemyActive(!alchemyActive)}
            className="w-full py-4 bg-purple-600 text-white font-bold tracking-[1em] hover:bg-purple-500 transition-all glow-purple active:scale-95"
          >
            {alchemyActive ? "正在共振..." : "开始共振"}
          </button>
          
          {alchemyActive && (
            <button onClick={() => setPhase('prescription')} className="w-full text-center text-xs text-white/40 hover:text-white mt-4 flex items-center justify-center gap-2">
              完成炼制 <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Section 3: Prescription */}
      <div className={`section ${phase === 'prescription' ? 'active' : 'next'}`}>
        <div className="w-full max-w-5xl space-y-12">
          <header className="text-center space-y-4">
            <h2 className="text-5xl font-bold tcm-font text-yellow-500">处方 · 情绪医生</h2>
            <p className="text-white/30 tracking-[0.5em]">SYNTHTIC TCM FORMULATION INTERFACE</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-6 rounded-lg space-y-4 border-yellow-500/20">
              <h4 className="text-xs font-bold text-yellow-500/50 uppercase tracking-widest">ZONE A: 诊断标签</h4>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map(s => (
                  <span key={s} className="bg-white/5 px-3 py-1 rounded text-sm hover:bg-yellow-500/20 transition-colors border border-white/10">{s}</span>
                ))}
              </div>
            </div>
            <div className="glass p-6 rounded-lg space-y-4 border-yellow-500/20">
              <h4 className="text-xs font-bold text-yellow-500/50 uppercase tracking-widest">ZONE B: 调配音频</h4>
              <div className="flex flex-col gap-2">
                <div className="text-left px-4 py-2 border border-yellow-500/50 rounded bg-yellow-500/5 text-sm">主药: {selectedTone} ({ELEMENTS_DATA.find(e => e.tone === selectedTone)?.organ})</div>
                <div className="text-left px-4 py-2 border border-white/10 rounded text-sm opacity-50">辅药: 商 (肺/金)</div>
              </div>
            </div>
            <div className="glass p-6 rounded-lg space-y-4 border-yellow-500/20">
              <h4 className="text-xs font-bold text-yellow-500/50 uppercase tracking-widest">ZONE C: 能量载体</h4>
              <div className="flex items-center justify-center h-24 border-2 border-dashed border-white/10 rounded group">
                <span className="text-xs text-yellow-500/80">{selectedInst} · 432Hz</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <button onClick={() => setPhase('result')} className="px-16 py-5 bg-yellow-500 text-black font-bold text-xl tracking-[1em] hover:bg-yellow-400 transition-all cyber-card">生成处方</button>
          </div>
        </div>
      </div>

      {/* Modal Result */}
      {phase === 'result' && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 p-6 animate-in fade-in duration-500">
          <div className="max-w-md w-full cyber-card text-white space-y-12">
            <header className="flex justify-between items-start">
              <div>
                <h3 className="text-3xl font-bold tcm-font text-yellow-500">处方笺</h3>
                <p className="text-[10px] tracking-widest text-white/40">SONIC PRESCRIPTION</p>
              </div>
              <div className="text-right text-[10px] opacity-30 font-mono">
                ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}<br />TIME: 亥时
              </div>
            </header>

            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <span className="text-[10px] text-white/40 uppercase block mb-2">主药/Primary Sound</span>
                <p className="text-xl font-bold">{selectedTone}音 - 入{ELEMENTS_DATA.find(e => e.tone === selectedTone)?.organ}经</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <span className="text-[10px] text-white/40 uppercase block mb-2">载体/Carrier Instrument</span>
                <p className="text-xl font-bold">{selectedInst}</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <span className="text-[10px] text-white/40 uppercase block mb-2">服用指南/Direction</span>
                <p className="text-sm italic text-yellow-500/80">“以声入神，调理气机。每日亥时静听21分钟。”</p>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div className="w-16 h-16 bg-white/10 flex items-center justify-center rounded">
                <div className="grid grid-cols-4 gap-1 w-10 h-10 opacity-50">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className={`bg-white ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-20'}`} />
                  ))}
                </div>
              </div>
              <button onClick={() => { setPhase('diagnosis'); setIntroMode(true); setIntroSlide(0); }} className="text-xs uppercase tracking-widest border border-yellow-500/50 px-6 py-3 hover:bg-yellow-500 hover:text-black transition-all">完成会诊</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);