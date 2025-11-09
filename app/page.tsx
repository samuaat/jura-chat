// app/page.tsx
export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>JURA Chat – Home</h1>
      <p>
        Ha ezt az oldalt látod Vercelen, akkor a Next.js build sikeresen lefutott. 😊
      </p>
      <p>
        A következő lépés a <code>/chat</code> oldal és az <code>/api/chat</code> bekötése lesz.
      </p>
    </main>
  );
}
