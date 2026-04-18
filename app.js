// ── localStorage 자동저장 ────────────────────────────────
const SAVE_KEY = "gostop_autosave_v1";
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
}
function writeSave(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {}
}

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
  purple:  "#b07ff0",
};

const S = {
  card: {
    background: C.bg2,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: 8,
  },
  playerRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 0",
    borderBottom: `1px solid ${C.border}`,
  },
  primaryBtn: {
    width: "100%",
    padding: 11,
    border: "none",
    borderRadius: 10,
    background: C.gold,
    color: "#1a0a00",
    fontSize: 14,
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: 8,
    fontFamily: "inherit",
    letterSpacing: "0.3px",
  },
  miniBtn: (active, variant) => ({
    padding: "5px 8px",
    border: `1px solid ${
      variant === "danger"  ? "rgba(224,90,90,0.4)"   :
      variant === "success" ? "rgba(78,203,138,0.4)"  :
      variant === "info"    ? "rgba(90,158,240,0.4)"  :
      variant === "purple"  ? "rgba(176,127,240,0.4)" :
      active                ? C.border2 : C.border
    }`,
    background: active ? "rgba(200,160,80,0.15)" : C.bg3,
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 12,
    color: variant === "danger"  ? C.red    :
           variant === "success" ? C.green  :
           variant === "info"    ? C.blue   :
           variant === "purple"  ? C.purple :
           active ? C.gold2 : C.text,
    whiteSpace: "nowrap",
    fontFamily: "inherit",
  }),
};

function Avatar({ i, name, size = 28 }) {
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

// ──────────────────────────────────────────────────────────
// 홀덤 헬퍼
// ──────────────────────────────────────────────────────────
function activePlayers(folded, n) {
  return Array.from({ length: n }, (_, i) => i).filter(i => !folded[i]);
}
function activeNonAllin(folded, allin, n) {
  return activePlayers(folded, n).filter(i => !allin[i]);
}
function getMaxBet(bets) {
  return Math.max(...bets);
}
function nextActive(folded, allin, fromIdx, n) {
  let idx = (fromIdx + 1) % n;
  for (let t = 0; t < n; t++) {
    if (!folded[idx] && !allin[idx]) return idx;
    idx = (idx + 1) % n;
  }
  return -1;
}
function isBettingDone(bets, folded, allin, n) {
  const active = activeNonAllin(folded, allin, n);
  if (active.length <= 1) return true;
  const mb = getMaxBet(bets);
  return active.every(i => bets[i] === mb);
}
function streetLabel(s) {
  return { preflop:"프리플랍", flop:"플랍", turn:"턴", river:"리버", showdown:"쇼다운" }[s] || s;
}

// ──────────────────────────────────────────────────────────
// 메인 앱
// ──────────────────────────────────────────────────────────
function GoStopApp() {
  const _s = React.useMemo(() => loadSave(), []);

  const [gameType, setGameType] = React.useState(_s.gameType || "gostop");
  const [screen,   setScreen]   = React.useState("setup");
  const [players,  setPlayers]  = React.useState(_s.players || ["플레이어 1", "플레이어 2", "플레이어 3"]);

  // ── 고스톱 state ────
  const [rounds,       setRounds]       = React.useState(_s.rounds || []);
  const [inputAmounts, setInputAmounts] = React.useState(Array((_s.players || ["","",""]).length).fill(0));
  const [inputError,   setInputError]   = React.useState("");

  // ── 홀덤 설정 state ────
  const [blinds,    setBlinds]    = React.useState(_s.blinds    || { small: 500, big: 1000 });
  const [anteAmt,   setAnteAmt]   = React.useState(_s.anteAmt   ?? 0);
  const [dealerIdx, setDealerIdx] = React.useState(_s.dealerIdx || 0);
  const [buyIns,    setBuyIns]    = React.useState(_s.buyIns    || Array((_s.players || ["","",""]).length).fill(0)); // 플레이어별 바이인

  // ── 홀덤 게임 state ────
  // street: preflop|flop|turn|river|showdown
  const [street,      setStreet]      = React.useState("preflop");
  const [pot,         setPot]         = React.useState(0);
  const [bets,        setBets]        = React.useState([]);   // 이번 스트리트
  const [totalBets,   setTotalBets]   = React.useState([]);   // 핸드 전체
  const [folded,      setFolded]      = React.useState([]);
  const [allin,       setAllin]       = React.useState([]);
  const [actionIdx,   setActionIdx]   = React.useState(-1);
  const [lastRaiser,  setLastRaiser]  = React.useState(-1);
  const [sbIdx,       setSbIdx]       = React.useState(1);
  const [bbIdx,       setBbIdx]       = React.useState(2);
  const [handActive,  setHandActive]  = React.useState(false);
  const [handOver,    setHandOver]    = React.useState(false);
  const [autoWinner,  setAutoWinner]  = React.useState([]);
  const [showdownWinners, setShowdownWinners] = React.useState([]);
  const [handHistory, setHandHistory] = React.useState(_s.handHistory || []);
  const [actionLog,   setActionLog]   = React.useState([]);
  const [raiseInput,  setRaiseInput]  = React.useState("");
  const [boardStage,  setBoardStage]  = React.useState(0); // 0,3,4,5

  const n = players.length;

  // ── 자동저장 ────────────────────────────────────────────
  React.useEffect(() => {
    writeSave({ gameType, players, rounds, handHistory, buyIns, blinds, anteAmt, dealerIdx });
  }, [gameType, players, rounds, handHistory, buyIns, blinds, anteAmt, dealerIdx]);

  // ── 정산 합계 ────
  const totalAmounts = React.useMemo(() => {
    const arr = Array(players.length).fill(0);
    handHistory.forEach(h => {
      h.settlement.forEach((amt, i) => { arr[i] = (arr[i] || 0) + amt; });
    });
    return arr;
  }, [handHistory, players.length]);

  const gostopTotals = players.map((_, i) =>
    rounds.reduce((sum, r) => sum + (r.amounts[i] || 0), 0)
  );

  // ── 공통 ────────────────────────────────────────────────
  function switchGame(type) {
    setGameType(type); setScreen("setup");
    setRounds([]); setInputAmounts(Array(players.length).fill(0));
    resetHand(); setHandHistory([]); setInputError("");
    setBuyIns(Array(players.length).fill(0));
  }

  function addPlayer() {
    if (n >= 8) return;
    setPlayers([...players, `플레이어 ${n + 1}`]);
    setInputAmounts([...inputAmounts, 0]);
    setBuyIns([...buyIns, 0]);
  }
  function removePlayer(i) {
    if (n <= 2) return;
    setPlayers(players.filter((_, j) => j !== i));
    setInputAmounts(inputAmounts.filter((_, j) => j !== i));
    setBuyIns(buyIns.filter((_, j) => j !== i));
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
  const inputSum = inputAmounts.reduce((a, b) => a + b, 0);

  // ── 홀덤: 핸드 초기화 ──────────────────────────────────
  function resetHand() {
    setHandActive(false); setHandOver(false);
    setStreet("preflop"); setPot(0);
    setBets([]); setTotalBets([]); setFolded([]); setAllin([]);
    setActionIdx(-1); setLastRaiser(-1);
    setAutoWinner([]); setShowdownWinners([]);
    setActionLog([]); setRaiseInput(""); setBoardStage(0);
  }

  function startHoldemHand() {
    const nn = players.length;
    const sb = (dealerIdx + 1) % nn;
    const bb = (dealerIdx + 2) % nn;
    const initBets       = Array(nn).fill(0);
    const initTotalBets  = Array(nn).fill(0);
    const initFolded     = Array(nn).fill(false);
    const initAllin      = Array(nn).fill(false);
    let   initPot        = 0;
    const log = [];

    // 앤티
    if (anteAmt > 0) {
      for (let i = 0; i < nn; i++) initTotalBets[i] += anteAmt;
      initPot += anteAmt * nn;
      log.push({ player: -1, action: "앤티", amount: anteAmt * nn });
    }

    // SB / BB (블라인드 없음이면 스킵)
    let firstAction, lastRaiserInit;
    if (blinds.small === 0) {
      firstAction    = (dealerIdx + 1) % nn;
      lastRaiserInit = firstAction;
    } else {
      initBets[sb]      = blinds.small;  initTotalBets[sb]  += blinds.small;
      initBets[bb]      = blinds.big;    initTotalBets[bb]  += blinds.big;
      initPot          += blinds.small + blinds.big;
      log.push({ player: sb, action: "SB", amount: blinds.small });
      log.push({ player: bb, action: "BB", amount: blinds.big });
      let utg = (bb + 1) % nn;
      let tries = 0;
      while ((initFolded[utg] || initAllin[utg]) && tries < nn) {
        utg = (utg + 1) % nn; tries++;
      }
      firstAction    = utg;
      lastRaiserInit = bb;
    }

    setSbIdx(blinds.small === 0 ? -1 : sb);
    setBbIdx(blinds.small === 0 ? -1 : bb);
    setBets(initBets); setTotalBets(initTotalBets);
    setFolded(initFolded); setAllin(initAllin);
    setPot(initPot); setStreet("preflop");
    setActionIdx(firstAction); setLastRaiser(lastRaiserInit);
    setActionLog(log); setHandActive(true); setHandOver(false);
    setAutoWinner([]); setShowdownWinners([]);
    setBoardStage(0); setRaiseInput("");
    setScreen("game");
  }

  // ── 홀덤: 스트리트 전환 ─────────────────────────────────
  function advanceStreetState(newBets, newTotalBets, newFolded, newAllin, newPot, newLog) {
    const nn = players.length;
    const alive = activePlayers(newFolded, nn);

    if (alive.length === 1) {
      // 한 명 자동 승리
      setAutoWinner(alive);
      setBets(newBets); setTotalBets(newTotalBets);
      setFolded(newFolded); setAllin(newAllin);
      setPot(newPot); setActionLog(newLog);
      setHandOver(true); setActionIdx(-1);
      return;
    }

    const streets = ["preflop","flop","turn","river","showdown"];
    const curIdx  = streets.indexOf(street);
    const next    = streets[curIdx + 1] || "showdown";

    // 보드 스테이지
    if (next === "flop")  setBoardStage(3);
    if (next === "turn")  setBoardStage(4);
    if (next === "river" || next === "showdown") setBoardStage(5);

    if (next === "showdown") {
      setBets(newBets); setTotalBets(newTotalBets);
      setFolded(newFolded); setAllin(newAllin);
      setPot(newPot); setActionLog(newLog);
      setStreet("showdown"); setHandOver(true); setActionIdx(-1);
      return;
    }

    // 포스트플랍: SB부터 시작
    const clearedBets = Array(nn).fill(0);
    let startIdx = (dealerIdx + 1) % nn;
    let t2 = 0;
    while ((newFolded[startIdx] || newAllin[startIdx]) && t2 < nn) {
      startIdx = (startIdx + 1) % nn; t2++;
    }
    const nonAllin = activeNonAllin(newFolded, newAllin, nn);
    if (nonAllin.length <= 1) {
      // 모두 올인 → 쇼다운
      setBets(clearedBets); setTotalBets(newTotalBets);
      setFolded(newFolded); setAllin(newAllin);
      setPot(newPot); setActionLog(newLog);
      setStreet("showdown"); setHandOver(true); setActionIdx(-1);
      return;
    }

    setBets(clearedBets); setTotalBets(newTotalBets);
    setFolded(newFolded); setAllin(newAllin);
    setPot(newPot); setStreet(next);
    setActionIdx(startIdx); setLastRaiser(startIdx);
    setActionLog(newLog); setRaiseInput("");
  }

  // ── 홀덤: 액션 처리 ─────────────────────────────────────
  function doAction(action) {
    const nn     = players.length;
    const i      = actionIdx;
    const mb     = getMaxBet(bets);
    const callAmt = mb - bets[i];

    const nb  = [...bets];
    const ntb = [...totalBets];
    const nf  = [...folded];
    const na  = [...allin];
    let   np  = pot;
    const log = [...actionLog];

    if (action === "fold") {
      nf[i] = true;
      log.push({ player: i, action: "다이", amount: 0 });

    } else if (action === "check") {
      log.push({ player: i, action: "체크", amount: 0 });

    } else if (action === "call") {
      nb[i]  += callAmt;
      ntb[i] += callAmt;
      np     += callAmt;
      log.push({ player: i, action: "콜", amount: callAmt });

    } else if (action === "raise") {
      const raiseBy = parseInt(raiseInput) || blinds.big;
      const total   = callAmt + raiseBy;
      nb[i]  += total;
      ntb[i] += total;
      np     += total;
      setLastRaiser(i);
      log.push({ player: i, action: `레이즈 +${raiseBy.toLocaleString()}`, amount: total });

    } else if (action === "allin") {
      // buyIns 기준 실제 남은 칩 계산 (이전 핸드 손익 포함)
      const prevPnl    = totalAmounts[i] || 0;
      const myBuyIn    = buyIns[i] || 0;
      const stackLeft  = myBuyIn > 0 ? (myBuyIn + prevPnl - ntb[i]) : 0;
      const allinAmt   = myBuyIn > 0 ? Math.max(stackLeft, callAmt) : callAmt;
      nb[i]  += allinAmt;
      ntb[i] += allinAmt;
      np     += allinAmt;
      na[i]   = true;
      log.push({ player: i, action: "올인!", amount: nb[i] });
    }

    // 다음 플레이어
    const nextIdx = nextActive(nf, na, i, nn);
    const alive   = activePlayers(nf, nn);

    if (alive.length === 1) {
      setAutoWinner(alive);
      setBets(nb); setTotalBets(ntb); setFolded(nf); setAllin(na);
      setPot(np); setActionLog(log);
      setHandOver(true); setActionIdx(-1);
      setRaiseInput("");
      return;
    }

    // 베팅 종료 조건: 모든 active non-allin이 같은 금액 && 다음 차례가 라스트레이저이거나 없음
    const roundDone = isBettingDone(nb, nf, na, nn) &&
      (nextIdx === lastRaiser || nextIdx === -1 ||
       activeNonAllin(nf, na, nn).length <= 1);

    if (roundDone) {
      advanceStreetState(nb, ntb, nf, na, np, log);
    } else {
      setBets(nb); setTotalBets(ntb); setFolded(nf); setAllin(na);
      setPot(np); setActionIdx(nextIdx); setActionLog(log);
      setRaiseInput("");
    }
  }

  // ── 홀덤: 팟 정산 ──────────────────────────────────────
  function settleHand() {
    const nn = players.length;
    const ws = autoWinner.length > 0 ? autoWinner : showdownWinners;
    if (ws.length === 0) return;

    const settlement = Array(nn).fill(0);
    const perWinner  = Math.floor(pot / ws.length);
    ws.forEach(w => { settlement[w] += perWinner; });
    for (let i = 0; i < nn; i++) settlement[i] -= totalBets[i];
    const rem = pot - perWinner * ws.length;
    if (rem > 0) settlement[ws[0]] += rem;

    setHandHistory([...handHistory, {
      pot, winners: ws,
      winnerNames: ws.map(w => players[w]),
      totalBets: [...totalBets],
      settlement,
    }]);

    // 다음 핸드: 딜러 버튼 이동
    setDealerIdx((dealerIdx + 1) % nn);
    resetHand();
    setScreen("setup");
  }

  // ── 정산 계산 ───────────────────────────────────────────
  function calcSettlement(amounts) {
    const balances = amounts.map((a, i) => ({ idx: i, amount: a }));
    const d = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);
    const c = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
    const tx = []; let di = 0, ci = 0;
    while (di < d.length && ci < c.length) {
      const pay = Math.min(-d[di].amount, c[ci].amount);
      if (pay > 0) tx.push({ from: d[di].idx, to: c[ci].idx, amount: pay });
      d[di].amount += pay; c[ci].amount -= pay;
      if (Math.abs(d[di].amount) < 1) di++;
      if (Math.abs(c[ci].amount) < 1) ci++;
    }
    return tx;
  }

  // ──────────────────────────────────────────────────────────
  // 렌더
  // ──────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", maxWidth: "100vw", boxSizing: "border-box", padding: "12px 12px 80px", margin: "0 auto",
      background: C.bg1, minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: C.text, overflowX: "hidden" }}>

      {/* 헤더 */}
      <div style={{ textAlign: "center", padding: "12px 0 10px" }}>
        <div style={{ fontSize: 22, fontWeight: "bold", color: C.gold2 }}>🎴🃏 정산기</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>현금 없이 간편하게</div>
      </div>

      {/* 게임 탭 */}
      <div style={{ display: "flex", background: C.bg2, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 4, marginBottom: 10, gap: 4 }}>
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
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[["setup","설정"],["game","게임"],["result","정산"]].map(([s, label]) => (
          <button key={s} onClick={() => setScreen(s)} style={{
            flex: 1, padding: "9px 4px", fontSize: 12, fontFamily: "inherit",
            background: screen === s ? "rgba(200,160,80,0.12)" : "transparent",
            color: screen === s ? C.gold2 : C.muted,
            border: screen === s ? `1px solid rgba(200,160,80,0.4)` : `1px solid ${C.border}`,
            borderRadius: 8, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {/* ══════════════════════════════════════
          설정 화면
      ══════════════════════════════════════ */}
      {screen === "setup" && (
        <div>
          <div style={S.sectionLabel}>참가자 (최대 8명)</div>
          <div style={S.card}>
            {players.map((p, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < n - 1 ? `1px solid ${C.border}` : "none" }}>
                {/* 윗줄: 아바타 + 배지 + 이름 입력 */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar i={i} name={p} />
                  {gameType === "holdem" && dealerIdx === i &&
                    <span style={{ fontSize: 9, background: "rgba(200,160,80,0.2)", color: C.gold2,
                      padding: "1px 5px", borderRadius: 8, flexShrink: 0 }}>D</span>}
                  {gameType === "holdem" && ((dealerIdx + 1) % n) === i &&
                    <span style={{ fontSize: 9, background: "rgba(90,158,240,0.15)", color: C.blue,
                      padding: "1px 5px", borderRadius: 8, flexShrink: 0 }}>SB</span>}
                  {gameType === "holdem" && ((dealerIdx + 2) % n) === i &&
                    <span style={{ fontSize: 9, background: "rgba(78,203,138,0.15)", color: C.green,
                      padding: "1px 5px", borderRadius: 8, flexShrink: 0 }}>BB</span>}
                  <input value={p} onChange={e => renamePlayer(i, e.target.value)} style={{
                    flex: 1, minWidth: 0, border: "none", background: "transparent", color: C.text,
                    fontSize: 14, fontWeight: "bold", borderBottom: `1px solid ${C.border}`,
                    outline: "none", fontFamily: "inherit", paddingBottom: 2,
                  }} />
                </div>
                {/* 아랫줄: 삭제 버튼 (오른쪽 정렬) */}
                {n > 2 && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                    <button onClick={() => removePlayer(i)}
                      style={{ ...S.miniBtn(false, "danger"), fontSize: 11, padding: "3px 12px" }}>
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {n < 8 && (
            <button onClick={addPlayer}
              style={{ ...S.miniBtn(false, null), width: "100%", padding: 10, marginBottom: 10 }}>
              + 참가자 추가
            </button>
          )}

          {/* 홀덤 설정 */}
          {gameType === "holdem" && (
            <>
              {/* 플레이어별 바이인 */}
              <div style={{ marginBottom: 12 }}>
                <div style={S.sectionLabel}>플레이어별 바이인</div>
                <div style={S.card}>
                  {players.map((p, i) => {
                    const units = [1000, 5000, 10000, 50000];
                    return (
                      <div key={i} style={{ ...S.playerRow, flexDirection: "column", alignItems: "stretch",
                        ...(i === n - 1 ? { borderBottom: "none" } : {}) }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <Avatar i={i} name={p} size={28} />
                          <span style={{ flex: 1, fontWeight: "bold", fontSize: 14 }}>{p}</span>
                          <span style={{ fontSize: 15, fontWeight: "bold",
                            color: buyIns[i] > 0 ? C.gold2 : C.muted }}>
                            {buyIns[i] > 0 ? buyIns[i].toLocaleString() + "원" : "미설정"}
                          </span>
                          {buyIns[i] > 0 && (
                            <button onClick={() => { const nb = [...buyIns]; nb[i] = 0; setBuyIns(nb); }}
                              style={{ ...S.miniBtn(false, "danger"), fontSize: 11, padding: "3px 8px" }}>초기화</button>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          {units.map(u => {
                            const count = Math.floor(buyIns[i] / u) % (u === 50000 ? 10 : u === 10000 ? 5 : u === 5000 ? 10 : 10);
                            const label = u >= 10000 ? (u/10000)+"만" : (u/1000)+"천";
                            return (
                              <button key={u}
                                onClick={() => { const nb = [...buyIns]; nb[i] += u; setBuyIns(nb); }}
                                style={{
                                  flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer",
                                  fontFamily: "inherit", textAlign: "center",
                                  border: `1px solid ${C.border}`,
                                  background: C.bg3,
                                  color: C.text,
                                  fontSize: 12, fontWeight: "bold",
                                }}>
                                <div>{label}</div>
                                <div style={{ fontSize: 10, marginTop: 2, color: C.muted }}>
                                  ×{Math.floor(buyIns[i] / u)}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {buyIns.some(b => b > 0) && (
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2, marginBottom: 8 }}>
                    총 충전액: {buyIns.reduce((a,b)=>a+b,0).toLocaleString()}원
                  </div>
                )}
              </div>

              {/* 블라인드 + 앤티 2열 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={S.sectionLabel}>블라인드 (SB/BB)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {[[0,0],[100,200],[250,500],[500,1000],[1000,2000]].map(([sb,bb]) => {
                      const isNone = sb === 0;
                      const active = isNone ? (blinds.small === 0) : (blinds.small === sb);
                      return (
                        <button key={sb} onClick={() => setBlinds({ small: sb, big: bb })}
                          style={{
                            padding: "7px 8px", fontSize: 11, borderRadius: 8, cursor: "pointer",
                            fontFamily: "inherit", textAlign: "center",
                            border: `1px solid ${active ? C.border2 : C.border}`,
                            background: active ? "rgba(200,160,80,0.18)" : C.bg3,
                            color: active ? C.gold2 : C.text,
                          }}>
                          {isNone ? "없음" : `${sb.toLocaleString()} / ${bb.toLocaleString()}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div style={S.sectionLabel}>앤티</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {[0, 100, 500, 1000, 5000].map(a => (
                      <button key={a} onClick={() => setAnteAmt(a)} style={{
                        padding: "7px 8px", fontSize: 11, borderRadius: 8, cursor: "pointer",
                        fontFamily: "inherit", textAlign: "center",
                        border: `1px solid ${anteAmt === a ? C.border2 : C.border}`,
                        background: anteAmt === a ? "rgba(200,160,80,0.18)" : C.bg3,
                        color: anteAmt === a ? C.gold2 : C.text,
                      }}>
                        {a === 0 ? "없음" : `${a.toLocaleString()}원`}
                      </button>
                    ))}
                  </div>
                  {anteAmt > 0 && (
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
                      시작팟 {(anteAmt * n).toLocaleString()}원
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div style={S.sectionLabel}>딜러 버튼 위치</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {players.map((p, i) => (
                    <button key={i} onClick={() => setDealerIdx(i)}
                      style={{ ...S.miniBtn(dealerIdx === i, null), padding: "5px 10px", fontSize: 11 }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={startHoldemHand} style={S.primaryBtn}>🃏 새 핸드 시작</button>

              {handHistory.length > 0 && (
                <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 8 }}>
                  진행된 핸드: {handHistory.length}개 | 정산 탭에서 결과 확인
                </div>
              )}
            </>
          )}

          {gameType === "gostop" && (
            <button onClick={() => setScreen("game")} style={S.primaryBtn}>게임 시작</button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          홀덤 게임 화면
      ══════════════════════════════════════ */}
      {screen === "game" && gameType === "holdem" && (
        <div>
          {!handActive ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🃏</div>
              <div style={{ marginBottom: 16, fontSize: 14 }}>설정 탭에서 새 핸드를 시작하세요</div>
              <button onClick={() => setScreen("setup")} style={S.primaryBtn}>설정으로 이동</button>
            </div>
          ) : (
            <>
              {/* 스트리트 바 + 팟 한 줄 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 3, flex: 1 }}>
                  {["preflop","flop","turn","river"].map(s => (
                    <div key={s} style={{
                      flex: 1, padding: "4px 2px", textAlign: "center", fontSize: 9, borderRadius: 6,
                      background: street === s ? "rgba(200,160,80,0.2)" :
                        ["preflop","flop","turn","river"].indexOf(s) <
                        ["preflop","flop","turn","river"].indexOf(street)
                          ? "rgba(78,203,138,0.1)" : C.bg2,
                      color: street === s ? C.gold2 : C.muted,
                      border: `1px solid ${street === s ? C.border2 : C.border}`,
                    }}>{streetLabel(s)}</div>
                  ))}
                </div>
                <div style={{ background: "rgba(200,160,80,0.1)", border: `1px solid rgba(200,160,80,0.3)`,
                  borderRadius: 10, padding: "6px 14px", textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: "bold", color: C.gold2 }}>{pot.toLocaleString()}원</div>
                  <div style={{ fontSize: 9, color: C.muted }}>팟{allin.some(Boolean) ? " ⚡올인" : ""}</div>
                </div>
              </div>

              {/* 커뮤니티 카드 (작게) */}
              <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 10 }}>
                {[1,2,3,4,5].map(ci => (
                  <div key={ci} style={{
                    width: 32, height: 46, borderRadius: 5,
                    border: `1px solid ${ci <= boardStage ? C.border2 : C.border}`,
                    background: ci <= boardStage ? "rgba(200,160,80,0.1)" : C.bg2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: ci <= boardStage ? 18 : 10, color: ci <= boardStage ? C.gold2 : C.muted,
                  }}>{ci <= boardStage ? "🂠" : ""}</div>
                ))}
              </div>

              {/* 2단 레이아웃: 왼쪽=플레이어 현황, 오른쪽=액션패널 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>

                {/* 왼쪽: 플레이어 베팅 현황 */}
                <div>
                  <div style={S.sectionLabel}>플레이어 베팅 현황</div>
                  <div style={{ ...S.card, padding: 10 }}>
                    {players.map((name, i) => {
                      const isAct  = actionIdx === i;
                      const isDead = folded[i];
                      const isAI   = allin[i];
                      const myBuyIn = buyIns[i] || 0;
                      const prevPnl = totalAmounts[i] || 0;
                      const stack   = myBuyIn > 0 ? myBuyIn + prevPnl - (totalBets[i]||0) : null;
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "flex-start", gap: 6,
                          padding: "7px 0", opacity: isDead ? 0.3 : 1,
                          background: isAct ? "rgba(200,160,80,0.07)" : "transparent",
                          borderRadius: isAct ? 6 : 0,
                          borderBottom: i < n - 1 ? `1px solid ${C.border}` : "none",
                        }}>
                          <Avatar i={i} name={name} size={26} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: "bold", fontSize: 12 }}>{name}</span>
                              {dealerIdx === i && <span style={{ fontSize: 8, background: "rgba(200,160,80,0.2)", color: C.gold2, padding: "0px 4px", borderRadius: 6 }}>D</span>}
                              {sbIdx === i      && <span style={{ fontSize: 8, background: "rgba(90,158,240,0.15)", color: C.blue, padding: "0px 4px", borderRadius: 6 }}>SB</span>}
                              {bbIdx === i      && <span style={{ fontSize: 8, background: "rgba(78,203,138,0.15)", color: C.green, padding: "0px 4px", borderRadius: 6 }}>BB</span>}
                              {isDead           && <span style={{ fontSize: 8, background: "rgba(224,90,90,0.15)", color: C.red, padding: "0px 4px", borderRadius: 6 }}>다이</span>}
                              {isAI             && <span style={{ fontSize: 8, background: "rgba(176,127,240,0.15)", color: C.purple, padding: "0px 4px", borderRadius: 6 }}>올인</span>}
                              {isAct && !isDead && <span style={{ fontSize: 8, background: "rgba(200,160,80,0.2)", color: C.gold2, padding: "0px 4px", borderRadius: 6 }}>← 차례</span>}
                            </div>
                            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                              베팅 <b style={{ color: C.gold2 }}>{(bets[i]||0).toLocaleString()}</b>
                            </div>
                            {stack !== null && (
                              <div style={{ fontSize: 10, color: stack >= 0 ? C.muted : C.red }}>
                                잔여 <b style={{ color: stack >= 0 ? C.gold2 : C.red }}>{stack.toLocaleString()}</b>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 오른쪽: 액션 패널 or 쇼다운 */}
                <div>
                  {!handOver && actionIdx >= 0 && (() => {
                    const i        = actionIdx;
                    const mb       = getMaxBet(bets);
                    const callAmt  = mb - (bets[i]||0);
                    const canCheck = callAmt === 0;
                    return (
                      <div>
                        <div style={S.sectionLabel}>{players[i]}의 차례</div>
                        <div style={{ ...S.card, padding: 10, border: `1px solid ${C.border2}` }}>
                          {!canCheck && (
                            <div style={{ fontSize: 11, color: C.blue, marginBottom: 8 }}>
                              콜: <b>{callAmt.toLocaleString()}원</b>
                            </div>
                          )}

                          {/* 레이즈 금액 */}
                          <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>레이즈 추가 금액</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6 }}>
                            {[100, 500, 1000, 5000].map(a => (
                              <button key={a}
                                onClick={() => setRaiseInput(String((parseInt(raiseInput)||0) + a))}
                                style={{ ...S.miniBtn(false, "info"), padding: "6px 2px", fontSize: 11, textAlign: "center" }}>
                                +{a.toLocaleString()}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                            <input type="number" value={raiseInput}
                              onChange={e => setRaiseInput(e.target.value)}
                              placeholder={`최소 ${blinds.big.toLocaleString()}`}
                              style={{ flex: 1, padding: "6px 8px", background: C.bg3,
                                border: `1px solid ${C.border2}`, borderRadius: 8,
                                color: C.text, fontSize: 12, outline: "none", fontFamily: "inherit" }} />
                            <button onClick={() => setRaiseInput("")}
                              style={{ ...S.miniBtn(false, "danger"), padding: "6px 8px", fontSize: 11 }}>✕</button>
                          </div>

                          {/* 액션 버튼 2×2 */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                            <button onClick={() => doAction("fold")}
                              style={{ ...S.miniBtn(false,"danger"), padding:"11px 4px", fontSize:13, textAlign:"center" }}>
                              다이
                            </button>
                            {canCheck ? (
                              <button onClick={() => doAction("check")}
                                style={{ ...S.miniBtn(false,null), padding:"11px 4px", fontSize:13, textAlign:"center" }}>
                                체크
                              </button>
                            ) : (
                              <button onClick={() => doAction("call")}
                                style={{ ...S.miniBtn(false,"info"), padding:"11px 4px", fontSize:13, textAlign:"center" }}>
                                콜
                              </button>
                            )}
                            <button onClick={() => doAction("raise")}
                              disabled={!raiseInput || parseInt(raiseInput) <= 0}
                              style={{ ...S.miniBtn(false,"success"), padding:"11px 4px", fontSize:13, textAlign:"center",
                                opacity: (!raiseInput || parseInt(raiseInput) <= 0) ? 0.35 : 1 }}>
                              레이즈
                            </button>
                            <button onClick={() => doAction("allin")}
                              style={{ ...S.miniBtn(false,"purple"), padding:"11px 4px", fontSize:13, textAlign:"center" }}>
                              올인!
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {handOver && (
                    <div>
                      <div style={S.sectionLabel}>
                        {autoWinner.length > 0 ? "자동 승리" : "쇼다운"}
                      </div>
                      <div style={{ ...S.card, padding: 10, border: `1px solid rgba(78,203,138,0.4)` }}>
                        <div style={{ fontSize: 12, fontWeight: "bold", color: C.green, marginBottom: 6 }}>
                          {autoWinner.length > 0
                            ? `🏆 ${autoWinner.map(w => players[w]).join(", ")} 승!`
                            : "승자를 선택하세요"}
                        </div>
                        <div style={{ fontSize: 12, color: C.gold2, marginBottom: 8 }}>팟: {pot.toLocaleString()}원</div>

                        {autoWinner.length === 0 && (
                          <div style={{ marginBottom: 8 }}>
                            {players.map((p, i) => !folded[i] && (
                              <button key={i} onClick={() => {
                                if (showdownWinners.includes(i)) setShowdownWinners(showdownWinners.filter(w => w !== i));
                                else setShowdownWinners([...showdownWinners, i]);
                              }} style={{
                                display: "flex", alignItems: "center", gap: 6, width: "100%",
                                padding: "7px 8px", marginBottom: 4, borderRadius: 8, cursor: "pointer",
                                border: `1px solid ${showdownWinners.includes(i) ? "rgba(78,203,138,0.5)" : C.border}`,
                                background: showdownWinners.includes(i) ? "rgba(78,203,138,0.1)" : C.bg3,
                                color: C.text, fontFamily: "inherit", textAlign: "left",
                              }}>
                                <Avatar i={i} name={p} size={22} />
                                <span style={{ flex: 1, fontSize: 12 }}>{p}</span>
                                {allin[i] && <span style={{ fontSize: 9, color: C.purple }}>올인</span>}
                                <span style={{ fontSize: 11, color: showdownWinners.includes(i) ? C.green : C.muted }}>
                                  {showdownWinners.includes(i) ? "✓" : "○"}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        <button onClick={settleHand}
                          disabled={autoWinner.length === 0 && showdownWinners.length === 0}
                          style={{ ...S.primaryBtn, marginTop: 0, fontSize: 12, padding: 10,
                            opacity: (autoWinner.length === 0 && showdownWinners.length === 0) ? 0.35 : 1 }}>
                          정산 & 다음 핸드 →
                        </button>
                      </div>
                    </div>
                  )}

                  {!handOver && actionIdx < 0 && (
                    <div style={{ ...S.card, padding: 10, textAlign: "center", color: C.muted, fontSize: 13 }}>
                      핸드 대기 중
                    </div>
                  )}
                </div>
              </div>

              {/* 이번 핸드 기록 (접힌 형태) */}
              {actionLog.length > 0 && (
                <div>
                  <div style={S.sectionLabel}>이번 핸드 기록</div>
                  <div style={{ ...S.card, padding: 10 }}>
                    <div style={{ maxHeight: 120, overflowY: "auto" }}>
                      {[...actionLog].reverse().map((h, ri) => (
                        <div key={ri} style={{ fontSize: 11, padding: "3px 0", color: C.muted,
                          borderBottom: `1px solid ${C.border}` }}>
                          {h.player === -1
                            ? <span style={{ color: C.gold }}>앤티 {h.amount.toLocaleString()}원 팟 추가</span>
                            : <span>
                                <span style={{ color: PLAYER_COLORS[h.player % 8].text }}>{players[h.player]}</span>
                                {" — "}
                                <span style={{
                                  color: h.action === "다이"         ? C.red    :
                                         h.action.includes("레이즈") ? C.green  :
                                         h.action === "올인!"        ? C.purple :
                                         h.action === "콜"           ? C.blue   : C.text
                                }}>{h.action}</span>
                                {h.amount > 0 && <span style={{ color: C.gold2 }}> {h.amount.toLocaleString()}원</span>}
                              </span>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          고스톱 게임 화면
      ══════════════════════════════════════ */}
      {screen === "game" && gameType === "gostop" && (
        <div>
          <div style={S.sectionLabel}>판 입력</div>
          <div style={S.card}>
            {players.map((name, i) => (
              <div key={i} style={{ ...S.playerRow, flexDirection: "column", alignItems: "stretch",
                ...(i === n - 1 ? { borderBottom: "none" } : {}) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Avatar i={i} name={name} size={28} />
                  <span style={{ flex: 1, fontWeight: "bold", fontSize: 14 }}>{name}</span>
                  <input type="number" value={inputAmounts[i] || ""}
                    onChange={e => setAmount(i, e.target.value)}
                    style={{ width: 90, padding: "5px 8px", textAlign: "right", fontSize: 14,
                      background: C.bg3, border: `1px solid ${C.border2}`,
                      borderRadius: 8, color: C.text, outline: "none", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {AMOUNT_BTNS.map(a => (
                    <button key={a} onClick={() => adjustAmount(i,  a)} style={S.miniBtn(false, "info")}>+{a.toLocaleString()}</button>
                  ))}
                  {AMOUNT_BTNS.map(a => (
                    <button key={"m"+a} onClick={() => adjustAmount(i, -a)} style={S.miniBtn(false, "danger")}>-{a.toLocaleString()}</button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingTop: 10, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
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
                <div style={{ display: "flex", fontSize: 11, color: C.muted,
                  borderBottom: `1px solid ${C.border}`, paddingBottom: 6, marginBottom: 4 }}>
                  <span style={{ flex: 1 }}>판</span>
                  {players.map((p, i) => <span key={i} style={{ minWidth: 70, textAlign: "right" }}>{p}</span>)}
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {rounds.map((r, ri) => (
                    <div key={ri} style={{ display: "flex", fontSize: 12, padding: "5px 0",
                      borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                      <span style={{ flex: 1, color: C.muted }}>#{ri + 1}</span>
                      {players.map((_, i) => (
                        <span key={i} style={{ minWidth: 70, textAlign: "right", fontWeight: "bold",
                          color: r.amounts[i] > 0 ? C.green : r.amounts[i] < 0 ? C.red : C.muted }}>
                          {r.amounts[i] > 0 ? "+" : ""}{r.amounts[i].toLocaleString()}
                        </span>
                      ))}
                      <button onClick={() => removeRound(ri)}
                        style={{ ...S.miniBtn(false,"danger"), fontSize:10, padding:"2px 6px", marginLeft:6 }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", fontSize: 13, fontWeight: "bold", paddingTop: 8,
                  borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
                  <span style={{ flex: 1 }}>합계</span>
                  {gostopTotals.map((a, i) => (
                    <span key={i} style={{ minWidth: 70, textAlign: "right",
                      color: a > 0 ? C.green : a < 0 ? C.red : C.muted }}>
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

      {/* ══════════════════════════════════════
          최종 정산 화면
      ══════════════════════════════════════ */}
      {screen === "result" && (
        <div>
          {gameType === "holdem" && handHistory.length > 0 && (
            <div>
              <div style={S.sectionLabel}>핸드 기록 ({handHistory.length}핸드)</div>
              <div style={S.card}>
                <div style={{ maxHeight: 160, overflowY: "auto" }}>
                  {handHistory.map((h, hi) => (
                    <div key={hi} style={{ fontSize: 12, padding: "5px 0",
                      borderBottom: `1px solid ${C.border}`, color: C.muted }}>
                      <span style={{ color: C.green }}>핸드 #{hi+1}</span>
                      {" — "}
                      <span style={{ color: C.gold2 }}>{h.winnerNames.join(", ")} 승</span>
                      {" — 팟 "}
                      <span>{h.pot.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={S.sectionLabel}>플레이어별 손익</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {players.map((p, i) => {
              const amt = gameType === "holdem" ? (totalAmounts[i]||0) : gostopTotals[i];
              const remaining = gameType === "holdem" && (buyIns[i]||0) > 0 ? (buyIns[i]||0) + amt : null;
              return (
                <div key={i} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, color: C.muted }}>{p}</div>
                  <div style={{ fontSize: 18, fontWeight: "bold", marginTop: 4,
                    color: amt > 0 ? C.green : amt < 0 ? C.red : C.muted }}>
                    {amt > 0 ? "+" : ""}{amt.toLocaleString()}원
                  </div>
                  {remaining !== null && (
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                      잔여: <span style={{ color: remaining >= 0 ? C.gold2 : C.red, fontWeight: "bold" }}>
                        {remaining.toLocaleString()}원
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={S.sectionLabel}>정산 방법 (최소 이체)</div>
          <div style={S.card}>
            {(() => {
              const amounts = gameType === "holdem" ? totalAmounts : gostopTotals;
              const tx = calcSettlement(amounts);
              return tx.length === 0
                ? <div style={{ textAlign: "center", color: C.muted, padding: 24 }}>정산할 내역이 없습니다</div>
                : tx.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0",
                    borderBottom: i < tx.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <Avatar i={t.from} name={players[t.from]} size={28} />
                    <span style={{ fontSize: 13, fontWeight: "bold" }}>{players[t.from]}</span>
                    <span style={{ color: C.muted }}>→</span>
                    <Avatar i={t.to} name={players[t.to]} size={28} />
                    <span style={{ fontSize: 13, fontWeight: "bold" }}>{players[t.to]}</span>
                    <span style={{ marginLeft: "auto", fontWeight: "bold", fontSize: 15, color: C.green }}>
                      {t.amount.toLocaleString()}원
                    </span>
                  </div>
                ));
            })()}
          </div>

          <button onClick={() => {
            setRounds([]); setHandHistory([]); resetHand(); setScreen("setup"); writeSave({});
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
