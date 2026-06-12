export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center relative overflow-hidden px-5 py-8">
      {/* Violet radial glow behind content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full"
        style={{ background: 'radial-gradient(circle, var(--violet-glow) 0%, transparent 70%)' }}
      />
      <div className="w-full max-w-[390px] relative z-10">
        {children}
      </div>
    </div>
  );
}
