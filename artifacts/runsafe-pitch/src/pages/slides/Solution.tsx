export default function Solution() {
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
          <div style={{ backgroundColor: "#aed9e0", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>The Solution</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: "2vh" }}>
          <h2 style={{ fontSize: "3.6vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 2vh 0", letterSpacing: "-0.05vw", maxWidth: "60vw", textWrap: "balance" }}>
            Two products. One workspace.
          </h2>
          <p style={{ fontSize: "1.6vw", color: "#4a5568", lineHeight: 1.4, margin: "0 0 4vh 0", maxWidth: "55vw" }}>
            RunSafe pairs a Delegation OS with a Compliance Autopilot so owners offload the work without losing visibility.
          </p>

          <div style={{ display: "flex", gap: "3vw" }}>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "3vw", boxShadow: "0 1vw 3vw rgba(0,0,0,0.05)", borderTop: "0.5vw solid #ffbca6" }}>
              <div style={{ fontSize: "1vw", textTransform: "uppercase", letterSpacing: "0.15vw", color: "#ffbca6", fontWeight: 700, marginBottom: "1.5vh" }}>Delegation OS</div>
              <h3 style={{ fontSize: "2.4vw", fontWeight: 800, color: "#1a202c", margin: "0 0 2vh 0", lineHeight: 1.1 }}>SOPs that move work.</h3>
              <p style={{ fontSize: "1.3vw", color: "#4a5568", margin: 0, lineHeight: 1.5 }}>
                Author a procedure once, assign it to anyone, and watch every step get checked off with proof.
              </p>
            </div>
            <div style={{ flex: 1, backgroundColor: "#2d3748", borderRadius: "1.5vw", padding: "3vw", color: "#ffffff", borderTop: "0.5vw solid #c8b6ff" }}>
              <div style={{ fontSize: "1vw", textTransform: "uppercase", letterSpacing: "0.15vw", color: "#c8b6ff", fontWeight: 700, marginBottom: "1.5vh" }}>Compliance Autopilot</div>
              <h3 style={{ fontSize: "2.4vw", fontWeight: 800, color: "#ffffff", margin: "0 0 2vh 0", lineHeight: 1.1 }}>Deadlines that find you.</h3>
              <p style={{ fontSize: "1.3vw", color: "#aed9e0", margin: 0, lineHeight: 1.5 }}>
                Prebuilt regulatory checklists, automatic recurring resets, and email reminders before fines arrive.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>04</div>
        </div>
      </div>
    </div>
  );
}
