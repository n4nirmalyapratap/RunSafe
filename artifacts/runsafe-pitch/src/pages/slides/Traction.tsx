export default function Traction() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ backgroundColor: "#ffffff", fontFamily: "'DM Sans', sans-serif", color: "#2d3748", display: "flex" }}
    >
      <div style={{ position: "absolute", top: "-15vh", right: "-5vw", width: "45vw", height: "45vw", backgroundColor: "#f4e8c1", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-10vh", left: "-10vw", width: "35vw", height: "35vw", backgroundColor: "#aed9e0", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", top: "40vh", right: "8vw", width: "4vw", height: "4vw", backgroundColor: "#aed9e0", borderRadius: "50%", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 10, margin: "8vh 8vw", width: "calc(100vw - 16vw)", height: "calc(100vh - 16vh)", backgroundColor: "rgba(255, 255, 255, 0.4)", backdropFilter: "blur(1vw)", WebkitBackdropFilter: "blur(1vw)", borderRadius: "2vw", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", padding: "4vh 4vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
            <div style={{ width: "3vw", height: "3vw", backgroundColor: "#2d3748", borderRadius: "0.8vw", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: "bold", fontSize: "1.5vw" }}>R</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 700 }}>RunSafe</div>
          </div>
          <div style={{ backgroundColor: "#ffbca6", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>Pilot Traction</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", marginTop: "3vh" }}>
          <h2 style={{ fontSize: "3.5vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 1vh 0", letterSpacing: "-0.05vw" }}>
            Early signal from 32 design-partner workspaces.
          </h2>
          <p style={{ fontSize: "1.3vw", color: "#4a5568", lineHeight: 1.4, margin: "0 0 4vh 0", maxWidth: "55vw" }}>
            12 weeks of usage across food service, dental practices, and small construction firms.
          </p>

          <div style={{ display: "flex", gap: "3vw", height: "100%", paddingBottom: "2vh" }}>
            <div style={{ flex: 2, backgroundColor: "#ffffff", borderRadius: "2vw", padding: "3vw", display: "flex", alignItems: "flex-end", gap: "2vw", boxShadow: "0 1vw 3vw rgba(0,0,0,0.05)", position: "relative" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "1vh", height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", backgroundColor: "#aed9e0", height: "30%", borderRadius: "1vw 1vw 0 0" }} />
                <div style={{ fontSize: "1vw", color: "#4a5568", fontWeight: 600 }}>W2</div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "1vh", height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", backgroundColor: "#aed9e0", height: "45%", borderRadius: "1vw 1vw 0 0" }} />
                <div style={{ fontSize: "1vw", color: "#4a5568", fontWeight: 600 }}>W4</div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "1vh", height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", backgroundColor: "#c8b6ff", height: "62%", borderRadius: "1vw 1vw 0 0" }} />
                <div style={{ fontSize: "1vw", color: "#4a5568", fontWeight: 600 }}>W6</div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "1vh", height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", backgroundColor: "#c8b6ff", height: "75%", borderRadius: "1vw 1vw 0 0" }} />
                <div style={{ fontSize: "1vw", color: "#4a5568", fontWeight: 600 }}>W8</div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "1vh", height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", backgroundColor: "#ffbca6", height: "88%", borderRadius: "1vw 1vw 0 0" }} />
                <div style={{ fontSize: "1vw", color: "#4a5568", fontWeight: 600 }}>W10</div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "1vh", height: "100%", justifyContent: "flex-end" }}>
                <div style={{ width: "100%", backgroundColor: "#ffbca6", height: "100%", borderRadius: "1vw 1vw 0 0" }} />
                <div style={{ fontSize: "1vw", color: "#4a5568", fontWeight: 600 }}>W12</div>
              </div>
              <div style={{ position: "absolute", top: "2vw", left: "3vw", fontSize: "1vw", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw" }}>Weekly Active Workspaces</div>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vw", justifyContent: "space-between" }}>
              <div style={{ backgroundColor: "#2d3748", borderRadius: "1.5vw", padding: "2vw", color: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
                <div style={{ fontSize: "1vw", textTransform: "uppercase", letterSpacing: "0.1vw", color: "#aed9e0", marginBottom: "0.8vh", fontWeight: 700 }}>WAU Retention</div>
                <div style={{ fontSize: "3.5vw", fontWeight: 800, lineHeight: 1 }}>78%</div>
                <div style={{ fontSize: "1vw", color: "#aed9e0", marginTop: "0.8vh" }}>Week 4 → Week 12</div>
              </div>
              <div style={{ backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "2vw", display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, border: "0.2vw solid #e2e8f0" }}>
                <div style={{ fontSize: "1vw", textTransform: "uppercase", letterSpacing: "0.1vw", color: "#718096", marginBottom: "0.8vh", fontWeight: 700 }}>Pilot ARR</div>
                <div style={{ fontSize: "3.5vw", fontWeight: 800, color: "#1a202c", lineHeight: 1 }}>$31k</div>
                <div style={{ fontSize: "1vw", color: "#ffbca6", marginTop: "0.8vh", fontWeight: 700 }}>Closed in 9 weeks</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>15</div>
        </div>
      </div>
    </div>
  );
}
