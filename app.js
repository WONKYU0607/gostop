const PLAYER_COLORS = ["#E85D4A","#4A90E8","#2ECC71","#F39C12","#9B59B6","#1ABC9C","#E74C3C","#3498DB","#F1C40F","#E67E22"];
const AMOUNT_BTNS = [100, 500, 1000];

function GoStopApp() {

  const [gameType, setGameType] = React.useState("gostop");
  const [screen, setScreen] = React.useState("setup");

  const [players, setPlayers] = React.useState(["플레이어 1","플레이어 2","플레이어 3"]);

  const [bets, setBets] = React.useState([0,0,0]);
  const [folded, setFolded] = React.useState([false,false,false]);
  const [pot, setPot] = React.useState(0);

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
    setBets([...bets, 0]);
    setFolded([...folded, false]);
  }

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
    if (sum !== 0) return;
    setRounds([...rounds, { amounts: [...inputAmounts] }]);
    setInputAmounts(Array(n).fill(0));
  }

  function calcSettlement() {
    const balances = totalAmounts.map((a, i) => ({ idx: i, amount: a }));
    const d = balances.filter(b => b.amount < 0);
    const c = balances.filter(b => b.amount > 0);
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

  return (
    <div style={{ padding: 20 }}>

      {/* 게임 선택 */}
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setGameType("gostop")}>🀄 고스톱</button>
        <button onClick={() => setGameType("holdem")}>🃏 홀덤</button>
      </div>

      {/* 화면 선택 */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setScreen("setup")}>설정</button>
        <button onClick={() => setScreen("game")}>게임</button>
        <button onClick={() => setScreen("result")}>정산</button>
      </div>

      {/* 설정 */}
      {screen === "setup" && (
        <div>
          {players.map((p,i)=>(
            <div key={i}>{p}</div>
          ))}
          <button onClick={addPlayer}>+ 플레이어</button>
          <button onClick={()=>setScreen("game")}>게임 시작</button>
        </div>
      )}

      {/* 게임 */}
      {screen === "game" && (
        <div>

          {/* 🔥 홀덤 UI */}
          {gameType === "holdem" && (
            <div style={{ marginBottom: 20, padding: 10, border: "1px solid #444" }}>
              <div>💰 팟: {pot}</div>

              {players.map((name, i) => (
                <div key={i}>
                  {name} / {bets[i]}

                  <button onClick={()=>{
                    const nb=[...bets]; nb[i]+=1000; setBets(nb);
                  }}>+1000</button>

                  <button onClick={()=>{
                    const max=Math.max(...bets);
                    const nb=[...bets]; nb[i]=max; setBets(nb);
                  }}>콜</button>

                  <button onClick={()=>{
                    const nf=[...folded]; nf[i]=true; setFolded(nf);
                  }}>폴드</button>
                </div>
              ))}

              <button onClick={()=>{
                const sum=bets.reduce((a,b)=>a+b,0);
                setPot(pot+sum);
                setBets(Array(players.length).fill(0));
              }}>
                라운드 종료
              </button>
            </div>
          )}

          {/* 고스톱 입력 */}
          {gameType === "gostop" && (
            <div>
              {players.map((name, i) => (
                <div key={i}>
                  {name}
                  <input onChange={(e)=>setAmount(i,e.target.value)} />
                  <button onClick={()=>adjustAmount(i,1000)}>+1000</button>
                </div>
              ))}
              <button onClick={addRound}>판 추가</button>
            </div>
          )}

          <button onClick={()=>setScreen("result")}>정산</button>
        </div>
      )}

      {/* 정산 */}
      {screen === "result" && (
        <div>
          {transactions.map((t,i)=>(
            <div key={i}>
              {players[t.from]} → {players[t.to]} : {t.amount}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(GoStopApp));
