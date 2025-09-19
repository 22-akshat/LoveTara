// @refresh reset
import React, { useMemo, useState, useEffect } from "react";

/* ===============================================================
   ❤️ DRIVE-POWERED LOVE GALLERY — APP.JSX (Modern • Professional • Elegant UI)
   - Vite friendly, single-file component
   - Functionality unchanged; UI refreshed only
   - Reads Google API key from env (same behavior)
   =============================================================== */

/* ==========================================
   GOOGLE DRIVE SETUP (photos + videos)
   ========================================== */
const DRIVE_FOLDER_INPUT =
    "https://drive.google.com/drive/folders/1w-m33RdvBsndplgTFR7HwhQ3fiDdVECz?usp=sharing";

// 🔑 Prefer env over hardcoding; for Vite use .env.local with VITE_GOOGLE_API_KEY
function __getGoogleKey() {
    // Vite (import.meta.env)
    try {
        const k = import.meta?.env?.VITE_GOOGLE_API_KEY;
        if (k) return k;
    } catch {
        // ignore: env might not exist in this runtime
    }
    // Next (public env)
    try {
        const k = (globalThis as any)?.process?.env?.NEXT_PUBLIC_GOOGLE_API_KEY;
        if (k) return k;
    } catch {
        // ignore: process/env may not exist in browser
    }
    return "AIzaSyCEfUGbs7bDaw3-Ro2maMs1nwYEtjdbJZI";
}
const GOOGLE_API_KEY = __getGoogleKey();

// URL → ID
const DRIVE_FOLDER_ID = (() => {
    const m = String(DRIVE_FOLDER_INPUT).match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return m ? m[1] : String(DRIVE_FOLDER_INPUT).trim();
})();

// (optional) shared drive
const DRIVE_SHARED = false; // set true if using a Shared Drive
const DRIVE_ID = ""; // the Shared Drive ID if DRIVE_SHARED=true

// fallback static
const PHOTO_URLS: string[] = [];

/* =========================
   Quiz (MCQ, Hinglish, romantic)
   ========================= */
const QUESTIONS = [
    {
        id: 1,
        type: "mcq",
        label: "Main tumhe kaunsa pyaara nickname se bulata/bulati hoon? 💕",
        options: ["Bacha", "Shona", "Jaan", "Cutie"],
        correctAnswer: "bacha",
    },
    {
        id: 2,
        type: "mcq",
        label: "Hamari pehli coffee date ka month kaunsa tha? ☕️",
        options: ["March", "May", "June", "August"],
        correctAnswer: "june",
    },
    {
        id: 3,
        type: "mcq",
        label: "Mera favourite color kya hai? 🎨",
        options: ["Black", "Blue", "Red", "Purple"],
        correctAnswer: "black",
    },
    {
        id: 4,
        type: "mcq",
        label: "Hamari first meet kaunse mall me hui thi? 🗺️",
        options: ["Amanora Mall", "Phoenix Marketcity", "Seasons Mall", "vanice mall"],
        // NOTE: aapne 'pune' bola—agar exact mall fix ho, yahan options/correct ko update kar dena
        correctAnswer: "vanice mall",
    },
    {
        id: 5,
        type: "mcq",
        label: "Mera go-to coffee order kya hota hai? ☕️💫",
        options: ["Cappuccino", "Latte", "Cold Coffee", "Mocha"],
        correctAnswer: "cappuccino",
    },

    {
        id: 7,
        type: "mcq",
        label: "Dream trip pe hum kahan jayenge? ✈️",
        options: ["Germany", "Paris", "Bali", "Switzerland"],
        correctAnswer: "germany",
    },
    {
        id: 8,
        type: "mcq",
        label: "Saath me pehli movie kaunsi dekhi thi? 🎬",
        options: ["How to train a dragon", "YJHD", "Inception", "3 Idiots"],
        correctAnswer: "how to train a dragon",
    },
    {
        id: 9,
        type: "mcq",
        label: "Main tumhe pyaar se kya bulata hoon? 🥰",
        options: ["Sweetheart", "Jaan", "Baby", "Cutu"],
        correctAnswer: "jaan",
    },
];

/* 🎨 Refined Palette */
const PALETTE = {
    bg1: "#0A0F1F",
    bg2: "#121832",
    primary: "#7C7BFF",
    accent: "#2EE6C5",
    glow: "#A78BFA",
    soft: "#F5F7FB",
};

/* Elegant glass panel */
const NEO: React.CSSProperties = {
    borderRadius: "20px",
    background: `linear-gradient(225deg, ${PALETTE.bg1} 0%, ${PALETTE.bg2} 100%)`,
    boxShadow:
        "0 10px 40px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 1px rgba(255,255,255,.06)",
};

/* ---------- Helpers & Memory ---------- */
type MediaItem = {
    id: string;
    url: string;
    displayUrl: string;
    type: "image" | "video";
    thumb?: string;
    name?: string;
    size?: number;
    created?: number;
    reaction?: "like" | "dislike" | null;
    webContentLink?: string;
};

function computeTotals(items: MediaItem[]) {
    const likes = items.filter((p) => p.reaction === "like").length;
    const dislikes = items.filter((p) => p.reaction === "dislike").length;
    return { likes, dislikes };
}
function toggleReaction(current: MediaItem, next: MediaItem["reaction"]) {
    return { ...current, reaction: next };
}

const STORAGE_KEY = "ss_media_reactions_v2"; // v2: save by id not url
const toSavable = (items: MediaItem[]) =>
    items.map((p) => ({ id: p.id, reaction: p.reaction ?? null }));
const saveToStorage = (items: MediaItem[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSavable(items)));
    } catch {
        // ignore storage write errors
    }
};
const loadFromStorage = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch {
        // ignore storage read/parse errors
        return [];
    }
};
const mergeSeedWithSaved = (seed: string[], saved: any[]) => {
    const map = new Map(saved.map((s: any) => [s.id, s.reaction ?? null]));
    return seed.map((u, i) => ({
        id: `seed-${i}`,
        url: u,
        type: "image" as const,
        displayUrl: u,
        reaction: map.get(`seed-${i}`) ?? null,
    }));
};

const driveThumbUrl = (fileId: string) =>
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;

/* Prefer the provided name when downloading */
const fileDownloadName = (item: MediaItem) => item?.name || `${item?.id || "media"}`;

/* ---------- Sorting ---------- */
const SORTS = [
    { key: "photosFirst", label: "Photos → Videos" },
    { key: "videosFirst", label: "Videos → Photos" },
    { key: "sizeDesc", label: "Size ⬇︎" },
    { key: "sizeAsc", label: "Size ⬆︎" },
    { key: "dateDesc", label: "Newest" },
    { key: "dateAsc", label: "Oldest" },
    { key: "nameAsc", label: "A → Z" },
    { key: "nameDesc", label: "Z → A" },
] as const;

function sortByMode(list: MediaItem[], mode: (typeof SORTS)[number]["key"]) {
    const arr = list.slice();
    const byName = (a: MediaItem, b: MediaItem) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
            numeric: true,
            sensitivity: "base",
        });
    const typeRank = (t: MediaItem["type"]) => (t === "image" ? 0 : 1);

    switch (mode) {
        case "videosFirst":
            arr.sort((a, b) => {
                const ra = typeRank(a.type) ? 0 : 1; // swap
                const rb = typeRank(b.type) ? 0 : 1;
                if (ra !== rb) return ra - rb;
                return Number(b.size || 0) - Number(a.size || 0) || byName(a, b);
            });
            break;
        case "sizeDesc":
            arr.sort((a, b) => Number(b.size || 0) - Number(a.size || 0) || byName(a, b));
            break;
        case "sizeAsc":
            arr.sort((a, b) => Number(a.size || 0) - Number(b.size || 0) || byName(a, b));
            break;
        case "dateDesc":
            arr.sort(
                (a, b) => Number(b.created || 0) - Number(a.created || 0) || byName(a, b)
            );
            break;
        case "dateAsc":
            arr.sort(
                (a, b) => Number(a.created || 0) - Number(b.created || 0) || byName(a, b)
            );
            break;
        case "nameAsc":
            arr.sort(byName);
            break;
        case "nameDesc":
            arr.sort((a, b) => byName(b, a));
            break;
        case "photosFirst":
        default:
            arr.sort((a, b) => {
                const ra = typeRank(a.type);
                const rb = typeRank(b.type);
                if (ra !== rb) return ra - rb;
                return Number(b.size || 0) - Number(a.size || 0) || byName(a, b);
            });
    }
    return arr;
}

/* ---------- Global styles ---------- */
function GlobalStyles() {
    return (
        <style>{`
      :root{
        --bg1:${PALETTE.bg1};
        --bg2:${PALETTE.bg2};
        --primary:${PALETTE.primary};
        --accent:${PALETTE.accent};
        --ring: 0 0 0 3px rgba(124,123,255,.35);
      }

      html,body{scroll-behavior:smooth}

      .focus-ring:focus{outline:none; box-shadow: var(--ring)}

      .icon-like, .icon-dislike{
        width:44px;height:44px;border-radius:9999px;display:flex;align-items:center;justify-content:center;
        border:1px solid rgba(255,255,255,.18); cursor:pointer; user-select:none; transition:transform .18s ease, border-color .18s ease, background-color .18s ease, box-shadow .18s ease;
        background:rgba(255,255,255,.06);
        backdrop-filter:saturate(140%) blur(6px);
      }
      @media (min-width:640px){ .icon-like, .icon-dislike{ width:48px;height:48px; } }
      .icon-like svg, .icon-dislike svg{opacity:.9}
      .icon-like.active{ background:rgba(124,123,255,.18); border-color:rgba(124,123,255,.45) }
      .icon-dislike.active{ background:rgba(46,230,197,.18); border-color:rgba(46,230,197,.45) }
      .icon-like:hover, .icon-dislike:hover{ transform:translateY(-1px) scale(1.03) }

      .skeleton{position:relative;overflow:hidden;border-radius:16px;background:linear-gradient(135deg, #0b1026 0%, #1e1b4b 100%)}
      .skeleton::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.10),transparent);transform:translateX(-100%);animation:shimmer 1.25s infinite}
      @keyframes shimmer{100%{transform:translateX(100%)}}

      .panel{border-radius:20px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));backdrop-filter:saturate(140%) blur(8px)}

      .bottom-bar{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center;padding:10px 0;background:linear-gradient(180deg,transparent,rgba(0,0,0,.45))}

      .chip{padding:8px 12px;border-radius:9999px;font-size:12px;border:1px solid rgba(255,255,255,.10);cursor:pointer;white-space:nowrap;background:rgba(255,255,255,.04);color:#e8e8ff}
      .chip.active{background:var(--primary);color:#fff;border-color:transparent}
      .chip:hover{background:rgba(255,255,255,.10)}
      .sortbar{display:flex;gap:8px;flex-wrap:nowrap;overflow:auto;padding:4px 2px}
      .sortbar::-webkit-scrollbar{display:none}

      .btn{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);color:#fff;border-radius:12px;padding:10px 14px;font-weight:600}
      .btn:hover{background:rgba(255,255,255,.08)}
      .btn.primary{background:var(--primary);border-color:transparent}
      .btn.ghost{background:rgba(255,255,255,.06)}

      .field-card{border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.04);border-radius:14px;padding:12px}
      .field-card.selected{border-color:rgba(124,123,255,.55); box-shadow: var(--ring)}
    `}</style>
    );
}

/* ---------- Lazy hook ---------- */
function useInView(options?: IntersectionObserverInit) {
    const [inView, setInView] = React.useState(false);
    const ref = React.useRef<HTMLDivElement | null>(null);
    React.useEffect(() => {
        if (!ref.current) return;
        const io = new IntersectionObserver(
            ([e]) => setInView(e.isIntersecting),
            options || { rootMargin: "800px" }
        );
        io.observe(ref.current);
        return () => io.disconnect();
    }, [options]);
    return [ref, inView] as const;
}

/* ---------- Simple retry with jitter ---------- */
async function fetchWithRetry(url: string, opts: RequestInit = {}, tries = 4) {
    let lastErr: unknown;
    for (let i = 0; i < tries; i++) {
        try {
            const res = await fetch(url, opts);
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return await res.json();
        } catch (e) {
            lastErr = e;
            const backoff = Math.min(1200 * 2 ** i, 5000) + Math.random() * 350;
            await new Promise((r) => setTimeout(r, backoff));
        }
    }
    throw (lastErr as any) || new Error("Network error");
}

/* ---------- UI ---------- */
function Navbar() {
    return (
        <nav
            className="sticky top-0 z-20 w-full border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-transparent"
            style={{
                background: `linear-gradient(180deg, ${PALETTE.bg1} 0%, ${PALETTE.bg2} 100%)`,
            }}
        >
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden>
                        ✨
                    </span>
                    <h1 className="text-base sm:text-lg md:text-xl font-semibold text-white tracking-wide">
                        For My Special One
                    </h1>
                </div>

                {/* Existing Start anchor preserved */}
                <div className="flex items-center gap-2">
                    <a href="#quiz" className="btn focus-ring" style={{ padding: "8px 14px" }}>
                        Start
                    </a>
                </div>
            </div>
        </nav>
    );
}

function Modal({
    open,
    onClose,
    onYes,
}: {
    open: boolean;
    onClose: () => void;
    onYes: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
            <div
                className="absolute inset-0"
                style={{ background: "rgba(0,0,0,0.55)" }}
                onClick={onClose}
            />
            <div className="relative z-10 w-[92%] max-w-md panel shadow-2xl">
                <div className="p-6 text-center">
                    <h3 className="text-xl font-semibold text-white">Ready for a surprise?</h3>
                    <p className="mt-2 text-white/90">Kuch pyaara sa wait kar raha hai ✨</p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <button onClick={onYes} className="btn primary focus-ring">Yes ✨</button>
                        <button onClick={onClose} className="btn ghost focus-ring">No 😏</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------- Reaction bar ---------- */
function ReactionBar({
    item,
    onReact,
}: {
    item: MediaItem;
    onReact: (item: MediaItem, reaction: MediaItem["reaction"]) => void;
}) {
    const likeActive = item.reaction === "like";
    const dislikeActive = item.reaction === "dislike";
    return (
        <div className="mt-2 sm:mt-3 flex items-center gap-3 justify-center">
            <button
                className={`icon-like ${likeActive ? "active" : ""}`}
                aria-label="Like"
                title="Like"
                onClick={(e) => {
                    e.stopPropagation();
                    onReact(item, likeActive ? null : "like");
                }}
            >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path fill="none" d="M0 0H24V24H0z" />
                    <path d="M16.5 3C19.538 3 22 5.5 22 9c0 7-7.5 11-10 12.5C9.5 20 2 16 2 9c0-3.5 2.5-6 5.5-6C9.36 3 11 4 12 5c1-1 2.64-2 4.5-2z" />
                </svg>
            </button>
            <button
                className={`icon-dislike ${dislikeActive ? "active" : ""}`}
                aria-label="Dislike"
                title="Dislike"
                onClick={(e) => {
                    e.stopPropagation();
                    onReact(item, dislikeActive ? null : "dislike");
                }}
            >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path fill="none" d="M0 0h24v24H0z" />
                    <path d="M15 3h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-4V3zm-2 0v12.5a2.5 2.5 0 1 1-5 0V13H4a1 1 0 0 1-.894-1.447l3-6A1 1 0 0 1 7 5h6z" />
                </svg>
            </button>
        </div>
    );
}

/* ---------- Question Field (MCQ/Text) ---------- */
function QuestionField({
    q,
    value,
    onChange,
    error,
}: {
    q: any;
    value: string;
    onChange: (id: number, value: string) => void;
    error: boolean;
}) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-white/90">{q.label}</label>

            {q.type === "mcq" && Array.isArray(q.options) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt: string) => {
                        const selected = (value || "") === opt;
                        return (
                            <label
                                key={opt}
                                className={`field-card focus-ring cursor-pointer ${selected ? "selected" : ""}`}
                                onClick={() => onChange(q.id, opt)}
                            >
                                <input
                                    type="radio"
                                    name={`q-${q.id}`}
                                    value={opt}
                                    checked={selected}
                                    onChange={() => onChange(q.id, opt)}
                                    className="hidden"
                                />
                                {opt}
                            </label>
                        );
                    })}
                </div>
            ) : (
                <input
                    type="text"
                    value={value || ""}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="w-full rounded-xl px-4 py-3 focus-ring text-white/90"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,.12)" }}
                />
            )}

            {error && <p className="text-sm" style={{ color: PALETTE.accent }}>Oops, sahi option choose karo ✨</p>}
        </div>
    );
}

/* ---------- Media Card ---------- */
function MediaCard({
    item,
    onReact,
    onOpen,
    onHover,
    onDownload,
}: {
    item: MediaItem;
    onReact: (itm: MediaItem, r: MediaItem["reaction"]) => void;
    onOpen: () => void;
    onHover?: () => void;
    onDownload: () => void;
}) {
    const [shape, setShape] = useState<"square" | "landscape" | "portrait">("square");
    const [loaded, setLoaded] = useState(false);
    const [ref, inView] = useInView({ rootMargin: "400px" });

    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const [playing, setPlaying] = useState(true);
    const [useIframe, setUseIframe] = useState(false);

    const aspectClass =
        shape === "landscape"
            ? "aspect-[16/10]"
            : shape === "portrait"
                ? "aspect-[3/4]"
                : "aspect-square";

    // ✅ Preload + autoplay when visible (muted for autoplay policies)
    useEffect(() => {
        if (!videoRef.current || useIframe) return;
        const v = videoRef.current;

        if (inView) {
            v.muted = true;
            v.load(); // preload when visible
            const p = v.play();
            if (p && typeof (p as any).catch === "function") {
                (p as any).catch(() => {
                    /* ignore autoplay errors */
                });
            }
            setPlaying(true);
        } else {
            v.pause();
            setPlaying(false);
        }
    }, [inView, useIframe]);

    return (
        <div ref={ref} className="group relative" onMouseEnter={onHover}>
            <div className={`relative overflow-hidden ${aspectClass}`} style={NEO}>
                <div className="relative w-full h-full rounded-[16px] bg-black/30 shadow-inner">
                    {/* Download btn */}
                    <button
                        onClick={onDownload}
                        className="absolute top-3 left-3 z-10 btn focus-ring"
                        aria-label="Save"
                        title="Save"
                        style={{ padding: "6px 10px" }}
                    >
                        ⬇︎ Save
                    </button>

                    {/* Lazy load */}
                    {!inView && <div className="skeleton w-full h-full" />}
                    {inView && (
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={onOpen}
                            className="outline-none rounded-[16px] w-full h-full"
                        >
                            {item.type === "video" ? (
                                <div className="w-full h-full relative">
                                    {useIframe ? (
                                        <iframe
                                            src={`https://drive.google.com/file/d/${item.id}/preview`}
                                            allow="autoplay; fullscreen"
                                            allowFullScreen
                                            title={item.name || "Drive preview"}
                                            className="absolute inset-0 w-full h-full"
                                            style={{ border: 0 }}
                                        />
                                    ) : (
                                        <>
                                            <video
                                                ref={videoRef}
                                                src={item.url}
                                                poster={item.displayUrl}
                                                muted
                                                loop
                                                playsInline
                                                preload="metadata"
                                                className="w-full h-full object-cover rounded-[16px]"
                                                onLoadedMetadata={(e) => {
                                                    const v = e.currentTarget;
                                                    const r = (v.videoWidth || 1) / (v.videoHeight || 1);
                                                    setShape(r > 1.15 ? "landscape" : r < 0.85 ? "portrait" : "square");
                                                }}
                                                onCanPlay={() => setLoaded(true)}
                                                onError={() => setUseIframe(true)}
                                            />
                                            {!loaded && <div className="skeleton absolute inset-0" />}
                                            {/* Bottom controls */}
                                            <div className="bottom-bar">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const v = videoRef.current;
                                                        if (!v) return;
                                                        if (playing) {
                                                            v.pause();
                                                            setPlaying(false);
                                                        } else {
                                                            v.play().catch(() => {
                                                                /* ignore play errors */
                                                            });
                                                            setPlaying(true);
                                                        }
                                                    }}
                                                    className="btn focus-ring"
                                                    aria-label={playing ? "Pause" : "Play"}
                                                >
                                                    {playing ? "⏸" : "▶️"}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <img
                                    src={item.displayUrl}
                                    alt={item.name || "Memory"}
                                    loading="lazy"
                                    decoding="async"
                                    onLoad={(e) => {
                                        const im = e.currentTarget as HTMLImageElement;
                                        const r = (im.naturalWidth || 1) / (im.naturalHeight || 1);
                                        setShape(r > 1.15 ? "landscape" : r < 0.85 ? "portrait" : "square");
                                        setLoaded(true);
                                    }}
                                    className={`w-full h-full object-cover rounded-[16px] ${loaded ? "" : "opacity-0"}`}
                                />
                            )}
                            {!loaded && item.type === "image" && <div className="skeleton absolute inset-0" />}
                        </div>
                    )}
                </div>
            </div>

            {/* 👍👎 Reaction bar */}
            <ReactionBar item={item} onReact={onReact} />
        </div>
    );
}

/* ---------- Media Grid ---------- */
function MediaGrid({
    items,
    onReact,
    onOpenAt,
    onHoverAt,
    onDownload,
}: {
    items: MediaItem[];
    onReact: (itm: MediaItem, r: MediaItem["reaction"]) => void;
    onOpenAt: (i: number) => void;
    onHoverAt?: (i: number) => void;
    onDownload: (item: MediaItem) => void;
}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 p-4">
            {items.map((item, i) => (
                <MediaCard
                    key={item.id}
                    item={item}
                    onReact={(itm, reaction) => onReact(itm, reaction)}
                    onOpen={() => onOpenAt(i)}
                    onHover={() => onHoverAt?.(i)}
                    onDownload={() => onDownload(item)}
                />
            ))}
        </div>
    );
}

/* ---------- Lightbox ---------- */
function MediaLightbox({
    open,
    items,
    index,
    onClose,
    onPrev,
    onNext,
    onReact,
    onDownload,
}: {
    open: boolean;
    items: MediaItem[];
    index: number;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
    onReact: (item: MediaItem, r: MediaItem["reaction"]) => void;
    onDownload: (item: MediaItem) => void;
}) {
    if (!open || !items.length) return null;
    const p = items[index];
    const iframeSrc = `https://drive.google.com/file/d/${p.id}/preview`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0" onClick={onClose} style={{ background: "rgba(0,0,0,0.6)" }} />
            <div className="relative z-10 w-[96vw] max-w-6xl h-[92vh] p-3" style={NEO}>
                <div
                    className="relative w-full h-full rounded-[16px] overflow-hidden panel"
                    style={{
                        background: `linear-gradient(180deg, ${PALETTE.bg1}, ${PALETTE.bg2})`,
                    }}
                >
                    <div className="absolute top-3 right-3 flex gap-2">
                        <button onClick={() => onDownload(p)} className="btn focus-ring" aria-label="Download">
                            ⬇︎
                        </button>
                        <button onClick={onClose} className="btn primary focus-ring" aria-label="Close">
                            Close
                        </button>
                    </div>

                    {p.type === "video" ? (
                        <iframe
                            src={iframeSrc}
                            allow="autoplay; fullscreen"
                            allowFullScreen
                            title={p.name || "Drive preview"}
                            className="absolute inset-0 w-full h-full"
                            style={{ border: 0 }}
                        />
                    ) : (
                        <img
                            src={`https://www.googleapis.com/drive/v3/files/${p.id}?alt=media&key=${GOOGLE_API_KEY}`}
                            onError={(e) => {
                                const img = e.currentTarget as HTMLImageElement;
                                if (p.displayUrl && img.src !== p.displayUrl) img.src = p.displayUrl;
                                else img.src = driveThumbUrl(p.id);
                            }}
                            alt={p.name || "Full"}
                            className="absolute inset-0 m-auto object-contain"
                            style={{ maxHeight: "100%", maxWidth: "100%" }}
                        />
                    )}

                    <div className="absolute bottom-4 inset-x-0 mx-auto flex flex-wrap items-center justify-center gap-3 px-2">
                        <button onClick={onPrev} className="btn focus-ring" aria-label="Previous">
                            ←
                        </button>
                        <button
                            onClick={() => onReact(p, p.reaction === "like" ? null : "like")}
                            className={`icon-like ${p.reaction === "like" ? "active" : ""}`}
                            aria-label="Like"
                            title="Like"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                                <path fill="none" d="M0 0H24V24H0z" />
                                <path d="M16.5 3C19.538 3 22 5.5 22 9c0 7-7.5 11-10 12.5C9.5 20 2 16 2 9c0-3.5 2.5-6 5.5-6C9.36 3 11 4 12 5c1-1 2.64-2 4.5-2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => onReact(p, p.reaction === "dislike" ? null : "dislike")}
                            className={`icon-dislike ${p.reaction === "dislike" ? "active" : ""}`}
                            aria-label="Dislike"
                            title="Dislike"
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                                <path fill="none" d="M0 0h24v24H0z" />
                                <path d="M15 3h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-4V3zm-2 0v12.5a2.5 2.5 0 1 1-5 0V13H4a1 1 0 0 1-.894-1.447l3-6A1 1 0 0 1 7 5h6z" />
                            </svg>
                        </button>
                        <button onClick={onNext} className="btn focus-ring" aria-label="Next">
                            →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================
   App
   ========================= */
export default function LoveGalleryApp() {
    // Quiz
    const [answers, setAnswers] = useState<Record<number, string>>(() =>
        Object.fromEntries(QUESTIONS.map((q) => [q.id, ""])) as Record<number, string>
    );
    const [errors, setErrors] = useState<Record<number, boolean>>({});
    const [allCorrect, setAllCorrect] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showPhotos, setShowPhotos] = useState(false);
    const [showAttitude, setShowAttitude] = useState(false);

    // Media
    const [items, setItems] = useState<MediaItem[]>([]); // {id,url,displayUrl,type,thumb,name,size,created,reaction,webContentLink}
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Drive status
    const [driveStatus, setDriveStatus] = useState<"idle" | "loading" | "ok" | "error" | "skipped">("idle");
    const [driveCount, setDriveCount] = useState(0);
    const [lastDriveUrl, setLastDriveUrl] = useState("");
    const [lastError, setLastError] = useState("");

    // Sorting
    const [sortMode, setSortMode] = useState<(typeof SORTS)[number]["key"]>("photosFirst");

    // pointer glow
    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            document.documentElement.style.setProperty("--x", e.clientX + "px");
            document.documentElement.style.setProperty("--y", e.clientY + "px");
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
    }, []);

    const { likes: totalLikes, dislikes: totalDislikes } = useMemo(
        () => computeTotals(items),
        [items]
    );
    const onReact = (media: MediaItem, r: MediaItem["reaction"]) =>
        setItems((prev) => prev.map((p) => (p === media ? toggleReaction(p, r) : p)));

    const normalized = (s: string) => String(s || "").trim().toLowerCase();
    const handleChange = (id: number, value: string) => {
        setAnswers((a) => ({ ...a, [id]: value }));
        setErrors((e) => ({ ...e, [id]: false }));
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let ok = true;
        const nextErrors: Record<number, boolean> = {};
        for (const q of QUESTIONS) {
            const userAns = answers[q.id] || "";
            const isCorrect = normalized(userAns) === normalized(q.correctAnswer);
            if (!isCorrect) {
                ok = false;
                nextErrors[q.id] = true;
            }
        }
        setErrors(nextErrors);
        setAllCorrect(ok);
        if (ok) setShowModal(true);
    };
    const reset = () => {
        setAnswers(() => Object.fromEntries(QUESTIONS.map((q) => [q.id, ""])) as Record<number, string>);
        setErrors({});
        setAllCorrect(false);
        setShowPhotos(false);
        setShowAttitude(false);
        setShowModal(false);
    };

    // Build Drive list URL (unchanged functionality)
    const buildDriveListUrl = (pageToken = "") => {
        const q = `'${DRIVE_FOLDER_ID}' in parents and trashed=false and (mimeType contains 'image/' or mimeType contains 'video/')`;
        const params = new URLSearchParams({
            q,
            fields:
                "files(id,name,mimeType,thumbnailLink,webContentLink,size,createdTime),nextPageToken",
            key: GOOGLE_API_KEY,
            pageSize: "200",
            orderBy: "name_natural",
            supportsAllDrives: "true",
            includeItemsFromAllDrives: "true",
        });
        if (pageToken) params.append("pageToken", pageToken);
        if (DRIVE_SHARED && DRIVE_ID) {
            params.append("corpora", "drive");
            params.append("driveId", DRIVE_ID);
        }
        return `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
    };

    // Load media (unchanged logic)
    useEffect(() => {
        const controller = new AbortController();

        const load = async () => {
            if (!showPhotos || items.length) return;
            const saved = loadFromStorage();

            if (DRIVE_FOLDER_ID && GOOGLE_API_KEY) {
                try {
                    setDriveStatus("loading");
                    setLastError("");
                    let out: MediaItem[] = [];
                    let pageToken = "";
                    do {
                        const url = buildDriveListUrl(pageToken);
                        setLastDriveUrl(url);
                        const data = await fetchWithRetry(url, { signal: controller.signal } as any);
                        const files = (data.files || []) as any[];

                        out = out.concat(
                            files.map((f) => {
                                const mime = f.mimeType || "";
                                const isVideo = mime.startsWith("video/");
                                const full = `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media&key=${GOOGLE_API_KEY}`; // full/stream
                                const thumb = f.thumbnailLink
                                    ? f.thumbnailLink.replace(/=s\d+/, "=s1200")
                                    : driveThumbUrl(f.id); // fast grid
                                return {
                                    id: f.id,
                                    url: full,
                                    displayUrl: thumb,
                                    type: isVideo ? "video" : "image",
                                    thumb,
                                    name: f.name,
                                    size: Number(f.size || 0),
                                    created: Date.parse(f.createdTime || 0),
                                    reaction: null,
                                    webContentLink: f.webContentLink || "",
                                } as MediaItem;
                            })
                        );

                        pageToken = (data.nextPageToken as string) || "";
                    } while (pageToken);

                    if (out.length) {
                        const map = new Map(saved.map((s: any) => [s.id, s.reaction ?? null]));
                        out = out.map((o) => ({ ...o, reaction: map.get(o.id) ?? null }));
                        setItems(out);
                        setDriveCount(out.length);
                        setDriveStatus("ok");
                        return;
                    } else {
                        setDriveStatus("error");
                        setLastError("No files found. Is the folder public?");
                    }
                } catch (e: any) {
                    console.error(e);
                    setDriveStatus("error");
                    setLastError(String(e?.message || e));
                }
            } else {
                setDriveStatus("skipped");
            }

            setItems(mergeSeedWithSaved(PHOTO_URLS, saved) as any);
        };
        load();

        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPhotos, items.length]);

    // Persist reactions
    useEffect(() => {
        if (showPhotos) saveToStorage(items);
    }, [items, showPhotos]);

    // Keyboard controls
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                if (lightboxOpen) setLightboxOpen(false);
                else if (showPhotos && items.length) setLightboxOpen(true);
                return;
            }
            if (!lightboxOpen) return;
            if (e.key === "ArrowRight") {
                e.preventDefault();
                setCurrentIndex((i) => (i + 1) % items.length);
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setCurrentIndex((i) => (i - 1 + items.length) % items.length);
            } else if (e.key === "Escape") {
                e.preventDefault();
                setLightboxOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightboxOpen, showPhotos, items.length]);

    const downloadMedia = async (media: MediaItem) => {
        try {
            const LARGE = 50 * 1024 * 1024; // 50MB
            if ((media.size || 0) > LARGE && media.webContentLink) {
                window.open(media.webContentLink, "_blank");
                return;
            }
            const res = await fetch(media.url, { mode: "cors" });
            if (!res.ok) throw new Error("Download failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileDownloadName(media);
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            window.open(media.webContentLink || media.url, "_blank");
        }
    };

    // sorted view
    const displayItems = useMemo(() => sortByMode(items, sortMode), [items, sortMode]);

    const Content = useMemo(() => {
        if (showPhotos) {
            return (
                <div className="space-y-6">
                    {/* Totals */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="panel px-3 sm:px-4 py-1.5 sm:py-2 rounded-[25px] text-[12px] sm:text-[13px]">
                                👍 Likes: <span className="font-bold">{totalLikes}</span>
                            </div>
                            <div className="panel px-3 sm:px-4 py-1.5 sm:py-2 rounded-[25px] text-[12px] sm:text-[13px]">
                                👎 Dislikes: <span className="font-bold">{totalDislikes}</span>
                            </div>
                            <div className="panel px-3 sm:px-4 py-1.5 sm:py-2 rounded-[25px] text-[12px] sm:text-[13px]">
                                🖼️ Media: <span className="font-bold">{items.length}</span>
                            </div>
                        </div>
                        <div className="text-xs text-white/80">
                            {driveStatus === "loading" && "Loading from Drive…"}
                            {driveStatus === "ok" && `Loaded ${driveCount} from Drive`}
                            {driveStatus === "error" && (
                                <>
                                    Drive load failed — check sharing or API key{" "}
                                    {lastDriveUrl && (
                                        <a className="underline" href={lastDriveUrl} target="_blank" rel="noreferrer">
                                            (debug)
                                        </a>
                                    )}
                                    {lastError ? ` — ${lastError}` : null}
                                </>
                            )}
                            {driveStatus === "skipped" &&
                                (GOOGLE_API_KEY ? "Using static links" : "Add GOOGLE_API_KEY to env or use static links")}
                        </div>

                        {/* Sorting nav */}
                        <div className="w-full max-w-6xl">
                            <div className="sortbar">
                                {SORTS.map((s) => (
                                    <button
                                        key={s.key}
                                        className={`chip ${sortMode === s.key ? "active" : ""}`}
                                        onClick={() => setSortMode(s.key)}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Grid + Lightbox */}
                    <>
                        <MediaGrid
                            items={displayItems}
                            onReact={onReact}
                            onOpenAt={(i) => {
                                setCurrentIndex(i);
                                setLightboxOpen(true);
                            }}
                            onHoverAt={(i) => setCurrentIndex(i)}
                            onDownload={downloadMedia}
                        />
                        <MediaLightbox
                            open={lightboxOpen}
                            items={displayItems}
                            index={currentIndex}
                            onClose={() => setLightboxOpen(false)}
                            onPrev={() => setCurrentIndex((i) => (i - 1 + displayItems.length) % displayItems.length)}
                            onNext={() => setCurrentIndex((i) => (i + 1) % displayItems.length)}
                            onReact={onReact}
                            onDownload={downloadMedia}
                        />
                    </>
                </div>
            );
        }
        if (showAttitude) {
            return (
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <div className="text-[90px] sm:text-[120px] leading-none select-none" aria-hidden>
                        😎
                    </div>
                    <p className="text-white/90 text-sm sm:text-base">Acha ji, thoda attitude hai kya? Try again! 😉</p>
                    <button
                        onClick={() => {
                            setShowAttitude(false);
                        }}
                        className="btn ghost focus-ring"
                    >
                        Back
                    </button>
                </div>
            );
        }
        return null;
    }, [
        showPhotos,
        showAttitude,
        totalLikes,
        totalDislikes,
        items.length,
        driveStatus,
        driveCount,
        lastDriveUrl,
        displayItems,
        onReact,
        lightboxOpen,
        currentIndex,
        sortMode,
        lastError,
    ]);

    return (
        <div
            className="min-h-screen font-sans text-neutral-100"
            style={{
                background: `radial-gradient(1200px 700px at var(--x, 50%) var(--y, 30%), rgba(124,123,255,.12), transparent 60%), linear-gradient(180deg, ${PALETTE.bg1} 0%, ${PALETTE.bg2} 60%, ${PALETTE.bg2} 100%)`,
            }}
        >
            <GlobalStyles />
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
                <section className="text-center space-y-3">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">Hi, My Love 💖</h2>
                    <p className="text-white/90 max-w-2xl mx-auto text-sm sm:text-base">
                        In cute questions ka sahi jawab do… aur phir magic! ✨
                    </p>
                </section>

                {/* Quiz */}
                {!showPhotos && !showAttitude && (
                    <section id="quiz" className="mt-6 sm:mt-8">
                        <form onSubmit={handleSubmit} className="panel p-4 sm:p-6 md:p-8 shadow-2xl space-y-5">
                            {QUESTIONS.map((q) => (
                                <QuestionField
                                    key={q.id}
                                    q={q}
                                    value={answers[q.id]}
                                    onChange={handleChange}
                                    error={!!errors[q.id]}
                                />
                            ))}

                            <div className="pt-1 flex items-center justify-between">
                                <button type="button" onClick={reset} className="btn ghost focus-ring">
                                    Reset
                                </button>
                                <button type="submit" className="btn primary focus-ring">
                                    Check Answers
                                </button>
                            </div>

                            {allCorrect && (
                                <p className="pt-2 text-center font-medium" style={{ color: PALETTE.accent }}>
                                    All correct! Tap to continue ↓
                                </p>
                            )}
                        </form>
                    </section>
                )}

                {Content}
            </main>

            {/* Modal controls what to show next */}
            <Modal
                open={showModal}
                onClose={() => {
                    setShowModal(false);
                    setShowAttitude(true);
                }}
                onYes={() => {
                    setShowModal(false);
                    setShowPhotos(true);
                }}
            />

            <footer className="mt-10 pb-8 text-center text-xs text-white/70">Made with ❤️ by You</footer>
        </div>
    );
}
