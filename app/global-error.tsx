"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "32rem",
              padding: "1.5rem",
              border: "1px solid #ef4444",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              textAlign: "center",
            }}
          >
            <h2 style={{ color: "#ef4444", marginBottom: "0.5rem" }}>
              Error al cargar la aplicación
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "1rem", fontSize: "0.875rem" }}>
              {error.message}
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
