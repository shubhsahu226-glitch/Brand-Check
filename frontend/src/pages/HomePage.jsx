import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  CheckSquare,
  BookOpen,
  Check,
  Clock,
  Award,
  Loader2,
  Shield,
  Layers,
  Palette,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_SAMPLES = {
  email: {
    title: 'Product Announcement Email',
    type: 'Email Newsletter',
    scoreInitial: 86,
    scoreFixed: 100,
    finding: {
      original: 'Our software is 100% completely error-free and guaranteed.',
      highlight: '100% completely error-free and guaranteed',
      suggestion: 'engineered for high reliability with 99.9% uptime',
      rule: 'Rule #14: Avoid absolute claims (e.g. 100% bug-free). Use verified data points.',
      explanation:
        'Brand guideline prohibits unsubstantiated absolute marketing claims. Use measured, factual performance metrics.',
    },
    bodyBefore:
      'We are thrilled to unveil our new cloud engine. It represents the pinnacle of modern architecture. ',
    bodyAfter:
      ' Customers can deploy in seconds without worrying about sudden outages or scaling bottlenecks.',
  },
  social: {
    title: 'LinkedIn Launch Post',
    type: 'Social Post',
    scoreInitial: 82,
    scoreFixed: 100,
    finding: {
      original: 'Hurry up and buy our product right now before price doubles!',
      highlight: 'Hurry up and buy our product right now',
      suggestion: 'Explore how top teams are streamlining their workflow today',
      rule: 'Rule #03: Maintain a consultative, empowering tone rather than aggressive sales pressure.',
      explanation:
        'Tone mismatch: Our brand voice is supportive and authoritative, avoiding high-pressure consumer sales tactics.',
    },
    bodyBefore:
      'Scaling brand consistency across distributed marketing teams is a real challenge. ',
    bodyAfter:
      ' Join our early preview community to see how governance and speed come together.',
  },
  press: {
    title: 'Press Release Teaser',
    type: 'PR Draft',
    scoreInitial: 89,
    scoreFixed: 100,
    finding: {
      original: 'BrandCheck is the cheap solution for all copywriters.',
      highlight: 'cheap solution',
      suggestion: 'cost-effective enterprise solution',
      rule: 'Rule #08: Refer to our pricing model as value-driven or accessible, never "cheap".',
      explanation:
        'Brand positioning guideline: "cheap" undermines enterprise perception. Use "cost-effective" or "accessible".',
    },
    bodyBefore:
      'Today BrandCheck announced the release of its workspace governance engine. Designed for modern creative organizations, ',
    bodyAfter:
      ' it establishes guardrails that respect creator agency while protecting brand integrity.',
  },
};

const ROLES_INFO = {
  CREATOR: {
    title: 'For Content Creators',
    icon: FileText,
    badgeColor: 'border border-emerald-300 bg-emerald-100 text-emerald-900',
    description:
      'Draft content freely. BrandCheck acts as your smart second reader, flagging tone inconsistencies and unverified claims before you submit for review.',
    highlights: [
      'Instant brand guideline feedback in real time',
      'Explainable suggestions mapped to actual brand rules',
      'No silent rewrites — you retain full creative authorship',
      'One-click draft submission to workspace reviewers',
    ],
    previewStatus: 'Draft Ready for Review',
    previewAction: 'Submit to Queue',
  },
  REVIEWER: {
    title: 'For Brand Reviewers',
    icon: CheckSquare,
    badgeColor: 'border border-amber-300 bg-amber-100 text-amber-900',
    description:
      'Review pending drafts with full contextual confidence. See exact rule citations, verified facts, and AI-assisted diffs in an organized review queue.',
    highlights: [
      'Centralized workspace review queue',
      'Visual side-by-side guideline comparison',
      'Inline suggestions, custom feedback, or one-click approval',
      'Full audit trail of every review decision',
    ],
    previewStatus: '2 Pending Drafts in Queue',
    previewAction: 'Approve & Finalize',
  },
  ADMIN: {
    title: 'For Workspace Admins',
    icon: Users,
    badgeColor: 'border border-[#d4ff32]/40 bg-[#0f140f] text-[#d4ff32]',
    description:
      'Centralize your brand identity. Upload tone of voice manuals, approved facts, and invite creators and reviewers with strict workspace data isolation.',
    highlights: [
      'Role-based access control (Admin, Creator, Reviewer)',
      'Secure 7-day tokenized team invitations',
      'Multi-tenant workspace isolation at the database level',
      'Knowledge base and compliance audit controls',
    ],
    previewStatus: 'Workspace Configured & Active',
    previewAction: 'Manage Permissions',
  },
};

export default function HomePage() {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('email');
  const [suggestionAccepted, setSuggestionAccepted] = useState(false);
  const [activeRole, setActiveRole] = useState('CREATOR');
  const [loadingRole, setLoadingRole] = useState(null);
  const [activePaletteTab, setActivePaletteTab] = useState('rules');

  const handleDemoLogin = async (role) => {
    if (loadingRole) return;
    setLoadingRole(role);
    try {
      const res = await demoLogin(role);
      if (res.success) {
        navigate('/dashboard');
      }
    } finally {
      setLoadingRole(null);
    }
  };

  const currentSample = DEMO_SAMPLES[activeTab];
  const roleData = ROLES_INFO[activeRole];
  const RoleIcon = roleData.icon;

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSuggestionAccepted(false);
  };

  return (
    <div className="relative mx-auto max-w-6xl space-y-16 pt-0 pb-16 sm:pt-1">
      {/* Subtle Background Perspective Grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-24 left-1/2 h-[700px] w-[1300px] -translate-x-1/2 bg-grid-isometric opacity-60 bg-radial-fade [transform:perspective(1000px)_rotateX(60deg)]"
          aria-hidden="true"
        />
        <div
          className="absolute -top-20 left-1/4 h-80 w-80 rounded-full bg-[#d4ff32]/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute top-[400px] -right-20 h-96 w-96 rounded-full bg-[#d8e6db]/40 blur-3xl"
          aria-hidden="true"
        />
      </div>

      {/* ========================================================
          HERO SECTION (High-Contrast Editorial + 3D Cluster)
          ======================================================== */}
      <section className="relative pt-1 sm:pt-2">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left Column: Exact Headline, Overline & Action Buttons */}
          <div className="text-left lg:col-span-6">
            {/* Overline Text */}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#d4ff32] ring-2 ring-[#0f140f] animate-pulse shrink-0" />
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#555d55]">
                BRANDCHECK • POLISHED BEFORE PUBLISHED
              </p>
            </div>

            {/* Main Headline (Exact 4 lines and font style) */}
            <h1 className="mt-3.5 text-5xl font-black tracking-[-0.035em] text-[#151c15] leading-[0.98] sm:text-6xl lg:text-[72px]">
              Keep the<br />
              character.<br />
              Check the<br />
              content.
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#555d55] sm:text-base">
              Check content against your approved guidelines. Understand every finding. Keep every final decision in human hands.
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  const el = document.getElementById('demo-studio');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else navigate('/signup');
                }}
                className="inline-flex items-center justify-center rounded-full bg-[#d8f45a] px-8 py-3.5 text-sm font-bold text-[#151c15] shadow-xs transition hover:bg-[#cbf03f] active:scale-[0.98]"
              >
                Open working demo
              </button>
              <a
                href="#approach"
                className="inline-flex items-center justify-center rounded-full border border-[#151c15]/60 bg-transparent px-8 py-3.5 text-sm font-bold text-[#151c15] shadow-xs transition hover:bg-[#151c15]/5 active:scale-[0.98]"
              >
                Our approach
              </a>
            </div>
          </div>

          {/* Right Column: 3D Visual Cluster (Exact 1:1 replica of screenshot) */}
          <div className="relative lg:col-span-6">
            <div className="relative mx-auto w-full max-w-[540px]">
              {/* Outer Light Green Rounded Backdrop Box */}
              <div className="relative rounded-[38px] bg-gradient-to-br from-[#dcf5cb]/85 via-[#e8f8da]/75 to-[#f3fbf0]/65 p-6 sm:p-8 shadow-[0_20px_50px_rgba(180,210,160,0.3)] border border-[#d2ecbe]/80">
                {/* Floating 3D Lime Glossy Sphere (Top Right) */}
                <div
                  className="absolute -top-7 -right-7 z-30 h-24 w-24 sm:h-28 sm:w-28 animate-float pointer-events-none"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_20px_28px_rgba(50,75,10,0.4)]">
                    <defs>
                      <radialGradient id="limeSphere" cx="30%" cy="28%" r="70%" fx="25%" fy="23%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                        <stop offset="12%" stopColor="#f5ff98" />
                        <stop offset="38%" stopColor="#c7f42d" />
                        <stop offset="68%" stopColor="#7ba812" />
                        <stop offset="92%" stopColor="#304406" />
                        <stop offset="100%" stopColor="#1a2702" />
                      </radialGradient>
                    </defs>
                    <circle cx="50" cy="50" r="48" fill="url(#limeSphere)" />
                  </svg>
                </div>

                {/* Top Card: "01 / THE WORDS MATTER" */}
                <div className="relative z-10 rounded-2xl bg-white p-5 sm:p-6 shadow-[0_14px_35px_rgba(0,0,0,0.06)] border border-slate-100/90">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#717a71]">
                    01 / THE WORDS MATTER
                  </p>
                  <h3 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-[#151c15]">
                    “The only solution you'll need.”
                  </h3>
                  <div className="mt-3.5 flex items-center gap-2 text-xs font-semibold text-[#5a625a]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f07153] shrink-0" />
                    <span>Absolute claim · human review needed</span>
                  </div>
                </div>

                {/* Bottom Row of Overlapping Tilted Cards */}
                <div className="mt-4 flex items-end justify-between gap-4">
                  {/* Card A: Left Dark "Aa" Card (Tilted -5deg) */}
                  <div className="relative z-10 w-44 sm:w-48 shrink-0 -rotate-[5deg] rounded-2xl bg-[#151e16] p-5 shadow-[0_20px_45px_rgba(0,0,0,0.32)] border border-[#232e24] transition duration-300 hover:rotate-0">
                    <div className="text-5xl sm:text-6xl font-black tracking-tight text-[#d4ff32] leading-none">
                      Aa
                    </div>
                    <p className="mt-4 text-xs font-bold text-white/95">
                      Distinctly you.
                    </p>
                  </div>

                  {/* Card B: Right White "BRAND DNA" Card (Tilted +4deg) */}
                  <div className="relative z-10 flex-1 rotate-[4deg] rounded-2xl bg-white p-5 shadow-[0_16px_36px_rgba(0,0,0,0.08)] border border-slate-100/90 transition duration-300 hover:rotate-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#717a71]">
                      BRAND DNA
                    </p>
                    <div className="mt-3 flex items-center gap-2.5">
                      <div className="h-16 sm:h-20 w-10 sm:w-12 rounded-2xl bg-[#151e16] shadow-inner" />
                      <div className="h-16 sm:h-20 w-10 sm:w-12 rounded-2xl bg-[#d8f45a] shadow-inner" />
                      <div className="h-16 sm:h-20 w-10 sm:w-12 rounded-2xl bg-[#f07153] shadow-inner" />
                    </div>
                  </div>
                </div>

                {/* Floating 3D Deep Forest Green Sphere (Bottom Left) */}
                <div
                  className="absolute -bottom-6 -left-6 z-20 h-18 w-18 sm:h-20 sm:w-20 animate-float-delayed pointer-events-none"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_18px_25px_rgba(5,20,12,0.6)]">
                    <defs>
                      <radialGradient id="pineSphere" cx="30%" cy="28%" r="70%" fx="25%" fy="23%">
                        <stop offset="0%" stopColor="#7be0aa" stopOpacity="0.9" />
                        <stop offset="15%" stopColor="#43956b" />
                        <stop offset="42%" stopColor="#1e583b" />
                        <stop offset="72%" stopColor="#0d2e1e" />
                        <stop offset="94%" stopColor="#05150d" />
                        <stop offset="100%" stopColor="#020905" />
                      </radialGradient>
                    </defs>
                    <circle cx="50" cy="50" r="48" fill="url(#pineSphere)" />
                  </svg>
                </div>

                {/* Floating 3D Terracotta Coral Torus (Bottom Right) */}
                <div
                  className="absolute -bottom-7 -right-4 z-20 h-20 w-24 sm:h-24 sm:w-28 animate-float-subtle pointer-events-none"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 120 90" className="w-full h-full drop-shadow-[0_16px_25px_rgba(160,50,20,0.5)]">
                    <defs>
                      <linearGradient id="torusTop" x1="15%" y1="0%" x2="85%" y2="100%">
                        <stop offset="0%" stopColor="#ffa082" />
                        <stop offset="30%" stopColor="#f07153" />
                        <stop offset="70%" stopColor="#d24d2d" />
                        <stop offset="100%" stopColor="#982e14" />
                      </linearGradient>
                      <linearGradient id="torusBody" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d24d2d" />
                        <stop offset="50%" stopColor="#982e14" />
                        <stop offset="100%" stopColor="#581606" />
                      </linearGradient>
                      <linearGradient id="torusInner" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#751b06" />
                        <stop offset="100%" stopColor="#d24d2d" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 12,42 C 12,65 34,78 60,78 C 86,78 108,65 108,42 L 108,48 C 108,71 86,84 60,84 C 34,84 12,71 12,48 Z"
                      fill="url(#torusBody)"
                    />
                    <path
                      d="M 40,42 C 40,53 49,60 60,60 C 71,60 80,53 80,42 L 80,47 C 80,58 71,65 60,65 C 49,65 40,58 40,47 Z"
                      fill="url(#torusInner)"
                    />
                    <path
                      fillRule="evenodd"
                      d="M 60,14 C 86,14 108,27 108,42 C 108,57 86,70 60,70 C 34,70 12,57 12,42 C 12,27 34,14 60,14 Z M 60,28 C 49,28 40,34 40,42 C 40,50 49,56 60,56 C 71,56 80,50 80,42 C 80,34 71,28 60,28 Z"
                      fill="url(#torusTop)"
                    />
                    <path
                      d="M 28,32 C 38,22 52,18 64,18"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.65"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          NEON MARQUEE TICKER (High-Impact Brand Ribbon)
          ======================================================== */}
      <section className="-mx-4 overflow-hidden border-y border-[#212a22] bg-[#0f140f] py-3.5 sm:-mx-8 lg:-mx-12">
        <div className="animate-marquee whitespace-nowrap text-xs font-black uppercase tracking-[0.25em] text-[#d4ff32]">
          <span>
            POLISHED BEFORE PUBLISHED • BRANDCHECK • HUMAN-LED GOVERNANCE • ZERO SILENT AI REWRITES • EXPLAINABLE RULE
            CITATIONS • MULTI-TENANT WORKSPACE SECURITY • SUB-2S AUDIT LATENCY • STRICT RBAC
            PERMISSIONS • ASCI COMPLIANCE GUARD • FACTUAL EVIDENCE RETRIEVAL •&nbsp;
          </span>
          <span>
            POLISHED BEFORE PUBLISHED • BRANDCHECK • HUMAN-LED GOVERNANCE • ZERO SILENT AI REWRITES • EXPLAINABLE RULE
            CITATIONS • MULTI-TENANT WORKSPACE SECURITY • SUB-2S AUDIT LATENCY • STRICT RBAC
            PERMISSIONS • ASCI COMPLIANCE GUARD • FACTUAL EVIDENCE RETRIEVAL •&nbsp;
          </span>
        </div>
      </section>

      {/* ========================================================
          VIBRANT LIME SHOWCASE BLOCK ("Meet your brand's moving parts")
          ======================================================== */}
      <section className="rounded-3xl bg-[#d4ff32] p-6 shadow-xl sm:p-10 lg:p-12">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#0f140f]/70">
              01 • BRAND ARCHITECTURE &amp; RULES
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f140f] sm:text-4xl">
              Meet your brand&apos;s moving parts.
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium leading-relaxed text-[#0f140f]/80">
            Approved guidelines to update every digital asset, and creators can test them in real time
            with instant, explainable feedback.
          </p>
        </div>

        {/* Inner Card (Warm Ivory / White) */}
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-md sm:p-8">
          {/* Sub-Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
            {[
              { id: 'rules', label: 'Editorial Rules' },
              { id: 'palette', label: 'Color System' },
              { id: 'tone', label: 'Tone of Voice' },
              { id: 'claims', label: 'Verified Claims' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePaletteTab(tab.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${activePaletteTab === tab.id
                  ? 'bg-[#0f140f] text-white'
                  : 'bg-[#f7f8f3] text-slate-600 hover:bg-slate-200 hover:text-[#0f140f]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Palette Showcase Content */}
          <div className="mt-6">
            <h3 className="text-2xl font-extrabold tracking-tight text-[#0f140f]">
              A palette with a point of view.
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Clear rules give distributed teams confidence. No guessing, no back-and-forth email chains.
            </p>

            {/* Three Swatch Cards */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {/* Swatch 1: Obsidian */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="h-28 bg-[#0f140f] p-4 text-white">
                  <span className="font-mono text-xs font-bold">#0F140F</span>
                </div>
                <div className="bg-[#fbfcf8] p-4">
                  <span className="block text-xs font-bold text-[#0f140f]">Obsidian Black</span>
                  <span className="text-[11px] text-slate-500">Core text &amp; luxury surfaces</span>
                </div>
              </div>

              {/* Swatch 2: Lime */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="h-28 bg-[#d4ff32] p-4 text-[#0f140f]">
                  <span className="font-mono text-xs font-bold">#D4FF32</span>
                </div>
                <div className="bg-[#fbfcf8] p-4">
                  <span className="block text-xs font-bold text-[#0f140f]">Acid Lime</span>
                  <span className="text-[11px] text-slate-500">Primary actions &amp; focus highlights</span>
                </div>
              </div>

              {/* Swatch 3: Coral */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="h-28 bg-[#f07153] p-4 text-white">
                  <span className="font-mono text-xs font-bold">#F07153</span>
                </div>
                <div className="bg-[#fbfcf8] p-4">
                  <span className="block text-xs font-bold text-[#0f140f]">Warm Coral</span>
                  <span className="text-[11px] text-slate-500">Audits, findings &amp; rule violations</span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[#d8e6db] bg-[#eef5ee] p-4 text-xs text-[#1c3822]">
              <span className="font-bold">Guideline Mandate: </span>
              Guidelines are neither a cage nor a suggestion. They are the bedrock of brand voice and team scale.
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          1-CLICK HACKATHON EVALUATOR ACCESS CARD
          ======================================================== */}
      <section className="rounded-3xl border border-[#212a22] bg-[#0f140f] p-6 text-white shadow-2xl sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#d4ff32] text-[#0f140f]">
              <Sparkles size={17} />
            </span>
            <div>
              <span className="block text-xs font-black uppercase tracking-wider text-[#d4ff32]">
                1-Click Hackathon Evaluator Access
              </span>
              <span className="block text-xs text-slate-300">
                Judges &amp; Reviewers: Click any role below to instantly log in without manual registration
              </span>
            </div>
          </div>
          <span className="rounded-full border border-[#d4ff32]/30 bg-[#d4ff32]/10 px-3 py-1 text-xs font-bold text-[#d4ff32]">
            Live Interactive Demo
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Admin Button */}
          <button
            type="button"
            disabled={loadingRole !== null}
            onClick={() => handleDemoLogin('ADMIN')}
            className="group relative flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-4 text-left transition duration-150 hover:-translate-y-0.5 hover:border-[#d4ff32] hover:bg-white/10 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d4ff32] text-[#0f140f]">
                {loadingRole === 'ADMIN' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ShieldCheck size={20} />
                )}
              </div>
              <div>
                <span className="block text-sm font-bold text-white group-hover:text-[#d4ff32] transition">
                  Admin Demo
                </span>
                <span className="block text-xs text-slate-300">Workspace &amp; rules</span>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-[#d4ff32]" />
          </button>

          {/* Creator Button */}
          <button
            type="button"
            disabled={loadingRole !== null}
            onClick={() => handleDemoLogin('CREATOR')}
            className="group relative flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-4 text-left transition duration-150 hover:-translate-y-0.5 hover:border-[#d4ff32] hover:bg-white/10 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400 text-[#0f140f]">
                {loadingRole === 'CREATOR' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <FileText size={20} />
                )}
              </div>
              <div>
                <span className="block text-sm font-bold text-white group-hover:text-emerald-300 transition">
                  Creator Demo
                </span>
                <span className="block text-xs text-slate-300">Draft editor &amp; tone</span>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-300" />
          </button>

          {/* Reviewer Button */}
          <button
            type="button"
            disabled={loadingRole !== null}
            onClick={() => handleDemoLogin('REVIEWER')}
            className="group relative flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-4 text-left transition duration-150 hover:-translate-y-0.5 hover:border-[#d4ff32] hover:bg-white/10 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400 text-[#0f140f]">
                {loadingRole === 'REVIEWER' ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CheckSquare size={20} />
                )}
              </div>
              <div>
                <span className="block text-sm font-bold text-white group-hover:text-amber-300 transition">
                  Reviewer Demo
                </span>
                <span className="block text-xs text-slate-300">Approval queue</span>
              </div>
            </div>
            <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-amber-300" />
          </button>
        </div>
      </section>

      {/* ========================================================
          DARK CONTRAST SECTION ("Not just a flag. The reason behind it." / Studio Demo)
          ======================================================== */}
      <section id="demo-studio" className="rounded-3xl border border-[#212a22] bg-[#0f140f] p-6 text-white shadow-2xl sm:p-10 lg:p-12">
        <div className="max-w-2xl">
          <span className="text-xs font-black uppercase tracking-widest text-[#d4ff32]">
            AI-ASSISTED WORKSPACE AUDIT
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Not just a flag. The reason behind it.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Every finding cites the exact brand rule and provides a drop-in revision. Creators and
            reviewers always make the final call.
          </p>
        </div>

        {/* Embedded Studio Card (Crisp White / Light Alabaster) */}
        <div className="mt-8 rounded-2xl bg-white p-6 text-[#0f140f] shadow-xl sm:p-8">
          {/* Studio Header Bar */}
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#f07153]" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-[#d4ff32] border border-[#0f140f]" />
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-2 text-xs font-bold text-[#0f140f]">
                <FileText size={15} />
                <span>Live Interactive BrandCheck Studio</span>
              </div>
            </div>

            {/* Interactive Sample Tabs */}
            <div className="flex rounded-xl bg-[#f7f8f3] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleTabChange('email')}
                className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'email'
                  ? 'bg-[#0f140f] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0f140f]'
                  }`}
              >
                Marketing Email
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('social')}
                className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'social'
                  ? 'bg-[#0f140f] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0f140f]'
                  }`}
              >
                Social Post
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('press')}
                className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'press'
                  ? 'bg-[#0f140f] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0f140f]'
                  }`}
              >
                Press Release
              </button>
            </div>
          </div>

          {/* Studio Body: Side-by-Side Comparison */}
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* Left: Original Draft */}
            <div className="rounded-2xl border border-slate-200 bg-[#fbfcf8] p-5 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-bold text-[#0f140f]">{currentSample.title}</h4>
                  <span className="text-xs text-slate-500">{currentSample.type} • Draft v2</span>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                  Live Audit
                </span>
              </div>

              {/* Text highlighting */}
              <div className="mt-4 text-sm leading-relaxed text-slate-800">
                <span>{currentSample.bodyBefore}</span>
                {suggestionAccepted ? (
                  <span className="rounded-md bg-[#d4ff32] px-1.5 py-0.5 font-bold text-[#0f140f] transition-all duration-300">
                    {currentSample.finding.suggestion}
                  </span>
                ) : (
                  <span className="rounded-md bg-[#f07153]/20 px-1.5 py-0.5 font-bold text-[#f07153] underline decoration-[#f07153] decoration-wavy underline-offset-4 transition-all duration-300">
                    {currentSample.finding.highlight}
                  </span>
                )}
                <span>{currentSample.bodyAfter}</span>
              </div>

              {/* Compliance Score Bar */}
              <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs">
                <span className="font-semibold text-slate-600">Brand Compliance Score:</span>
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-32 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full transition-all duration-500 ${suggestionAccepted ? 'w-full bg-[#1c3822]' : 'w-[86%] bg-[#f07153]'
                        }`}
                    />
                  </div>
                  <span
                    className={`font-black ${suggestionAccepted ? 'text-[#1c3822]' : 'text-[#f07153]'
                      }`}
                  >
                    {suggestionAccepted
                      ? `${currentSample.scoreFixed}%`
                      : `${currentSample.scoreInitial}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: AI Finding & Action */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#f7f8f3] p-5 lg:col-span-5">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f07153] text-white">
                      <AlertCircle size={15} />
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-[#0f140f]">
                      Guideline Violation
                    </span>
                  </div>
                  <span className="rounded-full border border-[#f07153]/40 bg-[#f07153]/15 px-2 py-0.5 text-[10px] font-bold text-[#f07153]">
                    Needs Revision
                  </span>
                </div>

                <div className="mt-3.5 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                  <p className="font-bold text-[#0f140f]">Exact Rule Citation:</p>
                  <p className="mt-1 text-slate-700 italic">&ldquo;{currentSample.finding.rule}&rdquo;</p>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  {currentSample.finding.explanation}
                </p>

                {/* Suggested Fix */}
                <div className="mt-4 rounded-xl border border-[#d8e6db] bg-[#eef5ee] p-3.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1c3822]">
                    Suggested Replacement:
                  </span>
                  <p className="mt-1 text-xs font-bold text-[#0f140f]">
                    &ldquo;{currentSample.finding.suggestion}&rdquo;
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 border-t border-slate-200 pt-4">
                {suggestionAccepted ? (
                  <div className="flex items-center justify-between rounded-xl bg-[#d4ff32] px-3.5 py-2.5 text-xs font-bold text-[#0f140f]">
                    <span className="flex items-center gap-1.5">
                      <Check size={16} strokeWidth={2.5} /> Revision Applied &amp; Verified!
                    </span>
                    <button
                      type="button"
                      onClick={() => setSuggestionAccepted(false)}
                      className="text-xs underline hover:text-black font-semibold"
                    >
                      Undo
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSuggestionAccepted(true)}
                      className="flex-1 rounded-xl bg-[#0f140f] px-3 py-2.5 text-xs font-bold text-[#d4ff32] shadow-sm transition hover:bg-[#1f2a20] active:scale-[0.98]"
                    >
                      Apply Suggestion
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuggestionAccepted(true)}
                      className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3-STEP PATHWAY ("A clear path to on-brand.")
          ======================================================== */}
      <section id="workflow" className="space-y-8">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
              02 • HOW IT WORKS
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f140f] sm:text-4xl">
              A clear path to on-brand.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#4b5548]">
            A seamless bridge between your static brand PDFs and everyday creator drafts.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Define what is on-brand.',
              body: 'Upload tone of voice manuals, approved product claims, and banned competitor terminology into your isolated workspace knowledge base.',
            },
            {
              step: '02',
              title: 'Review with context.',
              body: 'Creators write freely. BrandCheck acts as a smart second reader, identifying tone inconsistencies with explainable citations.',
            },
            {
              step: '03',
              title: 'Let people make the call.',
              body: 'Creators refine, reviewers inspect side-by-side diffs, and your team makes the final call. Nothing is published without human sign-off.',
            },
          ].map(({ step, title, body }) => (
            <div
              key={step}
              className="rounded-3xl border border-[#d8e6db] bg-[#eef5ee] p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="font-mono text-xs font-black tracking-widest text-[#0f140f]">
                {step}
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-[#0f140f]">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          ROLE COLLABORATION SECTION ("The right people, at the right moment.")
          ======================================================== */}
      <section id="approach" className="rounded-3xl border border-[#d8e6db] bg-[#d8e6db] p-8 shadow-sm sm:p-12">
        <div className="max-w-2xl">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#0f140f]/70">
            03 • MULTI-ROLE GOVERNANCE
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f140f] sm:text-4xl">
            The right people, at the right moment.
          </h2>
          <p className="mt-2 text-base text-[#0f140f]/80">
            Whether you are crafting copy, verifying compliance, or administrating workspace
            standards, BrandCheck adapts to your workflow.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-[#0f140f]/15 pb-4">
          {['CREATOR', 'REVIEWER', 'ADMIN'].map((roleKey) => {
            const role = ROLES_INFO[roleKey];
            const isActive = activeRole === roleKey;
            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => setActiveRole(roleKey)}
                className={`rounded-full px-5 py-2.5 text-xs font-extrabold transition ${isActive
                  ? 'bg-[#0f140f] text-white shadow-md'
                  : 'bg-white/80 text-[#0f140f] hover:bg-white'
                  }`}
              >
                {role.title}
              </button>
            );
          })}
        </div>

        {/* Role Showcase Body */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-4 lg:col-span-7">
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${roleData.badgeColor}`}>
                <RoleIcon size={14} />
                {activeRole}
              </span>
              <span className="text-xs font-semibold text-[#0f140f]/60">• Workspace Profile</span>
            </div>
            <h3 className="text-2xl font-extrabold text-[#0f140f]">{roleData.title}</h3>
            <p className="text-sm leading-relaxed text-[#0f140f]/80">{roleData.description}</p>

            <ul className="mt-4 space-y-2.5 text-sm font-medium text-[#0f140f]">
              {roleData.highlights.map((highlight, index) => (
                <li key={index} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#0f140f] text-[#d4ff32]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Role Status Card Preview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md lg:col-span-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500">Live Workspace Status</span>
              <span className="rounded-full bg-[#d4ff32] px-2.5 py-0.5 text-[10px] font-black text-[#0f140f]">
                ACTIVE
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-[#f7f8f3] p-4">
                <span className="text-xs text-slate-500">Current Task State</span>
                <p className="mt-1 font-bold text-[#0f140f]">{roleData.previewStatus}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#f7f8f3] p-4">
                <span className="text-xs text-slate-500">Next Action</span>
                <p className="mt-1 font-bold text-[#0f140f]">{roleData.previewAction}</p>
              </div>
            </div>
            <div className="mt-5">
              <NavLink
                to={user ? '/dashboard' : '/signup'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f140f] px-4 py-3 text-xs font-bold text-[#d4ff32] transition hover:bg-[#1a231b]"
              >
                <span>Experience {roleData.title}</span>
                <ArrowRight size={14} />
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          CONFIDENCE GRID ("Confidence starts with what you can see.")
          ======================================================== */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              04 • CORE PRINCIPLES
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f140f] sm:text-4xl">
              Confidence starts with what you can see.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              BrandCheck does not replace your team—it gives every creator and reviewer an infallible,
              transparent second reader grounded in audited truth.
            </p>
          </div>

          <div className="divide-y divide-slate-100 lg:col-span-7">
            <div className="pb-5">
              <h4 className="text-base font-bold text-[#0f140f]">Every finding has a source.</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                You never have to guess why a sentence was flagged. Click any suggestion to view the
                exact brand rule citation.
              </p>
            </div>
            <div className="py-5">
              <h4 className="text-base font-bold text-[#0f140f]">Zero silent rewrites.</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                AI will never silently publish or alter your drafts behind your back. Your authors make
                every final decision.
              </p>
            </div>
            <div className="py-5">
              <h4 className="text-base font-bold text-[#0f140f]">A history you can follow.</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Every review, edit, and approval is logged in a tamper-evident workspace audit trail for
                compliance peace of mind.
              </p>
            </div>
            <div className="pt-5">
              <h4 className="text-base font-bold text-[#0f140f]">Clean boundaries for team scale.</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Multi-tenant data isolation ensures your company&apos;s proprietary guidelines and confidential
                drafts remain strictly within your workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          BOTTOM CTA BANNER ("More consistency. Never lose humanity.")
          ======================================================== */}
      <section className="rounded-3xl bg-[#d4ff32] p-8 text-center shadow-xl sm:p-14">
        <span className="text-xs font-black uppercase tracking-widest text-[#0f140f]/70">
          START YOUR WORKSPACE TODAY
        </span>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-[#0f140f] sm:text-5xl sm:leading-tight">
          More consistency. Never lose humanity.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-relaxed text-[#0f140f]/80 sm:text-base">
          Start governing your brand communication in minutes. Experience AI-assisted review that
          elevates human judgment.
        </p>
        <div className="mt-8 flex justify-center">
          <NavLink
            to={user ? '/dashboard' : '/signup'}
            className="inline-flex items-center gap-2.5 rounded-full bg-[#0f140f] px-8 py-4 text-sm font-extrabold text-[#d4ff32] shadow-lg transition duration-150 hover:bg-[#1a231b] hover:shadow-xl active:scale-[0.98]"
          >
            <span>Start Free Workspace</span>
            <ArrowRight size={17} strokeWidth={2.5} />
          </NavLink>
        </div>
      </section>

      {/* ========================================================
          FOOTER (Matching the Reference Bottom Strip)
          ======================================================== */}
      <footer className="-mx-4 flex flex-col items-center justify-between gap-4 border-t border-[#212a22] bg-[#0f140f] px-8 py-6 text-xs text-slate-400 sm:-mx-8 sm:flex-row lg:-mx-12">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white">brandcheck<span className="text-[#d4ff32]">.</span></span>
          <span>• Polished before Published</span>
        </div>
        <div className="flex items-center gap-4">
          <NavLink to="/?login=true" className="hover:text-white transition">Sign In</NavLink>
          <span>•</span>
          <NavLink to="/signup" className="hover:text-white transition">Create Workspace</NavLink>
          <span>•</span>
          <span>Open Innovation — Data Sprint 2.0</span>
        </div>
      </footer>
    </div>
  );
}
