document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('scan-input');
    const scanBtn = document.getElementById('btn-scan');
    const btnText = document.getElementById('btn-text');
    const resultsView = document.getElementById('results');
    const dashboardBtn = document.getElementById('btn-dashboard');

    const modelOutput = document.getElementById('detected-model');
    const confOutput = document.getElementById('confidence-score');

    // Make sure button disables initially if empty
    input.addEventListener('input', () => {
        if (!input.value.trim()) {
            scanBtn.disabled = true;
        } else {
            scanBtn.disabled = false;
        }
    });

    // Initialize button state
    scanBtn.disabled = true;

    dashboardBtn.addEventListener('click', () => {
        // Redirect to local dashboard (assume running on port 3000)
        chrome.tabs.create({ url: `http://localhost:3000/scans` });
    });

    scanBtn.addEventListener('click', async () => {
        const textToScan = input.value.trim();
        if (!textToScan) return;

        // Reset UI
        resultsView.classList.add('hidden');
        scanBtn.disabled = true;
        btnText.textContent = "Executing Initial Scan...";

        try {
            const response = await fetch('http://localhost:8000/api/scan/core', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Inference-Mode': 'local'
                },
                body: JSON.stringify({
                    content: textToScan,
                    source_platform: "extension",
                    username: "analyst_agent"
                })
            });

            if (!response.ok) {
                throw new Error("Server rejected connection. Is the backend running?");
            }

            const data = await response.json();
            
            // Populate Results
            const riskPc = Math.round(data.risk_score * 100);
            
            if (riskPc > 50 || data.is_ai_generated) {
                modelOutput.textContent = data.detected_model.toUpperCase();
                modelOutput.className = "value bad";
                confOutput.className = "value bad";
            } else {
                modelOutput.textContent = "HUMAN";
                modelOutput.className = "value good";
                confOutput.className = "value good";
            }

            confOutput.textContent = `${riskPc}% Risk Profile`;
            resultsView.classList.remove('hidden');

        } catch (err) {
            console.error("Scan Error:", err);
            // Handle error logic visually inside the same wrapper
            modelOutput.textContent = "BACKEND OFFLINE";
            modelOutput.className = "value bad";
            confOutput.textContent = "N/A";
            confOutput.className = "value bad";
            resultsView.classList.remove('hidden');
        } finally {
            btnText.textContent = "Execute Forensic Scan";
            scanBtn.disabled = false;
        }
    });
});
