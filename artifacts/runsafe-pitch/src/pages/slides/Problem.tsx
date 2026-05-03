export default function Problem() {
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
          <div style={{ backgroundColor: "#ffbca6", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>The Problem</div>
        </div>

        <div style={{ display: "flex", height: "100%", marginTop: "4vh", gap: "4vw" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 style={{ fontSize: "4vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 3vh 0", letterSpacing: "-0.05vw", textWrap: "balance" }}>
              Owners are the bottleneck.
            </h2>
            <p style={{ fontSize: "1.6vw", color: "#4a5568", lineHeight: 1.5, margin: "0 0 4vh 0" }}>
              SMB founders carry operations, HR, and compliance in their heads. When they delegate, things slip. When they don't, they burn out.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
                <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", backgroundColor: "#ffbca6", marginTop: "0.6vw", flexShrink: 0 }} />
                <div style={{ fontSize: "1.5vw", color: "#2d3748", lineHeight: 1.4 }}>SOPs live in shared docs nobody opens twice.</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
                <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", backgroundColor: "#aed9e0", marginTop: "0.6vw", flexShrink: 0 }} />
                <div style={{ fontSize: "1.5vw", color: "#2d3748", lineHeight: 1.4 }}>Recurring tasks fall through cracks between Slack and email.</div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5vw" }}>
                <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", backgroundColor: "#c8b6ff", marginTop: "0.6vw", flexShrink: 0 }} />
                <div style={{ fontSize: "1.5vw", color: "#2d3748", lineHeight: 1.4 }}>Compliance deadlines surface only after a fine arrives.</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ width: "26vw", height: "26vw", backgroundColor: "#f4e8c1", borderRadius: "2vw", transform: "rotate(-5deg)", position: "relative", boxShadow: "0 2vw 4vw rgba(0,0,0,0.1)" }}>
              <div style={{ position: "absolute", top: "2vw", left: "2vw", right: "2vw", bottom: "2vw", backgroundColor: "#ffffff", borderRadius: "1vw", display: "flex", flexDirection: "column", padding: "2vw", gap: "1vh" }}>
                <div style={{ height: "1vh", backgroundColor: "#e2e8f0", borderRadius: "0.5vw", width: "70%" }} />
                <div style={{ height: "1vh", backgroundColor: "#e2e8f0", borderRadius: "0.5vw", width: "55%" }} />
                <div style={{ height: "1vh", backgroundColor: "#ffbca6", borderRadius: "0.5vw", width: "85%", marginTop: "1vh" }} />
                <div style={{ height: "1vh", backgroundColor: "#e2e8f0", borderRadius: "0.5vw", width: "40%" }} />
                <div style={{ height: "1vh", backgroundColor: "#e2e8f0", borderRadius: "0.5vw", width: "65%" }} />
                <div style={{ height: "1vh", backgroundColor: "#aed9e0", borderRadius: "0.5vw", width: "75%", marginTop: "1vh" }} />
              </div>
              <div style={{ position: "absolute", bottom: "-2vw", right: "-2vw", width: "10vw", height: "10vw", backgroundColor: "#ffbca6", borderRadius: "50%" }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>02</div>
        </div>
      </div>
    </div>
  );
}
