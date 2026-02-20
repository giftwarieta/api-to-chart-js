// Multiply Function
function multiplyAll(...numbers) {
    if (numbers.length === 0) return 0;
    const product = numbers.reduce((acc, curr) => acc * curr, 1);
    console.log("[multiplyAll] numbers:", numbers, "product:", product);
    return product;
}

function handleMultiply() {
    const input = document.getElementById('numbersInput').value;
    const numArr = input.split(",").map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
    const result = multiplyAll(...numArr);
    document.getElementById('multiplyResult').innerText = `Result: ${result}`;
}

let activeRequestId = 0;
let activeController = null;
let latestChartData = null;
let resizeRerenderTimer = null;
let chartTooltipEl = null;

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function buildInChartLineLegendHtml() {
    return `
        <div class="line-legend line-legend-overlay">
            <span class="legend-item"><span class="legend-swatch legend-swatch-blue"></span>Name Length</span>
            <span class="legend-item"><span class="legend-swatch legend-swatch-orange"></span>Running Average</span>
        </div>
    `;
}

function getChartTooltipEl() {
    if (chartTooltipEl && document.body.contains(chartTooltipEl)) return chartTooltipEl;
    chartTooltipEl = document.createElement("div");
    chartTooltipEl.className = "chart-tooltip";
    chartTooltipEl.style.display = "none";
    document.body.appendChild(chartTooltipEl);
    return chartTooltipEl;
}

function moveTooltip(event) {
    const tooltip = getChartTooltipEl();
    const offset = 12;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const rect = tooltip.getBoundingClientRect();
    let left = event.clientX + offset;
    let top = event.clientY + offset;

    if (left + rect.width + 8 > viewportW) left = event.clientX - rect.width - offset;
    if (top + rect.height + 8 > viewportH) top = event.clientY - rect.height - offset;

    tooltip.style.left = `${Math.max(8, left)}px`;
    tooltip.style.top = `${Math.max(8, top)}px`;
}

function showTooltip(event, text) {
    const tooltip = getChartTooltipEl();
    tooltip.textContent = text;
    tooltip.style.display = "block";
    moveTooltip(event);
}

function hideTooltip() {
    const tooltip = getChartTooltipEl();
    tooltip.style.display = "none";
}

function attachTooltipHandlers(surface) {
    const targets = surface.querySelectorAll("[data-tooltip]");
    targets.forEach((el) => {
        el.addEventListener("mouseenter", (event) => showTooltip(event, el.dataset.tooltip || ""));
        el.addEventListener("mousemove", moveTooltip);
        el.addEventListener("mouseleave", hideTooltip);
    });
}

function renderBarChart(surface, chartData) {
    const safeData = chartData.filter(d => typeof d.value === "number" && !isNaN(d.value));
    if (!safeData.length) {
        surface.innerHTML = "<div class='chart-empty'>No bar data available.</div>";
        return;
    }

    const isMobile = window.innerWidth <= 480;
    const labelLen = Math.max(...safeData.map(d => d.index.length), 5);
    const leftPad = Math.min(180, Math.max(95, (labelLen * (isMobile ? 6 : 7)) + 10));
    const rowHeight = isMobile ? 32 : 28;
    const topPad = 18;
    const rightPad = 58;
    const bottomPad = 40;
    const width = Math.max(520, surface.clientWidth || 520);
    const plotWidth = width - leftPad - rightPad;
    const height = topPad + bottomPad + (safeData.length * rowHeight);
    const plotHeight = safeData.length * rowHeight;
    const maxValue = Math.max(...safeData.map(d => d.value), 1);

    surface.style.height = `${height + 10}px`;

    const ticks = 5;
    const tickHtml = Array.from({ length: ticks + 1 }, (_, i) => {
        const ratio = i / ticks;
        const x = leftPad + (ratio * plotWidth);
        const val = Math.round(maxValue * ratio);
        return `
            <line x1="${x}" y1="${topPad}" x2="${x}" y2="${topPad + plotHeight}" class="axis-grid" />
            <text x="${x}" y="${topPad + plotHeight + 16}" class="axis-tick axis-tick-x" text-anchor="middle">${val}</text>
        `;
    }).join("");

    const barsHtml = safeData.map((d, i) => {
        const y = topPad + (i * rowHeight) + 4;
        const barH = rowHeight - 10;
        const barW = Math.max(2, (d.value / maxValue) * plotWidth);
        const labelY = y + (barH / 2) + 4;
        return `
            <text x="${leftPad - 8}" y="${labelY}" class="axis-label" text-anchor="end">${escapeHtml(d.index)}</text>
            <rect x="${leftPad}" y="${y}" width="${barW}" height="${barH}" rx="4" class="bar-rect" data-tooltip="${escapeHtml(d.index)}: ${d.value}"></rect>
            <text x="${leftPad + barW + 6}" y="${labelY}" class="bar-value">${d.value}</text>
        `;
    }).join("");

    surface.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" aria-label="Bar chart">
            <line x1="${leftPad}" y1="${topPad}" x2="${leftPad}" y2="${topPad + plotHeight}" class="axis-main" />
            <line x1="${leftPad}" y1="${topPad + plotHeight}" x2="${leftPad + plotWidth}" y2="${topPad + plotHeight}" class="axis-main" />
            ${tickHtml}
            ${barsHtml}
            <text x="${leftPad + (plotWidth / 2)}" y="${height - 6}" class="axis-title" text-anchor="middle">Name Length (characters)</text>
        </svg>
    `;
    attachTooltipHandlers(surface);
}

function renderLineChart(surface, chartData) {
    const safeData = chartData.filter(d => typeof d.value === "number" && !isNaN(d.value));
    if (!safeData.length) {
        surface.innerHTML = "<div class='chart-empty'>No line data available.</div>";
        return;
    }

    const isMobile = window.innerWidth <= 480;
    const width = Math.max(620, surface.clientWidth || 620);
    const topPad = 42;
    const rightPad = 22;
    const leftPad = 48;
    const bottomPad = isMobile ? 92 : 82;
    const height = isMobile ? 360 : 340;
    const plotWidth = width - leftPad - rightPad;
    const plotHeight = height - topPad - bottomPad;
    const maxValue = Math.max(...safeData.map(d => d.value), 1);

    surface.style.height = `${height + 10}px`;

    let runningTotal = 0;
    const avgData = safeData.map((d, i) => {
        runningTotal += d.value;
        return Number((runningTotal / (i + 1)).toFixed(2));
    });

    const mapX = (i) => safeData.length === 1 ? leftPad + (plotWidth / 2) : leftPad + ((i / (safeData.length - 1)) * plotWidth);
    const mapY = (v) => topPad + ((maxValue - v) / maxValue) * plotHeight;
    const linePoints = safeData.map((d, i) => `${mapX(i)},${mapY(d.value)}`).join(" ");
    const avgPoints = avgData.map((v, i) => `${mapX(i)},${mapY(v)}`).join(" ");

    const yTicks = 5;
    const yHtml = Array.from({ length: yTicks + 1 }, (_, i) => {
        const ratio = i / yTicks;
        const yVal = Math.round(maxValue * (1 - ratio));
        const y = topPad + (ratio * plotHeight);
        return `
            <line x1="${leftPad}" y1="${y}" x2="${leftPad + plotWidth}" y2="${y}" class="axis-grid" />
            <text x="${leftPad - 8}" y="${y + 4}" class="axis-tick axis-tick-y" text-anchor="end">${yVal}</text>
        `;
    }).join("");

    const xHtml = safeData.map((d, i) => {
        const x = mapX(i);
        const y = topPad + plotHeight + 14;
        return `
            <line x1="${x}" y1="${topPad + plotHeight}" x2="${x}" y2="${topPad + plotHeight + 4}" class="axis-main" />
            <text x="${x}" y="${y}" class="axis-tick axis-tick-x" text-anchor="end" transform="rotate(-35, ${x}, ${y})">${escapeHtml(d.index)}</text>
        `;
    }).join("");

    const pointHtml = safeData.map((d, i) => `
        <circle cx="${mapX(i)}" cy="${mapY(d.value)}" r="3" class="line-point line-point-main" data-tooltip="${escapeHtml(d.index)} (Name Length): ${d.value}"></circle>
        <circle cx="${mapX(i)}" cy="${mapY(avgData[i])}" r="3" class="line-point line-point-avg" data-tooltip="${escapeHtml(d.index)} (Running Average): ${avgData[i]}"></circle>
    `).join("");

    surface.innerHTML = `
        ${buildInChartLineLegendHtml()}
        <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" aria-label="Line chart">
            <line x1="${leftPad}" y1="${topPad}" x2="${leftPad}" y2="${topPad + plotHeight}" class="axis-main" />
            <line x1="${leftPad}" y1="${topPad + plotHeight}" x2="${leftPad + plotWidth}" y2="${topPad + plotHeight}" class="axis-main" />
            ${yHtml}
            <polyline points="${linePoints}" class="line-main" />
            <polyline points="${avgPoints}" class="line-avg" />
            ${pointHtml}
            ${xHtml}
            <text x="${leftPad + (plotWidth / 2)}" y="${height - 6}" class="axis-title" text-anchor="middle">Usernames (ordered)</text>
        </svg>
    `;
    attachTooltipHandlers(surface);
}

function renderCharts(chartData) {
    const barSurface = document.getElementById("chartSurface");
    const lineSurface = document.getElementById("lineChartSurface");
    if (!barSurface || !lineSurface) return;

    renderBarChart(barSurface, chartData);
    renderLineChart(lineSurface, chartData);
}

function scheduleResponsiveRerender() {
    if (!latestChartData) return;
    clearTimeout(resizeRerenderTimer);
    resizeRerenderTimer = setTimeout(() => renderCharts(latestChartData), 120);
}

function initResponsiveChartResizeHandling() {
    window.addEventListener("resize", scheduleResponsiveRerender);
    window.addEventListener("orientationchange", scheduleResponsiveRerender);
}

async function fetchAndPlotData() {
    const statusLabel = document.getElementById("apiStatus");
    const barSurface = document.getElementById("chartSurface");
    const lineSurface = document.getElementById("lineChartSurface");
    const plotBtn = document.getElementById("plotBtn");
    const requestId = ++activeRequestId;

    if (activeController) activeController.abort();
    activeController = new AbortController();

    statusLabel.innerText = "Status: Fetching data from API...";
    barSurface.innerHTML = "Loading bar chart...";
    lineSurface.innerHTML = "Loading line chart...";
    if (plotBtn) plotBtn.disabled = true;

    try {
        const response = await fetch("https://jsonplaceholder.typicode.com/users", {
            signal: activeController.signal
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const users = await response.json();
        if (requestId !== activeRequestId) return;

        const chartData = users.map(user => ({
            index: user.username,
            value: user.name.length
        }));
        latestChartData = chartData;

        renderCharts(chartData);
        statusLabel.innerText = "Status: All chart items and axes rendered clearly.";
    } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Chart Render Error:", error);
        statusLabel.innerText = `Status: Error: ${error.message}`;
        barSurface.innerHTML = "<div class='chart-empty'>Failed to load bar chart.</div>";
        lineSurface.innerHTML = "<div class='chart-empty'>Failed to load line chart.</div>";
    } finally {
        if (requestId === activeRequestId && plotBtn) plotBtn.disabled = false;
    }
}

initResponsiveChartResizeHandling();
