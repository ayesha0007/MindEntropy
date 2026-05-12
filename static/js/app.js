let radar;
const grid = document.getElementById('inputGrid');

const phqDetailedQuestions = [
    "Over the last 2 weeks, how often have you had little interest or pleasure in doing things you usually enjoy?",
    "How often have you been feeling down, depressed, or hopeless about your current situation?",
    "How often have you had trouble falling asleep, staying asleep, or found yourself sleeping too much?",
    "How often have you felt unusually tired or felt like you have very little energy to get through the day?",
    "How often have you experienced a poor appetite, or found yourself overeating more than usual?",
    "How often have you felt bad about yourself—feeling like a failure, or that you've let yourself or your family down?",
    "How often have you had trouble concentrating on tasks, such as reading a book, working, or watching television?",
    "How often have others noticed you moving or speaking slowly? Or being so restless that you are moving around more than usual?",
    "How often have you had thoughts that you would be better off dead, or thoughts of hurting yourself in some way?"
];

// 1. dashboard setup (UI Cards generation)
function setupDashboard() {
    if (!grid) return;
    grid.innerHTML = "";

    phqDetailedQuestions.forEach((q, i) => {
        const card = `
            <div class="bg-[#1e293b]/50 p-6 rounded-2xl border border-gray-800 hover:border-cyan-500/30 transition-all duration-300">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded-md font-bold uppercase tracking-tighter">Question ${i+1}</span>
                    <span id="val_q${i}" class="text-sm font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">0</span>
                </div>
                <h4 class="text-sm text-gray-200 mb-6 leading-relaxed min-h-[60px]">${q}</h4>
                <input type="range" id="q${i}" min="0" max="3" value="0" 
                       oninput="document.getElementById('val_q${i}').innerText = this.value"
                       class="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400">
                <div class="flex justify-between text-[8px] text-gray-500 mt-3 font-black uppercase tracking-widest">
                    <span class="w-1/4">Not at all</span>
                    <span class="w-1/4 text-center">Several days</span>
                    <span class="w-1/4 text-center">More than half</span>
                    <span class="w-1/4 text-right">Nearly every day</span>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', card);
    });
    initRadarChart();
    if (window.lucide) lucide.createIcons();
}

// 2. Clinical Logic
function getClinicalRecommendation(responses, score, entropy) {
    const suicidalIdeation = responses[8] > 0;
    const cognitiveSymptom = responses[5] >= 2 || responses[6] >= 2;
    const somaticSymptom = responses[2] >= 2 || responses[3] >= 2 || responses[4] >= 2;

    if (suicidalIdeation) {
        return `<b>Clinical Status: CRITICAL PRIORITY.</b> Positive screening for self-harm ideation. Regardless of the total score (${score}), this requires immediate clinical attention. Entropy analysis shows a ${entropy > 1.5 ? 'highly complex' : 'concentrated'} distress pattern. <br><b>Actionable Steps:</b> Seek emergency psychiatric evaluation or contact a crisis helpline immediately. Do not stay alone.`;
    }
    if (score >= 20 && entropy < 1.3) {
        return `<b>Clinical Status: Major Depressive Disorder (Severe).</b> Highly consistent symptoms with a primary depressive focus. Low system entropy indicates a "locked" state of distress. <br><b>Actionable Steps:</b> Consult a psychiatrist for pharmacological evaluation and intensive psychotherapy (CBT).`;
    }
    if (entropy > 1.8) {
        return `<b>Clinical Status: Complex Affective Dysregulation.</b> Symptoms are erratic and widely distributed across emotional and cognitive domains. <br><b>Actionable Steps:</b> A comprehensive diagnostic workup is needed to explore potential comorbid conditions like anxiety or chronic stress.`;
    }
    if (cognitiveSymptom && score >= 10) {
        return `<b>Clinical Status: Moderate Depression with Cognitive Impairment.</b> Significant struggles with self-perception and concentration identified. <br><b>Actionable Steps:</b> Prioritize cognitive restructuring and mindfulness-based therapy (MBCT) to improve focus.`;
    }
    if (somaticSymptom && score >= 10) {
        return `<b>Clinical Status: Moderate Depression with Somatic Features.</b> Distress is heavily manifesting through physical symptoms like sleep disruption and fatigue. <br><b>Actionable Steps:</b> Implement behavioral activation and strict sleep hygiene protocols. Rule out biological factors with a GP.`;
    }
    if (score < 10) {
        return `<b>Clinical Status: Sub-threshold/Mild Distress.</b> Symptoms currently do not meet full criteria for a clinical depressive episode. <br><b>Actionable Steps:</b> Focus on preventive self-care, regular exercise, and stress management.`;
    }
    return `<b>Clinical Status: Moderate Distress.</b> Total score of ${score} with an entropy of ${entropy}. <br><b>Actionable Steps:</b> Clinical correlation is recommended. Talking to a therapist could provide further clarity.`;
}

// 3. insight update
function updateInsights(responses, data) {
    const insightSection = document.getElementById('insightContent');
    const insightWrapper = document.getElementById('modelInsightSection');
    if (!insightSection || !insightWrapper) return;

    insightWrapper.classList.remove('hidden');
    const labels = ["Not at all", "Several days", "More than half", "Nearly every day"];
    const recommendation = getClinicalRecommendation(responses, data.score, data.shannon);

    let html = `
        <div class="space-y-8 animate-fade-in">
            <div class="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 rounded-[2.5rem] border border-cyan-500/30 shadow-2xl">
                <div class="flex items-center gap-4 mb-6">
                    <div class="p-3 bg-cyan-500/20 rounded-2xl shadow-lg">
                        <i data-lucide="stethoscope" class="text-cyan-400 w-6 h-6"></i>
                    </div>
                    <div>
                        <h4 class="text-white font-black text-sm uppercase tracking-widest">Clinical Diagnostic Report</h4>
                        <p class="text-[10px] text-cyan-500 font-bold uppercase">Multidimensional AI Analysis</p>
                    </div>
                </div>
                <div class="text-gray-200 text-sm leading-relaxed mb-6 space-y-4">
                    ${recommendation}
                </div>
                <div class="flex gap-4 pt-6 border-t border-gray-800">
                    <div class="px-4 py-2 bg-black/30 rounded-xl border border-gray-800">
                        <span class="text-[9px] text-gray-500 block uppercase font-bold tracking-tighter">Total Score</span>
                        <span class="text-white font-mono text-lg">${data.score}/27</span>
                    </div>
                    <div class="px-4 py-2 bg-black/30 rounded-xl border border-gray-800">
                        <span class="text-[9px] text-gray-500 block uppercase font-bold tracking-tighter">Shannon Entropy</span>
                        <span class="text-cyan-400 font-mono text-lg">${data.shannon}</span>
                    </div>
                </div>
            </div>

            <div>
                <h4 class="text-gray-400 text-[10px] uppercase font-black mb-4 tracking-[0.2em] px-2">Patient Response Logs (PHQ-9 Audit)</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${responses.map((val, i) => `
                        <div class="p-5 rounded-[2rem] bg-slate-800/20 border border-gray-800/50 hover:border-slate-600 transition-all duration-500 group">
                            <div class="flex justify-between items-center mb-3">
                                <span class="text-[9px] text-gray-500 font-black uppercase">Question ${i+1}</span>
                                <span class="text-[10px] font-mono font-bold ${val > 1 ? 'text-red-400' : 'text-cyan-500'} bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
                                    Val: ${val}
                                </span>
                            </div>
                            <p class="text-[11px] text-gray-400 font-medium mb-3 leading-tight italic">"${phqDetailedQuestions[i]}"</p>
                            <div class="flex items-center gap-2">
                                <div class="w-2 h-2 rounded-full ${val > 1 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]'}"></div>
                                <span class="text-[10px] font-black uppercase text-white">${labels[val]}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    insightSection.innerHTML = html;
    if(window.lucide) lucide.createIcons();
}

// 4. analysis func
async function analyze() {
    const btn = document.getElementById('analyzeBtn');
    const insightWrapper = document.getElementById('modelInsightSection');
    
    if (!btn || btn.disabled) return;
    btn.disabled = true;
    const oldContent = btn.innerHTML;
    btn.innerHTML = `<i class="animate-spin mr-2" data-lucide="refresh-cw"></i> PROCESSING CLINICAL DATA...`;
    if(window.lucide) lucide.createIcons();

    try {
        const responses = Array.from({length: 9}, (_, i) => {
            const input = document.getElementById(`q${i}`);
            return input ? parseInt(input.value) : 0;
        });

        const res = await fetch('/analyze', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({responses})
        });
        const data = await res.json();

        // update ui
        document.getElementById('res_sev').innerText = data.severity;
        document.getElementById('res_conf').innerText = data.confidence;
        document.getElementById('val_sh').innerText = data.shannon;
        document.getElementById('val_sa').innerText = data.sample;

        if (radar) {
            radar.data.datasets[0].data = [data.shannon, data.sample * 2, data.permutation, (data.shannon + data.sample)/2];
            radar.update();
        }

        updateInsights(responses, data);

        if (insightWrapper) {
            setTimeout(() => {
                insightWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }

    } catch (error) {
        console.error(error);
        alert("System Error: Analytics engine offline.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = oldContent;
        if(window.lucide) lucide.createIcons();
    }
}

// 5. radar chart initialization
function initRadarChart() {
    const radarCtx = document.getElementById('radarChart');
    if (radarCtx && !radar) {
        radar = new Chart(radarCtx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['Shannon', 'Sample', 'Permutation', 'Complexity'],
                datasets: [{
                    label: 'Entropy Profile',
                    data: [0, 0, 0, 0],
                    borderColor: '#22d3ee',
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#22d3ee'
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: { 
                    r: { 
                        grid: { color: '#334155' }, 
                        ticks: { display: false },
                        pointLabels: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
                    } 
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}

// 6. DOMContentLoaded 
document.addEventListener('DOMContentLoaded', () => {
    // লগইন চেক
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        const overlay = document.getElementById('loginOverlay');
        if (overlay) overlay.remove();
        
        const savedUser = sessionStorage.getItem('activeResearcher');
        if(savedUser && document.getElementById('displayUserName')) {
            document.getElementById('displayUserName').innerText = savedUser;
        }
    }

    // dashboard
    setupDashboard();
});