export default function SessionLoading() {
  return (
    <div className="flex flex-col h-dvh bg-bg px-5 pt-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="w-8 h-8 rounded-full bg-surface-2 animate-skeleton" />
        <div className="w-24 h-5 rounded-lg bg-surface-2 animate-skeleton" />
        <div className="w-8 h-8 rounded-full bg-surface-2 animate-skeleton" />
      </div>
      {/* Title skeleton */}
      <div className="text-center mb-8">
        <div className="w-40 h-6 rounded-lg bg-surface-2 animate-skeleton mx-auto mb-2" />
        <div className="w-20 h-4 rounded-lg bg-surface-3 animate-skeleton mx-auto" />
      </div>
      {/* Ring skeleton */}
      <div className="flex justify-center mb-8">
        <div className="w-48 h-48 rounded-full bg-surface-2 animate-skeleton" />
      </div>
      {/* Stepper skeletons */}
      <div className="space-y-3 mb-6">
        <div className="h-12 rounded-xl bg-surface-2 animate-skeleton" />
        <div className="h-12 rounded-xl bg-surface-2 animate-skeleton" />
      </div>
      {/* Button skeleton */}
      <div className="h-14 rounded-2xl bg-coral/30 animate-skeleton" />
    </div>
  );
}
