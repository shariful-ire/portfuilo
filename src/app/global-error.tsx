"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="en"><body style={{ margin: 0, padding: "4rem 1.5rem", background: "#090e17", color: "#edf2f7", fontFamily: "sans-serif" }}><main><h1>Something went wrong</h1><p role="alert">Please retry or reload this page.</p><button onClick={reset} style={{ padding: "0.8rem 1.4rem", background: "#79e3de", color: "#090e17", borderRadius: 8 }}>Try again</button></main></body></html>;
}
