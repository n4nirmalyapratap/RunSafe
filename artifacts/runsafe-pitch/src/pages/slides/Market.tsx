export default function Market() {
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
          <div style={{ backgroundColor: "#aed9e0", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>Market</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: "2vh" }}>
          <h2 style={{ fontSize: "3.6vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 4vh 0", letterSpacing: "-0.05vw", maxWidth: "60vw", textWrap: "balance" }}>
            33M US small businesses. Underserved by ops software.
          </h2>

          <div style={{ display: "flex", gap: "3vw", alignItems: "stretch" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>
              <div style={{ backgroundColor: "#ffffff", borderRadius: "1.2vw", padding: "2vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: "0.9vw", color: "#718096", textTransform: "uppercase", letterSpacing: "0.1vw", fontWeight: 700 }}>TAM</div>
                <div style={{ fontSize: "3vw", fontWeight: 800, color: "#1a202c", marginTop: "0.5vh", lineHeight: 1 }}>$28B</div>
                <div style={{ fontSize: "1.1vw", color: "#4a5568", marginTop: "0.5vh" }}>SMB ops &amp; compliance software, US + UK + AU.</div>
              </div>
              <div style={{ backgroundColor: "#ffffff", borderRadius: "1.2vw", padding: "2vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: "0.9vw", color: "#718096", textTransform: "uppercase", letterSpacing: "0.1vw", fontWeight: 700 }}>SAM</div>
                <div style={{ fontSize: "3vw", fontWeight: 800, color: "#1a202c", marginTop: "0.5vh", lineHeight: 1 }}>$6.4B</div>
                <div style={{ fontSize: "1.1vw", color: "#4a5568", marginTop: "0.5vh" }}>5–50 employee businesses in regulated verticals.</div>
              </div>
              <div style={{ backgroundColor: "#2d3748", borderRadius: "1.2vw", padding: "2vw", color: "#ffffff" }}>
                <div style={{ fontSize: "0.9vw", color: "#aed9e0", textTransform: "uppercase", letterSpacing: "0.1vw", fontWeight: 700 }}>SOM (Y3)</div>
                <div style={{ fontSize: "3vw", fontWeight: 800, marginTop: "0.5vh", lineHeight: 1 }}>$140M</div>
                <div style={{ fontSize: "1.1vw", color: "#aed9e0", marginTop: "0.5vh" }}>0.4% capture across food service, retail, trades.</div>
              </div>
            </div>
            <div style={{ flex: 1.2, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "3vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "1.3vw", fontWeight: 700, color: "#2d3748", marginBottom: "2vh" }}>Initial verticals</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5vh" }}>
                    <div style={{ fontSize: "1.2vw", color: "#2d3748", fontWeight: 600 }}>Food service</div>
                    <div style={{ fontSize: "1.1vw", color: "#718096" }}>980k businesses</div>
                  </div>
                  <div style={{ height: "1vh", backgroundColor: "#f1f5f9", borderRadius: "0.5vw", overflow: "hidden" }}>
                    <div style={{ width: "85%", height: "100%", backgroundColor: "#ffbca6" }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5vh" }}>
                    <div style={{ fontSize: "1.2vw", color: "#2d3748", fontWeight: 600 }}>Retail &amp; e-commerce</div>
                    <div style={{ fontSize: "1.1vw", color: "#718096" }}>1.1M businesses</div>
                  </div>
                  <div style={{ height: "1vh", backgroundColor: "#f1f5f9", borderRadius: "0.5vw", overflow: "hidden" }}>
                    <div style={{ width: "70%", height: "100%", backgroundColor: "#aed9e0" }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5vh" }}>
                    <div style={{ fontSize: "1.2vw", color: "#2d3748", fontWeight: 600 }}>Trades &amp; field svc.</div>
                    <div style={{ fontSize: "1.1vw", color: "#718096" }}>720k businesses</div>
                  </div>
                  <div style={{ height: "1vh", backgroundColor: "#f1f5f9", borderRadius: "0.5vw", overflow: "hidden" }}>
                    <div style={{ width: "60%", height: "100%", backgroundColor: "#c8b6ff" }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5vh" }}>
                    <div style={{ fontSize: "1.2vw", color: "#2d3748", fontWeight: 600 }}>Health &amp; wellness</div>
                    <div style={{ fontSize: "1.1vw", color: "#718096" }}>410k businesses</div>
                  </div>
                  <div style={{ height: "1vh", backgroundColor: "#f1f5f9", borderRadius: "0.5vw", overflow: "hidden" }}>
                    <div style={{ width: "45%", height: "100%", backgroundColor: "#f4e8c1" }} />
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "1vw", color: "#718096", marginTop: "2.5vh" }}>
                Counts: US Census County Business Patterns, 2024 establishment data.
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>13</div>
        </div>
      </div>
    </div>
  );
}
