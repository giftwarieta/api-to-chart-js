// --- 1. Multiply Function ---
// Uses the rest operator (...) to accept a variable number of arguments
function multiplyAll(...numbers) {
    if (numbers.length === 0) return 0;
    const product = numbers.reduce((acc, curr) => acc * curr, 1);
    console.log("[multiplyAll] numbers:", numbers, "product:", product);
    return product;
}

// Helper to handle the UI interaction for multiplication
function handleMultiply() {
    const input = document.getElementById('numbersInput').value;
    console.log("[handleMultiply] raw input:", input);
    // Parse the string into an array of numbers, filtering out invalid inputs
    const numArr = input.split(',')
                        .map(n => parseFloat(n.trim()))
                        .filter(n => !isNaN(n));
    console.log("[handleMultiply] parsed numbers:", numArr);
    
    const result = multiplyAll(...numArr);
    console.log("[handleMultiply] final result:", result);
    document.getElementById('multiplyResult').innerText = `Result: ${result}`;
}

// --- 2. Remote API & TFJS Visualization Function ---
let activeRequestId = 0;
let activeController = null;

function renderFallbackBarChart(surface, chartData) {
    const maxValue = Math.max(...chartData.map(d => d.value), 1);
    const barsHtml = chartData.map(d => {
        const widthPct = Math.max(5, Math.round((d.value / maxValue) * 100));
        return `
            <div style="margin-bottom:10px;">
                <div style="font-size:12px;color:#374151;margin-bottom:4px;">${d.index} (${d.value})</div>
                <div style="height:16px;background:#E5E7EB;border-radius:4px;overflow:hidden;">
                    <div style="height:100%;width:${widthPct}%;background:#4F46E5;"></div>
                </div>
            </div>
        `;
    }).join('');

    surface.innerHTML = `
        <div style="font-weight:600;margin-bottom:10px;color:#111827;">Name Lengths by Username (Fallback Chart)</div>
        <div style="padding: 10px;">${barsHtml}</div>
    `;
}

async function fetchAndPlotData() {
    const statusLabel = document.getElementById('apiStatus');
    const surface = document.getElementById('chartSurface');
    const plotBtn = document.getElementById('plotBtn');
    const requestId = ++activeRequestId;

    if (activeController) {
        activeController.abort();
    }
    activeController = new AbortController();
    
    statusLabel.innerText = "Status: Fetching data from API...";
    surface.innerHTML = "Loading chart...";
    if (plotBtn) plotBtn.disabled = true;
    
    try {
        // Fetch data from the remote endpoint
        const response = await fetch('https://jsonplaceholder.typicode.com/users', {
            signal: activeController.signal
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const users = await response.json();
        if (requestId !== activeRequestId) return; // Ignore stale request result

        console.log("[fetchAndPlotData] users fetched:", users.length);
        statusLabel.innerText = "Status: Data fetched! Transforming and plotting...";

        // Transform the data for tfjs-vis barchart
        const chartData = users.map(user => ({
            index: user.username,        // X-axis: Username
            value: user.name.length      // Y-axis: Length of their real name
        }));

        // Defensive check: If tfvis is missing, go straight to fallback without throwing an error
        if (typeof tfvis === 'undefined' || !tfvis.render || !tfvis.render.barchart) {
            console.warn("tfjs-vis library is missing or incomplete. Using fallback.");
            renderFallbackBarChart(surface, chartData);
            statusLabel.innerText = "Status: Chart rendered using HTML Fallback.";
            return;
        }

        // Define chart options
        const options = {
            xLabel: 'Usernames',
            yLabel: 'Length of Full Name (chars)',
            title: 'Name Lengths by Username',
            height: 350
        };

        // Render into a fresh child host every time to avoid repeated-click collisions.
        surface.innerHTML = "";
        const renderHost = document.createElement('div');
        surface.appendChild(renderHost);

        // Plot the Bar Chart using tfjs-vis
        // Note: barchart expects the raw array directly, NOT { values: chartData }
        await tfvis.render.barchart(renderHost, chartData, options);
        if (requestId !== activeRequestId) return; // Ignore stale render completion
        
        statusLabel.innerText = "Status: Chart rendered successfully via tfjs-vis.";
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log("[fetchAndPlotData] Previous request aborted by new click.");
            return;
        }

        console.error("Primary Execution Error:", error);
        statusLabel.innerText = `Status: Error plotting chart (${error.message}). Attempting fallback...`;
        
        // If the fetch worked but TFJS rendering failed, attempt the fallback via a fresh fetch
        try {
            const fallbackResponse = await fetch('https://jsonplaceholder.typicode.com/users', {
                signal: activeController.signal
            });
            if (!fallbackResponse.ok) throw new Error("Fallback fetch failed.");
            
            const fallbackUsers = await fallbackResponse.json();
            if (requestId !== activeRequestId) return;

            const fallbackData = fallbackUsers.map(user => ({
                index: user.username,
                value: user.name.length
            }));
            
            renderFallbackBarChart(surface, fallbackData);
            statusLabel.innerText = "Status: Rendered using fallback chart after initial error.";
            
        } catch (fallbackError) {
            console.error("Critical Fallback Error:", fallbackError);
            surface.innerHTML = "<div style='color:red; padding:20px; text-align:center;'>Failed to load any charts. Check console.</div>";
            statusLabel.innerText = "Status: Complete failure.";
        }
    } finally {
        if (requestId === activeRequestId && plotBtn) {
            plotBtn.disabled = false;
        }
    }
}
