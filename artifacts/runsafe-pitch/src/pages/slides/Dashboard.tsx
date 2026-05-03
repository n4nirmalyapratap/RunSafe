export default function Dashboard() {
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
          <div style={{ backgroundColor: "#aed9e0", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>Owner Dashboard</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", marginTop: "3vh" }}>
          <h2 style={{ fontSize: "3vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 1vh 0", letterSpacing: "-0.05vw" }}>
            The home screen owners actually open.
          </h2>
          <p style={{ fontSize: "1.3vw", color: "#4a5568", lineHeight: 1.4, margin: "0 0 3vh 0", maxWidth: "55vw" }}>
            Status of every assigned task, every overdue deadline, every active SOP — at a glance.
          </p>

          <div style={{ display: "flex", gap: "2vw", marginBottom: "2vh" }}>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.2vw", padding: "2vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "0.9vw", color: "#718096", textTransform: "uppercase", letterSpacing: "0.1vw", fontWeight: 700 }}>Open Tasks</div>
              <div style={{ fontSize: "3.5vw", fontWeight: 800, color: "#1a202c", lineHeight: 1, marginTop: "0.5vh" }}>12</div>
              <div style={{ fontSize: "0.95vw", color: "#dd6b20", fontWeight: 600, marginTop: "0.5vh" }}>2 overdue</div>
            </div>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.2vw", padding: "2vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "0.9vw", color: "#718096", textTransform: "uppercase", letterSpacing: "0.1vw", fontWeight: 700 }}>SOPs</div>
              <div style={{ fontSize: "3.5vw", fontWeight: 800, color: "#1a202c", lineHeight: 1, marginTop: "0.5vh" }}>23</div>
              <div style={{ fontSize: "0.95vw", color: "#2c5282", fontWeight: 600, marginTop: "0.5vh" }}>5 categories</div>
            </div>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.2vw", padding: "2vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "0.9vw", color: "#718096", textTransform: "uppercase", letterSpacing: "0.1vw", fontWeight: 700 }}>Compliance</div>
              <div style={{ fontSize: "3.5vw", fontWeight: 800, color: "#1a202c", lineHeight: 1, marginTop: "0.5vh" }}>8</div>
              <div style={{ fontSize: "0.95vw", color: "#c53030", fontWeight: 600, marginTop: "0.5vh" }}>2 overdue</div>
            </div>
            <div style={{ flex: 1, backgroundColor: "#2d3748", borderRadius: "1.2vw", padding: "2vw", color: "#ffffff" }}>
              <div style={{ fontSize: "0.9vw", color: "#aed9e0", textTransform: "uppercase", letterSpacing: "0.1vw", fontWeight: 700 }}>Team</div>
              <div style={{ fontSize: "3.5vw", fontWeight: 800, lineHeight: 1, marginTop: "0.5vh" }}>4</div>
              <div style={{ fontSize: "0.95vw", color: "#aed9e0", fontWeight: 600, marginTop: "0.5vh" }}>active members</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "2vw", flex: 1 }}>
            <div style={{ flex: 1.4, backgroundColor: "#ffffff", borderRadius: "1.2vw", padding: "2vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#2d3748", marginBottom: "1.5vh" }}>Upcoming compliance deadlines</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "1vh 0", borderBottom: "0.1vw solid #f1f5f9" }}>
                  <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>Wage &amp; Hour Audit Q2</div>
                  <div style={{ fontSize: "1vw", color: "#c53030", fontWeight: 700 }}>5d overdue</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "1vh 0", borderBottom: "0.1vw solid #f1f5f9" }}>
                  <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>OSHA 300 Log Review</div>
                  <div style={{ fontSize: "1vw", color: "#dd6b20", fontWeight: 700 }}>3 days</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "1vh 0", borderBottom: "0.1vw solid #f1f5f9" }}>
                  <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>Fire Extinguisher Inspection</div>
                  <div style={{ fontSize: "1vw", color: "#2c5282", fontWeight: 700 }}>12 days</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "1vh 0" }}>
                  <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>Business License Renewal</div>
                  <div style={{ fontSize: "1vw", color: "#2c5282", fontWeight: 700 }}>20 days</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: "#f4e8c1", borderRadius: "1.2vw", padding: "2vw" }}>
              <div style={{ fontSize: "1.1vw", fontWeight: 700, color: "#2d3748", marginBottom: "1.5vh" }}>Today's task throughput</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "0.8vw", height: "10vh" }}>
                <div style={{ flex: 1, backgroundColor: "#ffbca6", height: "40%", borderRadius: "0.5vw 0.5vw 0 0" }} />
                <div style={{ flex: 1, backgroundColor: "#ffbca6", height: "55%", borderRadius: "0.5vw 0.5vw 0 0" }} />
                <div style={{ flex: 1, backgroundColor: "#aed9e0", height: "75%", borderRadius: "0.5vw 0.5vw 0 0" }} />
                <div style={{ flex: 1, backgroundColor: "#aed9e0", height: "90%", borderRadius: "0.5vw 0.5vw 0 0" }} />
                <div style={{ flex: 1, backgroundColor: "#c8b6ff", height: "100%", borderRadius: "0.5vw 0.5vw 0 0" }} />
              </div>
              <div style={{ fontSize: "1vw", color: "#4a5568", marginTop: "1.5vh", lineHeight: 1.4 }}>
                Tasks completed per day this week. Uptick after Tuesday SOP rollout.
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>11</div>
        </div>
      </div>
    </div>
  );
}
