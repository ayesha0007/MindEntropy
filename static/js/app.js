let radar;
const grid = document.getElementById('inputGrid');
const qLabels = ["Interest/Pleasure", "Feeling Down", "Sleep Issues", "Energy Levels", "Appetite", "Self-Image", "Concentration", "Movement Speed", "Self-Harm Thoughts"];

// প্রশ্নগুলো তৈরি করা
qLabels.forEach((q, i) => {
    grid.innerHTML += `
        <div class="bg-black/20 p-6 rounded-2xl border border-gray-800">
            <label class="block text-xs text-gray-500 mb-4">${i+1}. ${q}</label>
            <input type="range" id="q${i}" min="0" max="3" value="0" class="w-full accent-cyan-500">
            <div class="flex justify-between text-[10px] text-gray-700 mt-2"><span>0</span><span>3</span></div>
        </div>
    `;
});

// রাডার চার্ট ইনিশিয়ালাইজেশন
const ctx = document.getElementById('radarChart').getContext('2d');
radar = new Chart(ctx, {
    type: 'radar',
    data: {
        labels: ['Shannon', 'Sample', 'Permutation', 'Complexity'],
        datasets: [{
            data: [0, 0, 0, 0],
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.1)',
            borderWidth: 2
        }]
    },
    options: { plugins: { legend: { display: false } }, scales: { r: { ticks: { display: false }, grid: { color: '#334155' } } } }
});

async function analyze() {
    const responses = Array.from({length: 9}, (_, i) => parseInt(document.getElementById(`q${i}`).value));
    
    const res = await fetch('/analyze', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({responses})
    });
    
    const data = await res.json();
    
    // UI আপডেট
    document.getElementById('res_sev').innerText = `${data.score} - ${data.severity}`;
    document.getElementById('res_conf').innerText = data.confidence;
    document.getElementById('val_sh').innerText = data.shannon;
    document.getElementById('val_sa').innerText = data.sample;

    // চার্ট আপডেট
    radar.data.datasets[0].data = [data.shannon, data.sample, data.permutation, data.shannon * 1.2];
    radar.update();
}