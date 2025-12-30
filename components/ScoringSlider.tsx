'use client'

interface ScoringSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  dimension: 'impact' | 'effort' | 'risk'
}

const guidance = {
  impact: {
    question: 'If you choose this option, how much does your life meaningfully improve in the next 3–12 months?',
    anchors: [
      { range: [1, 2], label: 'Barely noticeable' },
      { range: [3, 4], label: 'Small improvement' },
      { range: [5, 6], label: 'Moderate improvement' },
      { range: [7, 8], label: 'Major improvement' },
      { range: [9, 10], label: 'Life-changing improvement' },
    ],
    hint: 'Judge real-world consequences, not how exciting it feels today.',
  },
  effort: {
    question: 'What will this option demand from you in time, money, energy, focus, and opportunity cost?',
    anchors: [
      { range: [1, 2], label: 'Almost no cost or effort' },
      { range: [3, 4], label: 'Minor ongoing cost' },
      { range: [5, 6], label: 'Noticeable commitment' },
      { range: [7, 8], label: 'Heavy ongoing burden' },
      { range: [9, 10], label: 'Consumes major time, money, or energy' },
    ],
    hint: 'Include emotional load and lost alternatives.',
  },
  risk: {
    question: 'If this option turns out badly, how painful are the consequences?',
    anchors: [
      { range: [1, 2], label: 'Trivial downside' },
      { range: [3, 4], label: 'Minor setback' },
      { range: [5, 6], label: 'Serious inconvenience' },
      { range: [7, 8], label: 'Major setback' },
      { range: [9, 10], label: 'Long-term damage or hard to recover' },
    ],
    hint: 'Estimate real damage, not fear.',
  },
}

export default function ScoringSlider({ label, value, onChange, dimension }: ScoringSliderProps) {
  const guide = guidance[dimension]
  const currentAnchor = guide.anchors.find(
    (anchor) => value >= anchor.range[0] && value <= anchor.range[1]
  )

  return (
    <div className="space-y-3">
      {/* Question */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
          {label} (1–10)
        </label>
        <p className="text-xs text-[var(--text)] leading-relaxed mb-2">{guide.question}</p>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-[var(--surface-elevated)] rounded-lg appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, rgba(79,124,255,0.6) 0%, rgba(79,124,255,0.6) ${((value - 1) / 9) * 100}%, var(--surface-elevated) ${((value - 1) / 9) * 100}%, var(--surface-elevated) 100%)`,
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">1</span>
          <span className="text-sm font-semibold text-[var(--text)]">{value}</span>
          <span className="text-xs text-[var(--text-muted)]">10</span>
        </div>
      </div>

      {/* Current Anchor Label */}
      {currentAnchor && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2">
          <p className="text-xs font-medium text-[var(--text)]">{currentAnchor.label}</p>
        </div>
      )}

      {/* Anchor Scale (Collapsible/Always Visible) */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
          Scale
        </p>
        <div className="space-y-1">
          {guide.anchors.map((anchor, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 text-xs ${
                currentAnchor?.range[0] === anchor.range[0] &&
                currentAnchor?.range[1] === anchor.range[1]
                  ? 'text-[var(--text)] font-medium'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <span className="w-12 text-right tabular-nums">
                {anchor.range[0]}–{anchor.range[1]}
              </span>
              <span>{anchor.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-[var(--text-muted)] italic">{guide.hint}</p>
    </div>
  )
}

