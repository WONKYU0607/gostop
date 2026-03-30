const PLAYER_COLORS = ["#E85D4A","#4A90E8","#2ECC71","#F39C12","#9B59B6","#1ABC9C","#E74C3C","#3498DB","#F1C40F","#E67E22"];
const AMOUNT_BTNS = [100, 500, 1000, 5000];

function GoStopApp() {

  const [gameType, setGameType] = React.useState("gostop");
  const [screen, setScreen] = React.useState("setup");

  const [players, setPlayers] = React.useState(["플레이어 1","플레이어 2","플레이어 3"]);

  // 홀덤 상태
  const [bets, setBets] = React.useState([0,0,0]);
  const [folded, setFolded] = React.useState([false,false,false]);
  const [pot, setPot] = React.useState(0);
  const [raiseAmt, setRaiseAmt] = React.useState(1000);
  const [winners, setWinners] = React.useState([]);
  const [holdemHistory, setHoldemHistory] = React.useState([]);

  // 고스톱 상태
  const [rounds, setRounds] = React.useState([]);
  const [inputAmounts, setInputAmounts] = React.useState([0,0,0]);
  const [inputError, setInputError] = React.useState("");

  const n = players.length;

  const totalAmounts = players.map((_, i) =>
    rounds.reduce((sum, r) => sum + r.amounts[i], 0)
  );

  // ── 공통 ──────────────────────────────────────────────

  function switchGame(type) {
    setGameType(type);
    setScreen("setup");
    setRounds([]);
    setInputAmounts(Array(n).fill(0));
    setBets(Array(n).fill(0));
    setFolded(Array(n).fill(false));
    setPot(0);
    setHoldemHistory([]);
    setWinners([]);
    setInputError("");
  }

  function addPlayer() {
    if (players.length >= 8) return;
    const newN = players.length + 1;
    setPlayers([...players, `플레이어 ${newN}`]);
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
    const p = [...players];
    p[i] = val;
    setPlayers(p);
  }

  // ── 고스톱 ────────────────────────────────────────────

  function adjustAmount(i, delta) {
    const na = [...inputAmounts];
    na[i] += delta;
    setInputAmounts(na);
  }

  function setAmount(i, val) {
    const na = [...inputAmounts];
    na[i] = Number(val) || 0;
    setInputAmounts(na);
  }

  function addRound() {
    const sum = inputAmounts.reduce((a, b) => a + b, 0);
    // [버그수정] 원본은 sum !== 0 일때 return 이라 항상 막혔음 → sum === 0 일때만 통과
    if (inputAmounts.every(a => a === 0)) { setInputError("금액을 입력하세요."); return; }
    if (sum !== 0) { setInputError(`합계가 0이어야 합니다. 현재: ${sum.toLocaleString()}원`); return; }
    setInputError("");
    setRounds([...rounds, { amounts: [...inputAmounts] }]);
    setInputAmounts(Array(n).fill(0));
  }

  function removeRound(i) {
    setRounds(rounds.filter((_, j) => j !== i));
  }

  // ── 홀덤 ──────────────────────────────────────────────

  function doRaise(i) {
    const nb = [...bets];
    nb[i] += raiseAmt;
    setBets(nb);
  }

  function doCall(i) {
    const max = Math.max(...bets);
    const nb = [...bets];
    nb[i] = max;
    setBets(nb);
  }

  function doFold(i) {
    const nf = [...folded];
    nf[i] = true;
    setFolded(nf);
  }

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
    const roundAmts = players.map((_, i) => {
      if (winners.includes(i)) {
        return Math.floor(pot / winners.length) - perPerson;
      }
      return -perPerson;
    });
    // zero-sum 보정
    const s = roundAmts.reduce((a, b) => a + b, 0);
    if (s !== 0) roundAmts[winners[0]] -= s;

    setRounds([...rounds, { amounts: roundAmts }]);
    setHoldemHistory([...holdemHistory, {
      settle: true,
      winnerNames: winners.map(w => players[w]),
      total: pot,
      bets: roundAmts
    }]);
    setPot(0);
    setWinners([]);
    setBets(Array(n).fill(0));
  }

  // ── 정산 ──────────────────────────────────────────────

  function calcSettlement() {
    const balances = totalAmounts.map((a, i) => ({ idx: i, amount: a }));
    const d = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);
    const c = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
    const transactions = [];
    let di = 0, ci = 0;

    while (di < d.length && ci < c.length) {
      const pay = Math.min(-d[di].amount, c[ci].amount);
      if (pay > 0) transactions.push({ from: d[di].idx, to: c[ci].idx, amount: pay });
      d[di].amount += pay;
      c[ci].amount -= pay;
      if (d[di].amount === 0) di++;
      if (c[ci].amount === 0) ci++;
    }
    return transactions;
  }

  const transactions = screen === "result" ? calcSettlement() : [];
  const maxBet = Math.max(...bets);
  const betSum = bets.reduce((a, b) => a + b, 0);
  const inputSum = inputAmounts.reduce((a, b) => a + b, 0);

  // ── 렌더 ──────────────────────────────────────────────

  return (
    <div style={{ padding: 20, maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif" }}>

      {/* 게임 선택 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => switchGame("gostop")}
          style={{ flex: 1, padding: "10px", fontWeight: gameType === "gostop" ? "bold" : "normal",
            background: gameType === "gostop" ? "#222" : "#f5f5f5", color: gameType === "gostop" ? "#fff" : "#333",
            border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" }}
        >🀄 고스톱</button>
        <button
          onClick={() => switchGame("holdem")}
          style={{ flex: 1, padding: "10px", fontWeight: gameType === "holdem" ? "bold" : "normal",
            background: gameType === "holdem" ? "#222" : "#f5f5f5", color: gameType === "holdem" ? "#fff" : "#333",
            border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" }}
        >🃏 홀덤</button>
      </div>

      {/* 화면 선택 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
        {["setup","game","result"].map(s => (
          <button key={s}
            onClick={() => setScreen(s)}
            style={{ flex: 1, padding: "8px 4px", fontSize: 12,
              background: screen === s ? "#4A90E8" : "#f0f0f0",
              color: screen === s ? "#fff" : "#555",
              border: "none", borderRadius: 8, cursor: "pointer" }}
          >
            { s === "setup" ? "참가자" : s === "game" ? "게임" : "정산" }
          </button>
        ))}
      </div>

      {/* ── 참가자 설정 ── */}
      {screen === "setup" && (
        <div>
          {players.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: PLAYER_COLORS[i % 10] + "33", color: PLAYER_COLORS[i % 10],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: "bold"
              }}>{p[0]}</div>
              <input
                value={p}
                onChange={e => renamePlayer(i, e.target.value)}
                style={{ flex: 1, padding: "6px 10px", border: "1px solid #ccc", borderRadius: 8, fontSize: 14 }}
              />
              {n > 2 && (
                <button onClick={() => removePlayer(i)}
                  style={{ padding: "6px 10px", background: "#fee", color: "#e05", border: "1px solid #fcc", borderRadius: 8, cursor: "pointer" }}>
                  삭제
                </button>
              )}
            </div>
          ))}
          {n < 8 && (
            <button onClick={addPlayer}
              style={{ width: "100%", padding: 10, marginBottom: 10, background: "#f5f5f5", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer" }}>
              + 참가자 추가
            </button>
          )}
          <button onClick={() => setScreen("game")}
            style={{ width: "100%", padding: 12, background: "#222", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
            게임 시작
          </button>
        </div>
      )}

      {/* ── 고스톱 게임 ── */}
      {screen === "game" && gameType === "gostop" && (
        <div>
          <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            {players.map((name, i) => (
              <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < n - 1 ? "1px solid #eee" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: PLAYER_COLORS[i % 10] + "33", color: PLAYER_COLORS[i % 10],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: "bold", flexShrink: 0
                  }}>{name[0]}</div>
                  <span style={{ fontWeight: "bold", fontSize: 14 }}>{name}</span>
                  <input
                    type="number"
                    value={inputAmounts[i] || ""}
                    onChange={e => setAmount(i, e.target.value)}
                    style={{ marginLeft: "auto", width: 90, padding: "4px 8px", border: "1px solid #ccc", borderRadius: 6, textAlign: "right", fontSize: 14 }}
                  />
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {AMOUNT_BTNS.map(a => (
                    <button key={a} onClick={() => adjustAmount(i, a)}
                      style={{ padding: "4px 8px", fontSize: 12, background: "#eef", border: "1px solid #ccf", borderRadius: 6, cursor: "pointer" }}>
                      +{a.toLocaleString()}
                    </button>
                  ))}
                  {AMOUNT_BTNS.map(a => (
                    <button key={"m"+a} onClick={() => adjustAmount(i, -a)}
                      style={{ padding: "4px 8px", fontSize: 12, background: "#fee", border: "1px solid #fcc", borderRadius: 6, cursor: "pointer" }}>
                      -{a.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8 }}>
              <span style={{ fontSize: 13, color: inputSum === 0 ? "#2a9" : "#e05" }}>
                합계: {inputSum > 0 ? "+" : ""}{inputSum.toLocaleString()}원 {inputSum === 0 ? "✓" : "← 0이 되어야 함"}
              </span>
              <button onClick={addRound}
                style={{ padding: "8px 16px", background: "#2ECC71", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
                판 추가
              </button>
            </div>
            {inputError && <div style={{ color: "#e05", fontSize: 12, marginTop: 6 }}>{inputError}</div>}
          </div>

          {/* 기록 */}
          {rounds.length > 0 && (
            <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>기록 ({rounds.length}판)</div>
              <div style={{ display: "flex", fontSize: 11, color: "#aaa", borderBottom: "1px solid #eee", paddingBottom: 6, marginBottom: 4 }}>
                <span style={{ flex: 1 }}>판</span>
                {players.map((p, i) => <span key={i} style={{ minWidth: 70, textAlign: "right" }}>{p}</span>)}
              </div>
              <div style={{ maxHeight: 200, overflowY: "auto" }}>
                {rounds.map((r, ri) => (
                  <div key={ri} style={{ display: "flex", fontSize: 12, padding: "5px 0", borderBottom: "1px solid #f0f0f0", alignItems: "center" }}>
                    <span style={{ flex: 1, color: "#888" }}>#{ri + 1}</span>
                    {players.map((_, i) => (
                      <span key={i} style={{ minWidth: 70, textAlign: "right", fontWeight: "bold",
                        color: r.amounts[i] > 0 ? "#2a9" : r.amounts[i] < 0 ? "#e05" : "#aaa" }}>
                        {r.amounts[i] > 0 ? "+" : ""}{r.amounts[i].toLocaleString()}
                      </span>
                    ))}
                    <button onClick={() => removeRound(ri)}
                      style={{ marginLeft: 8, fontSize: 10, padding: "2px 6px", background: "#fee", color: "#e05", border: "1px solid #fcc", borderRadius: 4, cursor: "pointer" }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", fontSize: 13, fontWeight: "bold", paddingTop: 8, borderTop: "1px solid #eee", marginTop: 4 }}>
                <span style={{ flex: 1 }}>합계</span>
                {totalAmounts.map((a, i) => (
                  <span key={i} style={{ minWidth: 70, textAlign: "right", color: a > 0 ? "#2a9" : a < 0 ? "#e05" : "#aaa" }}>
                    {a > 0 ? "+" : ""}{a.toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setScreen("result")}
            style={{ width: "100%", padding: 12, background: "#222", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
            최종 정산 보기
          </button>
        </div>
      )}

      {/* ── 홀덤 게임 ── */}
      {screen === "game" && gameType === "holdem" && (
        <div>
          {/* 팟 */}
          <div style={{ textAlign: "center", background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 28, fontWeight: "bold", color: "#d48806" }}>💰 {pot.toLocaleString()}원</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>현재 팟</div>
          </div>

          {/* 베팅 단위 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>베팅 단위</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[500, 1000, 2000, 5000].map(a => (
                <button key={a} onClick={() => setRaiseAmt(a)}
                  style={{ flex: 1, padding: "7px 4px", fontSize: 12,
                    background: raiseAmt === a ? "#4A90E8" : "#f0f0f0",
                    color: raiseAmt === a ? "#fff" : "#555",
                    border: "none", borderRadius: 8, cursor: "pointer", fontWeight: raiseAmt === a ? "bold" : "normal" }}>
                  {a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* 플레이어 베팅 */}
          <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            {players.map((name, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0",
                borderBottom: i < n - 1 ? "1px solid #eee" : "none", opacity: folded[i] ? 0.4 : 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: PLAYER_COLORS[i % 10] + "33", color: PLAYER_COLORS[i % 10],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: "bold"
                }}>{name[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: 14 }}>
                    {name}
                    {folded[i] && <span style={{ marginLeft: 6, fontSize: 10, background: "#fee", color: "#e05",
                      padding: "1px 6px", borderRadius: 10 }}>폴드</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#888" }}>베팅: <b style={{ color: "#333" }}>{bets[i].toLocaleString()}원</b></div>
                </div>
                {!folded[i] && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => doRaise(i)}
                      style={{ padding: "5px 10px", fontSize: 12, background: "#eef", border: "1px solid #ccf", borderRadius: 6, cursor: "pointer" }}>
                      +{raiseAmt.toLocaleString()}
                    </button>
                    {bets[i] < maxBet && (
                      <button onClick={() => doCall(i)}
                        style={{ padding: "5px 10px", fontSize: 12, background: "#e8f4ff", border: "1px solid #4A90E8", borderRadius: 6, cursor: "pointer", color: "#4A90E8" }}>
                        콜
                      </button>
                    )}
                    <button onClick={() => doFold(i)}
                      style={{ padding: "5px 10px", fontSize: 12, background: "#fee", border: "1px solid #fcc", borderRadius: 6, cursor: "pointer", color: "#e05" }}>
                      폴드
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={endRound} disabled={betSum === 0}
            style={{ width: "100%", padding: 11, marginBottom: 16,
              background: betSum > 0 ? "#2ECC71" : "#ccc", color: "#fff",
              border: "none", borderRadius: 8, cursor: betSum > 0 ? "pointer" : "default", fontWeight: "bold" }}>
            라운드 종료 → 팟에 추가 ({betSum.toLocaleString()}원)
          </button>

          {/* 승자 선택 */}
          {pot > 0 && (
            <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>승자 선택 후 팟 정산</div>
              {players.map((p, i) => !folded[i] && (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0",
                  borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: PLAYER_COLORS[i % 10] + "33", color: PLAYER_COLORS[i % 10],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: "bold"
                  }}>{p[0]}</div>
                  <span style={{ flex: 1, fontSize: 14 }}>{p}</span>
                  {winners.includes(i) && <span style={{ fontSize: 11, background: "#e6fff2", color: "#2a9",
                    padding: "2px 8px", borderRadius: 10 }}>승자</span>}
                  <button onClick={() => toggleWinner(i)}
                    style={{ padding: "5px 12px", fontSize: 12,
                      background: winners.includes(i) ? "#2ECC71" : "#f0f0f0",
                      color: winners.includes(i) ? "#fff" : "#555",
                      border: "none", borderRadius: 6, cursor: "pointer" }}>
                    {winners.includes(i) ? "선택됨" : "승자 선택"}
                  </button>
                </div>
              ))}
              <button onClick={settlePot} disabled={winners.length === 0}
                style={{ width: "100%", padding: 10, marginTop: 12,
                  background: winners.length > 0 ? "#F39C12" : "#ccc",
                  color: "#fff", border: "none", borderRadius: 8,
                  cursor: winners.length > 0 ? "pointer" : "default", fontWeight: "bold" }}>
                팟 정산 ({pot.toLocaleString()}원)
              </button>
            </div>
          )}

          {/* 홀덤 기록 */}
          {holdemHistory.length > 0 && (
            <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>진행 기록</div>
              <div style={{ maxHeight: 160, overflowY: "auto" }}>
                {holdemHistory.map((h, i) => (
                  <div key={i} style={{ fontSize: 12, padding: "5px 0", borderBottom: "1px solid #f0f0f0", color: "#666" }}>
                    {h.settle
                      ? `정산: ${h.winnerNames.join(", ")} 승 / 팟 ${h.total.toLocaleString()}원`
                      : `라운드 ${i + 1} — 팟에 ${h.total.toLocaleString()}원 추가`}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setScreen("result")}
            style={{ width: "100%", padding: 12, background: "#222", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
            최종 정산 보기
          </button>
        </div>
      )}

      {/* ── 최종 정산 ── */}
      {screen === "result" && (
        <div>
          {/* 손익 요약 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {players.map((p, i) => (
              <div key={i} style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#888" }}>{p}</div>
                <div style={{ fontSize: 18, fontWeight: "bold", marginTop: 4,
                  color: totalAmounts[i] > 0 ? "#2a9" : totalAmounts[i] < 0 ? "#e05" : "#aaa" }}>
                  {totalAmounts[i] > 0 ? "+" : ""}{totalAmounts[i].toLocaleString()}원
                </div>
              </div>
            ))}
          </div>

          {/* 이체 내역 */}
          <div style={{ background: "#f9f9f9", border: "1px solid #eee", borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>정산 방법 (최소 이체)</div>
            {transactions.length === 0
              ? <div style={{ textAlign: "center", color: "#aaa", padding: 20 }}>정산할 내역이 없습니다</div>
              : transactions.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0",
                  borderBottom: i < transactions.length - 1 ? "1px solid #eee" : "none" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: PLAYER_COLORS[t.from % 10] + "33", color: PLAYER_COLORS[t.from % 10],
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold"
                  }}>{players[t.from][0]}</div>
                  <span style={{ fontSize: 13, fontWeight: "bold" }}>{players[t.from]}</span>
                  <span style={{ color: "#aaa" }}>→</span>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: PLAYER_COLORS[t.to % 10] + "33", color: PLAYER_COLORS[t.to % 10],
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold"
                  }}>{players[t.to][0]}</div>
                  <span style={{ fontSize: 13, fontWeight: "bold" }}>{players[t.to]}</span>
                  <span style={{ marginLeft: "auto", fontWeight: "bold", fontSize: 15, color: "#2a9" }}>
                    {t.amount.toLocaleString()}원
                  </span>
                </div>
              ))
            }
          </div>

          <button onClick={() => {
            setRounds([]);
            setBets(Array(n).fill(0));
            setFolded(Array(n).fill(false));
            setPot(0);
            setHoldemHistory([]);
            setWinners([]);
            setScreen("setup");
          }}
            style={{ width: "100%", padding: 12, background: "#fee", color: "#e05",
              border: "1px solid #fcc", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
            새 게임 시작
          </button>
        </div>
      )}

    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(GoStopApp));
