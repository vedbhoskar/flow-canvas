import Link from "next/link";
import {
  IconArrowRight,
  IconGitBranch,
  IconPlayerPlay,
  IconSparkles,
} from "@tabler/icons-react";
import { examples } from "./example-data";

const previews = [
  ["Client", "Auth", "Service", "Database"],
  ["Question", "Agent A", "Agent B", "Review"],
  ["Pool", "Node 4", "Surplus", "Node 5"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080b11] text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-3 text-lg font-semibold"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500 text-xl">
            ◇
          </span>
          Flow Canvas
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <a
            href="#examples"
            className="hidden text-slate-400 hover:text-white sm:inline"
          >
            Examples
          </a>
          <Link
            href="/studio?blank=1"
            className="rounded-lg border border-white/15 px-4 py-2 hover:bg-white/5"
          >
            Start blank
          </Link>
        </nav>
      </header>
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
        <div>
          <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-200">
            <IconSparkles size={15} /> Open-source visualization studio
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-[-.05em] sm:text-7xl">
            Make your system{" "}
            <span className="bg-gradient-to-r from-violet-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
              move.
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
            Build a connected model, script what changes over time, and present
            the whole story on one canvas.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white hover:bg-violet-400"
            >
              Open the studio <IconArrowRight size={18} />
            </Link>
            <Link
              href="/studio?blank=1"
              className="rounded-xl border border-white/15 px-5 py-3 font-semibold hover:bg-white/5"
            >
              Start with an empty canvas
            </Link>
          </div>
          <p className="mt-5 text-xs text-slate-500">
            Local-first · No account required · Scripted examples
          </p>
        </div>
        <div
          aria-hidden="true"
          className="rounded-[28px] border border-white/10 bg-[#111722] p-3 shadow-[0_30px_100px_rgba(0,0,0,.45)]"
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-3 pb-3 text-xs text-slate-500">
            <span className="size-2 rounded-full bg-rose-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="ml-3">resource-redistribution.flow</span>
          </div>
          <div className="relative flex h-[380px] items-center justify-between gap-3 overflow-hidden rounded-b-2xl bg-[#0c111a] bg-[radial-gradient(#273044_1px,transparent_1px)] p-5 [background-size:22px_22px]">
            {[
              ["Resource pool", "100 units", "violet"],
              ["Node 4", "Veto · fragmented", "rose"],
              ["Node 5", "+15 resold", "emerald"],
            ].map(([name, detail, color], index) => (
              <div
                key={name}
                className={`z-10 w-1/3 rounded-xl border border-white/20 bg-[#171d2b] p-3 shadow-xl ${index === 1 ? "-translate-y-9" : index === 2 ? "translate-y-8" : ""}`}
              >
                <span
                  className={`text-lg ${color === "emerald" ? "text-emerald-300" : color === "rose" ? "text-rose-300" : "text-violet-300"}`}
                >
                  ◇
                </span>
                <p className="mt-4 text-xs font-semibold">{name}</p>
                <p className="mt-1 text-[10px] text-slate-400">{detail}</p>
              </div>
            ))}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[#171d2b] px-4 py-3 text-xs text-slate-300">
              <IconPlayerPlay size={16} className="text-violet-300" /> 00:02 /
              00:03{" "}
              <div className="h-1 flex-1 rounded-full bg-white/10">
                <div className="h-1 w-2/3 rounded-full bg-violet-400" />
              </div>
              <span className="text-emerald-300">LIVE STORY</span>
            </div>
          </div>
        </div>
      </section>
      <section
        id="examples"
        className="border-t border-white/10 bg-[#0d1119] px-6 py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">
                Explore the possibilities
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                Start with a story
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-slate-400">
              Every example is a fully editable, scripted demo. Open one, press
              Play, then make it yours.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {examples.map((example, index) => (
              <Link
                key={example.slug}
                href={`/studio?example=${example.slug}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#141a25] transition hover:-translate-y-1 hover:border-violet-400/45"
              >
                <div className="flex h-40 items-center justify-around gap-1 border-b border-white/10 bg-[#101621] bg-[radial-gradient(#293348_1px,transparent_1px)] px-3 [background-size:20px_20px]">
                  {(previews[index] ?? []).map((step, stepIndex) => (
                    <div
                      key={step}
                      className="rounded-lg border border-white/15 bg-[#1b2230] px-2 py-2 text-[10px] font-medium shadow-lg"
                    >
                      {step}
                      {stepIndex < 3 && (
                        <span className="pl-2 text-violet-300">→</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-violet-300">
                    <span>{example.category}</span>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-slate-400">
                      Scripted demo
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">
                    {example.title}
                  </h3>
                  <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-400">
                    {example.description}
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-violet-300 group-hover:text-violet-200">
                    Open example <IconArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-12 flex items-center gap-3 border-t border-white/10 pt-8 text-sm text-slate-400">
            <IconGitBranch className="text-violet-300" /> Connect modules,
            replay changing state, and present in one click.
          </p>
        </div>
      </section>
    </main>
  );
}
