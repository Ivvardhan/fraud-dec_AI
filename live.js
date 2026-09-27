document.addEventListener('DOMContentLoaded', () => {
    const scroller = document.getElementById('feed-scroller');
    
    const apiBase =
        window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://127.0.0.1:5000'
            : 'https://fraud-dec-ai-1.onrender.com';

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
            if(statusInd && statusSpan) {
                statusInd.style.background = 'var(--danger-color)';
                statusInd.style.boxShadow = '0 0 8px var(--danger-color)';
                statusSpan.textContent = 'Backend: Not Reachable';
            }
            console.warn("Backend not reachable. Ensure Flask is running on port 5000.");
        });

    // Fetch random transactions and populate the feed
    async function fetchLiveTransactions() {
        try {
            const response = await fetch(`${apiBase}/api/live-transactions?count=60`);
            const data = await response.json();
            
            if (data.transactions) {
                // Clear existing
                scroller.innerHTML = '';
                
                data.transactions.forEach(tx => {
                    const row = document.createElement('div');
                    row.className = 'tx-row';
                    
                    const statusClass = tx.status === 'SUCCESS' ? 'badge-success' : 'badge-failed';
                    const icon = tx.status === 'SUCCESS' ? 'fa-check-circle' : 'fa-times-circle';
                    
                    row.innerHTML = `
                        <div class="tx-id">${tx.sender}</div>
                        <div class="tx-arrow"><i class="fa-solid fa-arrow-right"></i></div>
                        <div class="tx-id">${tx.receiver}</div>
                        <div class="tx-status">
                            <span class="badge ${statusClass}">
                                <i class="fa-solid ${icon}"></i> ${tx.status}
                            </span>
                        </div>
                    `;
                    scroller.appendChild(row);
                });
            }
        } catch (error) {
            console.error("Error fetching live transactions:", error);
        }
    }

    // Initial fetch
    fetchLiveTransactions();

    // The CSS animation takes 40s. We refresh the data every 40s to get a new batch
    setInterval(fetchLiveTransactions, 40000);
});
