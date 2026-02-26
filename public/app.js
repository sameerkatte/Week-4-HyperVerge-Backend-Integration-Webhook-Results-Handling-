// Debug Logger
class DebugLogger {
    constructor(elementId) {
        this.logElement = document.getElementById(elementId);
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span>${message}`;

        this.logElement.appendChild(logEntry);
        this.logElement.scrollTop = this.logElement.scrollHeight;

        // Also log to browser console
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    info(message) {
        this.log(message, 'info');
    }

    warn(message) {
        this.log(message, 'warn');
    }

    error(message) {
        this.log(message, 'error');
    }

    success(message) {
        this.log(message, 'success');
    }

    clear() {
        this.logElement.innerHTML = '';
    }
}

// Initialize logger
const logger = new DebugLogger('debug-log');

// DOM Elements
const configForm = document.getElementById('config-form');
const setupSection = document.getElementById('setup-section');
const loadingSection = document.getElementById('loading-section');
const resultSection = document.getElementById('result-section');
const resultContent = document.getElementById('result-content');
const launchBtn = document.getElementById('launchBtn');
const inputsModal = document.getElementById('inputsModal');
const inputsForm = document.getElementById('inputs-form');
const inputsContainer = document.getElementById('inputsContainer');
const addInputBtn = document.getElementById('addInputBtn');
const cancelInputsBtn = document.getElementById('cancelInputsBtn');

// Generate unique transaction ID
function generateTransactionId() {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Fetch auth token from backend
async function fetchAuthToken() {
    try {
        logger.info(`Fetching auth token from: /api/auth`);

        const response = await fetch(`/api/auth`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success || !data.token) {
            throw new Error('Invalid token response from backend');
        }

        logger.success('Auth token fetched successfully');
        logger.info(`Token length: ${data.token.length} characters`);

        return data.token;
    } catch (error) {
        logger.error(`Failed to fetch auth token: ${error.message}`);
        throw error;
    }
}

// Show loading state
function showLoading(message = 'Initializing SDK...') {
    setupSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    loadingSection.querySelector('p').textContent = message;
}

// Show result
function showResult(html) {
    setupSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    resultContent.innerHTML = html;
}

// Show setup form
function showSetup() {
    setupSection.classList.remove('hidden');
    loadingSection.classList.add('hidden');
    resultSection.classList.add('hidden');
}

// Show inputs modal
function showInputsModal() {
    inputsModal.classList.remove('hidden');
    // Focus the first key field
    const firstKey = inputsContainer.querySelector('.input-key');
    if (firstKey) firstKey.focus();
}

// Hide inputs modal
function hideInputsModal() {
    inputsModal.classList.add('hidden');
}

// Add a new input row
function addInputRow() {
    const row = document.createElement('div');
    row.className = 'input-row';
    row.innerHTML = `
        <input type="text" class="input-key" placeholder="Key" required />
        <input type="text" class="input-value" placeholder="Value" required />
        <button type="button" class="btn-remove" title="Remove">&times;</button>
    `;
    inputsContainer.appendChild(row);
    row.querySelector('.input-key').focus();
}

// Remove an input row (keep at least one)
function removeInputRow(btn) {
    if (inputsContainer.querySelectorAll('.input-row').length > 1) {
        btn.closest('.input-row').remove();
    }
}

// Collect all input key-value pairs into an object
function collectInputs() {
    const inputs = {};
    inputsContainer.querySelectorAll('.input-row').forEach(row => {
        const key = row.querySelector('.input-key').value.trim();
        const value = row.querySelector('.input-value').value.trim();
        if (key) {
            inputs[key] = value;
        }
    });
    return inputs;
}

// Handle SDK Result Callback
function createResultHandler(transactionId) {
    return (HyperKycResult) => {
        logger.info('SDK workflow completed');
        logger.info(`Status: ${HyperKycResult.status}`);
        logger.info(`Code: ${HyperKycResult.code || 'N/A'}`);
        logger.info(`Message: ${HyperKycResult.message || 'N/A'}`);

        // Log full result object
        console.log('Full HyperKycResult:', HyperKycResult);

        let resultHtml = '';

        switch (HyperKycResult.status) {
            case 'auto_approved':
                logger.success('Verification APPROVED');
                resultHtml = `
                    <div class="result-box result-success">
                        <div class="result-icon">✅</div>
                        <h3>Verification Successful!</h3>
                        <p>Your identity has been verified successfully.</p>
                        <p><strong>Transaction ID:</strong> ${transactionId}</p>
                        <p class="subtitle">All checks passed. You can proceed with your application.</p>
                        <button class="btn btn-primary" onclick="location.reload()">Start New Verification</button>
                        <div class="result-details">
                            <h4>Response Details:</h4>
                            <pre>${JSON.stringify(HyperKycResult, null, 2)}</pre>
                        </div>
                    </div>
                `;
                break;

            case 'auto_declined':
                logger.error('Verification DECLINED');
                resultHtml = `
                    <div class="result-box result-error">
                        <div class="result-icon">❌</div>
                        <h3>Verification Failed</h3>
                        <p>We were unable to verify your identity.</p>
                        <p><strong>Transaction ID:</strong> ${transactionId}</p>
                        <p class="subtitle">Please contact support if you believe this is an error.</p>
                        <button class="btn btn-secondary" onclick="location.reload()">Try Again</button>
                        <div class="result-details">
                            <h4>Response Details:</h4>
                            <pre>${JSON.stringify(HyperKycResult, null, 2)}</pre>
                        </div>
                    </div>
                `;
                break;

            case 'needs_review':
                logger.warn('Verification NEEDS MANUAL REVIEW');
                resultHtml = `
                    <div class="result-box result-warning">
                        <div class="result-icon">⏳</div>
                        <h3>Verification Under Review</h3>
                        <p>Your application has been flagged for manual review.</p>
                        <p><strong>Transaction ID:</strong> ${transactionId}</p>
                        <p class="subtitle">We'll notify you once the review is complete. This typically takes 24-48 hours.</p>
                        <button class="btn btn-primary" onclick="location.reload()">Start New Verification</button>
                        <div class="result-details">
                            <h4>Response Details:</h4>
                            <pre>${JSON.stringify(HyperKycResult, null, 2)}</pre>
                        </div>
                    </div>
                `;
                break;

            case 'user_cancelled':
                logger.warn('User CANCELLED the workflow');
                resultHtml = `
                    <div class="result-box result-info">
                        <div class="result-icon">🚫</div>
                        <h3>Verification Cancelled</h3>
                        <p>You cancelled the verification process.</p>
                        <p><strong>Transaction ID:</strong> ${transactionId}</p>
                        <p class="subtitle">You can restart the verification whenever you're ready.</p>
                        <button class="btn btn-primary" onclick="location.reload()">Restart Verification</button>
                        <div class="result-details">
                            <h4>Response Details:</h4>
                            <pre>${JSON.stringify(HyperKycResult, null, 2)}</pre>
                        </div>
                    </div>
                `;
                break;

            case 'error':
                logger.error('SDK ERROR occurred');
                resultHtml = `
                    <div class="result-box result-error">
                        <div class="result-icon">⚠️</div>
                        <h3>Technical Error</h3>
                        <p>A technical error occurred during verification.</p>
                        <p><strong>Error Code:</strong> ${HyperKycResult.code || 'Unknown'}</p>
                        <p><strong>Error Message:</strong> ${HyperKycResult.message || 'Unknown error'}</p>
                        <p><strong>Transaction ID:</strong> ${transactionId}</p>
                        <p class="subtitle">Please try again. If the issue persists, contact support.</p>
                        <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
                        <div class="result-details">
                            <h4>Error Details:</h4>
                            <pre>${JSON.stringify(HyperKycResult, null, 2)}</pre>
                        </div>
                    </div>
                `;
                break;

            default:
                logger.warn(`Unknown status: ${HyperKycResult.status}`);
                resultHtml = `
                    <div class="result-box result-warning">
                        <div class="result-icon">❓</div>
                        <h3>Unknown Status</h3>
                        <p>Received unexpected status from SDK.</p>
                        <p><strong>Status:</strong> ${HyperKycResult.status}</p>
                        <p><strong>Transaction ID:</strong> ${transactionId}</p>
                        <button class="btn btn-secondary" onclick="location.reload()">Start Over</button>
                        <div class="result-details">
                            <h4>Response Details:</h4>
                            <pre>${JSON.stringify(HyperKycResult, null, 2)}</pre>
                        </div>
                    </div>
                `;
                break;
        }

        showResult(resultHtml);
    };
}

// Launch HyperKYC SDK
async function launchHyperKYC(workflowId, showLandingPage, workflowInputs) {
    try {
        showLoading('Fetching authentication token...');
        logger.info('=== Starting HyperKYC SDK Integration ===');
        logger.info(`Workflow ID: ${workflowId}`);
        logger.info(`Show Landing Page: ${showLandingPage}`);
        logger.info(`Inputs: ${JSON.stringify(workflowInputs)}`);

        // Generate unique transaction ID
        const transactionId = generateTransactionId();
        logger.info(`Generated Transaction ID: ${transactionId}`);

        // Fetch auth token from backend (relative path — works on localhost & ngrok)
        const authToken = await fetchAuthToken();

        showLoading('Initializing HyperKYC SDK...');
        logger.info('Creating HyperKycConfig instance...');

        // Create HyperKycConfig instance
        const hyperKycConfig = new HyperKycConfig(
            authToken,          // JWT token from backend
            workflowId,         // Workflow ID
            transactionId,      // Unique transaction ID
            showLandingPage     // Show landing page flag
        );

        // Set workflow inputs (dynamic key-value pairs from user)
        if (Object.keys(workflowInputs).length > 0) {
            logger.info('Setting workflow inputs...');
            hyperKycConfig.setInputs(workflowInputs);
            logger.success('Workflow inputs set successfully');
        } else {
            logger.info('No workflow inputs provided, skipping setInputs');
        }

        logger.success('HyperKycConfig created successfully');
        logger.info('Launching HyperKYC SDK...');

        // Create result handler
        const resultHandler = createResultHandler(transactionId);

        // Launch the SDK
        showLoading('Launching verification workflow...');
        await HyperKYCModule.launch(hyperKycConfig, resultHandler);

        logger.info('SDK launch initiated successfully');

    } catch (error) {
        logger.error(`SDK Launch Failed: ${error.message}`);
        console.error('Full error:', error);

        const errorHtml = `
            <div class="result-box result-error">
                <div class="result-icon">⚠️</div>
                <h3>Failed to Launch SDK</h3>
                <p><strong>Error:</strong> ${error.message}</p>
                <p class="subtitle">Please check your configuration and try again.</p>
                <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
                <div class="result-details">
                    <h4>Error Stack:</h4>
                    <pre>${error.stack || 'No stack trace available'}</pre>
                </div>
            </div>
        `;
        showResult(errorHtml);
    }
}

// Store config temporarily
let tempConfig = null;

// Config form submit handler - show inputs modal
configForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const workflowId = document.getElementById('workflowId').value.trim();
    const showLandingPage = document.getElementById('showLandingPage').checked;

    if (!workflowId) {
        alert('Please enter a Workflow ID');
        return;
    }

    // Store config
    tempConfig = { workflowId, showLandingPage };

    // Show inputs modal
    showInputsModal();
});

// Add input row button
addInputBtn.addEventListener('click', () => {
    addInputRow();
});

// Remove input row (delegated)
inputsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove')) {
        removeInputRow(e.target);
    }
});

// Inputs form submit handler - launch SDK
inputsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const workflowInputs = collectInputs();

    // Hide modal
    hideInputsModal();

    // Disable button
    launchBtn.disabled = true;
    launchBtn.textContent = 'Launching...';

    // Clear previous logs
    logger.clear();

    // Launch SDK
    await launchHyperKYC(
        tempConfig.workflowId,
        tempConfig.showLandingPage,
        workflowInputs
    );

    // Re-enable button
    launchBtn.disabled = false;
    launchBtn.textContent = 'Start KYC Verification';
});

// Cancel button handler
cancelInputsBtn.addEventListener('click', () => {
    hideInputsModal();
});

// Close modal on overlay click
inputsModal.addEventListener('click', (e) => {
    if (e.target === inputsModal) {
        hideInputsModal();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !inputsModal.classList.contains('hidden')) {
        hideInputsModal();
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    logger.info('Page loaded successfully');
    logger.info('HyperKYC Web SDK ready');
    logger.info('Fill in the configuration and click "Start KYC Verification"');
});

// Network monitoring (optional but useful for debugging)
if (window.PerformanceObserver) {
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
                logger.info(`Network Request: ${entry.name}`);
            }
        }
    });
    observer.observe({ entryTypes: ['resource'] });
}
