export default function Roadmap() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ backgroundColor: "#ffffff", fontFamily: "'DM Sans', sans-serif", color: "#2d3748", display: "flex" }}
    >
      <div style={{ position: "absolute", top: "-15vh", right: "-5vw", width: "45vw", height: "45vw", backgroundColor: "#f4e8c1", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-10vh", left: "-10vw", width: "35vw", height: "35vw", backgroundColor: "#aed9e0", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "25vh", right: "20vw", width: "12vw", height: "12vw", backgroundColor: "#c8b6ff", borderRadius: "50% 50% 0 0", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 10, margin: "8vh 8vw", width: "calc(100vw - 16vw)", height: "calc(100vh - 16vh)", backgroundColor: "rgba(255, 255, 255, 0.4)", backdropFilter: "blur(1vw)", WebkitBackdropFilter: "blur(1vw)", borderRadius: "2vw", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", padding: "4vh 4vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
            <div style={{ width: "3vw", height: "3vw", backgroundColor: "#2d3748", borderRadius: "0.8vw", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: "bold", fontSize: "1.5vw" }}>R</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 700 }}>RunSafe</div>
          </div>
          <div style={{ backgroundColor: "#aed9e0", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>Roadmap</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: "2vh" }}>
          <h2 style={{ fontSize: "3.6vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 4vh 0", letterSpacing: "-0.05vw", maxWidth: "60vw" }}>
            What we're building next.
          </h2>

          <div style={{ display: "flex", gap: "2vw" }}>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "2.5vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)", borderTop: "0.5vw solid #ffbca6" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1.5vh" }}>
                <div style={{ width: "3vw", height: "3vw", borderRadius: "50%", backgroundColor: "#ffbca6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2vw", fontWeight: 800, color: "#2d3748" }}>Q3</div>
                <div style={{ fontSize: "1vw", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw" }}>2026</div>
              </div>
              <h3 style={{ fontSize: "1.8vw", fontWeight: 800, color: "#1a202c", margin: "0 0 1.5vh 0" }}>Stripe billing</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
                <div style={{ fontSize: "1.1vw", color: "#4a5568" }}>• Self-serve plan upgrades</div>
                <div style={{ fontSize: "1.1vw", color: "#4a5568" }}>• Seat-based metering</div>
                <div style={{ fontSize: "1.1vw", color: "#4a5568" }}>• Annual discount</div>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "2.5vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)", borderTop: "0.5vw solid #aed9e0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1.5vh" }}>
                <div style={{ width: "3vw", height: "3vw", borderRadius: "50%", backgroundColor: "#aed9e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2vw", fontWeight: 800, color: "#2d3748" }}>Q4</div>
                <div style={{ fontSize: "1vw", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw" }}>2026</div>
              </div>
              <h3 style={{ fontSize: "1.8vw", fontWeight: 800, color: "#1a202c", margin: "0 0 1.5vh 0" }}>Mobile app</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
                <div style={{ fontSize: "1.1vw", color: "#4a5568" }}>• iOS &amp; Android task queue</div>
                <div style={{ fontSize: "1.1vw", color: "#4a5568" }}>• Photo proof on completion</div>
                <div style={{ fontSize: "1.1vw", color: "#4a5568" }}>• Push reminders</div>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "2.5vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)", borderTop: "0.5vw solid #c8b6ff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1.5vh" }}>
                <div style={{ width: "3vw", height: "3vw", borderRadius: "50%", backgroundColor: "#c8b6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2vw", fontWeight: 800, color: "#2d3748" }}>Q1</div>
                <div style={{ fontSize: "1vw", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw" }}>2027</div>
              </div>
              <h3 style={{ fontSize: "1.8vw", fontWeight: 800, color: "#1a202c", margin: "0 0 1.5vh 0" }}>State-specific library</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
                <div style={{ fontSize: "1.1vw", color: "#4a5568" }}>• CA, NY, TX, FL packs</div>
                <div style={{ fontSize: "1.1vw", color: "#4a5568" }}>• Industry checklists</div>
                <div style={{ fontSize: "1.1vw", color: "#4a5568" }}>• Auto-update on rule change</div>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: "#2d3748", borderRadius: "1.5vw", padding: "2.5vw", color: "#ffffff", borderTop: "0.5vw solid #f4e8c1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1.5vh" }}>
                <div style={{ width: "3vw", height: "3vw", borderRadius: "50%", backgroundColor: "#f4e8c1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2vw", fontWeight: 800, color: "#2d3748" }}>Q2</div>
                <div style={{ fontSize: "1vw", color: "#aed9e0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw" }}>2027</div>
              </div>
              <h3 style={{ fontSize: "1.8vw", fontWeight: 800, color: "#ffffff", margin: "0 0 1.5vh 0" }}>AI SOP drafting</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
                <div style={{ fontSize: "1.1vw", color: "#aed9e0" }}>• Voice-to-SOP capture</div>
                <div style={{ fontSize: "1.1vw", color: "#aed9e0" }}>• Compliance gap detection</div>
                <div style={{ fontSize: "1.1vw", color: "#aed9e0" }}>• Auto-generated step proofs</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>16</div>
        </div>
      </div>
    </div>
  );
}
