import Link from "next/link";

const PROPS = [
  { n: 1, text: "Build your investing club with family & friends — research, pick and vote together", cls: "bg-green-tint text-green" },
  { n: 2, text: "Learn as you invest with 5-minute interactive lessons", cls: "bg-orange-tint text-orange-2" },
  { n: 3, text: "Practice with virtual portfolios — decisions are real, dollars aren't", cls: "bg-purple-tint text-purple-2" },
];

export default function WelcomePage() {
  return (
    <div className="flex-1 flex flex-col px-[22px] pt-[calc(18px+env(safe-area-inset-top))] sm:pt-[70px]">
      <div className="flex flex-col items-center gap-[10px] text-center mt-[14px]">
        <div className="w-[60px] h-[60px] rounded-[18px] bg-green-2 text-cream-text font-black text-[20px] flex items-center justify-center">
          FIC
        </div>
        <h1 className="text-[25px] font-black text-ink leading-[1.15]">Family Investing Club</h1>
        <p className="text-[14.5px] font-extrabold text-orange">Invest Together. Learn Together. Grow Together.</p>
      </div>

      <div
        className="mt-5 h-[190px] rounded-[18px] border border-line flex items-center justify-center font-mono text-[11px] text-ink-5"
        style={{ background: "repeating-linear-gradient(45deg,#F0E6D0 0 9px,#F7EFDD 9px 18px)" }}
        aria-hidden
      >
        v2 hero illustration
      </div>

      <ul className="flex flex-col gap-3 mt-[22px]">
        {PROPS.map((p) => (
          <li key={p.n} className="flex items-center gap-3">
            <span className={`w-[34px] h-[34px] rounded-[11px] flex items-center justify-center font-black text-[15px] shrink-0 ${p.cls}`}>
              {p.n}
            </span>
            <span className="text-[14px] font-bold text-[#4A4436]">{p.text}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6 pb-[calc(24px+env(safe-area-inset-bottom))] sm:pb-[44px]">
        <Link
          href="/onboarding/who"
          className="block w-full rounded-[16px] bg-orange p-4 text-center text-[16px] font-black text-cream-text shadow-[0_3px_0_#C96D25] active:translate-y-[2px] active:shadow-none transition"
        >
          Get Started
        </Link>
        <p className="mt-4 text-center text-[13px] font-bold text-ink-3">
          Already a member?{" "}
          <Link href="/login" className="text-green font-extrabold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
