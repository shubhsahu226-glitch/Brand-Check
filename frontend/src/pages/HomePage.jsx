import { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  Layers,
  Award,
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
    badgeColor: 'bg-emerald-100 text-emerald-800',
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
    badgeColor: 'bg-amber-100 text-amber-800',
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
    badgeColor: 'bg-purple-100 text-purple-800',
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('email');
  const [suggestionAccepted, setSuggestionAccepted] = useState(false);
  const [activeRole, setActiveRole] = useState('CREATOR');

  const currentSample = DEMO_SAMPLES[activeTab];
  const roleData = ROLES_INFO[activeRole];
  const RoleIcon = roleData.icon;

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSuggestionAccepted(false);
  };

  return (
    <div className="relative mx-auto max-w-6xl space-y-24 overflow-hidden py-4 sm:py-8">
      {/* Background Decorative Gradients */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/50 via-purple-100/40 to-sky-100/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-[600px] -left-48 -z-10 h-[450px] w-[500px] rounded-full bg-gradient-to-br from-indigo-100/40 via-violet-100/30 to-transparent blur-2xl"
        aria-hidden="true"
      />

      {/* Hero Section */}
      <section className="text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/90 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-xs backdrop-blur-xs transition hover:bg-indigo-100/80">
          <Sparkles size={14} className="text-indigo-600" />
          <span>Polished Before Published — Human-Led Brand Governance</span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl sm:leading-[1.12]">
          Make every piece of content feel{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent">
            unmistakably like your brand.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 sm:text-xl sm:leading-relaxed">
          BrandCheck gives creative teams instant AI-assisted guideline checks, verified fact
          retrieval, and explainable findings — with humans always making the final call.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {user ? (
            <NavLink
              to="/dashboard"
              className="inline-flex items-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-[0.98]"
            >
              <span>Go to Your Workspace</span>
              <ArrowRight size={18} />
            </NavLink>
          ) : (
            <>
              <NavLink
                to="/signup"
                className="inline-flex items-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-[0.98]"
              >
                <span>Start Free Workspace</span>
                <ArrowRight size={18} />
              </NavLink>
              <NavLink
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-xs transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
              >
                <span>Sign In to Account</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Feature Highlights Bar */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Zero Silent AI Rewrites</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Multi-Tenant Workspace Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Explainable Rule Citations</span>
          </div>
        </div>
      </section>

      {/* Interactive Hero Showcase with Floating Elements */}
      <section className="relative mx-auto mt-8 max-w-5xl">
        {/* Floating Element 1: Top Right - Tone Score */}
        <div className="animate-float absolute -top-8 -right-4 z-20 hidden rounded-2xl border border-emerald-100 bg-white/95 p-3.5 shadow-xl shadow-emerald-500/10 backdrop-blur-md sm:flex sm:items-center sm:gap-3 md:-right-8">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 shadow-xs">
            <CheckCircle2 size={20} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Tone Alignment
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                98% MATCH
              </span>
            </div>
            <p className="text-xs text-slate-600">Empowering, Confident, Clear</p>
          </div>
        </div>

        {/* Floating Element 2: Bottom Left - Rule Verification */}
        <div className="animate-float-delayed absolute -bottom-6 -left-4 z-20 hidden rounded-2xl border border-indigo-100 bg-white/95 p-3.5 shadow-xl shadow-indigo-500/10 backdrop-blur-md sm:flex sm:items-center sm:gap-3 md:-left-8">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-indigo-700 shadow-xs">
            <Sparkles size={20} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800">
                Rule Engine
              </span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                AI SOURCED
              </span>
            </div>
            <p className="text-xs text-slate-600">Verified against Brand Guidelines</p>
          </div>
        </div>

        {/* Floating Element 3: Bottom Right - Human In The Loop */}
        <div className="animate-float-subtle absolute -bottom-7 right-6 z-20 hidden rounded-2xl border border-purple-100 bg-white/95 p-3.5 shadow-xl shadow-purple-500/10 backdrop-blur-md lg:flex lg:items-center lg:gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-700 shadow-xs">
            <ShieldCheck size={20} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-800">
                Human Review
              </span>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                FINAL CALL
              </span>
            </div>
            <p className="text-xs text-slate-600">Reviewer approval required</p>
          </div>
        </div>

        {/* Main Interactive Studio Mockup Card */}
        <div className="relative rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl shadow-slate-300/40 sm:p-9">
          {/* Top Mockup Header Bar */}
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-400/80" />
                <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <FileText size={15} className="text-indigo-600" />
                <span>BrandCheck Review Studio</span>
              </div>
            </div>

            {/* Interactive Sample Selector Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleTabChange('email')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'email'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Marketing Email
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('social')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'social'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Social Post
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('press')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'press'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Press Release
              </button>
            </div>
          </div>

          {/* Interactive Document Body */}
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {/* Draft Content Panel */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{currentSample.title}</h3>
                  <span className="text-xs text-slate-500">{currentSample.type} • Draft v2</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  <Clock size={13} />
                  <span>Review Active</span>
                </div>
              </div>

              {/* Draft text with dynamic highlight */}
              <div className="mt-4 text-sm leading-relaxed text-slate-700">
                <span>{currentSample.bodyBefore}</span>
                {suggestionAccepted ? (
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-900 transition-all duration-300">
                    {currentSample.finding.suggestion}
                  </span>
                ) : (
                  <span className="rounded-md bg-amber-100/90 px-1.5 py-0.5 font-medium text-amber-950 underline decoration-amber-500 decoration-wavy decoration-1 underline-offset-4 transition-all duration-300">
                    {currentSample.finding.highlight}
                  </span>
                )}
                <span>{currentSample.bodyAfter}</span>
              </div>

              {/* Status indicator bar inside draft */}
              <div className="mt-6 flex items-center justify-between rounded-xl bg-white p-3 text-xs border border-slate-200/80">
                <span className="font-medium text-slate-600">Overall Brand Compliance:</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full transition-all duration-500 ${
                        suggestionAccepted ? 'w-full bg-emerald-500' : 'w-[86%] bg-amber-500'
                      }`}
                    />
                  </div>
                  <span
                    className={`font-bold ${
                      suggestionAccepted ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {suggestionAccepted
                      ? `${currentSample.scoreFixed}%`
                      : `${currentSample.scoreInitial}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Finding & Suggestion Panel */}
            <div className="flex flex-col justify-between rounded-2xl border border-indigo-100 bg-white p-5 shadow-xs lg:col-span-5">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-100 text-amber-800">
                      <AlertCircle size={15} />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Brand Finding #1
                    </span>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200/60">
                    Needs Attention
                  </span>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Guideline Reference:</p>
                  <p className="mt-1 text-slate-600 italic">"{currentSample.finding.rule}"</p>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  {currentSample.finding.explanation}
                </p>

                {/* Suggested Fix */}
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Suggested Revision:
                  </span>
                  <p className="mt-1 text-xs font-medium text-emerald-950">
                    "{currentSample.finding.suggestion}"
                  </p>
                </div>
              </div>

              {/* Interactive Accept / Dismiss Action */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                {suggestionAccepted ? (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-100/70 px-3 py-2 text-xs font-semibold text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <Check size={15} /> Revision Applied & Verified!
                    </span>
                    <button
                      type="button"
                      onClick={() => setSuggestionAccepted(false)}
                      className="text-xs text-emerald-700 underline hover:text-emerald-900"
                    >
                      Undo
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSuggestionAccepted(true)}
                      className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.98]"
                    >
                      Apply Suggestion
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuggestionAccepted(true)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
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

      {/* How BrandCheck Works */}
      <section className="space-y-10">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Engineered For Precision
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            How BrandCheck Works in 3 Clear Steps
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600">
            A seamless bridge between your brand guidelines and your everyday content creators.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Set Your Brand Standards',
              icon: BookOpen,
              color: 'text-indigo-600',
              bgColor: 'bg-indigo-50',
              body: 'Upload brand guidelines, tone frameworks, approved claims, and terminology into your isolated workspace knowledge base.',
            },
            {
              step: '02',
              title: 'Review with Full Context',
              icon: Sparkles,
              color: 'text-purple-600',
              bgColor: 'bg-purple-50',
              body: 'Our review engine scans drafts against guidelines, highlighting exact rule deviations with transparent explanations and citations.',
            },
            {
              step: '03',
              title: 'Decide with Total Agency',
              icon: CheckSquare,
              color: 'text-emerald-600',
              bgColor: 'bg-emerald-50',
              body: 'Creators refine, reviewers inspect side-by-side diffs, and your team makes the final call. Nothing is published without human sign-off.',
            },
          ].map(({ step, title, icon: Icon, color, bgColor, body }) => (
            <div
              key={step}
              className="group relative rounded-2xl border border-slate-200 bg-white p-7 shadow-xs transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-widest text-indigo-600">
                  {step}
                </span>
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${bgColor} ${color}`}>
                  <Icon size={20} />
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">
                {title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Role Experience Selector */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <Users size={13} /> Multi-Role Collaboration
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Built for everyone who touches your brand.
          </h2>
          <p className="mt-2 text-base text-slate-600">
            Whether you are crafting copy, verifying compliance, or administrating workspace
            standards, BrandCheck adapts to your workflow.
          </p>
        </div>

        {/* Role Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {['CREATOR', 'REVIEWER', 'ADMIN'].map((roleKey) => {
            const role = ROLES_INFO[roleKey];
            const isActive = activeRole === roleKey;
            return (
              <button
                key={roleKey}
                type="button"
                onClick={() => setActiveRole(roleKey)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {role.title}
              </button>
            );
          })}
        </div>

        {/* Role Content Showcase */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-4 lg:col-span-7">
            <div className="flex items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${roleData.badgeColor}`}
              >
                <RoleIcon size={14} />
                {activeRole}
              </span>
              <span className="text-xs text-slate-400">• Workspace Role Profile</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{roleData.title}</h3>
            <p className="text-sm leading-relaxed text-slate-600">{roleData.description}</p>

            <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
              {roleData.highlights.map((highlight, index) => (
                <li key={index} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check size={12} />
                  </span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive Role Card Preview */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 lg:col-span-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-xs font-semibold text-slate-500">Live Workspace Status</span>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                ACTIVE
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs text-slate-500">Current Task State</span>
                <p className="mt-1 font-semibold text-slate-900">{roleData.previewStatus}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs text-slate-500">Next Action</span>
                <p className="mt-1 font-semibold text-indigo-600">{roleData.previewAction}</p>
              </div>
            </div>
            <div className="mt-5">
              <NavLink
                to={user ? '/dashboard' : '/signup'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <span>Experience {roleData.title}</span>
                <ArrowRight size={14} />
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      {/* Human-Led by Design Philosophy Callout */}
      <section className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-8 text-white shadow-xl sm:p-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="space-y-4 lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-xs">
              <Award size={14} />
              <span>Our Non-Negotiable Product Rule</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              AI suggests. People decide. Never auto-published.
            </h2>
            <p className="text-base leading-relaxed text-indigo-200">
              BrandCheck will never silently rewrite a creator’s copy or automatically push content
              live. Our AI models act exclusively as a rigorous, explainable research and review
              partner. Your team retains 100% agency and authorial dignity.
            </p>
          </div>
          <div className="lg:col-span-4 lg:text-right">
            <NavLink
              to={user ? '/dashboard' : '/signup'}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-950 shadow-md transition hover:bg-indigo-50 active:scale-[0.98]"
            >
              <span>Create Your Workspace</span>
              <ArrowRight size={16} />
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  );
}
