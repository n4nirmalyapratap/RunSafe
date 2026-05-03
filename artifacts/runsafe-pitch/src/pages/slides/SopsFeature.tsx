export default function SopsFeature() {
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
          <div style={{ backgroundColor: "#ffbca6", padding: "0.8vh 1.5vw", borderRadius: "2vw", fontSize: "1vw", fontWeight: 700, color: "#2d3748" }}>SOPs</div>
        </div>

        <div style={{ display: "flex", height: "100%", marginTop: "4vh", gap: "4vw" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2 style={{ fontSize: "3.6vw", fontWeight: 800, color: "#1a202c", lineHeight: 1.1, margin: "0 0 3vh 0", letterSpacing: "-0.05vw", textWrap: "balance" }}>
              Procedures, not paragraphs.
            </h2>
            <p style={{ fontSize: "1.5vw", color: "#4a5568", lineHeight: 1.5, margin: "0 0 3vh 0" }}>
              Each SOP is an ordered list of steps with attachments, owner notes, and a category. Drag to reorder. Version implicit.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5vh" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5vw" }}>
                <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "0.4vw", backgroundColor: "#ffbca6", display: "flex", alignItems: "center", justifyContent: "center", color: "#2d3748", fontWeight: 800, fontSize: "1vw", flexShrink: 0 }}>1</div>
                <div style={{ fontSize: "1.4vw", color: "#2d3748" }}>Author once in plain English.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5vw" }}>
                <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "0.4vw", backgroundColor: "#aed9e0", display: "flex", alignItems: "center", justifyContent: "center", color: "#2d3748", fontWeight: 800, fontSize: "1vw", flexShrink: 0 }}>2</div>
                <div style={{ fontSize: "1.4vw", color: "#2d3748" }}>Attach files, photos, or owner notes per step.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5vw" }}>
                <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "0.4vw", backgroundColor: "#c8b6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2d3748", fontWeight: 800, fontSize: "1vw", flexShrink: 0 }}>3</div>
                <div style={{ fontSize: "1.4vw", color: "#2d3748" }}>Reuse the same SOP across recurring assignments.</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "30vw", backgroundColor: "#ffffff", borderRadius: "1.5vw", boxShadow: "0 2vw 4vw rgba(0,0,0,0.08)", overflow: "hidden" }}>
              <div style={{ padding: "2vw", borderBottom: "0.15vw solid #f1f5f9" }}>
                <div style={{ fontSize: "1vw", color: "#718096", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1vw" }}>Operations</div>
                <div style={{ fontSize: "1.8vw", fontWeight: 800, color: "#1a202c", marginTop: "0.5vh" }}>Daily Opening Checklist</div>
              </div>
              <div style={{ padding: "2vw", display: "flex", flexDirection: "column", gap: "1.2vh" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                  <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "0.3vw", backgroundColor: "#2d3748", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "1vw", flexShrink: 0 }}>✓</div>
                  <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>Unlock and disarm security system</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                  <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "0.3vw", backgroundColor: "#2d3748", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontSize: "1vw", flexShrink: 0 }}>✓</div>
                  <div style={{ fontSize: "1.1vw", color: "#2d3748" }}>Power on POS terminals</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                  <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "0.3vw", border: "0.2vw solid #cbd5e0", flexShrink: 0 }} />
                  <div style={{ fontSize: "1.1vw", color: "#4a5568" }}>Restock front-of-house supplies</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                  <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "0.3vw", border: "0.2vw solid #cbd5e0", flexShrink: 0 }} />
                  <div style={{ fontSize: "1.1vw", color: "#4a5568" }}>Inspect customer-facing areas</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1vw" }}>
                  <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "0.3vw", border: "0.2vw solid #cbd5e0", flexShrink: 0 }} />
                  <div style={{ fontSize: "1.1vw", color: "#4a5568" }}>Brief opening shift on promotions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "2vh", borderTop: "0.2vw solid rgba(45, 55, 72, 0.1)" }}>
          <div style={{ fontSize: "1.2vw", fontWeight: 500, color: "#718096" }}>RunSafe, Inc.</div>
          <div style={{ fontSize: "1.2vw", fontWeight: 700, color: "#2d3748" }}>06</div>
        </div>
      </div>
    </div>
  );
}
