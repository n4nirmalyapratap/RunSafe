export default function ComplianceFeature() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ backgroundColor: "#ffffff", fontFamily: "'DM Sans', sans-serif", color: "#2d3748", display: "flex" }}
    >
      <div style={{ position: "absolute", top: "-15vh", right: "-5vw", width: "45vw", height: "45vw", backgroundColor: "#f4e8c1", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-10vh", left: "-10vw", width: "35vw", height: "35vw", backgroundColor: "#aed9e0", borderRadius: "50%", zIndex: 0 }} />
      <div style={{ position: "absolute", top: "20vh", left: "55vw", width: "8vw", height: "24vw", backgroundColor: "#ffbca6", borderRadius: "4vw", transform: "rotate(15deg)", zIndex: 1 }} />
      <div style={{ position: "absolute", top: "40vh", right: "8vw", width: "4vw", height: "4vw", backgroundColor: "#aed9e0", borderRadius: "50%", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 10, margin: "8vh 8vw", width: "calc(100vw - 16vw)", height: "calc(100vh - 16vh)", backgroundColor: "rgba(255, 255, 255, 0.4)", backdropFilter: "blur(1vw)", WebkitBackdropFilter: "blur(1vw)", borderRadius: "2vw", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box", padding: "4vh 4vw" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
            <div style={{ width: "3vw", height: "3vw", backgroundColor: "#2d3748", borderRadius: "0.8vw", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: "bold", fontSize: "1.5vw" }}>R</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 700 }}>RunSafe</div>
          </div>
          <div style={{ backgroundColor: "#c8b6ff", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>Prebuilt Library</div>
        </div>

        <div style={{ display: "flex", height: "100%", marginTop: "4vh", gap: "4vw" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 style={{ fontSize: "3.6vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 3vh 0", letterSpacing: "-0.05vw", textWrap: "balance" }}>
              Day-one regulatory coverage.
            </h2>
            <p style={{ fontSize: "1.5vw", color: "#4a5568", lineHeight: 1.5, margin: "0 0 3vh 0" }}>
              New workspaces ship with a curated checklist for the obligations every US small business shares.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1vw" }}>
              <div style={{ padding: "1vh 1.5vw", backgroundColor: "#f4e8c1", borderRadius: "2vw", fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>Health &amp; Safety</div>
              <div style={{ padding: "1vh 1.5vw", backgroundColor: "#aed9e0", borderRadius: "2vw", fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>Employment</div>
              <div style={{ padding: "1vh 1.5vw", backgroundColor: "#ffbca6", borderRadius: "2vw", fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>Licensing</div>
              <div style={{ padding: "1vh 1.5vw", backgroundColor: "#c8b6ff", borderRadius: "2vw", fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>Data Privacy</div>
            </div>
          </div>

          <div style={{ flex: 1.1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "32vw", backgroundColor: "#ffffff", borderRadius: "1.5vw", boxShadow: "0 2vw 4vw rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ padding: "1.5vw 2vw", backgroundColor: "#2d3748", color: "#ffffff" }}>
                <div style={{ fontSize: "1vw", color: "#aed9e0", textTransform: "uppercase", letterSpacing: "0.1vw", fontWeight: 700 }}>Compliance Checklist</div>
                <div style={{ fontSize: "1.5vw", fontWeight: 700, marginTop: "0.3vh" }}>8 active items</div>
              </div>
              <div style={{ padding: "1vw", display: "flex", flexDirection: "column", gap: "0.8vh" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1vh 1.5vw", borderRadius: "0.8vw", backgroundColor: "#fff5f0", borderLeft: "0.4vw solid #ffbca6" }}>
                  <div style={{ fontSize: "1.1vw", color: "#2d3748", fontWeight: 600 }}>Wage &amp; Hour Audit Q2</div>
                  <div style={{ fontSize: "0.9vw", color: "#c53030", fontWeight: 700 }}>5d overdue</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1vh 1.5vw", borderRadius: "0.8vw", backgroundColor: "#fff5f0", borderLeft: "0.4vw solid #ffbca6" }}>
                  <div style={{ fontSize: "1.1vw", color: "#2d3748", fontWeight: 600 }}>Food Handler Certifications</div>
                  <div style={{ fontSize: "0.9vw", color: "#c53030", fontWeight: 700 }}>12d overdue</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1vh 1.5vw", borderRadius: "0.8vw", backgroundColor: "#fffaf0" }}>
                  <div style={{ fontSize: "1.1vw", color: "#2d3748", fontWeight: 600 }}>OSHA 300 Log Review</div>
                  <div style={{ fontSize: "0.9vw", color: "#dd6b20", fontWeight: 700 }}>3 days</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1vh 1.5vw", borderRadius: "0.8vw", backgroundColor: "#f0f9ff" }}>
                  <div style={{ fontSize: "1.1vw", color: "#2d3748", fontWeight: 600 }}>Fire Extinguisher Inspection</div>
                  <div style={{ fontSize: "0.9vw", color: "#2c5282", fontWeight: 700 }}>12 days</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1vh 1.5vw", borderRadius: "0.8vw", backgroundColor: "#f0f9ff" }}>
                  <div style={{ fontSize: "1.1vw", color: "#2d3748", fontWeight: 600 }}>Business License Renewal</div>
                  <div style={{ fontSize: "0.9vw", color: "#2c5282", fontWeight: 700 }}>20 days</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>09</div>
        </div>
      </div>
    </div>
  );
}
