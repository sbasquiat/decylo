import Link from "next/link";
import Image from "next/image";

type Shot = { title: string; desc: string; src: string };
type Testimonial = { quote: string; name: string; context?: string };

const shots: Shot[] = [
  {
    title: "Today",
    desc: "See what's active, what's due, and close loops fast.",
    src: "/screens/today.png",
  },
  {
    title: "New Decision",
    desc: "Capture context, score options, commit with clarity.",
    src: "/screens/new-decision.png",
  },
  {
    title: "Insights",
    desc: "Track calibration and trajectory — not vibes.",
    src: "/screens/insights.png",
  },
];

const testimonials: Testimonial[] = [
  { quote: "This makes me notice when I'm just rationalising.", name: "Beta user", context: "Founder" },
  { quote: "Logging outcomes is the killer feature. It forces honesty.", name: "Beta user", context: "Operator" },
  { quote: "Feels premium and calm. I actually want to come back.", name: "Beta user", context: "PM" },
];

function ShotCard({ s }: { s: Shot }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="text-sm font-semibold tracking-tight text-white">{s.title}</div>
      <div className="mt-1 text-sm text-white/65">{s.desc}</div>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
        <div className="relative aspect-[16/10] w-full">
          <Image
            src={s.src}
            alt={`${s.title} screenshot`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            onError={() => {}}
          />
          {/* Fallback overlay (in case image missing) */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/[0.02] to-black/40">
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70">
              Drop screenshot at <span className="font-semibold text-white/85">{s.src}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-sm leading-relaxed text-white/80">"{t.quote}"</div>
      <div className="mt-3 text-xs text-white/55">
        <span className="font-semibold text-white/70">{t.name}</span>
        {t.context ? <span> · {t.context}</span> : null}
      </div>
    </div>
  );
}

function ExampleDecision() {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5">
      <div className="text-sm font-semibold text-white">Example: "Should I take the job offer?"</div>
      <div className="mt-2 text-sm text-white/70">
        A simple way to use Decylo properly: define success, score options, commit, then log outcomes.
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs font-semibold text-white/80">Option A</div>
          <div className="mt-1 text-sm text-white/70">Take the offer</div>
          <div className="mt-2 text-xs text-white/55">Impact: 8 · Effort: 7 · Risk: 6</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-xs font-semibold text-white/80">Option B</div>
          <div className="mt-1 text-sm text-white/70">Decline & keep searching</div>
          <div className="mt-2 text-xs text-white/55">Impact: 7 · Effort: 6 · Risk: 7</div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-white/55">
          The point isn't the "right" answer — it's calibration, follow-through, and learning.
        </div>
        <div className="flex gap-2">
          <Link
            href="/examples"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
          >
            See full example
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-[#4C7DFF] px-4 py-2 text-sm font-bold text-[#071024] hover:opacity-95"
          >
            Try Decylo
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProofSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-[0.2em] text-white/55">PROOF</div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
            See it. Feel it. Understand it in 10 seconds.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
            Decylo works when you close loops. These screens show exactly how.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/how-it-works"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/[0.06]"
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl bg-[#4C7DFF] px-4 py-2 text-sm font-bold text-[#071024] hover:opacity-95"
          >
            View pricing
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {shots.map((s) => (
          <ShotCard key={s.title} s={s} />
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {testimonials.map((t, idx) => (
          <TestimonialCard key={idx} t={t} />
        ))}
      </div>

      <div className="mt-8">
        <ExampleDecision />
      </div>
    </section>
  );
}

