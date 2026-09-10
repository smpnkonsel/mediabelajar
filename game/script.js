/* ==========================================================================
   KW LEARNING — ARENA MATEMATIKA
   JavaScript Application Logic
   Soal & kategori dimuat dari file HTML terpisah di folder /soal
   ========================================================================== */

// Daftar bab/materi yang tersedia — tambahkan baris baru di sini kalau mau
// menambah file soal baru di folder /soal
const CHAPTERS = [
    {
        id: "bilangan-berpangkat",
        file: "soal/bilangan-berpangkat.html",
        label: "Bilangan Berpangkat",
        icon: "🔢"
    },
    {
        id: "teorema-pythagoras",
        file: "soal/teorema-pythagoras.html",
        label: "Teorema Pythagoras",
        icon: "📐"
    },
    {
        id: "persamaan-linear",
        file: "soal/persamaan-linear.html",
        label: "Persamaan Linear dan Pertidaksamaan Linear",
        icon: "➗"
    },
    {
        id: "relasi-dan-fungsi",
        file: "soal/relasi-dan-fungsi.html",
        label: "Relasi dan Fungsi",
        icon: "🔗"
    },
    {
        id: "persamaan-garis-lurus",
        file: "soal/persamaan-garis-lurus.html",
        label: "Persamaan Garis Lurus",
        icon: "📈"
    },
    {
        id: "statistika",
        file: "soal/statistika.html",
        label: "Statistika",
        icon: "📊"
    }
];

const TEAM_COLORS = ["#00f0ff", "#00e676", "#ff9100", "#9d4edd", "#ff007f", "#ffd700"];
const MAX_TEAMS = 6;
const MIN_TEAMS = 2;
const STORAGE_KEY = "KW_ARENA_STATE";

document.addEventListener("DOMContentLoaded", () => {

    let state = {
        setupComplete: false,
        chapterId: null,
        chapterMeta: null,
        categories: [],
        questionsData: [],

        currentQuestionIndex: 0,
        answeredQuestions: {},
        teams: [],
        activeTeamIndex: 0,
        selectedCategory: "all",

        timerSeconds: 300,
        timerMaxSeconds: 300,
        isTimerRunning: false,
        timerInterval: null,

        soundEnabled: true,
        animationEnabled: true,
        confettiEnabled: true,
        isSpinning: false,
        selectedOptionIndex: null
    };

    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return audioCtx;
    }

    function playSound(type) {
        if (!state.soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            const now = ctx.currentTime;

            if (type === "click") {
                osc.type = "sine";
                osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now); osc.stop(now + 0.05);
            } else if (type === "correct") {
                osc.type = "triangle";
                osc.frequency.setValueAtTime(523.25, now);
                osc.frequency.setValueAtTime(659.25, now + 0.1);
                osc.frequency.setValueAtTime(783.99, now + 0.2);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now); osc.stop(now + 0.4);
            } else if (type === "wrong") {
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.setValueAtTime(150, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now); osc.stop(now + 0.3);
            } else if (type === "spin") {
                osc.type = "sine";
                osc.frequency.setValueAtTime(400, now);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
                osc.start(now); osc.stop(now + 0.03);
            }
        } catch (e) { console.log("Audio play error", e); }
    }

    // ==========================================================================
    // SETUP SCREEN — pilih bab, waktu, dan nama tim
    // ==========================================================================
    let setupSelectedChapterId = null;
    let setupTeamCount = 2;

    function initSetupScreen() {
        const grid = document.getElementById("chapterGrid");
        grid.innerHTML = "";
        CHAPTERS.forEach((ch, idx) => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "chapter-card";
            card.dataset.chapterId = ch.id;
            card.innerHTML = `
                <span class="chapter-icon">${ch.icon}</span>
                <span class="chapter-name">${ch.label}</span>
                <span class="chapter-sub">Klik untuk memilih materi ini</span>
            `;
            card.onclick = () => {
                setupSelectedChapterId = ch.id;
                document.querySelectorAll(".chapter-card").forEach(c => c.classList.remove("selected"));
                card.classList.add("selected");
                document.getElementById("setupError").textContent = "";
            };
            grid.appendChild(card);
            if (idx === 0) card.click();
        });

        renderTeamSetupRows();

        document.getElementById("addTeamBtn").onclick = () => {
            if (setupTeamCount >= MAX_TEAMS) return;
            setupTeamCount++;
            renderTeamSetupRows();
        };

        document.querySelectorAll(".time-chip").forEach(chip => {
            chip.onclick = () => {
                document.getElementById("setupTimeInput").value = chip.dataset.min;
                document.querySelectorAll(".time-chip").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
            };
        });

        document.getElementById("startGameBtn").onclick = handleStartGame;
    }

    function renderTeamSetupRows() {
        const list = document.getElementById("teamSetupList");
        const existingValues = Array.from(list.querySelectorAll(".team-name-input")).map(i => i.value);
        list.innerHTML = "";

        for (let i = 0; i < setupTeamCount; i++) {
            const row = document.createElement("div");
            row.className = "team-setup-row";
            const savedVal = existingValues[i];
            row.innerHTML = `
                <div class="team-setup-swatch" style="background:${TEAM_COLORS[i % TEAM_COLORS.length]}"></div>
                <input type="text" class="input-field team-name-input" placeholder="Nama Tim ${i + 1}" value="${savedVal ? savedVal : ""}" maxlength="24">
                <button type="button" class="team-remove-btn" title="Hapus tim">✕</button>
            `;
            const removeBtn = row.querySelector(".team-remove-btn");
            removeBtn.disabled = setupTeamCount <= MIN_TEAMS;
            removeBtn.onclick = () => {
                if (setupTeamCount <= MIN_TEAMS) return;
                setupTeamCount--;
                renderTeamSetupRows();
            };
            list.appendChild(row);
        }
    }

    function handleStartGame() {
        playSound("click");
        const errorBox = document.getElementById("setupError");

        if (!setupSelectedChapterId) {
            errorBox.textContent = "Silakan pilih bab/materi terlebih dahulu.";
            return;
        }

        const nameInputs = Array.from(document.querySelectorAll(".team-name-input"));
        const teamNames = nameInputs.map((inp, idx) => inp.value.trim() || `Tim ${idx + 1}`);

        const minutes = parseInt(document.getElementById("setupTimeInput").value, 10);
        if (!minutes || minutes < 1) {
            errorBox.textContent = "Masukkan durasi waktu yang valid (minimal 1 menit).";
            return;
        }

        errorBox.textContent = "";

        const teams = teamNames.map((name, idx) => ({
            id: idx,
            name: name,
            score: 0,
            color: TEAM_COLORS[idx % TEAM_COLORS.length]
        }));

        state.teams = teams;
        state.activeTeamIndex = 0;
        state.timerMaxSeconds = minutes * 60;
        state.timerSeconds = minutes * 60;
        state.answeredQuestions = {};
        state.currentQuestionIndex = 0;
        state.selectedCategory = "all";

        loadChapterAndStart(setupSelectedChapterId);
    }

    // ==========================================================================
    // MEMUAT SOAL DARI FILE HTML TERPISAH (folder /soal)
    // ==========================================================================
    function loadChapterAndStart(chapterId) {
        const chapterCfg = CHAPTERS.find(c => c.id === chapterId);
        if (!chapterCfg) {
            alert("Bab tidak ditemukan.");
            return;
        }

        const startBtn = document.getElementById("startGameBtn");
        if (startBtn) { startBtn.disabled = true; startBtn.textContent = "MEMUAT SOAL..."; }

        fetch(chapterCfg.file)
            .then(res => {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.text();
            })
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const scriptTag = doc.getElementById("quiz-bank");
                if (!scriptTag) throw new Error("Format file soal tidak valid (elemen #quiz-bank tidak ditemukan).");
                const data = JSON.parse(scriptTag.textContent);

                state.chapterId = chapterCfg.id;
                state.chapterMeta = data.meta || { title: chapterCfg.label, subtitle: "", icon: chapterCfg.icon };
                state.categories = data.categories || [];
                state.questionsData = data.questions || [];
                state.setupComplete = true;

                startArena();
            })
            .catch(err => {
                console.error(err);
                alert(
                    "Gagal memuat file soal (" + chapterCfg.file + ").\n\n" +
                    "Kemungkinan penyebab: halaman ini dibuka langsung dari file (file://) " +
                    "sehingga browser memblokir permintaan fetch antar-file.\n\n" +
                    "Solusi: jalankan folder project-kuis ini melalui local server " +
                    "(misalnya ekstensi 'Live Server' di VS Code, atau jalankan " +
                    "'python -m http.server' di dalam folder project-kuis), lalu buka index.html melalui http://localhost."
                );
            })
            .finally(() => {
                if (startBtn) { startBtn.disabled = false; startBtn.textContent = "🚀 MULAI PERMAINAN"; }
            });
    }

    function startArena() {
        document.getElementById("setupScreen").classList.add("hidden");
        document.body.classList.remove("setup-active");
        document.getElementById("appContainer").classList.remove("hidden");

        document.getElementById("babIcon").textContent = state.chapterMeta.icon || "📖";
        document.getElementById("babTitle").textContent = state.chapterMeta.title || "Bab";
        document.getElementById("babSubtitle").textContent = state.chapterMeta.subtitle || "Kuis Interaktif SMP";
        document.getElementById("modeLabel").textContent = "Mode: Tim";
        document.getElementById("modeSub").textContent = `${state.teams.length} Tim`;

        buildWheel();
        renderCategories();
        renderTeamScores();
        updateLeaderboard();
        renderQuestion(state.currentQuestionIndex);
        updateProgress();
        updateTimerDisplay();
        startTimer();
        setupEventListeners();
        saveLocalStorage();
    }

    // ==========================================================================
    // LOCALSTORAGE — melanjutkan sesi terakhir bila ada
    // ==========================================================================
    function loadLocalStorage() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        try {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
        } catch (e) {
            console.error("Failed to load state", e);
        }
    }

    function saveLocalStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            setupComplete: state.setupComplete,
            chapterId: state.chapterId,
            chapterMeta: state.chapterMeta,
            categories: state.categories,
            questionsData: state.questionsData,
            answeredQuestions: state.answeredQuestions,
            teams: state.teams,
            activeTeamIndex: state.activeTeamIndex,
            currentQuestionIndex: state.currentQuestionIndex,
            timerSeconds: state.timerSeconds,
            timerMaxSeconds: state.timerMaxSeconds,
            soundEnabled: state.soundEnabled,
            animationEnabled: state.animationEnabled,
            confettiEnabled: state.confettiEnabled
        }));
    }

    // ==========================================================================
    // RODA SOAL (WHEEL) SVG GENERATOR & SPIN
    // ==========================================================================
    function buildWheel() {
        const wheelSvg = document.getElementById("wheelSvg");
        wheelSvg.innerHTML = "";
        const numSectors = Math.max(state.questionsData.length, 1);
        const anglePerSector = 360 / numSectors;
        const colors = ["#00f0ff", "#0088ff", "#9d4edd", "#ff007f", "#ff9100", "#00e676"];

        for (let i = 0; i < numSectors; i++) {
            const startAngle = i * anglePerSector;
            const endAngle = (i + 1) * anglePerSector;
            const color = colors[i % colors.length];

            const x1 = 150 + 140 * Math.cos(Math.PI * startAngle / 180);
            const y1 = 150 + 140 * Math.sin(Math.PI * startAngle / 180);
            const x2 = 150 + 140 * Math.cos(Math.PI * endAngle / 180);
            const y2 = 150 + 140 * Math.sin(Math.PI * endAngle / 180);
            const largeArc = anglePerSector > 180 ? 1 : 0;

            const pathData = `M 150 150 L ${x1} ${y1} A 140 140 0 ${largeArc} 1 ${x2} ${y2} Z`;

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathData);
            path.setAttribute("fill", color);
            path.setAttribute("opacity", "0.7");
            path.setAttribute("stroke", "#020817");
            path.setAttribute("stroke-width", "2");
            wheelSvg.appendChild(path);

            const midAngle = startAngle + anglePerSector / 2;
            const tx = 150 + 105 * Math.cos(Math.PI * midAngle / 180);
            const ty = 150 + 105 * Math.sin(Math.PI * midAngle / 180);

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", tx);
            text.setAttribute("y", ty);
            text.setAttribute("fill", "#ffffff");
            text.setAttribute("font-size", numSectors > 24 ? "9" : "12");
            text.setAttribute("font-weight", "bold");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "central");
            text.setAttribute("transform", `rotate(${midAngle + 90}, ${tx}, ${ty})`);
            text.textContent = i + 1;
            wheelSvg.appendChild(text);
        }
    }

    function spinWheel() {
        if (state.isSpinning) return;
        if (state.questionsData.length === 0) return;
        state.isSpinning = true;
        playSound("click");

        const spinBtn = document.getElementById("spinBtn");
        spinBtn.disabled = true;
        const wheelContainer = document.getElementById("wheelContainer");
        const total = state.questionsData.length;

        const unaskedIndices = state.questionsData
            .map((q, idx) => ({ q, idx }))
            .filter(item => !state.answeredQuestions[item.q.id])
            .map(item => item.idx);

        let targetIndex = Math.floor(Math.random() * total);
        if (unaskedIndices.length > 0) {
            targetIndex = unaskedIndices[Math.floor(Math.random() * unaskedIndices.length)];
        }

        const anglePerSector = 360 / total;
        const targetSectorAngle = (targetIndex * anglePerSector) + (anglePerSector / 2);
        const randomSpins = 5 * 360;
        const totalRotation = randomSpins + (360 - targetSectorAngle);

        wheelContainer.style.transform = `rotate(${totalRotation}deg)`;

        let spinTicks = 0;
        const tickInterval = setInterval(() => {
            playSound("spin");
            spinTicks++;
            if (spinTicks > 20) clearInterval(tickInterval);
        }, 150);

        setTimeout(() => {
            state.isSpinning = false;
            spinBtn.disabled = false;
            wheelContainer.style.transition = "none";
            wheelContainer.style.transform = `rotate(${360 - targetSectorAngle}deg)`;
            setTimeout(() => { wheelContainer.style.transition = "transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)"; }, 50);

            state.currentQuestionIndex = targetIndex;
            renderQuestion(targetIndex);
            saveLocalStorage();
        }, 4000);
    }

    // ==========================================================================
    // QUESTION & OPTIONS RENDERER
    // ==========================================================================
    function renderQuestion(index) {
        state.selectedOptionIndex = null;
        const q = state.questionsData[index];
        if (!q) return;

        document.getElementById("currentNumberDisplay").textContent = q.id;
        document.getElementById("qNumHeader").textContent = q.id;
        document.getElementById("qCategoryBadge").textContent = q.category;
        document.getElementById("qDifficultyBadge").textContent = q.difficulty;
        document.getElementById("qPointsBadge").textContent = `+${q.points} Pts`;
        document.getElementById("questionText").textContent = q.question;

        const stageStatus = document.getElementById("stageStatusText");
        stageStatus.textContent = state.answeredQuestions[q.id] ? "Soal ini telah dijawab!" : "Soal siap dijawab!";

        const optionsGrid = document.getElementById("optionsGrid");
        optionsGrid.innerHTML = "";
        const prefixes = ["A", "B", "C", "D"];
        const optClasses = ["opt-a", "opt-b", "opt-c", "opt-d"];
        const answeredData = state.answeredQuestions[q.id];

        q.options.forEach((optText, optIdx) => {
            const optBtn = document.createElement("button");
            optBtn.className = `option-btn ${optClasses[optIdx % optClasses.length]}`;

            if (answeredData) {
                if (optIdx === q.answer) {
                    optBtn.classList.add("correct-ans");
                } else if (optIdx === answeredData.selectedOption) {
                    optBtn.classList.add("wrong-ans");
                }
                optBtn.disabled = true;
            } else {
                optBtn.onclick = () => selectOption(optIdx);
            }

            optBtn.innerHTML = `
                <div class="opt-prefix">${prefixes[optIdx % prefixes.length]}</div>
                <div class="opt-text">${optText}</div>
            `;
            optionsGrid.appendChild(optBtn);
        });

        const submitBtn = document.getElementById("submitAnswerBtn");
        const expBox = document.getElementById("explanationBox");

        if (answeredData) {
            submitBtn.disabled = true;
            expBox.classList.remove("hidden");
            const isCorr = answeredData.isCorrect;
            const fbHeader = document.getElementById("feedbackHeader");
            fbHeader.className = `feedback-header ${isCorr ? "feedback-correct" : "feedback-wrong"}`;
            document.getElementById("feedbackIcon").textContent = isCorr ? "✓" : "✕";
            document.getElementById("feedbackTitle").textContent = isCorr ? "JAWABAN BENAR!" : "JAWABAN KURANG TEPAT";
            document.getElementById("feedbackPts").textContent = isCorr ? `+${answeredData.points} POIN` : "+0 POIN";
            document.getElementById("explanationText").textContent = q.explanation;
        } else {
            submitBtn.disabled = false;
            expBox.classList.add("hidden");
        }
    }

    function selectOption(optIdx) {
        playSound("click");
        state.selectedOptionIndex = optIdx;
        const buttons = document.querySelectorAll(".option-btn");
        buttons.forEach((btn, idx) => {
            if (idx === optIdx) btn.classList.add("selected");
            else btn.classList.remove("selected");
        });
    }

    // ==========================================================================
    // SUBMIT ANSWER LOGIC
    // ==========================================================================
    function submitAnswer() {
        const q = state.questionsData[state.currentQuestionIndex];
        if (!q) return;
        if (state.answeredQuestions[q.id]) return;

        if (state.selectedOptionIndex === null) {
            alert("Pilih salah satu jawaban terlebih dahulu!");
            return;
        }

        const isCorrect = state.selectedOptionIndex === q.answer;
        const pointsAwarded = isCorrect ? q.points : 0;

        state.answeredQuestions[q.id] = {
            selectedOption: state.selectedOptionIndex,
            isCorrect: isCorrect,
            points: pointsAwarded
        };

        if (isCorrect) {
            playSound("correct");
            state.teams[state.activeTeamIndex].score += pointsAwarded;
            if (state.confettiEnabled) triggerConfetti();
        } else {
            playSound("wrong");
        }

        state.activeTeamIndex = (state.activeTeamIndex + 1) % state.teams.length;

        renderQuestion(state.currentQuestionIndex);
        renderTeamScores();
        updateLeaderboard();
        updateProgress();
        saveLocalStorage();

        if (Object.keys(state.answeredQuestions).length === state.questionsData.length) {
            setTimeout(finishGame, 1000);
        }
    }

    // ==========================================================================
    // TEAM SCORE & LEADERBOARD SYSTEM
    // ==========================================================================
    function renderTeamScores() {
        const activeTeam = state.teams[state.activeTeamIndex];
        const nameEl = document.getElementById("activeTeamName");
        nameEl.textContent = activeTeam.name;
        nameEl.title = activeTeam.name;

        const container = document.getElementById("teamListContainer");
        container.innerHTML = "";

        state.teams.forEach((t, idx) => {
            const isTurn = idx === state.activeTeamIndex;
            const div = document.createElement("div");
            div.className = `team-card ${isTurn ? "current-turn" : ""}`;
            div.innerHTML = `
                <div class="team-card-info">
                    <div class="team-avatar" style="background: ${t.color}; color: #000;">${idx + 1}</div>
                    <span class="team-name-text" title="${t.name}">${t.name}</span>
                </div>
                <div class="team-score-val">${t.score}</div>
            `;
            container.appendChild(div);
        });
    }

    function updateLeaderboard() {
        const sorted = [...state.teams].sort((a, b) => b.score - a.score);
        const tbody = document.getElementById("leaderboardTbody");
        tbody.innerHTML = "";

        sorted.forEach((team, rank) => {
            const tr = document.createElement("tr");
            const crown = rank === 0 ? '<span class="rank-crown">👑</span>' : '';
            tr.innerHTML = `
                <td><strong>${rank + 1}</strong></td>
                <td>${crown}${team.name}</td>
                <td style="text-align: right; font-weight: bold; color: var(--primary-cyan);">${team.score}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ==========================================================================
    // PROGRESS & CATEGORY FILTERS
    // ==========================================================================
    function updateProgress() {
        const total = state.questionsData.length;
        const answeredCount = Object.keys(state.answeredQuestions).length;
        const pct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

        let correctCount = 0, wrongCount = 0;
        Object.values(state.answeredQuestions).forEach(ans => {
            if (ans.isCorrect) correctCount++; else wrongCount++;
        });

        document.getElementById("progressTextSide").textContent = `${answeredCount} / ${total} Soal`;
        document.getElementById("progressBarSide").style.width = `${pct}%`;
        document.getElementById("fTotal").textContent = total;
        document.getElementById("fAnswered").textContent = answeredCount;
        document.getElementById("fCorrect").textContent = correctCount;
        document.getElementById("fWrong").textContent = wrongCount;
        document.getElementById("fProgressPct").textContent = `${pct}%`;
        document.getElementById("progressBarFooter").style.width = `${pct}%`;
    }

    function renderCategories() {
        const grid = document.getElementById("categoryGrid");
        grid.innerHTML = "";

        const allBtn = document.createElement("button");
        allBtn.type = "button";
        allBtn.className = "category-card active";
        allBtn.dataset.category = "all";
        allBtn.innerHTML = `<span class="cat-icon">🌐</span><span class="cat-name">Semua Kategori</span>`;
        grid.appendChild(allBtn);

        state.categories.forEach(cat => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "category-card";
            btn.dataset.category = cat.key;
            btn.innerHTML = `<span class="cat-icon">${cat.icon || "📌"}</span><span class="cat-name">${cat.name}</span>`;
            grid.appendChild(btn);
        });

        const cards = grid.querySelectorAll(".category-card");
        cards.forEach(card => {
            card.onclick = () => {
                playSound("click");
                cards.forEach(c => c.classList.remove("active"));
                card.classList.add("active");

                const cat = card.getAttribute("data-category");
                state.selectedCategory = cat;

                if (cat !== "all") {
                    const firstMatch = state.questionsData.findIndex(q => q.category === cat);
                    if (firstMatch !== -1) {
                        state.currentQuestionIndex = firstMatch;
                        renderQuestion(firstMatch);
                    }
                }
            };
        });
    }

    // ==========================================================================
    // TIMER SYSTEM
    // ==========================================================================
    function startTimer() {
        if (state.timerInterval) clearInterval(state.timerInterval);
        state.isTimerRunning = true;
        state.timerInterval = setInterval(() => {
            if (state.timerSeconds > 0) {
                state.timerSeconds--;
                updateTimerDisplay();
            } else {
                clearInterval(state.timerInterval);
                state.isTimerRunning = false;
                finishGame("timeup");
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const m = Math.floor(state.timerSeconds / 60).toString().padStart(2, '0');
        const s = (state.timerSeconds % 60).toString().padStart(2, '0');
        const timeStr = `${m}:${s}`;
        document.getElementById("timerDisplay").textContent = timeStr;
        document.getElementById("fTimer").textContent = timeStr;
    }

    // ==========================================================================
    // MODALS, SETTINGS & GAME OVER
    // ==========================================================================
    let listenersBound = false;
    function setupEventListeners() {
        if (listenersBound) return;
        listenersBound = true;

        document.getElementById("spinBtn").onclick = spinWheel;
        document.getElementById("submitAnswerBtn").onclick = submitAnswer;

        document.getElementById("prevQuestionBtn").onclick = () => {
            playSound("click");
            const total = state.questionsData.length;
            state.currentQuestionIndex = (state.currentQuestionIndex - 1 + total) % total;
            renderQuestion(state.currentQuestionIndex);
        };

        document.getElementById("nextQuestionBtn").onclick = () => {
            playSound("click");
            const total = state.questionsData.length;
            state.currentQuestionIndex = (state.currentQuestionIndex + 1) % total;
            renderQuestion(state.currentQuestionIndex);
        };

        document.getElementById("soundToggleBtn").onclick = () => {
            state.soundEnabled = !state.soundEnabled;
            document.getElementById("soundIcon").textContent = state.soundEnabled ? "🔊" : "🔇";
            playSound("click");
        };

        const settingsModal = document.getElementById("settingsModal");
        document.getElementById("settingsBtn").onclick = () => {
            playSound("click");
            document.getElementById("setSound").checked = state.soundEnabled;
            document.getElementById("setAnimation").checked = state.animationEnabled;
            document.getElementById("setConfetti").checked = state.confettiEnabled;
            settingsModal.classList.remove("hidden");
        };

        document.getElementById("closeSettingsBtn").onclick = () => settingsModal.classList.add("hidden");

        document.getElementById("saveSettingsBtn").onclick = () => {
            playSound("click");
            state.soundEnabled = document.getElementById("setSound").checked;
            state.animationEnabled = document.getElementById("setAnimation").checked;
            state.confettiEnabled = document.getElementById("setConfetti").checked;
            saveLocalStorage();
            settingsModal.classList.add("hidden");
        };

        document.getElementById("resetGameBtn").onclick = () => {
            if (confirm("Apakah Anda yakin ingin meriset seluruh permainan?")) {
                localStorage.removeItem(STORAGE_KEY);
                location.reload();
            }
        };

        document.getElementById("changeSetupBtn").onclick = () => {
            if (confirm("Ganti bab, tim, atau waktu? Progress kuis saat ini akan direset.")) {
                localStorage.removeItem(STORAGE_KEY);
                location.reload();
            }
        };

        document.getElementById("playAgainBtn").onclick = () => {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        };
    }

    function finishGame(reason = "completed") {
        clearInterval(state.timerInterval);
        const resultModal = document.getElementById("resultModal");

        document.getElementById("resultModalTitle").textContent =
            reason === "timeup" ? "⏰ WAKTU HABIS!" : "🏆 KUIS SELESAI!";

        const sorted = [...state.teams].sort((a, b) => b.score - a.score);
        const winner = sorted[0];

        document.getElementById("winnerTeamName").textContent = `${winner.name.toUpperCase()} JUARA!`;
        document.getElementById("winnerScoreTag").textContent = `${winner.score} Poin`;

        let totalCorrect = 0, totalWrong = 0;
        Object.values(state.answeredQuestions).forEach(a => { if (a.isCorrect) totalCorrect++; else totalWrong++; });

        const total = state.questionsData.length || 1;
        const accuracy = Math.round((totalCorrect / total) * 100);

        document.getElementById("finalCorrect").textContent = totalCorrect;
        document.getElementById("finalWrong").textContent = totalWrong;
        document.getElementById("finalAccuracy").textContent = `${accuracy}%`;

        const rankList = document.getElementById("finalRankList");
        rankList.innerHTML = "";
        sorted.forEach((team, r) => {
            const item = document.createElement("div");
            item.className = "final-rank-item";
            item.innerHTML = `
                <span><strong>#${r + 1}</strong> ${team.name}</span>
                <span style="color: var(--primary-cyan); font-weight: bold;">${team.score} Pts</span>
            `;
            rankList.appendChild(item);
        });

        resultModal.classList.remove("hidden");
        if (state.confettiEnabled) triggerConfetti();
    }

    // ==========================================================================
    // CONFETTI EFFECT
    // ==========================================================================
    function triggerConfetti() {
        const canvas = document.getElementById("confettiCanvas");
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const colors = ["#00f0ff", "#ff007f", "#00e676", "#ffd700", "#9d4edd"];

        for (let i = 0; i < 100; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 5 + 2,
                speedX: Math.random() * 4 - 2
            });
        }

        let animationFrame;
        function update() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            });
            if (pieces.some(p => p.y < canvas.height)) {
                animationFrame = requestAnimationFrame(update);
            } else {
                cancelAnimationFrame(animationFrame);
            }
        }
        update();
    }

    // ==========================================================================
    // BOOT
    // ==========================================================================
    function boot() {
        loadLocalStorage();

        if (state.setupComplete && state.chapterId && state.questionsData.length > 0) {
            // Lanjutkan sesi terakhir tanpa menampilkan setup lagi
            document.getElementById("setupScreen").classList.add("hidden");
            document.body.classList.remove("setup-active");
            document.getElementById("appContainer").classList.remove("hidden");

            document.getElementById("babIcon").textContent = state.chapterMeta.icon || "📖";
            document.getElementById("babTitle").textContent = state.chapterMeta.title || "Bab";
            document.getElementById("babSubtitle").textContent = state.chapterMeta.subtitle || "Kuis Interaktif SMP";
            document.getElementById("modeLabel").textContent = "Mode: Tim";
            document.getElementById("modeSub").textContent = `${state.teams.length} Tim`;

            buildWheel();
            renderCategories();
            renderTeamScores();
            updateLeaderboard();
            renderQuestion(state.currentQuestionIndex);
            updateProgress();
            updateTimerDisplay();
            startTimer();
            setupEventListeners();
        } else {
            document.body.classList.add("setup-active");
            initSetupScreen();
        }
    }

    boot();
});
