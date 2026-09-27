document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('detection-form');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultWidget = document.getElementById('result-widget');
    const loadingState = document.getElementById('loading-state');
    const finalResult = document.getElementById('final-result');
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resultDesc = document.getElementById('result-desc');
    const riskFill = document.getElementById('risk-fill');
    const scoreVal = document.getElementById('score-val');
    
    const apiBase =
        window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://127.0.0.1:5000'
            : window.location.origin;

    // Check Backend Status
    fetch(`${apiBase}/api/status`)
        .then(res => res.json())
        .then(data => {
            const statusInd = document.querySelector('.status-indicator');
            const statusSpan = document.querySelector('.info-status span');
            if(data.model_loaded) {
                statusInd.style.background = 'var(--success-color)';
                statusInd.style.boxShadow = '0 0 8px var(--success-color)';
                statusSpan.textContent = 'ML Model: Online';
            } else {
                statusInd.style.background = 'var(--warning-color)';
                statusInd.style.boxShadow = '0 0 8px var(--warning-color)';
                statusSpan.textContent = 'ML Model: Offline';
            }
        })
        .catch(err => {
            const statusInd = document.querySelector('.status-indicator');
            const statusSpan = document.querySelector('.info-status span');
            statusInd.style.background = 'var(--danger-color)';
            statusInd.style.boxShadow = '0 0 8px var(--danger-color)';
            statusSpan.textContent = 'Backend: Not Reachable';
            console.warn("Backend not reachable. Ensure Flask is running on port 5000.");
        });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Show Result Widget & Loading State
        resultWidget.style.display = 'flex';
        
        loadingState.style.display = 'flex';
        finalResult.style.display = 'none';
        
        analyzeBtn.disabled = true;
        analyzeBtn.style.opacity = '0.7';

        // Get Input Values
        const device_type = document.getElementById('device-type').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const upi_app = document.getElementById('upi-app').value;
        const victim_state = document.getElementById('victim-state').value;
        const victim_occupation = document.getElementById('victim-occupation').value;
        const victim_age_group = document.getElementById('victim-age-group').value;
        const linked_bank = document.getElementById('linked-bank').value;
        const time = document.getElementById('time').value;
        const transaction_type = document.getElementById('transaction-type').value;

        try {
            // ML PREDICTION (Calling Flask API)
            const predRes = await fetch(`${apiBase}/api/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_type, amount, upi_app, transaction_type, victim_state, victim_occupation, victim_age_group, linked_bank, time })
            });
            const predData = await predRes.json();

            if (predData.error) {
                showResult(false, 0, "System Error", predData.error, "var(--warning-color)", '<i class="fa-solid fa-triangle-exclamation"></i>', null);
                return;
            }

            let isFraud = predData.is_fraud;
            let title = "";
            let desc = predData.ai_comment || "";
            let color = "";
            let iconHtml = "";

            if (predData.is_fraud) {
                title = "Transaction is Fraud & High Risk";
                color = "var(--danger-color)";
                iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
            } else if (predData.risk_score > 50) {
                isFraud = true; // High risk treated as fraud for UI
                title = "Transaction is at Risk";
                color = "var(--warning-color)";
                iconHtml = '<i class="fa-solid fa-circle-exclamation"></i>';
            } else {
                title = "Transaction is Safe & Low Risk";
                color = "var(--success-color)";
                iconHtml = '<i class="fa-solid fa-shield-check"></i>';
            }
            
            showResult(isFraud, predData.risk_score, title, color, iconHtml);

            // Save state to sessionStorage
            sessionStorage.setItem('lastFraudAnalysis', JSON.stringify({
                isFraud: predData.is_fraud,
                riskScore: predData.risk_score,
                title, desc, color, iconHtml,
                aiComment: predData.ai_comment,
                inputs: {
                    device_type: device_type,
                    amount: amount,
                    upi_app: upi_app,
                    transaction_type: transaction_type,
                    victim_state: victim_state,
                    victim_occupation: victim_occupation,
                    victim_age_group: victim_age_group,
                    linked_bank: linked_bank,
                    time: time
                }
            }));

        } catch (err) {
            console.error(err);
            showResult(false, 0, "Connection Error", "var(--danger-color)", '<i class="fa-solid fa-server"></i>');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.style.opacity = '1';
        }
    });

    function showResult(isFraud, riskScore, title, color, iconHtml) {
        // Hide Loading, Show Result
        loadingState.style.display = 'none';
        finalResult.style.display = 'block';
        
        // Populate Result
        resultIcon.className = 'result-icon-lg';
        resultIcon.innerHTML = iconHtml;
        resultIcon.style.color = color;
        
        resultTitle.textContent = title;
        resultTitle.style.color = color;

        if (document.getElementById('risk-score')) document.getElementById('risk-score').textContent = riskScore + '/100';
        if (document.getElementById('risk-bar')) document.getElementById('risk-bar').style.width = riskScore + '%';
    }

    // Helper for animating numbers
    function animateValue(obj, start, end, duration) {
        if (end === 0) {
            obj.innerHTML = 0;
            return;
        }
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            obj.innerHTML = Math.floor(start + (end - start) * easeOut);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }



    // Form input resets the result
    form.addEventListener('input', () => {
        sessionStorage.removeItem('lastFraudAnalysis');
        resultWidget.style.display = 'none';
    });

    // Handle clear button
    form.addEventListener('reset', () => {
        sessionStorage.removeItem('lastFraudAnalysis');
        resultWidget.style.display = 'none';
    });

    // Restore from SessionStorage on load
    const saved = sessionStorage.getItem('lastFraudAnalysis');
    if (saved) {
        try {
            const lastAnalysis = JSON.parse(saved);
            if (lastAnalysis.inputs) {
                if(document.getElementById('device-type')) document.getElementById('device-type').value = lastAnalysis.inputs.device_type || 'Android';
                if(document.getElementById('amount')) document.getElementById('amount').value = lastAnalysis.inputs.amount || '';
                if(document.getElementById('upi-app')) document.getElementById('upi-app').value = lastAnalysis.inputs.upi_app || 'Google Pay';
                if(document.getElementById('transaction-type')) document.getElementById('transaction-type').value = lastAnalysis.inputs.transaction_type || 'P2P';
                if(document.getElementById('victim-state')) document.getElementById('victim-state').value = lastAnalysis.inputs.victim_state || '';
                if(document.getElementById('victim-occupation')) document.getElementById('victim-occupation').value = lastAnalysis.inputs.victim_occupation || 'Salaried Employee';
                if(document.getElementById('victim-age-group')) document.getElementById('victim-age-group').value = lastAnalysis.inputs.victim_age_group || '26-35';
                if(document.getElementById('linked-bank')) document.getElementById('linked-bank').value = lastAnalysis.inputs.linked_bank || 'Axis Bank';
                if(document.getElementById('time')) document.getElementById('time').value = lastAnalysis.inputs.time || '';
            }    
            // Re-show result instantly
            resultWidget.style.display = 'flex';
            showResult(lastAnalysis.isFraud, lastAnalysis.riskScore, lastAnalysis.title, lastAnalysis.color, lastAnalysis.iconHtml);
        } catch (e) {
            console.error("Could not parse saved analysis state", e);
        }
    }
});
