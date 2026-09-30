import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-1 text-sm text-violet-200">
        Open-source visualization studio
      </span>
      <h1 className="text-5xl font-semibold tracking-tight">Flow Canvas</h1>
      <p className="max-w-xl text-lg text-slate-400">
        Build a system diagram, replay its story, and present it clearly.
      </p>
      <Link
        href="/studio"
        className="rounded-xl bg-violet-500 px-5 py-3 font-medium text-white hover:bg-violet-400"
      >
        Open the studio
      </Link>
    </main>
  );
}
