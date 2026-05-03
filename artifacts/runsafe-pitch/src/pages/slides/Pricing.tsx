export default function Pricing() {
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
          <div style={{ backgroundColor: "#ffbca6", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>Pricing</div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: "2vh" }}>
          <h2 style={{ fontSize: "3.6vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 1vh 0", letterSpacing: "-0.05vw" }}>
            Three tiers. No surprise add-ons.
          </h2>
          <p style={{ fontSize: "1.4vw", color: "#4a5568", lineHeight: 1.4, margin: "0 0 4vh 0", maxWidth: "55vw" }}>
            Per-workspace pricing scales with team size. Compliance Autopilot unlocks at Growth.
          </p>

          <div style={{ display: "flex", gap: "2.5vw" }}>
            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "2.5vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "1.2vw", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw" }}>Starter</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5vw", marginTop: "1vh" }}>
                <div style={{ fontSize: "4vw", fontWeight: 800, color: "#1a202c", lineHeight: 1 }}>$29</div>
                <div style={{ fontSize: "1.1vw", color: "#718096" }}>/mo</div>
              </div>
              <div style={{ fontSize: "1vw", color: "#4a5568", marginTop: "0.5vh" }}>Up to 3 seats</div>
              <div style={{ height: "0.1vw", backgroundColor: "#e2e8f0", margin: "2vh 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
                <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>✓ SOPs &amp; tasks</div>
                <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>✓ Member task isolation</div>
                <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>✓ Owner dashboard</div>
                <div style={{ fontSize: "1.1vw", color: "#a0aec0" }}>— Compliance library</div>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: "#2d3748", borderRadius: "1.5vw", padding: "2.5vw", color: "#ffffff", position: "relative", boxShadow: "0 2vw 3vw rgba(45, 55, 72, 0.25)" }}>
              <div style={{ position: "absolute", top: "-1.5vh", left: "2.5vw", padding: "0.5vh 1.2vw", backgroundColor: "#ffbca6", color: "#2d3748", borderRadius: "1vw", fontSize: "0.9vw", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw" }}>Most Popular</div>
              <div style={{ fontSize: "1.2vw", color: "#aed9e0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw" }}>Growth</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5vw", marginTop: "1vh" }}>
                <div style={{ fontSize: "4vw", fontWeight: 800, lineHeight: 1 }}>$79</div>
                <div style={{ fontSize: "1.1vw", color: "#aed9e0" }}>/mo</div>
              </div>
              <div style={{ fontSize: "1vw", color: "#aed9e0", marginTop: "0.5vh" }}>Up to 10 seats</div>
              <div style={{ height: "0.1vw", backgroundColor: "rgba(255,255,255,0.15)", margin: "2vh 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
                <div style={{ fontSize: "1.1vw" }}>✓ Everything in Starter</div>
                <div style={{ fontSize: "1.1vw" }}>✓ Compliance library</div>
                <div style={{ fontSize: "1.1vw" }}>✓ Email reminders</div>
                <div style={{ fontSize: "1.1vw" }}>✓ Audit log export</div>
              </div>
            </div>

            <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "1.5vw", padding: "2.5vw", boxShadow: "0 1vw 2vw rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: "1.2vw", color: "#718096", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw" }}>Pro</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5vw", marginTop: "1vh" }}>
                <div style={{ fontSize: "4vw", fontWeight: 800, color: "#1a202c", lineHeight: 1 }}>$149</div>
                <div style={{ fontSize: "1.1vw", color: "#718096" }}>/mo</div>
              </div>
              <div style={{ fontSize: "1vw", color: "#4a5568", marginTop: "0.5vh" }}>Unlimited seats</div>
              <div style={{ height: "0.1vw", backgroundColor: "#e2e8f0", margin: "2vh 0" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "1vh" }}>
                <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>✓ Everything in Growth</div>
                <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>✓ Custom checklists</div>
                <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>✓ Priority support</div>
                <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>✓ SSO &amp; role policies</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>12</div>
        </div>
      </div>
    </div>
  );
}
