const apiUrl = 'api/game';
const labels = ['A', 'B', 'C', 'D'];
let previousBattleState = null;

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;
    if (page === 'menu') {
        setupMenu();
    } else if (page === 'battle') {
        setupBattle();
    } else if (page === 'result') {
        loadResult();
    } else if (page === 'highscore') {
        loadHighScores();
    }
});

function setupMenu() {
    document.getElementById('guideBtn').addEventListener('click', () => {
        document.getElementById('guideBox').classList.toggle('hidden');
    });

    document.getElementById('startBtn').addEventListener('click', async () => {
        const playerName = document.getElementById('playerName').value.trim() || 'Scholar';
        const body = new URLSearchParams({action: 'start', playerName});
        const response = await fetch(apiUrl, {method: 'POST', body});
        if (response.ok) {
            window.location.href = 'battle.html';
        }
    });
}

function setupBattle() {
    document.getElementById('submitAnswerBtn').addEventListener('click', submitAnswer);
    document.getElementById('usePotionBtn').addEventListener('click', usePotion);
    loadState();
}

async function loadState() {
    const response = await fetch(`${apiUrl}?action=state`);
    const state = await response.json();
    renderBattle(state);
}

function renderBattle(state) {
    if (!state.started) {
        window.location.href = 'index.html';
        return;
    }
    if (state.gameOver) {
        window.location.href = 'result.html';
        return;
    }

    setText('playerName', state.playerName);
    setText('playerHp', `${state.playerHp}/${state.playerMaxHp}`);
    setText('monsterName', state.monsterName);
    setText('monsterHp', `${state.monsterHp}/${state.monsterMaxHp}`);
    setText('stageNumber', state.stage);
    setText('score', state.score);
    setText('message', state.message);
    setText('itemCount', `HealingPotion x${state.inventory.length}`);
    setHpBar('playerHpBar', state.playerHp, state.playerMaxHp);
    setHpBar('monsterHpBar', state.monsterHp, state.monsterMaxHp);

    const form = document.getElementById('answerForm');
    form.innerHTML = '';
    setText('questionText', state.question ? state.question.pertanyaan : 'Tidak ada soal.');
    if (state.question) {
        state.question.opsi.forEach((text, index) => {
            const label = document.createElement('label');
            label.className = 'option';
            label.innerHTML = `
                <input type="radio" name="jawaban" value="${labels[index]}" ${index === 0 ? 'checked' : ''}>
                <span><strong>${labels[index]}.</strong> ${escapeHtml(text)}</span>
            `;
            form.appendChild(label);
        });
    }

    document.getElementById('usePotionBtn').disabled = state.inventory.length === 0;
    notifyBattleScene(state);
}

async function submitAnswer() {
    const selected = document.querySelector('input[name="jawaban"]:checked');
    if (!selected) {
        return;
    }
    const body = new URLSearchParams({action: 'answer', jawaban: selected.value});
    const response = await fetch(apiUrl, {method: 'POST', body});
    const state = await response.json();
    renderBattle(state);
}

async function usePotion() {
    const body = new URLSearchParams({action: 'useItem', index: '0'});
    const response = await fetch(apiUrl, {method: 'POST', body});
    const state = await response.json();
    renderBattle(state);
}

async function loadResult() {
    const response = await fetch(`${apiUrl}?action=result`);
    const result = await response.json();
    if (!result.started) {
        window.location.href = 'index.html';
        return;
    }
    setText('resultTitle', `Hasil ${result.playerName}`);
    setText('resultMessage', result.message);
    setText('finalScore', result.score);
    setText('finalStage', result.stageTerakhir);
}

async function loadHighScores() {
    const response = await fetch(`${apiUrl}?action=highscores`);
    const data = await response.json();
    const rows = document.getElementById('scoreRows');
    rows.innerHTML = '';

    if (data.scores.length === 0) {
        rows.innerHTML = '<tr><td colspan="4">Belum ada score.</td></tr>';
        return;
    }

    data.scores.forEach((score, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(score.playerName)}</td>
            <td>${score.score}</td>
            <td>${score.stageTerakhir}</td>
        `;
        rows.appendChild(row);
    });
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function setHpBar(id, hp, maxHp) {
    const element = document.getElementById(id);
    if (!element) {
        return;
    }
    const percent = maxHp <= 0 ? 0 : Math.max(0, Math.min(100, (hp / maxHp) * 100));
    element.style.width = `${percent}%`;
}

function notifyBattleScene(state) {
    window.dispatchEvent(new CustomEvent('battle-state-updated', {
        detail: {
            state,
            previousState: previousBattleState
        }
    }));
    previousBattleState = state;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
