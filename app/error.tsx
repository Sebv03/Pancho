"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 max-w-lg text-center">
        <h2 className="text-lg font-semibold text-destructive mb-2">
          Algo salió mal
        </h2>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
