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
        window.location.protocol === 'file:'
            ? 'http://127.0.0.1:5000'
            : `${window.location.protocol}//${window.location.hostname}:5000`;

    // Check Backend Status
    fetch(`${apiBase}/api/status`)
        .then(res => res.json())
        .then(data => {
            const statusInd = document.querySelector('.status-indicator');
            const statusSpan = document.querySelector('.info-status span');
            if (data.model_loaded) {
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
        const sender_upi = document.getElementById('sender-upi').value;
        const receiver_upi = document.getElementById('receiver-upi').value;
        const device_type = document.getElementById('device-type').value;
        const amount = parseFloat(document.getElementById('amount').value);

        // Validate UPI IDs
        const validSuffixes = ['@sbi', '@oksbi', '@ptsbi', '@hdfcbank', '@okhdfcbank', '@pthdfc', '@icici', '@okicici', '@axis', '@axl', '@okaxis', '@ptaxis', '@ybl', '@ibl', '@yes', '@ptyes', '@kotak', '@kotak811', '@pnb', '@barodapay', '@bob', '@indie', '@indus', '@airtel', '@upi', '@apl', '@yapl'];

        const isValidUPI = (upi) => {
            const upiLower = upi.toLowerCase().trim();
            if (!upiLower.includes('@')) return false;
            const parts = upiLower.split('@');
            if (parts.length !== 2) return false;
            const prefix = parts[0];
            const suffix = '@' + parts[1];

            // Check if prefix is exactly 10 digits (mobile number)
            if (!/^\d{10}$/.test(prefix)) return false;

            // Check if suffix is in the valid list
            if (!validSuffixes.includes(suffix)) return false;

            return true;
        };

        if (!isValidUPI(sender_upi) || !isValidUPI(receiver_upi)) {
            showResult(false, 0, "Fake UPI ID", "Invalid UPI ID format! It must start with a 10-digit mobile number and contain a valid bank handle with '@' (e.g., 9876543210@sbi).", "var(--danger-color)", '<i class="fa-solid fa-triangle-exclamation"></i>', null);
            analyzeBtn.disabled = false;
            analyzeBtn.style.opacity = '1';
            return;
        }

        try {
            // ML PREDICTION (Calling Flask API)
            const predRes = await fetch(`${apiBase}/api/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender_upi, receiver_upi, device_type, amount })
            });
            const predData = await predRes.json();

            if (predData.error) {
                showResult(false, 0, "System Error", predData.error, "var(--warning-color)", '<i class="fa-solid fa-triangle-exclamation"></i>', null);
                return;
            }

            // Show Real ML Prediction
            let title, desc, color, iconHtml;
            if (predData.is_fraud) {
                title = 'High Risk Detected';
                desc = 'ML Model flagged this transaction based on real-time parameters. Recommended action: BLOCK.';
                color = 'var(--danger-color)';
                iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
            } else {
                title = 'Transaction Safe';
                desc = 'ML model determined no significant risk factors for this context. Transaction is legitimate.';
                color = 'var(--success-color)';
                iconHtml = '<i class="fa-solid fa-shield-check"></i>';
            }

            showResult(predData.is_fraud, predData.risk_score, title, desc, color, iconHtml, predData.ai_comment);

            // Save state to sessionStorage
            sessionStorage.setItem('lastAnalysis', JSON.stringify({
                isFraud: predData.is_fraud,
                riskScore: predData.risk_score,
                title, desc, color, iconHtml,
                aiComment: predData.ai_comment,
                inputs: {
                    sender_upi: sender_upi,
                    receiver_upi: receiver_upi,
                    device_type: device_type,
                    amount: amount
                }
            }));

        } catch (err) {
            console.error(err);
            showResult(false, 0, "Connection Error", "Could not connect to the ML Backend server. Make sure Flask is running on port 5000.", "var(--danger-color)", '<i class="fa-solid fa-server"></i>', null);
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.style.opacity = '1';
        }
    });

    function showResult(isFraud, riskScore, title, desc, color, iconHtml, aiComment) {
        // Hide Loading, Show Result
        loadingState.style.display = 'none';
        finalResult.style.display = 'block';

        // Populate Result
        resultIcon.className = 'result-icon-lg';
        resultIcon.innerHTML = iconHtml;
        resultIcon.style.color = color;

        resultTitle.textContent = title;
        resultTitle.style.color = color;
        resultDesc.textContent = desc;

        // Populate numbered checklist
        const checkUpi = document.getElementById('check-upi');
        const checkBank = document.getElementById('check-bank');
        const checkTxn = document.getElementById('check-txn');
        const checklistContainer = document.querySelector('.prediction-checklist');

        if (checklistContainer) {
            if (title === "Connection Error" || title === "System Error") {
                checklistContainer.style.display = 'none';
            } else {
                checklistContainer.style.display = 'block';
                if (checkUpi && checkBank && checkTxn) {
                    if (title === "Fake UPI ID") {
                        checkUpi.textContent = "Invalid Format";
                        checkUpi.style.color = "var(--danger-color)";
                        checkBank.textContent = "N/A";
                        checkTxn.textContent = "Blocked";
                    } else if (isFraud) {
                        checkUpi.textContent = "Format Valid, but flagged by network";
                        checkUpi.style.color = "var(--warning-color)";
                        checkBank.textContent = "Operational";
                        checkBank.style.color = "var(--success-color)";
                        checkTxn.textContent = "High Risk - BLOCKED";
                        checkTxn.style.color = "var(--danger-color)";
                    } else {
                        checkUpi.textContent = "Safe & Verified";
                        checkUpi.style.color = "var(--success-color)";
                        checkBank.textContent = "Good Health";
                        checkBank.style.color = "var(--success-color)";
                        checkTxn.textContent = "Safe & Legitimate";
                        checkTxn.style.color = "var(--success-color)";
                    }
                }
            }
        }

        // AI Comment Widget Logic
        const aiWidget = document.getElementById('ai-comment-widget');
        const aiText = document.getElementById('ai-comment-text');
        if (aiWidget && aiText) {
            if (aiComment && title !== "Connection Error" && title !== "System Error") {
                aiWidget.style.display = 'block';
                aiText.textContent = aiComment;
            } else {
                aiWidget.style.display = 'none';
            }
        }
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

    // --- Bank Sparklines Real Monitoring ---
    async function fetchAndDrawSparklines() {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/bank-status');
            if (!response.ok) throw new Error('Network response was not ok');
            const bankData = await response.json();

            const canvases = document.querySelectorAll('.sparkline');
            canvases.forEach(canvas => {
                const bankItem = canvas.closest('.bank-item');
                const bankName = bankItem ? bankItem.getAttribute('data-bank') : null;

                // If we don't have data for this bank yet, fallback to a flat line
                let reportsArray = bankData[bankName];
                if (!reportsArray) {
                    reportsArray = Array(40).fill(0);
                }

                const ctx = canvas.getContext('2d');
                // Ensure crisp lines on retina displays
                const dpr = window.devicePixelRatio || 1;
                const rect = canvas.getBoundingClientRect();

                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                ctx.scale(dpr, dpr);

                const w = rect.width;
                const h = rect.height;

                const points = reportsArray.length;
                const pointSpacing = w / (points - 1);

                ctx.beginPath();
                ctx.moveTo(0, h);

                let currentX = 0;
                let maxReports = 0;

                for (let i = 0; i < points; i++) {
                    let reports = reportsArray[i];
                    if (reports > maxReports) maxReports = reports;

                    let drawVal = Math.min(reports, 50);
                    const y = h - (drawVal / 50 * h);

                    if (i === 0) {
                        ctx.moveTo(currentX, y);
                    } else {
                        ctx.lineTo(currentX, y);
                    }
                    currentX += pointSpacing;
                }

                // Determine color based on maxReports
                let lineColor, gradStart;
                if (maxReports > 40) {
                    lineColor = '#ff4757';
                    gradStart = 'rgba(255, 71, 87, 0.2)';
                } else if (maxReports > 30) {
                    lineColor = '#ffa502';
                    gradStart = 'rgba(255, 165, 2, 0.2)';
                } else {
                    lineColor = '#00d2ff';
                    gradStart = 'rgba(0, 210, 255, 0.2)';
                }

                ctx.lineWidth = 1.5;
                ctx.strokeStyle = lineColor;
                ctx.stroke();

                ctx.lineTo(w, h);
                ctx.lineTo(0, h);

                const gradient = ctx.createLinearGradient(0, 0, 0, h);
                gradient.addColorStop(0, gradStart);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = gradient;
                ctx.fill();

                // Update the report count text below the graph
                const container = canvas.closest('.sparkline-container');
                if (container) {
                    const countSpan = container.querySelector('.report-count');
                    if (countSpan) {
                        const finalCount = Math.floor(maxReports);
                        countSpan.textContent = finalCount + (finalCount === 1 ? ' report' : ' reports');
                        countSpan.style.color = lineColor;
                    }
                }
            });
        } catch (error) {
            console.error("Error fetching bank status:", error);
        }
    }

    // Draw them slightly after load so CSS sizes are applied
    setTimeout(fetchAndDrawSparklines, 200);

    // Form input resets the result
    form.addEventListener('input', () => {
        sessionStorage.removeItem('lastAnalysis');
        resultWidget.style.display = 'none';
    });

    // Handle clear button
    form.addEventListener('reset', () => {
        sessionStorage.removeItem('lastAnalysis');
        resultWidget.style.display = 'none';
    });

    // Restore from SessionStorage on load
    const saved = sessionStorage.getItem('lastAnalysis');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            document.getElementById('sender-upi').value = data.inputs.sender_upi;
            document.getElementById('receiver-upi').value = data.inputs.receiver_upi;
            document.getElementById('device-type').value = data.inputs.device_type;
            document.getElementById('amount').value = data.inputs.amount;

            // Re-show result instantly
            resultWidget.style.display = 'flex';
            showResult(data.isFraud, data.riskScore, data.title, data.desc, data.color, data.iconHtml, data.aiComment);
        } catch (e) {
            console.error("Could not parse saved analysis state", e);
        }
    }
});
