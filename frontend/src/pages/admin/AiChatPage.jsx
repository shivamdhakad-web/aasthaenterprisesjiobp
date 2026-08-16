import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Activity,
  Bot,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  CreditCard,
  Droplets,
  Fuel,
  Globe,
  HelpCircle,
  ImageUp,
  Layers,
  Loader2,
  MessageSquare,
  Mic,
  Radio,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Truck,
  UserRound,
  Users,
  Volume2,
  X,
  Zap,
} from "lucide-react"
import { extractEntriesFromPhoto, getAiChatModels, sendAiChatMessage } from "../../services/aiApi"

const DEFAULT_MODEL = "gemini-3.5-flash-lite"
const FALLBACK_MODELS = [
  DEFAULT_MODEL,
  "llama-3.3-70b-versatile",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
]
const FALLBACK_PROVIDERS = {
  groq: { label: "Groq Neural", models: FALLBACK_MODELS, defaultModel: "llama-3.1-8b-instant" },
  gemini: {
    label: "Google Gemini",
    models: ["gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"],
    defaultModel: DEFAULT_MODEL,
  },
}
const FALLBACK_SCOPES = [
  { key: "direct", label: "Direct AI Chat", icon: MessageSquare },
  { key: "all", label: "All Operational Registers", icon: Layers },
  { key: "dailySales", label: "Daily Fuel Sales", icon: Fuel },
  { key: "expenses", label: "Expenses & Accounts", icon: CreditCard },
  { key: "lubricantSales", label: "Lubricant Inventory", icon: Droplets },
  { key: "mdu", label: "MDU Logistics", icon: Truck },
  { key: "cardSwipe", label: "Card Swipe Register", icon: CreditCard },
  { key: "dcd", label: "D.C.D Register", icon: Fuel },
  { key: "invoiceDetails", label: "Invoice Details", icon: Layers },
  { key: "tankerDeliveries", label: "Tanker Deliveries", icon: Truck },
  { key: "employees", label: "Staff & Payroll", icon: Users },
]

const QUICK_PROMPTS = [
  {
    title: "Today's Fuel Sales",
    prompt: "Summarize today's fuel sales, nozzle readings, and profit margins.",
    icon: Fuel,
    tag: "Sales",
    color: "from-emerald-500/10 to-teal-500/5 text-emerald-600 border-emerald-500/20",
  },
  {
    title: "MDU Decanting Stock",
    prompt: "What is the current MDU opening stock, decant volume, and physical stock status?",
    icon: Truck,
    tag: "Logistics",
    color: "from-cyan-500/10 to-blue-500/5 text-cyan-600 border-cyan-500/20",
  },
  {
    title: "Lubricant Profitability",
    prompt: "Show me lubricant inventory stock levels and top-selling products by profit.",
    icon: Droplets,
    tag: "Inventory",
    color: "from-amber-500/10 to-orange-500/5 text-amber-600 border-amber-500/20",
  },
  {
    title: "Pending Credit Balances",
    prompt: "Which credit customers have outstanding pending balances this month?",
    icon: CreditCard,
    tag: "Finance",
    color: "from-purple-500/10 to-indigo-500/5 text-purple-600 border-purple-500/20",
  },
  {
    title: "Staff Attendance",
    prompt: "Give me an overview of today's staff shift attendance and bonus log.",
    icon: Users,
    tag: "Workforce",
    color: "from-rose-500/10 to-pink-500/5 text-rose-600 border-rose-500/20",
  },
  {
    title: "ASTM 15°C Density",
    prompt: "Explain how ASTM Table 53B fuel density conversion to 15°C works.",
    icon: Zap,
    tag: "Audit",
    color: "from-teal-500/10 to-emerald-500/5 text-teal-600 border-teal-500/20",
  },
]

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hello! I’m your Jio-bp Station AI Assistant. How can I help you today?",
  timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
}

const VOICE_MODES = [
  { key: "voice-input", label: "Voice Input", detail: "Speak, review the text, then send manually.", icon: Mic },
  { key: "voice-reply", label: "Voice Reply", detail: "Speak, review the text, then hear the answer after sending.", icon: Volume2 },
  { key: "live", label: "Live Voice", detail: "Keep the microphone on, then send the reviewed text manually.", icon: Radio },
]

const RESPONSE_LANGUAGES = [
  { key: "hindi", label: "Hindi" },
  { key: "hinglish", label: "Hinglish" },
  { key: "english", label: "English" },
]

const DATA_RANGES = [
  { key: "all", label: "All Data" },
  { key: "currentMonth", label: "Current Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "1m", label: "Last 1 Month" },
  { key: "2m", label: "Last 2 Months" },
  { key: "3m", label: "Last 3 Months" },
  { key: "6m", label: "Last 6 Months" },
  { key: "1y", label: "Last 1 Year" },
]

const renderInlineText = (value) =>
  String(value).split(/(\*\*.*?\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-extrabold text-[color:var(--text-strong)]">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })

// FORMAT TEXT HELPER WITH BOLD & LIST FORMATTING
const renderFormattedText = (text) => {
  if (!text) return null
  const lines = text.split("\n")
  return lines.map((line, idx) => {
    let formattedLine = line

    const lineContent = renderInlineText(formattedLine)

    const trimmedLine = line.trim()
    if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
      return (
        <li key={idx} className="ml-4 list-disc my-0.5">
          {renderInlineText(trimmedLine.slice(2))}
        </li>
      )
    }

    const numberedLine = trimmedLine.match(/^\d+\.\s+(.*)$/)
    if (numberedLine) {
      return (
        <li key={idx} className="ml-4 list-decimal my-0.5 marker:font-medium">
          {renderInlineText(numberedLine[1])}
        </li>
      )
    }

    return (
      <p key={idx} className={line.trim() === "" ? "h-2" : "my-1"}>
        {lineContent}
      </p>
    )
  })
}

export default function AiChatPage() {
  const navigate = useNavigate()
  const [providers, setProviders] = useState(FALLBACK_PROVIDERS)
  const [provider, setProvider] = useState("gemini")
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [scopes, setScopes] = useState(FALLBACK_SCOPES)
  const [scope, setScope] = useState("all")
  const [dataRange, setDataRange] = useState("all")
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [photoImportOpen, setPhotoImportOpen] = useState(false)
  const [voiceMode, setVoiceMode] = useState("voice-input")
  const [responseLanguage, setResponseLanguage] = useState("hinglish")
  const [listening, setListening] = useState(false)
  const endRef = useRef(null)
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(
    () => () => {
      recognitionRef.current?.stop?.()
      window.speechSynthesis?.cancel?.()
    },
    [],
  )

  useEffect(() => {
    getAiChatModels()
      .then((data) => {
        if (data?.providers) {
          setProviders(data.providers)
          const initialProvider = data.defaultProvider || "gemini"
          setProvider(initialProvider)
          setModel(data.providers?.[initialProvider]?.defaultModel || DEFAULT_MODEL)
        }
        if (Array.isArray(data?.scopes) && data.scopes.length) {
          setScopes(data.scopes)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading])

  const speakAnswer = (text, onEnd) => {
    if (!("speechSynthesis" in window)) {
      setError("Voice playback is not supported in this browser.")
      return
    }

    const spokenText = String(text || "")
      .replace(/[*#`_]/g, "")
      .replace(/\n+/g, ". ")
      .slice(0, 3500)
    const utterance = new SpeechSynthesisUtterance(spokenText)
    utterance.lang = /[\u0900-\u097F]/.test(spokenText) ? "hi-IN" : "en-IN"
    utterance.rate = 1
    utterance.onend = () => onEnd?.()
    utterance.onerror = () => onEnd?.()
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const stopListening = () => {
    recognitionRef.current?.stop?.()
    recognitionRef.current = null
    setListening(false)
  }

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError("Voice input is supported in Google Chrome. Please use Chrome and allow microphone access.")
      return
    }
    if (loading) return

    stopListening()
    const recognition = new SpeechRecognition()
    recognition.lang = "en-IN"
    recognition.continuous = voiceMode === "live"
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onstart = () => setListening(true)
    recognition.onerror = (event) => {
      setListening(false)
      if (event.error !== "aborted" && event.error !== "no-speech") {
        setError(event.error === "not-allowed" ? "Please allow microphone access to use voice chat." : "Unable to hear your voice. Please try again.")
      }
    }
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null
      setListening(false)
    }
    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex]?.[0]?.transcript?.trim() || ""
      if (transcript) {
        setQuestion(transcript)
      }
    }
    recognition.start()
  }

  const submitQuestion = async (textToSend, { speak = false } = {}) => {
    const text = (textToSend || question).trim()
    if (!text || loading) return

    const nowTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    const userMessage = { role: "user", content: text, timestamp: nowTime }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setQuestion("")
    setError("")
    setLoading(true)

    try {
      const result = await sendAiChatMessage({
        question: text,
        provider,
        model,
        scope,
        dataRange,
        responseLanguage,
        messages: nextMessages.slice(1),
      })
      const replyTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.answer || "No response received.", timestamp: replyTime },
      ])
      if (speak) {
        speakAnswer(result.answer || "No response received.")
      }
    } catch (requestError) {
      const message = requestError?.response?.data?.message || "Unable to get an AI answer right now."
      setError(message)
      const errTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      setMessages((current) => [
        ...current,
        { role: "assistant", content: `System Error: ${message}`, timestamp: errTime },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    submitQuestion(undefined, {
      speak: voiceMode !== "voice-input",
    })
  }

  const handleCopyMessage = (content, index) => {
    navigator.clipboard.writeText(content)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleClearChat = () => {
    setMessages([WELCOME_MESSAGE])
    setError("")
  }

  const handleQuickPromptClick = (promptText) => {
    setQuestion(promptText)
    submitQuestion(promptText, {
      speak: voiceMode !== "voice-input",
    })
  }
  
  const activeVoiceMode = VOICE_MODES.find((item) => item.key === voiceMode) || VOICE_MODES[0]

  return (
    <div
      className="w-full flex flex-col overflow-hidden bg-[var(--bg-main)] text-[color:var(--text-primary)] font-sans p-2 sm:p-4 gap-3 transition-colors duration-300"
      style={{ height: "calc(var(--app-screen-height, 100vh) - 85px)" }}
    >
      {/* TOP SLEEK CONTROL BAR */}
      <header className="shrink-0 flex flex-col gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-3 shadow-[var(--shadow-soft)] sm:px-5 sm:py-3.5 lg:flex-row lg:items-center lg:justify-between">
        
        {/* BRAND & ACTIVE STATUS */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white">
              <Bot size={19} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-[color:var(--text-strong)] sm:text-lg">
                Jio-bp AI Copilot
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                <Activity size={9} /> Active
              </span>
            </div>
            <p className="text-[11px] text-[color:var(--text-secondary)] font-medium hidden sm:block">
              Neural Assistant for Station Sales, MDU Logistics, Inventory & Audits
            </p>
          </div>
        </div>

        {/* CONTROLS & ACTIONS */}
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {/* PROVIDER SELECTOR */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs">
            <Zap size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              value={provider}
              onChange={(event) => {
                const nextProvider = event.target.value
                setProvider(nextProvider)
                setModel(providers[nextProvider]?.defaultModel || "")
              }}
              disabled={loading}
              className="bg-transparent font-bold text-[color:var(--text-strong)] outline-none cursor-pointer text-xs"
            >
              {Object.entries(providers).map(([key, item]) => (
                <option key={key} value={key} className="bg-[var(--bg-panel)] text-[color:var(--text-strong)]">
                  {item.label || key}
                </option>
              ))}
            </select>
          </div>

          {/* MODEL SELECTOR */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs max-w-[190px]">
            <Cpu size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
              disabled={loading}
              className="bg-transparent font-bold text-[color:var(--text-strong)] outline-none cursor-pointer text-xs truncate"
            >
              {(providers[provider]?.models || []).map((item) => (
                <option key={item} value={item} className="bg-[var(--bg-panel)] text-[color:var(--text-strong)]">
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* NEW CHAT BUTTON */}
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-2 text-xs font-bold text-[color:var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            title="New Chat Session"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

      </header>

      {/* ERROR NOTICE */}
      {error && (
        <div className="shrink-0 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between shadow-sm">
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* MAIN FULL HEIGHT CHAT WORKSPACE */}
      <main className="flex-1 min-h-0 flex flex-col rounded-xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[var(--shadow-soft)] overflow-hidden">
        
        {/* MESSAGES SCROLL AREA (FULL FLEX) */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-[var(--bg-soft)]/50 p-4 sm:p-6 space-y-6 scrollbar-thin">
          
          {/* WELCOME HERO & QUICK PROMPTS (WHEN CHAT IS FRESH) */}
          {messages.length <= 1 && (
            <div className="max-w-4xl mx-auto my-auto space-y-6 py-4 text-center">
              
              {/* WELCOME ICON & HEADING */}
              <div className="space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 shadow-sm">
                  <Sparkles size={25} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--text-strong)]">
                  What would you like to analyze today?
                </h2>
              </div>

              {/* QUICK PROMPTS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                {QUICK_PROMPTS.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuickPromptClick(item.prompt)}
                      className={`group flex flex-col justify-between rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md bg-[var(--bg-panel)] ${item.color}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-soft)] text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <Icon size={16} />
                          </div>
                          <span className="rounded-full bg-[var(--bg-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[color:var(--text-secondary)] border border-[var(--border-color)]">
                            {item.tag}
                          </span>
                        </div>
                        <h4 className="text-xs font-extrabold text-[color:var(--text-strong)] group-hover:text-emerald-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-[11px] text-[color:var(--text-secondary)] leading-relaxed line-clamp-2">
                          "{item.prompt}"
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-end text-[10px] font-extrabold text-emerald-600 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Ask AI Copilot <Send size={10} />
                      </div>
                    </button>
                  )
                })}
              </div>

            </div>
          )}

          {/* MESSAGES CONVERSATION STREAM */}
          {messages.map((message, index) => {
            const isUser = message.role === "user"
            return (
              <div
                key={`${message.role}-${index}`}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* AVATAR */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-sm ${
                    isUser
                      ? "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
                      : "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white"
                  }`}
                >
                  {isUser ? <UserRound size={17} /> : <Bot size={18} />}
                </div>

                {/* BUBBLE WRAPPER */}
                <div className={`group relative max-w-[90%] sm:max-w-[80%] lg:max-w-[75%] space-y-1 ${isUser ? "text-right" : "text-left"}`}>
                  
                  {/* SENDER LABEL */}
                  <div className={`flex items-center gap-2 text-[10px] font-bold uppercase text-[color:var(--text-secondary)] ${isUser ? "justify-end" : "justify-start"}`}>
                    <span>{isUser ? "You" : "Jio-bp AI Assistant"}</span>
                    {message.timestamp && <span>• {message.timestamp}</span>}
                  </div>

                  {/* BUBBLE CONTENT */}
                  <div
                    className={`relative overflow-hidden p-4 sm:p-5 text-sm leading-relaxed ${
                      isUser
                        ? "rounded-xl rounded-tr-sm bg-emerald-600 text-white shadow-sm font-medium"
                        : "rounded-xl rounded-tl-sm border border-[var(--border-strong)] bg-[var(--bg-panel)] text-[color:var(--text-strong)] shadow-sm"
                    }`}
                  >
                    {isUser ? message.content : renderFormattedText(message.content)}
                  </div>

                  {/* ASSISTANT ACTION TOOLBAR */}
                  {!isUser && (
                    <div className="flex items-center gap-3 pt-1 text-[11px]">
                      <button
                        onClick={() => handleCopyMessage(message.content, index)}
                        className="inline-flex items-center gap-1.5 text-[color:var(--text-secondary)] hover:text-emerald-600 transition-colors font-semibold"
                        title="Copy Response"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check size={13} className="text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied to Clipboard</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copy Response</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )
          })}

          {/* THINKING LOADER */}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <Bot size={18} />
              </div>
              <div className="rounded-xl rounded-tl-sm border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-3 shadow-sm">
                <Loader2 size={18} className="animate-spin text-emerald-600" />
                <span>Analyzing station operational data & crafting response...</span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* BOTTOM DOCKED INPUT FORM */}
        <form onSubmit={handleSubmit} className="shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-panel)] p-3 sm:p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2.5 py-1.5 text-xs font-bold text-[color:var(--text-secondary)]">
                <Globe size={13} className="text-emerald-600" />
                Scope
                <select
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                  disabled={loading}
                  className="max-w-40 bg-transparent font-bold text-[color:var(--text-strong)] outline-none"
                >
                  {scopes.map((item) => (
                    <option key={item.key} value={item.key}>{item.label}</option>
                  ))}
                </select>
              </label>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2.5 py-1.5 text-xs font-bold text-[color:var(--text-secondary)]">
                <Layers size={13} className="text-emerald-600" />
                Data
                <select
                  value={dataRange}
                  onChange={(event) => setDataRange(event.target.value)}
                  disabled={loading}
                  className="bg-transparent font-bold text-[color:var(--text-strong)] outline-none"
                >
                  {DATA_RANGES.map((range) => (
                    <option key={range.key} value={range.key}>{range.label}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => setPhotoImportOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-500/20"
                title="Import multiple entries from a photo"
              >
                <ImageUp size={14} />
                Photo Import
              </button>
              {VOICE_MODES.map((item) => {
                const Icon = item.icon
                const isActive = voiceMode === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (listening) stopListening()
                      window.speechSynthesis?.cancel?.()
                      setVoiceMode(item.key)
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${isActive ? "border-emerald-600 bg-emerald-600 text-white" : "border-[var(--border-color)] bg-[var(--bg-soft)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}
                    title={item.detail}
                  >
                    <Icon size={14} />
                    {item.label}
                  </button>
                )
              })}
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-soft)] px-2.5 py-1.5 text-xs font-bold text-[color:var(--text-secondary)]">
                Response
                <select
                  value={responseLanguage}
                  onChange={(event) => setResponseLanguage(event.target.value)}
                  disabled={loading}
                  className="bg-transparent font-bold text-[color:var(--text-strong)] outline-none"
                >
                  {RESPONSE_LANGUAGES.map((language) => (
                    <option key={language.key} value={language.key}>{language.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <span className={`text-xs font-semibold ${listening ? "text-rose-600" : "text-[color:var(--text-secondary)]"}`}>
              {listening ? "Listening..." : activeVoiceMode.detail}
            </span>
          </div>
          <div className="flex items-end gap-3 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-soft)] p-2.5 shadow-sm transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  submitQuestion(undefined, {
                    speak: voiceMode !== "voice-input",
                  })
                }
              }}
              rows={2}
              placeholder="Ask Jio-bp AI Copilot about daily fuel sales, nozzle readings, MDU decant, lubricants, or staff payroll..."
              className="min-h-[48px] max-h-36 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm font-medium text-[color:var(--text-strong)] outline-none placeholder:text-[color:var(--text-muted)]"
            />

            <div className="flex items-center gap-2 pb-0.5">
              <button
                type="button"
                onClick={() => (listening ? stopListening() : startListening())}
                disabled={loading}
                className={`inline-flex h-12 w-12 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${listening ? "border-rose-500 bg-rose-500 text-white" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"}`}
                title={listening ? "Stop listening and keep the typed text" : `${activeVoiceMode.label}: start microphone`}
              >
                {voiceMode === "live" ? <Radio size={18} className={listening ? "animate-pulse" : ""} /> : voiceMode === "voice-reply" ? <Volume2 size={18} /> : <Mic size={18} />}
              </button>
              <button
                type="submit"
                disabled={!question.trim() || loading}
                className="inline-flex h-12 px-6 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white font-black text-xs shadow-sm transition-colors hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                title="Send Message"
              >
                <span>Send</span>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-col sm:flex-row items-center justify-between text-[10px] font-bold text-[color:var(--text-secondary)] px-1 gap-1">
            <span>Press <kbd className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 border border-[var(--border-color)]">Enter</kbd> to send, <kbd className="rounded bg-[var(--bg-panel)] px-1.5 py-0.5 border border-[var(--border-color)]">Shift+Enter</kbd> for newline</span>
            <span className="text-emerald-600 font-extrabold flex items-center gap-1">
              <Sparkles size={11} /> Jio-bp Station Neural Network • Active Scope: {scopes.find((s) => s.key === scope)?.label || scope}
            </span>
          </div>
        </form>

      </main>

      {photoImportOpen ? (
        <PhotoImportModal
          onClose={() => setPhotoImportOpen(false)}
          onImported={(result) => {
            sessionStorage.setItem("aiPhotoImportDraft", JSON.stringify(result))
            setPhotoImportOpen(false)
            navigate(PHOTO_IMPORT_ROUTES[result.pageKey])
          }}
        />
      ) : null}
    </div>
  )
}

const PHOTO_IMPORT_PAGES = [
  { key: "expenses", label: "Expenses" },
  { key: "cardSwipe", label: "Card Swipe Register" },
  { key: "dcd", label: "D.C.D" },
  { key: "mdu", label: "M.D.U" },
  { key: "dailySales", label: "Daily Sales" },
  { key: "invoiceDetails", label: "Invoice Details" },
]

const PHOTO_IMPORT_ROUTES = {
  expenses: "/admin/expenses",
  cardSwipe: "/admin/card-swipe",
  dcd: "/admin/dcd",
  mdu: "/admin/mdu",
  dailySales: "/admin/daily-sales",
  invoiceDetails: "/admin/invoice-details",
}

function PhotoImportModal({ onClose, onImported }) {
  const [imageDataUrl, setImageDataUrl] = useState("")
  const [pageKey, setPageKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    setError("")
    setImageDataUrl("")

    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Choose an image smaller than 10 MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => setImageDataUrl(String(reader.result || ""))
    reader.onerror = () => setError("Unable to read this image.")
    reader.readAsDataURL(file)
  }

  const handleImport = async () => {
    if (!imageDataUrl || !pageKey || loading) return
    setLoading(true)
    setError("")
    try {
      const result = await extractEntriesFromPhoto({ imageDataUrl, pageKey })
      onImported(result)
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to read the photo right now.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-[color:var(--text-strong)]">Import Entries from Photo</h2>
            <p className="mt-1 text-sm text-[color:var(--text-secondary)]">Choose a photo first, then select the page to fill.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] p-2 text-[color:var(--text-secondary)]" title="Close">
            <X size={17} />
          </button>
        </div>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-400/50 bg-emerald-500/5 px-4 py-8 text-center transition-colors hover:bg-emerald-500/10">
          <ImageUp size={28} className="text-emerald-600" />
          <span className="mt-3 text-sm font-bold text-[color:var(--text-strong)]">Choose register photo</span>
          <span className="mt-1 text-xs text-[color:var(--text-secondary)]">Clear table photos work best. Maximum size: 10 MB.</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
        </label>

        {imageDataUrl ? (
          <>
            <img src={imageDataUrl} alt="Selected register" className="mt-4 max-h-64 w-full rounded-xl border border-[var(--border-color)] object-contain" />
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--text-strong)]">Which page should these entries fill?</span>
              <select value={pageKey} onChange={(event) => setPageKey(event.target.value)} className="input w-full">
                <option value="">Select page</option>
                {PHOTO_IMPORT_PAGES.map((page) => <option key={page.key} value={page.key}>{page.label}</option>)}
              </select>
            </label>
          </>
        ) : null}

        {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--text-primary)]">Cancel</button>
          <button type="button" onClick={handleImport} disabled={!imageDataUrl || !pageKey || loading} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Reading Photo..." : "Read and Fill Entries"}
          </button>
        </div>
      </div>
    </div>
  )
}
