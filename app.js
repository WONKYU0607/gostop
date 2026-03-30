const PLAYER_COLORS = [
  { bg: "rgba(232,93,74,0.2)",  text: "#E85D4A" },
  { bg: "rgba(74,144,232,0.2)", text: "#4A90E8" },
  { bg: "rgba(46,204,113,0.2)", text: "#2ECC71" },
  { bg: "rgba(243,156,18,0.2)", text: "#F39C12" },
  { bg: "rgba(155,89,182,0.2)", text: "#9B59B6" },
  { bg: "rgba(26,188,156,0.2)", text: "#1ABC9C" },
  { bg: "rgba(231,76,60,0.2)",  text: "#E74C3C" },
  { bg: "rgba(52,152,219,0.2)", text: "#3498DB" },
];

const AMOUNT_BTNS = [100, 500, 1000, 5000];

// ── 공통 스타일 토큰 ──────────────────────────────────────
const C = {
  bg1:     "#1a0a00",
  bg2:     "rgba(255,255,255,0.04)",
  bg3:     "rgba(255,255,255,0.08)",
  border:  "rgba(200,160,80,0.2)",
  border2: "rgba(200,160,80,0.45)",
  gold:    "#c8a050",
  gold2:   "#e8c870",
  text:    "#f5e6c8",
  muted:   "#a08060",
  green:   "#4ecb8a",
  red:     "#e05a5a",
  blue:    "#5a9ef0",
};

const S = {
  card: {
    background: C.bg2,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: 10,
  },
  playerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 0",
    borderBottom: `1px solid ${C.border}`,
  },
  primaryBtn: {
    width: "100%",
    padding: 13,
    border: "none",
    borderRadius: 10,
    background: C.gold,
    color: "#1a0a00",
    fontSize: 14,
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: 10,
    fontFamily: "inherit",
    letterSpacing: "0.3px",
  },
  miniBtn: (active, variant) => ({
    padding: "5px 10px",
    border: `1px solid ${
      variant === "danger" ? "rgba(224,90,90,0.4)" :
      variant === "success" ? "rgba(78,203,138,0.4)" :
      variant === "info"    ? "rgba(90,158,240,0.4)" :
      active                ? C.border2 : C.border
    }`,
    background: active ? "rgba(200,160,80,0.15)" : C.bg3,
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    color: variant === "danger"  ? C.red  :
           variant === "success" ? C.green :
           variant === "info"    ? C.blue  :
           active ? C.gold2 : C.text,
    whiteSpace: "nowrap",
    fontFamily: "inherit",
  }),
};

function Avatar({ i, name, size = 34 }) {
  const c = PLAYER_COLORS[i % 8];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: c.bg, color: c.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: "bold",
    }}>
      {name?.[0] ?? "?"}
    </div>
  );
}

// ── 메인 앱 ──────────────────────────────────────────────
function GoStopApp() {
  const [gameType, setGameType] = React.useState("gostop");
  const [screen,   setScreen]   = React.useState("setup");
  const [players,  setPlayers]  = React.useState(["플레이어 1", "플레이어 2", "플레이어 3"]);

  // 홀덤
  const [bets,         setBets]         = React.useState([0, 0, 0]);
  const [folded,       setFolded]       = React.useState([false, false, false]);
  const [pot,          setPot]          = React.useState(0);
  const [raiseAmt,     setRaiseAmt]     = React.useState(1000);
  const [winners,      setWinners]      = React.useState([]);
  const [holdemHistory,setHoldemHistory]= React.useState([]);

  // 고스톱
  const [rounds,       setRounds]       = React.useState([]);
  const [inputAmounts, setInputAmounts] = React.useState([0, 0, 0]);
  const [inputError,   setInputError]   = React.useState("");

  const n = players.length;

  const totalAmounts = players.map((_, i) =>
    rounds.reduce((sum, r) => sum + r.amounts[i], 0)
  );

  // ── 공통 ────────────────────────────────────────────────
  function switchGame(type) {
    setGameType(type); setScreen("setup");
    setRounds([]); setInputAmounts(Array(n).fill(0));
    setBets(Array(n).fill(0)); setFolded(Array(n).fill(false));
    setPot(0); setHoldemHistory([]); setWinners([]); setInputError("");
  }

  function addPlayer() {
    if (n >= 8) return;
    setPlayers([...players, `플레이어 ${n + 1}`]);
    setInputAmounts([...inputAmounts, 0]);
    setBets([...bets, 0]);
    setFolded([...folded, false]);
    setWinners([]);
  }

  function removePlayer(i) {
    if (n <= 2) return;
    setPlayers(players.filter((_, j) => j !== i));
    setInputAmounts(inputAmounts.filter((_, j) => j !== i));
    setBets(bets.filter((_, j) => j !== i));
    setFolded(folded.filter((_, j) => j !== i));
    setWinners([]);
  }

  function renamePlayer(i, val) {
    const p = [...players]; p[i] = val; setPlayers(p);
  }

  // ── 고스톱 ──────────────────────────────────────────────
  function adjustAmount(i, delta) {
    const na = [...inputAmounts]; na[i] += delta; setInputAmounts(na);
  }

  function setAmount(i, val) {
    const na = [...inputAmounts]; na[i] = Number(val) || 0; setInputAmounts(na);
  }

  function addRound() {
    if (inputAmounts.every(a => a === 0)) { setInputError("금액을 입력하세요."); return; }
    const sum = inputAmounts.reduce((a, b) => a + b, 0);
    if (sum !== 0) { setInputError(`합계가 0이어야 합니다. 현재: ${sum.toLocaleString()}원`); return; }
    setInputError("");
    setRounds([...rounds, { amounts: [...inputAmounts] }]);
    setInputAmounts(Array(n).fill(0));
  }

  function removeRound(i) { setRounds(rounds.filter((_, j) => j !== i)); }

  // ── 홀덤 ────────────────────────────────────────────────
  function doRaise(i) { const nb = [...bets]; nb[i] += raiseAmt; setBets(nb); }
  function doCall(i)  { const max = Math.max(...bets); const nb = [...bets]; nb[i] = max; setBets(nb); }
  function doFold(i)  { const nf = [...folded]; nf[i] = true; setFolded(nf); }

  function endRound() {
    const sum = bets.reduce((a, b) => a + b, 0);
    if (sum === 0) return;
    setPot(pot + sum);
    setHoldemHistory([...holdemHistory, { bets: [...bets], total: sum, settle: false }]);
    setBets(Array(n).fill(0));
    setFolded(Array(n).fill(false));
  }

  function toggleWinner(i) {
    if (winners.includes(i)) setWinners(winners.filter(w => w !== i));
    else setWinners([...winners, i]);
  }

  function settlePot() {
    if (pot === 0 || winners.length === 0) return;
    const perPerson = Math.floor(pot / n);
    const roundAmts = players.map((_, i) =>
      winners.includes(i) ? Math.floor(pot / winners.length) - perPerson : -perPerson
    );
    const s = roundAmts.reduce((a, b) => a + b, 0);
    if (s !== 0) roundAmts[winners[0]] -= s;
    setRounds([...rounds, { amounts: roundAmts }]);
    setHoldemHistory([...holdemHistory, { settle: true, winnerNames: winners.map(w => players[w]), total: pot, bets: roundAmts }]);
    setPot(0); setWinners([]); setBets(Array(n).fill(0));
  }

  // ── 정산 ────────────────────────────────────────────────
  function calcSettlement() {
    const balances = totalAmounts.map((a, i) => ({ idx: i, amount: a }));
    const d = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);
    const c = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
    const tx = []; let di = 0, ci = 0;
    while (di < d.length && ci < c.length) {
      const pay = Math.min(-d[di].amount, c[ci].amount);
      if (pay > 0) tx.push({ from: d[di].idx, to: c[ci].idx, amount: pay });
      d[di].amount += pay; c[ci].amount -= pay;
      if (d[di].amount === 0) di++;
      if (c[ci].amount === 0) ci++;
    }
    return tx;
  }

  const transactions = screen === "result" ? calcSettlement() : [];
  const maxBet  = Math.max(...bets);
  const betSum  = bets.reduce((a, b) => a + b, 0);
  const inputSum = inputAmounts.reduce((a, b) => a + b, 0);

  // ── 렌더 ────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", maxWidth: 480, padding: "16px 16px 60px", margin: "0 auto" }}>

      {/* 헤더 */}
      <div style={{ textAlign: "center", padding: "24px 0 20px" }}>
        <div style={{ fontSize: 22, fontWeight: "bold", color: C.gold2 }}>🎴 정산기</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>현금 없이 간편하게</div>
      </div>

      {/* 게임 탭 */}
      <div style={{ display: "flex", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, marginBottom: 14, gap: 4 }}>
        {[["gostop","🀄 고스톱"],["holdem","🃏 홀덤"]].map(([type, label]) => (
          <button key={type} onClick={() => switchGame(type)} style={{
            flex: 1, padding: 10, border: gameType === type ? `1px solid ${C.border2}` : "1px solid transparent",
            background: gameType === type ? C.bg3 : "transparent",
            borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: "bold",
            color: gameType === type ? C.gold2 : C.muted, fontFamily: "inherit",
          }}>{label}</button>
        ))}
      </div>

      {/* 화면 탭 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
        {[["setup","참가자"],["game","게임"],["result","정산"]].map(([s, label]) => (
          <button key={s} onClick={() => setScreen(s)} style={{
            flex: 1, padding: "9px 4px", fontSize: 12, fontFamily: "inherit",
            background: screen === s ? "rgba(200,160,80,0.12)" : "transparent",
            color: screen === s ? C.gold2 : C.muted,
            border: screen === s ? `1px solid rgba(200,160,80,0.4)` : `1px solid ${C.border}`,
            borderRadius: 8, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {/* ── 참가자 설정 ── */}
      {screen === "setup" && (
        <div>
          <div style={S.sectionLabel}>참가자 (최대 8명)</div>
          <div style={S.card}>
            {players.map((p, i) => (
              <div key={i} style={{ ...S.playerRow, ...(i === n - 1 ? { borderBottom: "none" } : {}) }}>
                <Avatar i={i} name={p} />
                <input value={p} onChange={e => renamePlayer(i, e.target.value)} style={{
                  flex: 1, border: "none", background: "transparent",
                  color: C.text, fontSize: 14, fontWeight: "bold",
                  borderBottom: `1px solid ${C.border}`, outline: "none",
                  fontFamily: "inherit", paddingBottom: 2,
                }} />
                {n > 2 && (
                  <button onClick={() => removePlayer(i)} style={S.miniBtn(false, "danger")}>삭제</button>
                )}
              </div>
            ))}
          </div>
          {n < 8 && (
            <button onClick={addPlayer} style={{ ...S.miniBtn(false, null), width: "100%", padding: 10, marginBottom: 10 }}>
              + 참가자 추가
            </button>
          )}
          <button onClick={() => setScreen("game")} style={S.primaryBtn}>게임 시작</button>
        </div>
      )}

      {/* ── 고스톱 게임 ── */}
      {screen === "game" && gameType === "gostop" && (
        <div>
          <div style={S.sectionLabel}>판 입력</div>
          <div style={S.card}>
            {players.map((name, i) => (
              <div key={i} style={{ ...S.playerRow, flexDirection: "column", alignItems: "stretch", ...(i === n - 1 ? { borderBottom: "none" } : {}) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Avatar i={i} name={name} size={28} />
                  <span style={{ flex: 1, fontWeight: "bold", fontSize: 14 }}>{name}</span>
                  <input
                    type="number"
                    value={inputAmounts[i] || ""}
                    onChange={e => setAmount(i, e.target.value)}
                    style={{
                      width: 90, padding: "5px 8px", textAlign: "right", fontSize: 14,
                      background: C.bg3, border: `1px solid ${C.border2}`,
                      borderRadius: 8, color: C.text, outline: "none", fontFamily: "inherit",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {AMOUNT_BTNS.map(a => (
                    <button key={a}  onClick={() => adjustAmount(i,  a)} style={S.miniBtn(false, "info")}>+{a.toLocaleString()}</button>
                  ))}
                  {AMOUNT_BTNS.map(a => (
                    <button key={"m"+a} onClick={() => adjustAmount(i, -a)} style={S.miniBtn(false, "danger")}>-{a.toLocaleString()}</button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: inputSum === 0 ? C.green : C.red }}>
                합계: {inputSum > 0 ? "+" : ""}{inputSum.toLocaleString()}원 {inputSum === 0 ? "✓" : ""}
              </span>
              <button onClick={addRound} style={S.miniBtn(false, "success")}>+ 판 추가</button>
            </div>
            {inputError && <div style={{ fontSize: 12, color: C.red, marginTop: 6 }}>{inputError}</div>}
          </div>

          {rounds.length > 0 && (
            <div>
              <div style={S.sectionLabel}>기록 ({rounds.length}판)</div>
              <div style={S.card}>
                <div style={{ display: "flex", fontSize: 11, color: C.muted, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 4 }}>
                  <span style={{ flex: 1 }}>판</span>
                  {players.map((p, i) => <span key={i} style={{ minWidth: 70, textAlign: "right" }}>{p}</span>)}
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {rounds.map((r, ri) => (
                    <div key={ri} style={{ display: "flex", fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                      <span style={{ flex: 1, color: C.muted }}>#{ri + 1}</span>
                      {players.map((_, i) => (
                        <span key={i} style={{ minWidth: 70, textAlign: "right", fontWeight: "bold",
                          color: r.amounts[i] > 0 ? C.green : r.amounts[i] < 0 ? C.red : C.muted }}>
                          {r.amounts[i] > 0 ? "+" : ""}{r.amounts[i].toLocaleString()}
                        </span>
                      ))}
                      <button onClick={() => removeRound(ri)} style={{ ...S.miniBtn(false, "danger"), fontSize: 10, padding: "2px 6px", marginLeft: 6 }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", fontSize: 13, fontWeight: "bold", paddingTop: 8, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
                  <span style={{ flex: 1 }}>합계</span>
                  {totalAmounts.map((a, i) => (
                    <span key={i} style={{ minWidth: 70, textAlign: "right", color: a > 0 ? C.green : a < 0 ? C.red : C.muted }}>
                      {a > 0 ? "+" : ""}{a.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button onClick={() => setScreen("result")} style={S.primaryBtn}>최종 정산 보기</button>
        </div>
      )}

      {/* ── 홀덤 게임 ── */}
      {screen === "game" && gameType === "holdem" && (
        <div>
          {/* 팟 */}
          <div style={{ textAlign: "center", background: "rgba(200,160,80,0.08)", border: `1px solid rgba(200,160,80,0.3)`, borderRadius: 12, padding: 20, marginBottom: 14 }}>
            <div style={{ fontSize: 30, fontWeight: "bold", color: C.gold2 }}>{pot.toLocaleString()}원</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>현재 팟</div>
          </div>

          {/* 베팅 단위 */}
          <div style={{ marginBottom: 14 }}>
            <div style={S.sectionLabel}>베팅 단위</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[500, 1000, 2000, 5000].map(a => (
                <button key={a} onClick={() => setRaiseAmt(a)} style={{ ...S.miniBtn(raiseAmt === a, null), flex: 1, padding: "8px 4px" }}>
                  {a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* 플레이어 베팅 */}
          <div style={S.sectionLabel}>베팅</div>
          <div style={S.card}>
            {players.map((name, i) => (
              <div key={i} style={{ ...S.playerRow, opacity: folded[i] ? 0.4 : 1, ...(i === n - 1 ? { borderBottom: "none" } : {}) }}>
                <Avatar i={i} name={name} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: "bold", fontSize: 14 }}>{name}</span>
                    {folded[i] && <span style={{ fontSize: 10, background: "rgba(224,90,90,0.15)", color: C.red, padding: "1px 7px", borderRadius: 10 }}>폴드</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>베팅: <b style={{ color: C.gold2 }}>{bets[i].toLocaleString()}원</b></div>
                </div>
                {!folded[i] && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => doRaise(i)} style={S.miniBtn(false, null)}>+{raiseAmt.toLocaleString()}</button>
                    {bets[i] < maxBet && <button onClick={() => doCall(i)} style={S.miniBtn(false, "info")}>콜</button>}
                    <button onClick={() => doFold(i)} style={S.miniBtn(false, "danger")}>폴드</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={endRound} disabled={betSum === 0} style={{
            ...S.miniBtn(false, "success"), width: "100%", padding: 11, marginBottom: 14,
            opacity: betSum === 0 ? 0.4 : 1, cursor: betSum === 0 ? "default" : "pointer",
          }}>
            라운드 종료 → 팟에 추가 ({betSum.toLocaleString()}원)
          </button>

          {/* 승자 선택 */}
          {pot > 0 && (
            <div>
              <div style={S.sectionLabel}>승자 선택 후 팟 정산</div>
              <div style={S.card}>
                {players.map((p, i) => !folded[i] && (
                  <div key={i} style={{ ...S.playerRow, ...(i === n - 1 ? { borderBottom: "none" } : {}) }}>
                    <Avatar i={i} name={p} size={28} />
                    <span style={{ flex: 1, fontSize: 14 }}>{p}</span>
                    {winners.includes(i) && <span style={{ fontSize: 11, background: "rgba(78,203,138,0.15)", color: C.green, padding: "2px 8px", borderRadius: 10 }}>승자</span>}
                    <button onClick={() => toggleWinner(i)} style={S.miniBtn(winners.includes(i), winners.includes(i) ? "success" : null)}>
                      {winners.includes(i) ? "선택됨" : "승자 선택"}
                    </button>
                  </div>
                ))}
                <button onClick={settlePot} disabled={winners.length === 0} style={{
                  ...S.miniBtn(false, "success"), width: "100%", padding: 10, marginTop: 10,
                  opacity: winners.length === 0 ? 0.4 : 1, cursor: winners.length === 0 ? "default" : "pointer",
                }}>
                  팟 정산 ({pot.toLocaleString()}원)
                </button>
              </div>
            </div>
          )}

          {/* 홀덤 기록 */}
          {holdemHistory.length > 0 && (
            <div>
              <div style={S.sectionLabel}>진행 기록</div>
              <div style={S.card}>
                <div style={{ maxHeight: 160, overflowY: "auto" }}>
                  {holdemHistory.map((h, i) => (
                    <div key={i} style={{ fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${C.border}`, color: C.muted }}>
                      {h.settle
                        ? <span style={{ color: C.green }}>정산: {h.winnerNames.join(", ")} 승 / {h.total.toLocaleString()}원</span>
                        : `라운드 ${i + 1} — 팟에 ${h.total.toLocaleString()}원 추가`}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button onClick={() => setScreen("result")} style={S.primaryBtn}>최종 정산 보기</button>
        </div>
      )}

      {/* ── 최종 정산 ── */}
      {screen === "result" && (
        <div>
          <div style={S.sectionLabel}>플레이어별 손익</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {players.map((p, i) => (
              <div key={i} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, color: C.muted }}>{p}</div>
                <div style={{ fontSize: 18, fontWeight: "bold", marginTop: 4,
                  color: totalAmounts[i] > 0 ? C.green : totalAmounts[i] < 0 ? C.red : C.muted }}>
                  {totalAmounts[i] > 0 ? "+" : ""}{totalAmounts[i].toLocaleString()}원
                </div>
              </div>
            ))}
          </div>

          <div style={S.sectionLabel}>정산 방법 (최소 이체)</div>
          <div style={S.card}>
            {transactions.length === 0
              ? <div style={{ textAlign: "center", color: C.muted, padding: 24 }}>정산할 내역이 없습니다</div>
              : transactions.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0",
                  borderBottom: i < transactions.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <Avatar i={t.from} name={players[t.from]} size={28} />
                  <span style={{ fontSize: 13, fontWeight: "bold" }}>{players[t.from]}</span>
                  <span style={{ color: C.muted }}>→</span>
                  <Avatar i={t.to} name={players[t.to]} size={28} />
                  <span style={{ fontSize: 13, fontWeight: "bold" }}>{players[t.to]}</span>
                  <span style={{ marginLeft: "auto", fontWeight: "bold", fontSize: 15, color: C.green }}>
                    {t.amount.toLocaleString()}원
                  </span>
                </div>
              ))
            }
          </div>

          <button onClick={() => {
            setRounds([]); setBets(Array(n).fill(0)); setFolded(Array(n).fill(false));
            setPot(0); setHoldemHistory([]); setWinners([]); setScreen("setup");
          }} style={{ ...S.primaryBtn, background: "transparent", border: `1px solid rgba(224,90,90,0.4)`, color: C.red }}>
            새 게임 시작
          </button>
        </div>
      )}

    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(GoStopApp));
