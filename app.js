const PLAYER_COLORS = ["#E85D4A","#4A90E8","#2ECC71","#F39C12","#9B59B6","#1ABC9C","#E74C3C","#3498DB","#F1C40F","#E67E22"];
const AMOUNT_BTNS = [100, 500, 1000];

function GoStopApp() {
  const [screen, setScreen] = React.useState("setup");
  const [players, setPlayers] = React.useState(["플레이어 1","플레이어 2","플레이어 3"]);
  const [rounds, setRounds] = React.useState([]);
  const [inputAmounts, setInputAmounts] = React.useState([0,0,0]);
  const [inputError, setInputError] = React.useState("");

  const n = players.length;

  const totalAmounts = players.map((_, i) =>
    rounds.reduce((sum, r) => sum + r.amounts[i], 0)
  );

  function addPlayer() {
    if (players.length >= 10) return;
    setPlayers([...players, `플레이어 ${players.length + 1}`]);
    setInputAmounts([...inputAmounts, 0]);
  }

  function removePlayer(i) {
    if (players.length <= 2) return;
    setPlayers(players.filter((_, idx) => idx !== i));
    setInputAmounts(inputAmounts.filter((_, idx) => idx !== i));
    setRounds(rounds.map(r => ({ amounts: r.amounts.filter((_, idx) => idx !== i) })));
  }

  function adjustAmount(i, delta) {
    const na = [...inputAmounts];
    na[i] = na[i] + delta;
    setInputAmounts(na);
    setInputError("");
  }

  function setAmount(i, val) {
    const na = [...inputAmounts];
    na[i] = Number(val) || 0;
    setInputAmounts(na);
    setInputError("");
  }

  function addRound() {
    const sum = inputAmounts.reduce((a, b) => a + b, 0);
    if (inputAmounts.every(a => a === 0)) { setInputError("금액을 입력해주세요."); return; }
    if (sum !== 0) { setInputError(`합계가 0이어야 합니다. (현재: ${sum >= 0 ? "+" : ""}${sum.toLocaleString()}원)`); return; }
    setInputError("");
    setRounds([...rounds, { amounts: [...inputAmounts] }]);
    setInputAmounts(Array(n).fill(0));
  }

  function deleteRound(idx) {
    if (window.confirm(`${idx + 1}판을 삭제할까요?`)) {
      setRounds(rounds.filter((_, i) => i !== idx));
    }
  }

  function calcSettlement() {
    const balances = totalAmounts.map((a, i) => ({ idx: i, amount: a }));
    const d = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount).map(x => ({ ...x }));
    const c = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount).map(x => ({ ...x }));
    const transactions = [];
    let di = 0, ci = 0;
    while (di < d.length && ci < c.length) {
      const pay = Math.min(-d[di].amount, c[ci].amount);
      if (pay > 0) transactions.push({ from: d[di].idx, to: c[ci].idx, amount: pay });
      d[di].amount += pay; c[ci].amount -= pay;
      if (d[di].amount === 0) di++;
      if (c[ci].amount === 0) ci++;
    }
    return transactions;
  }

  const transactions = screen === "result" ? calcSettlement() : [];
  const currentSum = inputAmounts.reduce((a, b) => a + b, 0);

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(245,200,66,0.12)",
    borderRadius: 14, padding: "16px 16px 18px", marginBottom: 16,
  };
  const cardTitleStyle = {
    margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "#f5c842",
    letterSpacing: 2, borderBottom: "1px solid rgba(245,200,66,0.12)", paddingBottom: 10,
    display: "block",
  };
  const inputStyle = {
    width: "100%", padding: "10px 12px",
    background: "rgba(0,0,0,0.3)", border: "1px solid rgba(245,200,66,0.2)",
    borderRadius: 8, color: "#f5e6c8", fontSize: 15, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box", marginBottom: 10,
  };

  return (
    <div style={{ width: "100%", maxWidth: 520, padding: "0 16px 40px" }}>
      <div style={{ textAlign: "center", padding: "32px 0 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 4 }}>🀄</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, color: "#f5c842", textShadow: "0 0 20px rgba(245,200,66,0.4)", margin: 0 }}>고스톱 정산기</h1>
        <p style={{ color: "#a07850", fontSize: 13, margin: "6px 0 0", letterSpacing: 2 }}>GO · STOP · SETTLE</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 4 }}>
        {[["setup","⚙️ 설정"],["game","🎮 게임"],["result","💰 정산"]].map(([s, label]) => (
          <button key={s} onClick={() => setScreen(s)} style={{
            flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
            background: screen === s ? "rgba(245,200,66,0.18)" : "transparent",
            color: screen === s ? "#f5c842" : "#7a5c3a",
            fontFamily: "inherit", fontSize: 13, fontWeight: screen === s ? 700 : 400,
            cursor: "pointer", borderBottom: screen === s ? "2px solid #f5c842" : "2px solid transparent",
          }}>{label}</button>
        ))}
      </div>

      {/* 설정 */}
      {screen === "setup" && (
        <div>
          <div style={cardStyle}>
            <span style={cardTitleStyle}>플레이어 설정 ({n}명)</span>
            {players.map((name, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: PLAYER_COLORS[i], flexShrink: 0 }} />
                <input
                  value={name}
                  onChange={(e) => { const p = [...players]; p[i] = e.target.value; setPlayers(p); }}
                  style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                  placeholder={`플레이어 ${i + 1}`}
                />
                {players.length > 2 && (
                  <button onClick={() => removePlayer(i)} style={{
                    width: 30, height: 30, border: "none", borderRadius: 6,
                    background: "rgba(232,93,74,0.2)", color: "#E85D4A", cursor: "pointer", fontSize: 16, flexShrink: 0,
                  }}>×</button>
                )}
              </div>
            ))}
            {players.length < 10 && (
              <button onClick={addPlayer} style={{
                width: "100%", padding: "10px 0", marginTop: 4,
                background: "rgba(245,200,66,0.08)", border: "1px dashed rgba(245,200,66,0.3)",
                borderRadius: 8, color: "#f5c842", fontFamily: "inherit", fontSize: 13, cursor: "pointer",
              }}>+ 플레이어 추가 ({n}/10)</button>
            )}
          </div>
          <button onClick={() => setScreen("game")} style={{
            width: "100%", padding: "16px 0",
            background: "linear-gradient(135deg, #f5c842, #e8a020)",
            border: "none", borderRadius: 12, color: "#1a0a00",
            fontSize: 17, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 2,
          }}>게임 시작 →</button>
        </div>
      )}

      {/* 게임 */}
      {screen === "game" && (
        <div>
          <div style={cardStyle}>
            <span style={cardTitleStyle}>누적 금액</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {players.map((name, i) => (
                <div key={i} style={{
                  flex: "1 1 calc(33% - 6px)", minWidth: 80, textAlign: "center", padding: "10px 6px",
                  background: "rgba(0,0,0,0.2)", borderRadius: 10, border: `1px solid ${PLAYER_COLORS[i]}33`,
                }}>
                  <div style={{ fontSize: 10, color: "#a07850", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: totalAmounts[i] > 0 ? "#2ECC71" : totalAmounts[i] < 0 ? "#E85D4A" : "#f5e6c8" }}>
                    {totalAmounts[i] >= 0 ? "+" : ""}{totalAmounts[i].toLocaleString()}원
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <span style={cardTitleStyle}>{rounds.length + 1}판 금액 입력</span>
            <p style={{ color: "#a07850", fontSize: 12, marginBottom: 14 }}>💡 딴 사람 +, 잃은 사람 - / 합계가 0이어야 해요</p>
            {players.map((name, i) => (
              <div key={i} style={{ marginBottom: 16, padding: 12, background: "rgba(0,0,0,0.15)", borderRadius: 10, border: `1px solid ${PLAYER_COLORS[i]}22` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: PLAYER_COLORS[i] }}>{name}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: inputAmounts[i] > 0 ? "#2ECC71" : inputAmounts[i] < 0 ? "#E85D4A" : "#a07850" }}>
                    {inputAmounts[i] >= 0 ? "+" : ""}{inputAmounts[i].toLocaleString()}원
                  </span>
                </div>
                <input
                  type="number"
                  value={inputAmounts[i] === 0 ? "" : inputAmounts[i]}
                  onChange={(e) => setAmount(i, e.target.value)}
                  placeholder="직접 입력"
                  style={inputStyle}
                />
                <div style={{ display: "flex", gap: 6 }}>
                  {AMOUNT_BTNS.map(v => (
                    <div key={v} style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                      <button onClick={() => adjustAmount(i, v)} style={{
                        width: "100%", padding: "12px 0", border: "none", borderRadius: 8,
                        background: "rgba(46,204,113,0.2)", color: "#2ECC71",
                        fontFamily: "inherit", fontSize: 15, cursor: "pointer", fontWeight: 700,
                      }}>+{v >= 1000 ? (v/1000)+"K" : v}</button>
                      <button onClick={() => adjustAmount(i, -v)} style={{
                        width: "100%", padding: "12px 0", border: "none", borderRadius: 8,
                        background: "rgba(232,93,74,0.2)", color: "#E85D4A",
                        fontFamily: "inherit", fontSize: 15, cursor: "pointer", fontWeight: 700,
                      }}>-{v >= 1000 ? (v/1000)+"K" : v}</button>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button onClick={() => setAmount(i, 0)} style={{
                      padding: "12px 10px", border: "none", borderRadius: 8,
                      background: "rgba(255,255,255,0.06)", color: "#a07850",
                      fontFamily: "inherit", fontSize: 12, cursor: "pointer",
                    }}>초기화</button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ textAlign: "right", fontSize: 13, color: "#a07850", padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.05)", marginBottom: 10 }}>
              합계: <span style={{ fontWeight: 700, fontSize: 16, color: currentSum === 0 ? "#2ECC71" : "#E85D4A" }}>
                {currentSum >= 0 ? "+" : ""}{currentSum.toLocaleString()}원{currentSum === 0 ? " ✓" : ""}
              </span>
            </div>
            {inputError && (
              <div style={{ background: "rgba(232,93,74,0.15)", border: "1px solid rgba(232,93,74,0.4)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#E85D4A", marginBottom: 10 }}>{inputError}</div>
            )}
            <button onClick={addRound} style={{
              width: "100%", padding: "12px 0",
              background: currentSum === 0 ? "linear-gradient(135deg, #f5c842, #e8a020)" : "rgba(255,255,255,0.06)",
              border: "none", borderRadius: 10, color: currentSum === 0 ? "#1a0a00" : "#7a5c3a",
              fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: currentSum === 0 ? "pointer" : "not-allowed",
            }}>+ 판 추가</button>
          </div>

          {rounds.length > 0 && (
            <div style={cardStyle}>
              <span style={cardTitleStyle}>판별 내역 (총 {rounds.length}판)</span>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                <div style={{ width: 30 }} />
                {players.map((name, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, color: PLAYER_COLORS[i], overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                ))}
                <div style={{ width: 28 }} />
              </div>
              {[...rounds].reverse().map((r, ri) => {
                const actualIdx = rounds.length - 1 - ri;
                return (
                  <div key={actualIdx} style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: 10, color: "#5a3c20", width: 30 }}>{actualIdx + 1}판</span>
                    {r.amounts.map((a, i) => (
                      <div key={i} style={{ flex: 1, textAlign: "center", fontWeight: 600, fontSize: 11, color: a > 0 ? "#2ECC71" : a < 0 ? "#E85D4A" : "#a07850" }}>
                        {a >= 0 ? "+" : ""}{Math.abs(a) >= 1000 ? (a/1000).toFixed(1)+"K" : a}
                      </div>
                    ))}
                    <button onClick={() => deleteRound(actualIdx)} style={{ width: 28, height: 28, border: "none", borderRadius: 6, background: "rgba(232,93,74,0.15)", color: "#E85D4A", cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={() => setScreen("result")} style={{
            width: "100%", padding: "14px 0", marginTop: 8,
            background: "linear-gradient(135deg, #2ECC71, #27ae60)",
            border: "none", borderRadius: 12, color: "#fff",
            fontSize: 16, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: 2,
          }}>💰 최종 정산하기</button>
        </div>
      )}

      {/* 정산 */}
      {screen === "result" && (
        <div>
          <div style={cardStyle}>
            <span style={cardTitleStyle}>최종 결과</span>
            {[...players.map((_, i) => i)].sort((a, b) => totalAmounts[b] - totalAmounts[a]).map((i, rank) => {
              const medals = ["🥇","🥈","🥉"];
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", marginBottom: 8,
                  background: `${PLAYER_COLORS[i]}12`, borderRadius: 12, border: `1px solid ${PLAYER_COLORS[i]}33`,
                }}>
                  <span style={{ fontSize: 20 }}>{medals[rank] || "🎴"}</span>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: PLAYER_COLORS[i] }}>{players[i]}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: totalAmounts[i] > 0 ? "#2ECC71" : totalAmounts[i] < 0 ? "#E85D4A" : "#f5e6c8" }}>
                    {totalAmounts[i] >= 0 ? "+" : ""}{totalAmounts[i].toLocaleString()}원
                  </span>
                </div>
              );
            })}
          </div>

          <div style={cardStyle}>
            <span style={cardTitleStyle}>정산 내역</span>
            {transactions.length === 0 ? (
              <div style={{ textAlign: "center", color: "#a07850", padding: "20px 0" }}>정산할 내역이 없습니다 🎉</div>
            ) : transactions.map((t, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", marginBottom: 8, background: "rgba(0,0,0,0.25)", borderRadius: 12,
                border: "1px solid rgba(245,200,66,0.15)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: PLAYER_COLORS[t.from], fontWeight: 700, fontSize: 15 }}>{players[t.from]}</span>
                  <span style={{ color: "#5a3c20", fontSize: 18 }}>→</span>
                  <span style={{ color: PLAYER_COLORS[t.to], fontWeight: 700, fontSize: 15 }}>{players[t.to]}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#f5c842", background: "rgba(245,200,66,0.1)", padding: "4px 12px", borderRadius: 8 }}>
                  {t.amount.toLocaleString()}원
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setScreen("game")} style={{
              flex: 1, padding: "14px 0", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#f5e6c8",
              fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
            }}>← 게임으로</button>
            <button onClick={() => { setRounds([]); setInputAmounts(Array(n).fill(0)); setScreen("setup"); }} style={{
              flex: 1, padding: "14px 0", background: "linear-gradient(135deg, #E85D4A, #c0392b)",
              border: "none", borderRadius: 12, color: "#fff",
              fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
            }}>새 게임 🎴</button>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(GoStopApp));
