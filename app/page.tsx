"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, ArrowUp, ChevronDown, Clock3, Command, Copy, FilePenLine, FolderOpen, Mic, MoreHorizontal, Network, Radio, Rocket, ShieldCheck, Sparkles, Terminal, Wifi, X, User, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import AuthModal from "../components/AuthModal";
import ProfileModal from "../components/ProfileModal";
import HistorySidebar from "../components/HistorySidebar";
import SettingsModal from "../components/SettingsModal";
import SubscriptionModal from "../components/SubscriptionModal";
import ErrorBoundary from "../components/ErrorBoundary";

type Log = { time: string; title: string; detail: string; tone: "cyan" | "violet" | "dim" };
const initialLogs: Log[] = [
  { time: "09:42:18", title: "Journal sync complete", detail: "2 entries indexed in local vault", tone: "cyan" },
  { time: "09:41:56", title: "System status read", detail: "MacBook Pro · 78% battery · online", tone: "violet" },
  { time: "09:40:11", title: "Memory checkpoint", detail: "Conversation context persisted", tone: "dim" }
];
const tools = [{ name: "appLauncherTool", icon: Rocket, active: true }, { name: "journalTool", icon: FilePenLine, active: true }, { name: "systemStatusTool", icon: Activity, active: true }, { name: "fileActionTool", icon: FolderOpen, active: false }, { name: "taskSchedulerTool", icon: Clock3, active: false }];

type AgentEvent = { type: "status" | "message" | "tool-start" | "tool-result" | "permission-required" | "error" | "complete"; status?: string; detail?: string; content?: string; tool?: string; message?: string };
type AgentResponse = { responseText?: string; codeSnippet?: string | null; codeLanguage?: string | null; text?: string };
type Session = { id: string; title: string; timestamp: number; messages: Array<{ role: "user" | "assistant" | "tool"; content: string; tool?: string }> };
type View = "landing" | "auth" | "profile" | "hud";
type CurrentUser = { email: string; token: string };

function HomeContent() {
  const [view, setView] = useState<View>("landing");
  const [mounted, setMounted] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState<{ fullName: string; gender: string; preferredVoice: string } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [input, setInput] = useState("");
  const [chatMode, setChatMode] = useState<'chat' | 'analyze'>('chat');
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; type: string; data: string }>>([]);
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [logs, setLogs] = useState(initialLogs);
  const [thinking, setThinking] = useState(false);
  const [deckOpen, setDeckOpen] = useState(true);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant" | "tool"; content: string; tool?: string }>>([]);
  const [artifact, setArtifact] = useState<{ code: string; language: string } | null>(null);
  const [copiedArtifact, setCopiedArtifact] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const activityFeedRef = useRef<HTMLDivElement | null>(null);
  const appendLog = (log: Log) => setLogs((current) => [...current, log]);
  const dynamicGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good morning";
    if (hours < 17) return "Good afternoon";
    return "Good evening";
  };
  const handleAgentReply = (reply: string, codeSnippet?: string | null, language = "CODE") => {
    const code = codeSnippet?.trim();
    if (code) {
      setArtifact({ code, language });
      speakReply("I have generated the requested program for you on the display terminal, sir.");
    } else {
      speakReply(reply);
    }
    appendLog({ time: new Date().toLocaleTimeString([], { hour12: false }), title: "Jarvis reply", detail: reply, tone: "violet" });
  };
  const textForHistoryRef = useRef("");
  useEffect(() => {
    const storedUser = window.localStorage.getItem("jarvis-current-user");
    if (!storedUser) return;
    try {
      const user = JSON.parse(storedUser) as CurrentUser;
      if (user.email && user.token) {
        setCurrentUser(user);
      }
    } catch {
      window.localStorage.removeItem("jarvis-current-user");
    }

    const storedProfile = window.localStorage.getItem("jarvis-user-profile");
    if (storedProfile) {
      try {
        setProfile(JSON.parse(storedProfile));
      } catch {
        console.warn("Failed to parse stored profile");
      }
    }

    const storedHistory = window.localStorage.getItem("jarvis-chat-history");
    if (storedHistory) {
      try {
        setSessions(JSON.parse(storedHistory));
      } catch {
        console.warn("Failed to parse chat history");
      }
    }
  }, []);
  const saveSession = (session: Session) => {
    setSessions((prev) => {
      const index = prev.findIndex((s) => s.id === session.id);
      const next = index >= 0 ? [...prev] : [...prev, session];
      if (index >= 0) next[index] = session;
      window.localStorage.setItem("jarvis-chat-history", JSON.stringify(next));
      return next;
    });
  };

  const createChat = () => {
    const id = `sess-${Date.now()}`;
    const newSession: Session = { id, title: "New Conversation", timestamp: Date.now(), messages: [] };
    setSessions((prev) => {
      const next = [newSession, ...prev];
      window.localStorage.setItem("jarvis-chat-history", JSON.stringify(next));
      return next;
    });
    setActiveSessionId(id);
    setHistory([]);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      window.localStorage.setItem("jarvis-chat-history", JSON.stringify(next));
      return next;
    });
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setHistory([]);
    }
  };

  const selectSession = (id: string) => {
    setActiveSessionId(id);
    const session = sessions.find((s) => s.id === id);
    if (session) setHistory(session.messages);
  };

  const renderMessage = (msg: { role: "user" | "assistant" | "tool"; content: string; tool?: string }) => {
    const isUser = msg.role === "user";
    const isTool = msg.role === "tool";

    if (isTool) {
      return (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          key={Math.random()}
          className="mb-6 flex items-start gap-3 opacity-60"
        >
          <div className="mt-1 rounded-full bg-white/10 p-1.5 text-cyan-200"><Terminal size={12} /></div>
          <div className="flex-1 rounded-2xl bg-white/5 p-3 text-xs font-mono text-white/60 border border-white/5">
            <div className="mb-1 text-[10px] uppercase tracking-widest text-white/30">Tool execution: {msg.tool}</div>
            {msg.content}
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        key={Math.random()}
        className={`mb-6 flex ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div className={`flex max-w-[80%] gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <div className={`mt-1 shrink-0 rounded-full p-1.5 ${isUser ? "bg-cyan-200 text-black" : "bg-violet-200 text-black"}`}>
            {isUser ? <User size={14} /> : <Sparkles size={14} />}
          </div>
          <div className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
            isUser ? "bg-cyan-200/10 text-white border border-cyan-200/20" : "bg-white/5 text-white/90 border border-white/10"
          }`}>
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\\w+)/.exec(className || "");
                  return !inline && match ? (
                    <div className="my-4 rounded-xl overflow-hidden border border-white/10">
                      <div className="flex items-center justify-between bg-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-white/40">
                        <span>{match[1]}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(String(children));
                          }}
                          className="hover:text-white flex items-center gap-1"
                        >
                          <Copy size={10} /> Copy
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{ margin: 0, padding: "1rem", fontSize: "0.8rem" }}
                        {...props}
                      >
                        {String(children).replace(/\\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="rounded bg-white/10 px-1 py-0.5 text-cyan-200" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        </div>
      </motion.div>
    );
  };

  const launchConsole = () => setView(currentUser ? "hud" : "auth");
  const handleAuthSuccess = (user: CurrentUser) => {
    window.localStorage.setItem("jarvis-current-user", JSON.stringify(user));
    setCurrentUser(user);
    const storedProfile = window.localStorage.getItem("jarvis-user-profile");
    if (!storedProfile) {
      setView("profile");
    } else {
      try {
        setProfile(JSON.parse(storedProfile));
        setView("hud");
      } catch {
        setView("profile");
      }
    }
  };

  const handleProfileComplete = (profileData: any) => {
    window.localStorage.setItem("jarvis-user-profile", JSON.stringify(profileData));
    setProfile(profileData);
    setView("hud");
  };

  const updateProfile = (updates: any) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    window.localStorage.setItem("jarvis-user-profile", JSON.stringify(newProfile));
  };

  const logout = () => { window.localStorage.removeItem("jarvis-current-user"); setCurrentUser(null); setView("landing"); };
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentDate(`${now.toLocaleDateString("en-US", { weekday: "long" })} · ${now.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}`);
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
      setTimeZone(new Intl.DateTimeFormat([], { timeZoneName: "short" }).formatToParts(now).find((part) => part.type === "timeZoneName")?.value ?? "LOCAL TIME");
    };
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("getBattery" in navigator)) return;

    const updateBattery = async () => {
      try {
        const battery = await (navigator as any).getBattery();
        setBatteryLevel(battery.level * 100);
        setIsCharging(battery.charging);

        const onLevelChange = () => setBatteryLevel(battery.level * 100);
        const onChargingChange = () => setIsCharging(battery.charging);

        battery.addEventListener("levelchange", onLevelChange);
        battery.addEventListener("chargingchange", onChargingChange);

        return () => {
          battery.removeEventListener("levelchange", onLevelChange);
          battery.removeEventListener("chargingchange", onChargingChange);
        };
      } catch (e) {
        console.warn("Battery API access failed", e);
      }
    };

    void updateBattery();
  }, []);

  useEffect(() => {
    let active = true;
    const checkBackend = async () => {
      try {
        const response = await fetch("/api/health");
          if (active && response.ok) setConnectionError("");
      } catch {
        // Command requests provide the visible connection error when needed.
      }
    };
    void checkBackend();
    const timer = window.setInterval(checkBackend, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const speakReply = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();

    let selectedVoice: SpeechSynthesisVoice | null = null;
    if (profile?.preferredVoice === "Jarvis Classic - Male") {
      selectedVoice = voices.find((v) => /Daniel|Google UK English Male|Microsoft David/i.test(v.name)) ?? null;
    } else if (profile?.preferredVoice === "Friday / Nova - Female") {
      selectedVoice = voices.find((v) => /Samantha|Google UK English Female|Microsoft Zira/i.test(v.name)) ?? null;
    } else {
      selectedVoice = voices.find((v) => /Daniel|Samantha|Siri|Google UK English/i.test(v.name)) ??
                       voices.find((v) => /^en(-|_)/i.test(v.lang)) ??
                       null;
    }

    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice?.lang ?? "en-US";
    utterance.rate = 0.96;
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const runCommand = async (commandInput: unknown = input, clearInput = true) => {
    const text = (typeof commandInput === "string" ? commandInput : input).trim();
    if (!text) return;

    setInput("");
    setAttachedFiles([]);
    transcriptRef.current = "";

    // Immediately append the user message to state
    setHistory(prev => [...prev, { role: "user", content: text }]);

    setThinking(true);
    setConnectionError("");
    appendLog({ time: new Date().toLocaleTimeString([], { hour12: false }), title: "Command sent", detail: text, tone: "cyan" });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          messages: history,
          userName: profile?.fullName || "Sir",
          mode: chatMode
        }),
      });

      if (!response.ok) throw new Error(`Jarvis backend returned HTTP ${response.status}`);

      const data = await response.json() as { success?: boolean; reply?: string; content?: string; error?: string };

      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      const reply = data.reply || data.content || "Command executed successfully.";

      // Append the assistant reply directly into messages state
      setHistory(prev => {
        const updatedHistory = [...prev, { role: "assistant" as const, content: reply }];

        // Save to session if active
        if (activeSessionId) {
          const session = sessions.find((s) => s.id === activeSessionId);
          if (session) {
            const updatedSession = {
              ...session,
              messages: updatedHistory,
              timestamp: Date.now(),
              title: session.title === "New Conversation" ? (text.slice(0, 30) + (text.length > 30 ? "..." : "")) : session.title,
            };
            saveSession(updatedSession);
          }
        }

        return updatedHistory;
      });

      // Maintain existing side effects: speech and artifacts
      handleAgentReply(reply);

    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reach Jarvis";
      console.warn(message);
      setConnectionError(`${message}. Check your Groq connection.`);
      appendLog({ time: new Date().toLocaleTimeString([], { hour12: false }), title: "Connection issue", detail: message, tone: "dim" });
    } finally {
      setThinking(false);
    }
  };
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: Array<{ name: string; type: string; data: string }> = [];
    for (const file of Array.from(files)) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newFiles.push({ name: file.name, type: file.type, data: base64 });
    }
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startListening = () => {
    const SpeechRecognition = (window as typeof window & { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any }).SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    transcriptRef.current = "";
    setInput("");
    recognition.onstart = () => { setListening(true); setConnectionError(""); };
    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) currentTranscript += event.results[index][0].transcript;
      transcriptRef.current = currentTranscript;
      setInput(currentTranscript);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      const command = transcriptRef.current.trim();
      if (command) void runCommand(command, false);
    };
    recognition.onerror = (event: any) => {
      console.warn("Speech recognition notice:", event.error);
      setListening(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    recognition.start();
  };
  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };
  const toggleVoiceRecording = () => { if (listening) stopListening(); else startListening(); };
  const toggleVoiceRecordingHandler = toggleVoiceRecording;
  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const synthesis = window.speechSynthesis;
    const preloadVoices = () => { voicesRef.current = synthesis.getVoices(); };
    synthesis.onvoiceschanged = preloadVoices;
    preloadVoices();
    return () => {
      if (synthesis.onvoiceschanged === preloadVoices) synthesis.onvoiceschanged = null;
    };
  }, []);
  useEffect(() => { const activityFeed = document.querySelector<HTMLElement>("main > section > div:first-child > div:nth-child(3)"); activityFeed?.scrollTo({ top: activityFeed.scrollHeight, behavior: "smooth" }); }, [logs]);
  if (view !== "hud") {
    return (
      <main className="portal noise min-h-screen overflow-x-hidden">
        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-10"><button onClick={() => setView("landing")} className="flex items-center gap-3 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-200/30 bg-cyan-200/10 text-cyan-100 shadow-[0_0_25px_rgba(114,227,223,.12)]"><Sparkles size={19}/></span><span><strong className="block text-sm tracking-[.28em] text-white">JARVIS</strong><span className="mono block text-[9px] uppercase tracking-[.18em] text-white/35">Autonomous intelligence OS</span></span></button><nav className="hidden items-center gap-8 text-xs uppercase tracking-[.16em] text-white/40 md:flex"><a href="#features" className="hover:text-cyan-100">Features</a><a href="#architecture" className="hover:text-cyan-100">Architecture</a><a href="#docs" className="hover:text-cyan-100">Docs</a></nav><div className="flex items-center gap-2">{currentUser ? <><span className="hidden rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-2 text-xs text-cyan-100 sm:inline">{currentUser.email}</span><button onClick={launchConsole} className="rounded-lg bg-cyan-200 px-4 py-2 text-xs font-semibold text-[#061014]">Launch HUD</button><button onClick={logout} className="px-2 py-2 text-xs text-white/40 hover:text-white">Logout</button></> : <button onClick={() => setView("auth")} className="rounded-lg border border-white/15 px-4 py-2 text-xs text-white/75 hover:border-cyan-200/50 hover:text-cyan-100">Sign In / Sign Up</button>}</div></header>
        <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 lg:px-10 lg:pt-24"><div className="pointer-events-none absolute -right-24 top-0 h-[30rem] w-[30rem] rounded-full bg-cyan-300/10 blur-[140px]"/><div className="relative max-w-4xl"><div className="mono mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-cyan-200/[.06] px-3 py-2 text-[10px] uppercase tracking-[.18em] text-cyan-100/80"><span className="h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_#72e3df]"/> JARVIS OS 3.0 · POWERED BY GROQ LPU INFERENCE</div><h1 className="max-w-4xl text-5xl font-medium leading-[.98] tracking-[-.045em] text-white sm:text-7xl lg:text-8xl">The Autonomous Intelligence <span className="text-cyan-200">Console</span> for Your Workflow</h1><p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/50 sm:text-xl">Natural voice orchestration, local automation tools, and real-time cognitive assistance engineered for Mac and Web.</p><div className="mt-10 flex flex-wrap gap-3"><button onClick={launchConsole} className="flex items-center gap-3 rounded-xl bg-cyan-200 px-5 py-4 text-sm font-semibold text-[#061014] shadow-[0_0_35px_rgba(114,227,223,.18)] hover:bg-cyan-100"><Rocket size={17}/> Launch Jarvis Web Console</button><button onClick={() => setDownloadOpen(true)} className="rounded-xl border border-white/15 px-5 py-4 text-sm text-white/70 hover:border-white/35 hover:text-white">Download Desktop Client</button></div></div></section>
        <section id="features" className="border-y border-white/[.08] bg-black/20"><div className="mx-auto grid max-w-7xl gap-px bg-white/[.08] px-5 lg:grid-cols-3 lg:px-10"><div className="bg-[#070b10] p-7"><div className="mono mb-12 text-[10px] uppercase tracking-[.2em] text-cyan-200/60">01 / Voice core</div><h2 className="text-2xl text-white">Sub-200ms Voice Core</h2><p className="mt-3 text-sm leading-relaxed text-white/40">Whisper Large v3 Turbo turns natural commands into action without breaking your flow.</p></div><div className="bg-[#070b10] p-7"><div className="mono mb-12 text-[10px] uppercase tracking-[.2em] text-violet-200/60">02 / Tool mesh</div><h2 className="text-2xl text-white">Cognitive Tool Registry</h2><p className="mt-3 text-sm leading-relaxed text-white/40">App launcher, terminal tools, journal vault, and scheduled actions in one governed system.</p></div><div className="bg-[#070b10] p-7"><div className="mono mb-12 text-[10px] uppercase tracking-[.2em] text-amber-200/70">03 / Telemetry</div><h2 className="text-2xl text-white">Neural Telemetry HUD</h2><p className="mt-3 text-sm leading-relaxed text-white/40">Live waveform visualizers and system signals make the invisible state legible.</p></div></div></section>
        <section id="architecture" className="mx-auto grid max-w-7xl gap-10 px-5 py-24 lg:grid-cols-[1fr_1.2fr] lg:px-10"><div><div className="mono text-[10px] uppercase tracking-[.2em] text-cyan-200/60">Architecture / 03 layers</div><h2 className="mt-4 text-4xl tracking-tight text-white">A private command surface with a public web edge.</h2></div><div className="space-y-3">{["Browser-native microphone pipeline", "Groq inference and transcription routes", "Local-first action execution with approval gates"].map((item, index) => <div key={item} className="flex items-center gap-4 border-b border-white/10 py-4"><span className="mono text-xs text-cyan-200/60">0{index + 1}</span><span className="text-white/65">{item}</span><ArrowUp size={14} className="ml-auto rotate-45 text-white/25"/></div>)}</div></section>
        <footer id="docs" className="mx-auto flex max-w-7xl items-center justify-between border-t border-white/10 px-5 py-7 text-xs text-white/30 lg:px-10"><span className="mono uppercase tracking-[.15em]">JARVIS OS · v3.0.4</span><span>Engineered for focused work.</span></footer>
        {view === "auth" && AuthModal && <AuthModal onSuccess={handleAuthSuccess} onCancel={() => setView("landing")} />}
        {view === "profile" && ProfileModal && <ProfileModal onComplete={handleProfileComplete} onCancel={() => setView("landing")} />}
        {downloadOpen && <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-5 backdrop-blur-sm"><div className="glass max-w-sm rounded-2xl p-7"><div className="mono text-[10px] uppercase tracking-[.2em] text-cyan-200/60">Desktop channel</div><h2 className="mt-3 text-2xl text-white">Mac client provisioning</h2><p className="mt-3 text-sm leading-relaxed text-white/45">The signed desktop package will be available when the release channel is connected.</p><button onClick={() => setDownloadOpen(false)} className="mt-6 w-full rounded-xl border border-white/15 py-3 text-sm text-white/70 hover:border-cyan-200/50 hover:text-white">Close</button></div></div>}
      </main>
    );
  }

  return (
    <main className="h-screen w-screen flex flex-col bg-[#08080c] text-white overflow-hidden">
      {!bannerDismissed && (
        <div className="relative z-[60] flex items-center justify-between px-6 py-2 bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-violet-500/20 border-b border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="mono text-[10px] uppercase tracking-widest text-white/80">
              ⚡ JARVIS OS v1.0 [BETA] — System is currently under active testing. Full autonomous capabilities & tool execution modules will launch soon.
            </p>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <header className="flex-shrink-0 z-50 flex w-full items-center justify-between px-6 py-4 backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-200/10 text-cyan-100 shadow-[0_0_15px_rgba(114,227,223,.2)]">
            <Sparkles size={16} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xs font-bold uppercase tracking-widest text-white">Jarvis HUD</h1>
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-amber-400 animate-pulse" />
              <span className="mono text-[9px] uppercase tracking-tighter text-amber-200/70">
                ● SYSTEM UNDER TESTING / PREVIEW MODE · {timeZone}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSubscriptionOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-200/30 bg-cyan-200/5 text-xs font-medium text-cyan-100 hover:bg-cyan-200/10 hover:border-cyan-200/50 transition-all duration-300 shadow-[0_0_10px_rgba(114,227,223,0.1)] hover:shadow-[0_0_15px_rgba(114,227,223,0.2)]"
          >
            <Zap size={12} className="text-cyan-200" />
            Upgrade to Pro
          </button>
          <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <MoreHorizontal size={18} />
          </button>
          <button onClick={() => setView("profile")} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 hover:bg-white/10 transition-colors">
            <User size={14} />
            <span>{profile?.fullName || "Agent"}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className={`flex-shrink-0 border-r border-white/5 bg-black/40 backdrop-blur-xl transition-all ${deckOpen ? "w-64" : "w-0 overflow-hidden"}`}>
          <HistorySidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={selectSession}
            onCreateChat={createChat}
            onDeleteSession={deleteSession}
          />
        </aside>

          <section className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-6 py-4 scroll-smooth" ref={activityFeedRef}>
            <div className="mx-auto max-w-4xl flex flex-col gap-12">
              <div className="relative flex flex-col items-center justify-center py-12">
                <div className={`relative h-48 w-48 rounded-full transition-all duration-700 ${thinking ? "scale-110 shadow-[0_0_60px_rgba(114,227,223,0.4)]" : "shadow-[0_0_30px_rgba(114,227,223,0.2)]"} bg-gradient-to-br from-cyan-200/20 to-violet-500/20 border border-white/10 backdrop-blur-3xl flex items-center justify-center overflow-hidden`}>
                  <motion.div
                    animate={thinking ? { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`absolute inset-0 opacity-30 animate-pulse bg-[radial-gradient(circle,rgba(114,227,223,0.4)_0%,transparent_70%)] ${speaking ? "scale-125" : "scale-100"}`}
                  />
                  <div className={`h-32 w-32 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-400 blur-2xl transition-all ${speaking ? "animate-bounce opacity-80" : "opacity-40"}`} />
                  <Sparkles className={`text-cyan-100 transition-transform duration-500 ${thinking ? "animate-spin" : ""}`} size={40} />
                </div>
                <div className="mt-6 mono text-center">
                  <p className="text-[10px] uppercase tracking-[.3em] text-white/30">System Status</p>
                  <p className="text-sm text-cyan-100 font-medium">{thinking ? "Processing Request..." : speaking ? "Speaking..." : "Ready for Command"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {tools.map((tool) => (
                  <button
                    key={tool.name}
                    className={`group relative p-4 rounded-2xl border transition-all duration-300 text-left ${tool.active ? "bg-white/5 border-white/10 hover:border-cyan-200/50 hover:bg-white/[0.08]" : "bg-black/20 border-white/5 opacity-50 grayscale cursor-not-allowed"}`}
                  >
                    <tool.icon size={20} className={`mb-3 transition-colors ${tool.active ? "text-cyan-200 group-hover:text-cyan-100" : "text-white/30"}`} />
                    <span className="block text-[11px] font-medium uppercase tracking-wider text-white/60 group-hover:text-white transition-colors">{tool.name.replace("Tool", "")}</span>
                    {tool.active && <div className="absolute top-2 right-2 h-1 w-1 rounded-full bg-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </button>
                ))}
              </div>

              <div className="space-y-6 pb-32">
                {history.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <p className="text-white/20 mono text-xs uppercase tracking-widest">No active transmission</p>
                    <p className="text-white/40 text-sm max-w-xs mx-auto">Awaiting voice or text input to initialize session context.</p>
                  </div>
                ) : (
                  history.map((msg, i) => (
                    <div key={i}>{renderMessage(msg)}</div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div >
        <footer className="flex-shrink-0 w-full max-w-4xl mx-auto p-4 z-20">
            <div className="mx-auto max-w-4xl relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center gap-3 p-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
                <button
                  onClick={toggleVoiceRecording}
                  className={`p-3 rounded-xl transition-all duration-300 ${listening ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-white/5 text-white/60 hover:text-cyan-100"}`}
                >
                  <Mic size={20} />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runCommand()}
                  placeholder="Enter command or ask anything..."
                  className="flex-1 bg-transparent py-3 px-2 text-sm outline-none text-white placeholder:text-white/20"
                />
                <button
                  onClick={() => runCommand()}
                  disabled={thinking}
                  className="p-3 rounded-xl bg-cyan-200 text-black hover:bg-cyan-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowUp size={20} />
                </button>
              </div>
            </div>
          </footer>

      <AnimatePresence>
        {settingsOpen && <SettingsModal profile={profile} onUpdateProfile={updateProfile} onClose={() => setSettingsOpen(false)} />}
        {subscriptionOpen && (
          <SubscriptionModal
            onClose={() => setSubscriptionOpen(false)}
            onJoinWaitlist={(tier) => {
              showToast(`You have been added to the priority access list for ${tier}!`);
              setSubscriptionOpen(false);
            }}
          />
        )}
      </AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl bg-cyan-200 text-black text-sm font-bold shadow-[0_0_30px_rgba(114,227,223,0.4)] border border-white/20"
        >
          {toast}
        </motion.div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#08080c] text-white">
      <ErrorBoundary>
        <HomeContent />
      </ErrorBoundary>
    </div>
  );
}
