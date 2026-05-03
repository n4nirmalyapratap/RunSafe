export default function DelegationDivider() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ backgroundColor: "#f4e8c1", fontFamily: "'DM Sans', sans-serif", color: "#2d3748", display: "flex" }}
    >
      <div style={{ position: "absolute", top: "-20vh", left: "-10vw", width: "50vw", height: "50vw", backgroundColor: "#ffbca6", borderRadius: "50%", zIndex: 0, opacity: 0.7 }} />
      <div style={{ position: "absolute", bottom: "-15vh", right: "-10vw", width: "45vw", height: "45vw", backgroundColor: "#aed9e0", borderRadius: "50%", zIndex: 0, opacity: 0.6 }} />
      <div style={{ position: "absolute", top: "15vh", right: "15vw", width: "8vw", height: "20vw", backgroundColor: "#c8b6ff", borderRadius: "4vw", transform: "rotate(-12deg)", zIndex: 1 }} />
      <div style={{ position: "absolute", bottom: "20vh", left: "20vw", width: "10vw", height: "2vw", background: "radial-gradient(circle, #2d3748 0.5vw, transparent 0.6vw)", backgroundSize: "2vw 2vw", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 10, width: "100vw", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 12vw", boxSizing: "border-box" }}>
        <div style={{ display: "inline-block", width: "fit-content", padding: "0.8vh 1.8vw", backgroundColor: "#2d3748", borderRadius: "2vw", fontSize: "1.2vw", fontWeight: 700, color: "#ffffff", marginBottom: "3vh", textTransform: "uppercase", letterSpacing: "0.15vw" }}>Part One</div>
        <h2 style={{ fontSize: "8vw", fontWeight: 800, color: "#1a202c", lineHeight: 1, margin: 0, letterSpacing: "-0.2vw", maxWidth: "70vw", textWrap: "balance" }}>
          Delegation OS
        </h2>
        <p style={{ fontSize: "2vw", fontWeight: 500, color: "#2d3748", marginTop: "3vh", lineHeight: 1.4, maxWidth: "55vw" }}>
          Turn the work in your head into procedures the team actually runs.
        </p>
      </div>

      <div style={{ position: "absolute", bottom: "4vh", right: "4vw", fontSize: "1.2vw", fontWeight: 700, color: "#2d3748", zIndex: 10 }}>05</div>
    </div>
  );
}
