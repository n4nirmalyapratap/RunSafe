export default function Differentiation() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ backgroundColor: "#ffffff", fontFamily: "'DM Sans', sans-serif", color: "#2d3748", display: "flex" }}
    >
      <div style={{ position: "absolute", top: "-15vh", right: "-5vw", width: "45vw", height: "45vw", backgroundColor: "#f4e8c1", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-10vh", left: "-10vw", width: "35vw", height: "35vw", backgroundColor: "#aed9e0", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", top: "20vh", left: "55vw", width: "8vw", height: "24vw", backgroundColor: "#ffbca6", borderRadius: "4vw", transform: "rotate(15deg)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 10, margin: "8vh 8vw", width: "calc(100vw - 16vw)", height: "calc(100vh - 16vh)", backgroundColor: "rgba(255, 255, 255, 0.4)", backdropFilter: "blur(1vw)", WebkitBackdropFilter: "blur(1vw)", borderRadius: "2vw", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", padding: "4vh 4vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
            <div style={{ width: "3vw", height: "3vw", backgroundColor: "#2d3748", borderRadius: "0.8vw", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: "bold", fontSize: "1.5vw" }}>R</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 700 }}>RunSafe</div>
          </div>
          <div style={{ backgroundColor: "#c8b6ff", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>Why Us</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: "2vh" }}>
          <h2 style={{ fontSize: "3.6vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 1vh 0", letterSpacing: "-0.05vw", maxWidth: "60vw", textWrap: "balance" }}>
            Asana is too generic. Trainual is too HR-only.
          </h2>
          <p style={{ fontSize: "1.4vw", color: "#4a5568", lineHeight: 1.4, margin: "0 0 4vh 0", maxWidth: "55vw" }}>
            RunSafe is the first product that treats SOPs and regulatory deadlines as the same workflow.
          </p>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "1vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "1vw", padding: "1.5vh 1.5vw", borderBottom: "0.15vw solid #f1f5f9" }}>
              <div style={{ fontSize: "1vw", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw" }}>Capability</div>
              <div style={{ fontSize: "1vw", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw", textAlign: "center" }}>Asana</div>
              <div style={{ fontSize: "1vw", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw", textAlign: "center" }}>Trainual</div>
              <div style={{ fontSize: "1vw", color: "#2d3748", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1vw", textAlign: "center" }}>RunSafe</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "1vw", padding: "1.5vh 1.5vw", borderBottom: "0.1vw solid #f8fafc" }}>
              <div style={{ fontSize: "1.2vw", color: "#2d3748" }}>SOP authoring &amp; assignment</div>
              <div style={{ fontSize: "1.2vw", color: "#a0aec0", textAlign: "center" }}>partial</div>
              <div style={{ fontSize: "1.2vw", color: "#2d3748", textAlign: "center" }}>✓</div>
              <div style={{ fontSize: "1.2vw", color: "#2d3748", fontWeight: 700, textAlign: "center" }}>✓</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "1vw", padding: "1.5vh 1.5vw", borderBottom: "0.1vw solid #f8fafc" }}>
              <div style={{ fontSize: "1.2vw", color: "#2d3748" }}>Recurring task automation</div>
              <div style={{ fontSize: "1.2vw", color: "#2d3748", textAlign: "center" }}>✓</div>
              <div style={{ fontSize: "1.2vw", color: "#a0aec0", textAlign: "center" }}>—</div>
              <div style={{ fontSize: "1.2vw", color: "#2d3748", fontWeight: 700, textAlign: "center" }}>✓</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "1vw", padding: "1.5vh 1.5vw", borderBottom: "0.1vw solid #f8fafc" }}>
              <div style={{ fontSize: "1.2vw", color: "#2d3748" }}>Prebuilt compliance library</div>
              <div style={{ fontSize: "1.2vw", color: "#a0aec0", textAlign: "center" }}>—</div>
              <div style={{ fontSize: "1.2vw", color: "#a0aec0", textAlign: "center" }}>—</div>
              <div style={{ fontSize: "1.2vw", color: "#2d3748", fontWeight: 700, textAlign: "center" }}>✓</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "1vw", padding: "1.5vh 1.5vw", borderBottom: "0.1vw solid #f8fafc" }}>
              <div style={{ fontSize: "1.2vw", color: "#2d3748" }}>Deadline reminders &amp; audit log</div>
              <div style={{ fontSize: "1.2vw", color: "#a0aec0", textAlign: "center" }}>—</div>
              <div style={{ fontSize: "1.2vw", color: "#a0aec0", textAlign: "center" }}>partial</div>
              <div style={{ fontSize: "1.2vw", color: "#2d3748", fontWeight: 700, textAlign: "center" }}>✓</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: "1vw", padding: "1.5vh 1.5vw" }}>
              <div style={{ fontSize: "1.2vw", color: "#2d3748" }}>SMB-priced ($29 entry)</div>
              <div style={{ fontSize: "1.2vw", color: "#a0aec0", textAlign: "center" }}>—</div>
              <div style={{ fontSize: "1.2vw", color: "#a0aec0", textAlign: "center" }}>—</div>
              <div style={{ fontSize: "1.2vw", color: "#2d3748", fontWeight: 700, textAlign: "center" }}>✓</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>14</div>
        </div>
      </div>
    </div>
  );
}
