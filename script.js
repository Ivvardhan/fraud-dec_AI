document.addEventListener('DOMContentLoaded', () => {
    // --- Keep Refresh Button Logic --- //
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        const refreshIcon = refreshBtn.querySelector('i');
        refreshBtn.addEventListener('click', () => {
            refreshIcon.classList.add('spin-anim');
            refreshBtn.disabled = true;
            refreshBtn.style.opacity = '0.7';

            setTimeout(() => {
                refreshIcon.classList.remove('spin-anim');
                refreshBtn.disabled = false;
                refreshBtn.style.opacity = '1';
                
                const statusSpan = document.querySelector('.info-status span');
                const originalText = statusSpan.textContent;
                statusSpan.textContent = 'Data Synced Successfully';
                statusSpan.style.color = 'var(--success-color)';
                
                const indicator = document.querySelector('.status-indicator');
                if (indicator) indicator.style.background = 'var(--success-color)';
                
                setTimeout(() => {
                    statusSpan.textContent = originalText;
                    statusSpan.style.color = 'var(--text-secondary)';
                    if (indicator) indicator.style.background = 'var(--info-color)';
                }, 3000);
            }, 600);
        });
    }

    // --- Render Charts (if canvases exist) ---
    const trendCtx = document.getElementById('fraudTrendChart');
    const categoryCtx = document.getElementById('fraudCategoryChart');
    const stateCtx = document.getElementById('stateRiskChart');
    const valueCtx = document.getElementById('valueImpactChart');

    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Fraud Cases (Thousands)',
                    data: [85, 92, 105, 112, 110, 128],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#9ca3af' }
                    }
                },
                scales: {
                    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }

    if (categoryCtx) {
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['Phishing', 'Fake QR', 'Vishing', 'Malware', 'Other'],
                datasets: [{
                    data: [45, 25, 15, 10, 5],
                    backgroundColor: [
                        '#ef4444',
                        '#f59e0b',
                        '#3b82f6',
                        '#10b981',
                        '#6366f1'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#9ca3af', padding: 20 }
                    }
                }
            }
        });
    }

    if (stateCtx) {
        new Chart(stateCtx, {
            type: 'bar',
            data: {
                labels: ['Maharashtra', 'Delhi', 'Uttar Pradesh', 'West Bengal', 'Karnataka'],
                datasets: [{
                    label: 'Reported Cases',
                    data: [15000, 12500, 10200, 8900, 7500],
                    backgroundColor: '#f59e0b',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#9ca3af' }, grid: { display: false } }
                }
            }
        });
    }

    if (valueCtx) {
        new Chart(valueCtx, {
            type: 'bar',
            data: {
                labels: ['< ₹1,000', '₹1K - ₹5K', '₹5K - ₹20K', '₹20K - ₹50K', '> ₹50K'],
                datasets: [{
                    label: 'Fraud Value Ranges',
                    data: [35, 40, 15, 7, 3],
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
                    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }
});
