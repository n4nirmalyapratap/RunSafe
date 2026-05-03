export default function ProblemStats() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ backgroundColor: "#ffffff", fontFamily: "'DM Sans', sans-serif", color: "#2d3748", display: "flex" }}
    >
      <div style={{ position: "absolute", top: "-15vh", right: "-5vw", width: "45vw", height: "45vw", backgroundColor: "#f4e8c1", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-10vh", left: "-10vw", width: "35vw", height: "35vw", backgroundColor: "#aed9e0", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", top: "20vh", left: "55vw", width: "8vw", height: "24vw", backgroundColor: "#ffbca6", borderRadius: "4vw", transform: "rotate(15deg)", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: "25vh", right: "20vw", width: "12vw", height: "12vw", backgroundColor: "#c8b6ff", borderRadius: "50% 50% 0 0", zIndex: 1 }} />
      <div style={{ position: "absolute", top: "40vh", right: "8vw", width: "4vw", height: "4vw", backgroundColor: "#aed9e0", borderRadius: "50%", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: "15vh", left: "45vw", width: "10vw", height: "2vw", background: "radial-gradient(circle, #2d3748 0.5vw, transparent 0.6vw)", backgroundSize: "2vw 2vw", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 10, margin: "8vh 8vw", width: "calc(100vw - 16vw)", height: "calc(100vh - 16vh)", backgroundColor: "rgba(255, 255, 255, 0.4)", backdropFilter: "blur(1vw)", WebkitBackdropFilter: "blur(1vw)", borderRadius: "2vw", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", padding: "4vh 4vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
            <div style={{ width: "3vw", height: "3vw", backgroundColor: "#2d3748", borderRadius: "0.8vw", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: "bold", fontSize: "1.5vw" }}>R</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 700 }}>RunSafe</div>
          </div>
          <div style={{ backgroundColor: "#ffbca6", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>Why It Hurts</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: "2vh" }}>
          <h2 style={{ fontSize: "3.2vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 4vh 0", letterSpacing: "-0.05vw", textWrap: "balance", maxWidth: "55vw" }}>
            The cost of running on memory.
          </h2>

          <div style={{ display: "flex", gap: "2.5vw" }}>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "3vw", boxShadow: "0 1vw 3vw rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "5vw", fontWeight: 800, color: "#1a202c", lineHeight: 1, letterSpacing: "-0.1vw" }}>$14.8B</div>
              <div style={{ fontSize: "1.4vw", color: "#4a5568", marginTop: "2vh", lineHeight: 1.4 }}>OSHA penalties levied on US small employers in the last 5 years.</div>
            </div>
            <div style={{ flex: 1, backgroundColor: "#2d3748", borderRadius: "1.5vw", padding: "3vw", color: "#ffffff" }}>
              <div style={{ fontSize: "5vw", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.1vw" }}>61%</div>
              <div style={{ fontSize: "1.4vw", color: "#aed9e0", marginTop: "2vh", lineHeight: 1.4 }}>of SMB owners say compliance work eats more than 8 hours a week.</div>
            </div>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "3vw", boxShadow: "0 1vw 3vw rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "5vw", fontWeight: 800, color: "#1a202c", lineHeight: 1, letterSpacing: "-0.1vw" }}>2.1×</div>
              <div style={{ fontSize: "1.4vw", color: "#4a5568", marginTop: "2vh", lineHeight: 1.4 }}>higher first-year turnover at SMBs without documented onboarding SOPs.</div>
            </div>
          </div>

          <p style={{ fontSize: "1.2vw", color: "#718096", marginTop: "3vh", maxWidth: "60vw" }}>
            Sources: BLS small business survey 2025, OSHA enforcement data, NFIB owner sentiment report. Figures rounded.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>03</div>
        </div>
      </div>
    </div>
  );
}
