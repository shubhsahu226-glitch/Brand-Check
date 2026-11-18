import { NavLink, Route, Routes } from 'react-router-dom';
import { ArrowRight, Bell, BookOpen, Check, CircleHelp, FileText, Home, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

function Header() {
  return (
    <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-10">
      <NavLink to="/" className="flex items-center gap-3" aria-label="BrandCheck home">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white"><ShieldCheck size={21} /></span>
        <span className="text-lg font-semibold tracking-tight text-slate-900">brandcheck</span>
      </NavLink>
      <div className="flex items-center gap-3 text-slate-500">
        <button className="rounded-lg p-2 hover:bg-slate-100" aria-label="Help"><CircleHelp size={19} /></button>
        <button className="rounded-lg p-2 hover:bg-slate-100" aria-label="Notifications"><Bell size={19} /></button>
        <span className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">BC</span>
      </div>
    </header>
  );
}

function Sidebar() {
  const links = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/login', label: 'Log in', icon: FileText },
    { to: '/signup', label: 'Sign up', icon: BookOpen },
  ];
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white p-5 md:block">
      <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
      <nav className="space-y-1" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition', isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50')}>
            <Icon size={18} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm"><Check size={17} /></div>
        <p className="text-sm font-semibold text-slate-800">Human-led by design</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">AI suggestions support your review. Your team makes the final call.</p>
      </div>
    </aside>
  );
}

function HomePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-sm font-medium text-indigo-600">Polished Before Published</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Make every piece of content feel like your brand.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">BrandCheck helps your team review content against your brand guidelines, approved facts, and accessibility standards before it goes live.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <NavLink to="/signup" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">Get started <ArrowRight size={17} /></NavLink>
        <NavLink to="/login" className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Log in</NavLink>
      </div>
      <section className="mt-12 grid gap-4 sm:grid-cols-3" aria-label="How BrandCheck works">
        {[
          ['01', 'Set your standards', 'Bring your brand guidance and approved facts together.'],
          ['02', 'Review with context', 'See clear findings linked to your standards.'],
          ['03', 'Decide with confidence', 'Your people stay in control of every change.'],
        ].map(([number, title, body]) => <article key={number} className="rounded-xl border border-slate-200 bg-white p-5"><span className="text-xs font-semibold tracking-widest text-indigo-600">{number}</span><h2 className="mt-3 font-semibold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></article>)}
      </section>
      <p className="mt-8 text-xs leading-5 text-slate-500">How to use this page: Explore the overview, then choose Get started or Log in to continue.</p>
    </div>
  );
}

function AuthPage({ signup = false }) {
  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
      <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><ShieldCheck size={23} /></div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{signup ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{signup ? 'Get your team started with brand confident content.' : 'Sign in to continue to BrandCheck.'}</p>
      <form className="mt-7 space-y-4" onSubmit={(event) => event.preventDefault()}>
        {signup && <label className="block text-sm font-medium text-slate-700">Name<input className="form-input" type="text" name="name" autoComplete="name" placeholder="Your name" /></label>}
        <label className="block text-sm font-medium text-slate-700">Email<input className="form-input" type="email" name="email" autoComplete="email" placeholder="you@company.com" /></label>
        <label className="block text-sm font-medium text-slate-700">Password<input className="form-input" type="password" name="password" autoComplete={signup ? 'new-password' : 'current-password'} placeholder="••••••••" /></label>
        <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">{signup ? 'Create account' : 'Log in'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">{signup ? 'Already have an account?' : 'New to BrandCheck?'} <NavLink className="font-semibold text-indigo-600 hover:text-indigo-700" to={signup ? '/login' : '/signup'}>{signup ? 'Log in' : 'Create an account'}</NavLink></p>
      <p className="mt-6 text-xs leading-5 text-slate-500">Phase 0 interface only. Account actions are not connected to authentication.</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">How to use this page: This is a visual placeholder; form submission is not enabled.</p>
    </section>
  );
}

export default function App() {
  return <div className="min-h-screen bg-[#f7f8fa] text-slate-900"><Header /><div className="flex min-h-[calc(100vh-76px)]"><Sidebar /><main className="min-w-0 flex-1 px-6 py-10 sm:px-10 lg:px-14"><Routes><Route path="/" element={<HomePage />} /><Route path="/login" element={<AuthPage />} /><Route path="/signup" element={<AuthPage signup />} /><Route path="*" element={<HomePage />} /></Routes></main></div></div>;
}
