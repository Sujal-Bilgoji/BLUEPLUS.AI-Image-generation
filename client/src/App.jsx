import { useEffect, useRef, useState } from 'react'
import { get, set } from 'idb-keyval'
import { useSpeechRecognition } from './useSpeechRecognition'

const STYLES = [
  ['Auto', ''],
  ['Realistic', 'photorealistic, 85mm lens, natural skin texture, soft cinematic lighting, sharp focus'],
  ['Cinematic', 'cinematic film still, dramatic lighting, shallow depth of field'],
  ['Anime', 'anime style, vibrant colors, clean line art'],
  ['Ghibli', 'hand-painted anime film style, soft watercolor backgrounds, gentle pastel colors, whimsical countryside, warm natural light'],
  ['3D', '3D animated movie style, detailed textures, realistic skin and fabric shading, cinematic lighting, high quality CGI render'],
  ['Digital art', 'digital art, concept art, highly detailed'],
  ['Oil paint', 'oil painting, visible brush strokes, rich colors'],
  ['Watercolor', 'watercolor painting, soft colors'],
  ['Cyberpunk', 'cyberpunk, neon lights, futuristic city'],
  ['Pixel art', 'pixel art, 16-bit, retro game style'],
  ['Sketch', 'pencil sketch, detailed line drawing'],
]
// Must match ASPECT_RATIOS in config.js
const RATIOS = [['1:1', 1024, 1024], ['16:9', 1024, 576], ['9:16', 576, 1024], ['4:3', 1024, 768], ['3:4', 768, 1024]]
const OPTIONS = {
  lighting: ['', 'soft natural lighting', 'golden hour', 'dramatic lighting', 'neon lights', 'studio lighting', 'moonlit'],
  mood: ['', 'calm mood', 'joyful mood', 'mysterious mood', 'epic mood', 'nostalgic mood', 'dark mood'],
  camera: ['', 'close-up', 'wide angle', 'aerial view', 'low angle', 'eye level'],
}
const buildGuided = (g) =>
  [g.subject, g.setting && `in ${g.setting}`, g.lighting, g.mood, g.camera].filter(Boolean).join(', ')
const css = (r) => r.replace(':', ' / ')
const ext = (s) => (s.startsWith('data:image/png') ? 'png' : 'jpg')
const slug = (s) => s.toLowerCase().replace(/\s+/g, '-')
const FOCUS = { '3d': 'center top' } // keeps faces from being cropped in style cards
const day = (t) => (t ? new Date(t).toDateString() : '')
const VOICE_LANG = 'en-IN'
const RULES = [
  ['Use original ideas', 'Describe your own characters and scenes. Names of trademarked characters, brands and real people are often blocked by the safety filter.'],
  ['Keep it safe and respectful', 'Do not create violent, sexual, hateful or misleading content, and do not try to get around the safety filter.'],
  ['Reword if blocked', 'The filter can block harmless prompts too. If that happens, try a shorter and simpler description.'],
  ['Use photos you have permission for', 'Only upload images you own or have the right to use, and never photos of other people without their consent. Reference photos are sent to our image provider to create the result and are not stored on our server.'],
  ['Respect the usage limits', 'Each person can send up to 5 requests per minute, create up to 60 images per hour and up to 100 per day. The site also shares a daily allowance, so it can run out. If it does, come back later.'],
  ['Create up to 4 images at a time', 'Prompts can be up to 1,000 characters long.'],
  ['Your history stays on your device', 'Images and prompts are not saved on our server. History is kept in your browser only (latest 24 images), so clearing your browser data deletes it and it will not appear on other devices. Download the images you want to keep.'],
  ['Voice input', 'It works in Chrome and Edge. Your browser sends the audio to its own speech service, not to us.'],
  ['AI can make mistakes', 'Faces, hands and text may look wrong. Check the results before sharing them, and do not present AI images as real photos. You are responsible for how you use what you create.'],
]

const CARD = 'rounded-2xl border border-white/15 bg-white/[0.05]'
const INPUT = 'w-full rounded-lg border border-white/20 bg-black/40 p-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white'
const BRAND = "font-['Anton_SC',sans-serif] tracking-wide"
const tile = (on) =>
  `flex h-16 flex-col items-center justify-center gap-1 rounded-xl border ${
    on ? 'border-white bg-white text-black' : 'border-white/20 hover:border-white/60'
  }`

export default function App() {
  const [page, setPage] = useState('home')
  const [history, setHistory] = useState([])
  useEffect(() => {
    get('history').then((h) => h && setHistory(h)).catch(() => {})
  }, [])
  const save = (next) => {
    setHistory(next)
    set('history', next).catch(() => {})
  }
  return page === 'home' ? (
    <Home history={history} onStart={() => setPage('studio')} />
  ) : (
    <Studio history={history} save={save} onHome={() => setPage('home')} />
  )
}

function Home({ onStart }) {
  const [rules, setRules] = useState(false)
  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[radial-gradient(ellipse_at_50%_35%,#1c1c1c,#000_70%)] text-white">
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 sm:px-10">
        <button onClick={() => setRules(false)} aria-label="Home" className="hover:opacity-80">
          <img src="/brand.png" alt="BluePlus.AI" className="h-8 w-auto" />
        </button>
        <div className="hidden gap-16 text-lg sm:flex">
          <button onClick={() => setRules(false)}>Home</button>
          <button onClick={() => setRules(true)}>Rules</button>
        </div>
        <button onClick={onStart} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black hover:bg-slate-200">
          Open studio
        </button>
      </nav>

      <div
        className={`${BRAND} absolute inset-x-0 top-[20%] z-0 flex justify-center whitespace-nowrap text-[min(26.5vw,60vh)] leading-none [text-shadow:0_0_50px_rgba(255,255,255,0.3)]`}
      >
        BLUEPLUS
      </div>

      <img src="/hero.png" alt="" className="absolute bottom-0 left-1/2 z-10 h-[88vh] max-w-none -translate-x-1/2" />

      <div className="absolute inset-x-0 top-[84%] z-20 flex justify-between px-6 text-sm font-medium sm:px-[8vw] sm:text-lg">
        <span>Describe it. Pick a style.</span>
        <span>Get up to 4 images.</span>
      </div>
      <div className="absolute bottom-6 left-6 z-20 hidden text-sm text-slate-300 sm:block">Free AI image studio</div>
      {rules && (
        <div onClick={() => setRules(false)} className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[#111] p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl">Rules</h2>
              <button onClick={() => setRules(false)} className="text-slate-400 hover:text-white">
                Close
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-400">Please keep these in mind while using BluePlus.AI.</p>
            <ol className="mt-5 space-y-4 text-sm leading-relaxed text-slate-300">
              {RULES.map(([title, text], i) => (
                <li key={title} className="flex gap-3">
                  <span className="text-slate-500">{i + 1}.</span>
                  <p>
                    <span className="text-white">{title}.</span> {text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}
function Studio({ history, save, onHome }) {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState(0)
  const [count, setCount] = useState(1)
  const [ratio, setRatio] = useState('1:1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [progress, setProgress] = useState(0)
  const [confirmDel, setConfirmDel] = useState(null)
  useEffect(() => {
    if (!loading) return
    setProgress(0)
    const t = setInterval(() => setProgress((p) => (p < 90 ? p + Math.max(0.4, (90 - p) / 25) : p)), 300)
    return () => clearInterval(t)
  }, [loading])
  const baseRef = useRef('')
  const [refImage, setRefImage] = useState('')
  const fileRef = useRef(null)
  const [mode, setMode] = useState('custom')
  const [guided, setGuided] = useState({ subject: '', setting: '', lighting: '', mood: '', camera: '' })
  const setG = (k) => (e) => setGuided({ ...guided, [k]: e.target.value })
  const { supported, listening, error: voiceError, toggle, stop } = useSpeechRecognition({
    lang: VOICE_LANG,
    onTranscript: (t) => setPrompt(((baseRef.current ? baseRef.current + ' ' : '') + t).slice(0, 1000)),
  })

  function pickFile(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    const img = new Image()
    img.onload = () => {
      const s = Math.min(1, 480 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * s)
      c.height = Math.round(img.height * s)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      setRefImage(c.toDataURL('image/jpeg', 0.85))
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  }

  async function generate() {
    stop()
    const base = (mode === 'guided' ? buildGuided(guided) : prompt).trim()
    if (!base) return setError('Please type a prompt first.')
    const sv = STYLES[style][1]
    setLoading(true)
    setError('')
    setResults([])
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: sv ? `${base}, ${sv}` : base, count, ratio, image: refImage || undefined }),
      })
      if (!res.ok) {
        let msg = 'Something went wrong.'
        try {
          msg = (await res.json()).error || msg
        } catch {}
        throw new Error(msg)
      }
      const data = await res.json()
      const batch = crypto.randomUUID()
      const items = data.images.map((img) => ({
        id: crypto.randomUUID(),
        batch,
        at: Date.now(),
        src: `data:${img.mime};base64,${img.data}`,
        prompt: base,
        style: STYLES[style][0],
        ratio,
      }))
      setProgress(100)
      await new Promise((r) => setTimeout(r, 500))
      setResults(items)
      save([...items, ...history].slice(0, 48))
      if (data.failed > 0) setError(`${data.failed} image(s) failed and were not counted.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const n = loading ? count : results.length
  const [, W, H] = RATIOS.find((r) => r[0] === ratio)
  const groups = []
  history.forEach((h) => {
    const key = h.batch || h.id
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(h)
    else groups.push({ key, items: [h] })
  })
  const plusBtn = (
    <button
              type="button"
              onClick={() => fileRef.current.click()}
              title="Add a reference image"
              className="group shrink-0 cursor-pointer outline-none duration-300 hover:rotate-90"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="44"
                height="44"
                viewBox="0 0 24 24"
                className="fill-none stroke-zinc-400 duration-300 group-hover:fill-zinc-800 group-active:fill-zinc-600 group-active:stroke-zinc-200 group-active:duration-0"
              >
                <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" strokeWidth="1.5" />
                <path d="M8 12H16" strokeWidth="1.5" />
                <path d="M12 16V8" strokeWidth="1.5" />
              </svg>
    </button>
  )

  return (
        <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_50%_0%,#1c1c1c,#000_65%)] text-white [color-scheme:dark] lg:h-screen lg:overflow-hidden">
      <header className="flex shrink-0 items-center justify-between px-4 py-2 sm:px-8">
        <div className="flex items-center gap-4">
          <button onClick={onHome} aria-label="Back to home" className="text-3xl leading-none hover:opacity-70">
            ←
          </button>
          <button onClick={onHome} aria-label="Go to home page" title="Home" className="hover:opacity-80">
            <img src="/brand.png" alt="BluePlus.AI" className="h-7 w-auto" />
          </button>
        </div>
        <span className="text-sm font-semibold text-slate-400">AI Generate Image</span>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 px-4 pb-4 pt-1 lg:grid-cols-[1fr_380px] lg:grid-rows-[minmax(0,1fr)]">
        <section className="order-2 flex min-h-0 flex-col gap-3 lg:order-1">
          <div className={`${CARD} flex shrink-0 items-end gap-2 p-2`}>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              title="Add a reference image"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 hover:bg-white hover:text-black"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-5 w-5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            {refImage && (
              <div className="relative shrink-0 self-center">
                <img src={refImage} alt="Reference" className="h-12 w-12 rounded-lg object-cover" />
                <button onClick={() => setRefImage('')} className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-500 text-xs text-white">
                  ×
                </button>
              </div>
            )}
            <textarea
              value={mode === 'guided' ? buildGuided(guided) : prompt}
              readOnly={mode === 'guided'}
              onChange={(e) => setPrompt(e.target.value)}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  generate()
                }
              }}
              maxLength={1000}
              rows={1}
              placeholder={mode === 'guided' ? 'Fill in the Guided fields on the right...' : 'Describe your image, e.g. a cozy cabin in a snowy forest at sunset'}
              className="max-h-32 min-h-12 min-w-0 flex-1 resize-none bg-transparent px-2 py-3 text-base text-white outline-none placeholder:text-slate-500"
            />
            {supported && mode !== 'guided' && (
              <button
                type="button"
                onClick={() => {
                  baseRef.current = prompt.trim()
                  toggle()
                }}
                title="Speak your prompt"
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${listening ? 'animate-pulse border-red-500 bg-red-500 text-white' : 'border-white/20 hover:bg-white hover:text-black'}`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
                  <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-3.08A7 7 0 0 0 19 11Z" />
                </svg>
              </button>
            )}
            <button
              onClick={generate}
              disabled={loading}
              className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-6 text-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Generating...' : 'Generate'}
              <img src="/coins.png" alt="" className="h-5 w-5" />
            </button>
          </div>
          {(listening || voiceError) && (
            <p className={`text-sm ${listening ? 'text-red-400' : 'text-amber-400'}`}>{listening ? 'Listening...' : voiceError}</p>
          )}

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
            <div className={`${CARD} min-h-64 p-4`}>
              {loading && (
                <div className="flex flex-col items-center gap-4 py-14">
                  <div className="loader" />
                  <p className="text-slate-700">Your image is generating... {Math.round(progress)}%</p>
                  <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-zinc-700 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
              {!loading && results.length === 0 && (
                <p className="py-20 text-center text-slate-500">Your images will appear here. Write a prompt and hit Generate.</p>
              )}
              {!loading && results.length > 0 && (
                <>
                  <p className="mb-3 text-sm text-slate-400">Click an image to view and download it.</p>
                  <div className={`grid gap-3 ${results.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {results.map((r) => (
                      <img key={r.id} src={r.src} alt={r.prompt} onClick={() => setSelected(r)} className="w-full cursor-pointer rounded-xl border border-white/20 hover:opacity-90" />
                    ))}
                  </div>
                </>
              )}
              {error && <p className="mt-3 text-red-400">{error}</p>}
            </div>

            {groups.length > 0 && (
              <div className={`${CARD} p-4`}>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-lg font-extrabold">History</h2>
                  <button onClick={() => setConfirmDel({ key: null, count: history.length })} className="text-sm text-slate-400 hover:text-red-400">
                    Clear all
                  </button>
                </div>
                {groups.map((g, gi) => {
                  const d = day(g.items[0].at)
                  const first = g.items[0]
                  return (
                    <div key={g.key}>
                      {d && d !== day(groups[gi - 1]?.items[0].at) && <p className="mb-2 mt-4 text-sm text-slate-400">{d}</p>}
                      <div className="mb-3 flex flex-col gap-3 rounded-xl bg-white/[0.06] p-3 sm:flex-row sm:items-stretch">
                        <div className="grid flex-1 grid-cols-4 gap-2">
                          {g.items.map((h) => (
                            <img
                              key={h.id}
                              src={h.src}
                              alt={h.prompt}
                              onClick={() => setSelected(h)}
                              className="aspect-square w-full cursor-pointer rounded-lg object-cover hover:opacity-80"
                            />
                          ))}
                        </div>
                        <div className="flex flex-col justify-between gap-3 sm:w-48">
                          <div>
                            <p className="line-clamp-3 text-sm">"{first.prompt}"</p>
                            <div className="mt-2 flex flex-wrap gap-1 text-xs">
                              <span className="rounded-full bg-white px-2 py-0.5 text-black">{first.style}</span>
                              <span className="rounded-full bg-white/15 px-2 py-0.5">{first.ratio}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setConfirmDel({ key: g.key, count: g.items.length })}
                            className="flex items-center gap-1.5 self-end rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <aside className={`${CARD} order-1 space-y-4 overflow-y-auto p-3 lg:order-2`}>
          <div className="flex rounded-full bg-white/10 p-1 text-sm font-bold">
            {['custom', 'guided'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full py-1.5 capitalize ${mode === m ? 'bg-white text-black' : 'text-slate-400'}`}
              >
                {m}
              </button>
            ))}
          </div>

          {mode === 'guided' && (
            <div className="space-y-2">
              <input value={guided.subject} onChange={setG('subject')} maxLength={300} placeholder="Subject, e.g. an old fisherman mending a net" className={INPUT} />
              <input value={guided.setting} onChange={setG('setting')} maxLength={200} placeholder="Setting, e.g. a misty harbor at dawn" className={INPUT} />
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(OPTIONS).map(([k, opts]) => (
                  <select key={k} value={guided[k]} onChange={setG(k)} className={INPUT}>
                    {opts.map((o) => (
                      <option key={o} value={o}>
                        {o || k}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm">Select Style</p>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map(([label], i) => (
                <button
                  key={label}
                  onClick={() => setStyle(i)}
                  title={label}
                  style={{ background: `linear-gradient(135deg, hsl(${i * 33} 80% 68%), hsl(${i * 33 + 40} 70% 42%))` }}
                  className={`relative aspect-[16/10] overflow-hidden rounded-lg border-2 ${style === i ? 'border-white ring-2 ring-white' : 'border-transparent'}`}
                >
                  <img
                    src={`/styles/${slug(label)}.jpg`}
                    alt=""
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                    style={{ objectPosition: FOCUS[slug(label)] || 'center' }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-black/65 py-0.5 text-[10px] text-white">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold">Image Dimensions</p>
              <span className="rounded-md border border-white/40 px-2 py-0.5 text-xs font-bold">
                {W}×{H}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {RATIOS.map(([r, w, h]) => {
                const k = 22 / Math.max(w, h)
                return (
                  <button key={r} onClick={() => setRatio(r)} className={tile(ratio === r)}>
                    <span style={{ width: w * k, height: h * k }} className="rounded-sm border-2 border-current" />
                    <span className="text-xs font-bold">{r}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm">Number of generations</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  className={`h-9 w-9 rounded-lg border ${count === c ? 'border-white bg-white text-black' : 'border-white/20 hover:border-white/60'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {confirmDel && (
        <div onClick={() => setConfirmDel(null)} className="fixed inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#111] p-6">
            <h3 className="text-lg">{confirmDel.key ? 'Delete these images?' : 'Clear all history?'}</h3>
            <p className="mt-2 text-sm text-slate-400">
              {confirmDel.count} image{confirmDel.count > 1 ? 's' : ''} will be removed from this device. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirmDel(null)} className="rounded-xl border border-white/20 px-5 py-2 text-sm hover:bg-white/10">
                Cancel
              </button>
              <button
                onClick={() => {
                  save(confirmDel.key ? history.filter((h) => (h.batch || h.id) !== confirmDel.key) : [])
                  setConfirmDel(null)
                }}
                className="rounded-xl bg-red-500 px-5 py-2 text-sm text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {selected && (
        <div onClick={() => setSelected(null)} className="fixed inset-0 z-10 flex items-center justify-center bg-black/85 p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="grid max-h-full w-full max-w-4xl gap-5 overflow-auto rounded-2xl border border-white/15 bg-[#111] p-4 md:grid-cols-[1.4fr_1fr]"
          >
            <img src={selected.src} alt={selected.prompt} className="w-full rounded-xl border border-white/20" />
            <div className="flex flex-col">
              <h3 className="text-lg font-extrabold">{selected.prompt}</h3>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-slate-500">Style</dt>
                  <dd className="font-semibold">{selected.style}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Ratio</dt>
                  <dd className="font-semibold">{selected.ratio}</dd>
                </div>
              </dl>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                <a
                  href={selected.src}
                  download={`blueplus-ai.${ext(selected.src)}`}
                  className="rounded-full bg-white px-6 py-2.5 text-sm font-extrabold text-black hover:bg-slate-200"
                >
                  Download
                </a>
                <button
                  onClick={() => {
                    setPrompt(selected.prompt)
                    setMode('custom')
                    setSelected(null)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
                >
                  Reuse prompt
                </button>
                <button onClick={() => setSelected(null)} className="px-4 py-2.5 text-sm text-slate-400 hover:text-white">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}