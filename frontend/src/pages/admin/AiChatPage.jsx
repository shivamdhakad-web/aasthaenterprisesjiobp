import { useEffect, useRef, useState } from "react"
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
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Truck,
  UserRound,
  Users,
  Zap,
} from "lucide-react"
import { getAiChatModels, sendAiChatMessage } from "../../services/aiApi"

const DEFAULT_MODEL = "llama-3.1-8b-instant"
const FALLBACK_MODELS = [
  DEFAULT_MODEL,
  "llama-3.3-70b-versatile",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
]
const FALLBACK_PROVIDERS = {
  groq: { label: "Groq Neural", models: FALLBACK_MODELS, defaultModel: DEFAULT_MODEL },
  gemini: { label: "Google Gemini", models: ["gemini-flash-latest"], defaultModel: "gemini-flash-latest" },
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
    "Hello! I am your Jio-bp Station AI Assistant. I can analyze daily sales, MDU logistics, lubricant inventory, credit ledgers, and staff attendance. How can I assist you today?",
  timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
}

// FORMAT TEXT HELPER WITH BOLD & LIST FORMATTING
const renderFormattedText = (text) => {
  if (!text) return null
  const lines = text.split("\n")
  return lines.map((line, idx) => {
    let formattedLine = line

    // Render Bold text **word**
    const parts = formattedLine.split(/(\*\*.*?\*\*)/g)
    const lineContent = parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={pIdx} className="font-extrabold text-[color:var(--text-strong)]">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })

    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      return (
        <li key={idx} className="ml-4 list-disc my-0.5">
          {lineContent}
        </li>
      )
    }

    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <li key={idx} className="ml-4 list-decimal my-0.5">
          {lineContent}
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
  const [providers, setProviders] = useState(FALLBACK_PROVIDERS)
  const [provider, setProvider] = useState("groq")
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [scopes, setScopes] = useState(FALLBACK_SCOPES)
  const [scope, setScope] = useState("all")
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copiedIndex, setCopiedIndex] = useState(null)
  const endRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    getAiChatModels()
      .then((data) => {
        if (data?.providers) {
          setProviders(data.providers)
          const initialProvider = data.defaultProvider || "groq"
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

  const submitQuestion = async (textToSend) => {
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
        messages: nextMessages.slice(1),
      })
      const replyTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.answer || "No response received.", timestamp: replyTime },
      ])
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
    submitQuestion()
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
    submitQuestion(promptText)
  }

  return (
    <div
      className="w-full flex flex-col overflow-hidden bg-[var(--bg-main)] text-[color:var(--text-primary)] font-sans p-2 sm:p-4 gap-3 transition-colors duration-300"
      style={{ height: "calc(var(--app-screen-height, 100vh) - 68px)" }}
    >
      {/* TOP SLEEK CONTROL BAR */}
      <header className="shrink-0 flex flex-col gap-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-3 sm:px-5 sm:py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        
        {/* BRAND & ACTIVE STATUS */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[var(--bg-panel)] text-emerald-600 dark:text-emerald-400 font-bold">
              <Bot size={22} className="animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-[color:var(--text-strong)] sm:text-lg">
                Jio-bp AI Copilot
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <Activity size={9} className="animate-ping text-emerald-500" /> Active
              </span>
            </div>
            <p className="text-[11px] text-[color:var(--text-secondary)] font-medium hidden sm:block">
              Neural Assistant for Station Sales, MDU Logistics, Inventory & Audits
            </p>
          </div>
        </div>

        {/* CONTROLS & ACTIONS */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* SCOPE SELECTOR */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs">
            <Globe size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              disabled={loading}
              className="bg-transparent font-bold text-[color:var(--text-strong)] outline-none cursor-pointer text-xs"
            >
              {scopes.map((item) => (
                <option key={item.key} value={item.key} className="bg-[var(--bg-panel)] text-[color:var(--text-strong)]">
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* PROVIDER SELECTOR */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs">
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
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs max-w-[190px]">
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
            className="flex items-center gap-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-soft)] px-3 py-1.5 text-xs font-bold text-[color:var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
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
      <main className="flex-1 min-h-0 flex flex-col rounded-3xl border border-[var(--border-strong)] bg-[var(--bg-panel)] shadow-[var(--shadow-soft)] overflow-hidden">
        
        {/* MESSAGES SCROLL AREA (FULL FLEX) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          
          {/* WELCOME HERO & QUICK PROMPTS (WHEN CHAT IS FRESH) */}
          {messages.length <= 1 && (
            <div className="max-w-4xl mx-auto my-auto space-y-6 py-6 text-center">
              
              {/* WELCOME ICON & HEADING */}
              <div className="space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20">
                  <Sparkles size={28} className="animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--text-strong)] tracking-tight">
                  What would you like to analyze today?
                </h2>
                <p className="text-xs sm:text-sm text-[color:var(--text-secondary)] max-w-xl mx-auto">
                  Ask me anything about daily fuel sales, nozzle readings, MDU decant deliveries, lubricant stock profit, credit balances, or staff payroll.
                </p>
              </div>

              {/* QUICK PROMPTS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                {QUICK_PROMPTS.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuickPromptClick(item.prompt)}
                      className={`group flex flex-col justify-between rounded-2xl border p-4 transition-all hover:scale-[1.02] hover:shadow-lg bg-[var(--bg-panel)] ${item.color}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
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
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
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
                  <div className={`flex items-center gap-2 text-[10px] font-bold text-[color:var(--text-secondary)] ${isUser ? "justify-end" : "justify-start"}`}>
                    <span>{isUser ? "You" : "Jio-bp AI Assistant"}</span>
                    {message.timestamp && <span>• {message.timestamp}</span>}
                  </div>

                  {/* BUBBLE CONTENT */}
                  <div
                    className={`relative overflow-hidden p-4 sm:p-5 text-sm leading-relaxed ${
                      isUser
                        ? "rounded-3xl rounded-tr-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white shadow-md font-medium"
                        : "rounded-3xl rounded-tl-sm border border-[var(--border-strong)] bg-[var(--bg-soft)] text-[color:var(--text-strong)] shadow-sm"
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
                <Bot size={18} />
              </div>
              <div className="rounded-3xl rounded-tl-sm border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-3 shadow-sm">
                <Loader2 size={18} className="animate-spin text-emerald-600" />
                <span>Analyzing station operational data & crafting response...</span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* BOTTOM DOCKED INPUT FORM */}
        <form onSubmit={handleSubmit} className="shrink-0 border-t border-[var(--border-color)] bg-[var(--bg-soft)] p-3 sm:p-4">
          <div className="flex items-end gap-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] p-2.5 shadow-md transition-all focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/15">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  submitQuestion()
                }
              }}
              rows={2}
              placeholder="Ask Jio-bp AI Copilot about daily fuel sales, nozzle readings, MDU decant, lubricants, or staff payroll..."
              className="min-h-[48px] max-h-36 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm font-medium text-[color:var(--text-strong)] outline-none placeholder:text-[color:var(--text-muted)]"
            />

            <div className="flex items-center gap-2 pb-0.5">
              <button
                type="submit"
                disabled={!question.trim() || loading}
                className="inline-flex h-12 px-6 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
    </div>
  )
}
