export default function RemindersAudit() {
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
          <div style={{ backgroundColor: "#c8b6ff", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>Reminders &amp; Audit</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: "2vh" }}>
          <h2 style={{ fontSize: "3.6vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 2vh 0", letterSpacing: "-0.05vw", maxWidth: "55vw", textWrap: "balance" }}>
            The system that nags itself.
          </h2>
          <p style={{ fontSize: "1.5vw", color: "#4a5568", lineHeight: 1.5, margin: "0 0 4vh 0", maxWidth: "60vw" }}>
            Recurring resets, email reminders before due dates, and a tamper-resistant completion log for every closed item.
          </p>

          <div style={{ display: "flex", gap: "2vw" }}>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "2.5vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "1vw", textTransform: "uppercase", letterSpacing: "0.15vw", color: "#ffbca6", fontWeight: 700, marginBottom: "1vh" }}>Recurrence</div>
              <h3 style={{ fontSize: "1.7vw", fontWeight: 700, margin: "0 0 1.5vh 0", color: "#1a202c" }}>Auto-reset cadence</h3>
              <p style={{ fontSize: "1.2vw", color: "#4a5568", margin: 0, lineHeight: 1.4 }}>Annual, quarterly, monthly. Items reopen with the next due date the moment they're closed.</p>
            </div>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "2.5vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "1vw", textTransform: "uppercase", letterSpacing: "0.15vw", color: "#aed9e0", fontWeight: 700, marginBottom: "1vh" }}>Email Cadence</div>
              <h3 style={{ fontSize: "1.7vw", fontWeight: 700, margin: "0 0 1.5vh 0", color: "#1a202c" }}>7-day &amp; 1-day pings</h3>
              <p style={{ fontSize: "1.2vw", color: "#4a5568", margin: 0, lineHeight: 1.4 }}>Resend-powered owner reminders, deduplicated per due date so the inbox never floods.</p>
            </div>
            <div style={{ flex: 1, backgroundColor: "#2d3748", borderRadius: "1.5vw", padding: "2.5vw", color: "#ffffff" }}>
              <div style={{ fontSize: "1vw", textTransform: "uppercase", letterSpacing: "0.15vw", color: "#c8b6ff", fontWeight: 700, marginBottom: "1vh" }}>Audit Log</div>
              <h3 style={{ fontSize: "1.7vw", fontWeight: 700, margin: "0 0 1.5vh 0", color: "#ffffff" }}>Who, what, when</h3>
              <p style={{ fontSize: "1.2vw", color: "#aed9e0", margin: 0, lineHeight: 1.4 }}>Every completion records actor, timestamp, and notes. Exportable when the inspector asks.</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>10</div>
        </div>
      </div>
    </div>
  );
}
