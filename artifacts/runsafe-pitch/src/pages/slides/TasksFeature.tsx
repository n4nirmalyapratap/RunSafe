export default function TasksFeature() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ backgroundColor: "#ffffff", fontFamily: "'DM Sans', sans-serif", color: "#2d3748", display: "flex" }}
    >
      <div style={{ position: "absolute", top: "-15vh", right: "-5vw", width: "45vw", height: "45vw", backgroundColor: "#f4e8c1", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-10vh", left: "-10vw", width: "35vw", height: "35vw", backgroundColor: "#aed9e0", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "25vh", right: "20vw", width: "12vw", height: "12vw", backgroundColor: "#c8b6ff", borderRadius: "50% 50% 0 0", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: "15vh", left: "45vw", width: "10vw", height: "2vw", background: "radial-gradient(circle, #2d3748 0.5vw, transparent 0.6vw)", backgroundSize: "2vw 2vw", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 10, margin: "8vh 8vw", width: "calc(100vw - 16vw)", height: "calc(100vh - 16vh)", backgroundColor: "rgba(255, 255, 255, 0.4)", backdropFilter: "blur(1vw)", WebkitBackdropFilter: "blur(1vw)", borderRadius: "2vw", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", padding: "4vh 4vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
            <div style={{ width: "3vw", height: "3vw", backgroundColor: "#2d3748", borderRadius: "0.8vw", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: "bold", fontSize: "1.5vw" }}>R</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 700 }}>RunSafe</div>
          </div>
          <div style={{ backgroundColor: "#ffbca6", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>Tasks</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: "2vh" }}>
          <h2 style={{ fontSize: "3.6vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 2vh 0", letterSpacing: "-0.05vw", maxWidth: "55vw", textWrap: "balance" }}>
            Assign with proof of completion.
          </h2>
          <p style={{ fontSize: "1.5vw", color: "#4a5568", lineHeight: 1.5, margin: "0 0 4vh 0", maxWidth: "60vw" }}>
            Owners assign SOPs to staff with a due date. Members see only their own queue. Step-by-step completion logs the receipt.
          </p>

          <div style={{ display: "flex", gap: "2vw" }}>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "2.5vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
              <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "50%", backgroundColor: "#ffbca6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2vh", fontSize: "1.8vw", fontWeight: 800, color: "#2d3748" }}>→</div>
              <h3 style={{ fontSize: "1.6vw", fontWeight: 700, margin: "0 0 1vh 0", color: "#1a202c" }}>Owner assigns</h3>
              <p style={{ fontSize: "1.2vw", color: "#4a5568", margin: 0, lineHeight: 1.4 }}>Pick an SOP, assignee, and due date. Done in 10 seconds.</p>
            </div>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "2.5vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
              <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "50%", backgroundColor: "#aed9e0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2vh", fontSize: "1.8vw", fontWeight: 800, color: "#2d3748" }}>•</div>
              <h3 style={{ fontSize: "1.6vw", fontWeight: 700, margin: "0 0 1vh 0", color: "#1a202c" }}>Member runs</h3>
              <p style={{ fontSize: "1.2vw", color: "#4a5568", margin: 0, lineHeight: 1.4 }}>Personal task list. Each step a checkbox. Cannot see other members' queues.</p>
            </div>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "2.5vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
              <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "50%", backgroundColor: "#c8b6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2vh", fontSize: "1.8vw", fontWeight: 800, color: "#2d3748" }}>✓</div>
              <h3 style={{ fontSize: "1.6vw", fontWeight: 700, margin: "0 0 1vh 0", color: "#1a202c" }}>Owner verifies</h3>
              <p style={{ fontSize: "1.2vw", color: "#4a5568", margin: 0, lineHeight: 1.4 }}>Dashboard surfaces overdue tasks and step-level completion timestamps.</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>07</div>
        </div>
      </div>
    </div>
  );
}
