const state = {
  planData: null,
  disciplineData: null,
  activeDemo: "landing",
  activePlanView: "overview",
  activeDisciplineView: "board",
  planningFilters: {
    topic: "全部",
    status: "全部",
    owner: "全部",
    sort: "riskDesc",
  },
  disciplineFilters: {
    position: "全部",
    category: "全部",
    degree: "全部",
    sort: "percentileAsc",
  },
};

const topicOrder = ["办学规模", "办学条件", "党的建设", "学科建设", "人才培养", "科技创新", "人才队伍", "国际合作"];
const statusOrder = { 异常: 0, 预警: 1, 正常: 2 };
const statusClass = { 正常: "ok", 预警: "warning", 异常: "danger" };
const statusWeight = { 正常: 1, 预警: 0.72, 异常: 0.42 };
const positionOrder = ["优势学科", "重点学科", "支撑学科", "特色学科"];
const positionClass = { 优势学科: "gold", 重点学科: "blue", 支撑学科: "", 特色学科: "red" };

const byId = (id) => document.getElementById(id);

function escapeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function compactText(value, max = 42) {
  const text = String(value ?? "").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const value = typeof getter === "function" ? getter(item) : item[getter];
    const key = value || "未填";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function uniqueValues(items, getter) {
  return [...new Set(items.map((item) => (typeof getter === "function" ? getter(item) : item[getter])).filter(Boolean))];
}

function tag(text, kind = "") {
  return `<span class="tag ${kind}">${escapeText(text)}</span>`;
}

function setHeader(eyebrow, title, subhead) {
  byId("appEyebrow").textContent = eyebrow;
  byId("appTitle").textContent = title;
  byId("appSubhead").textContent = subhead;
}

function hideAllShells() {
  byId("landingView").hidden = true;
  byId("planDemoView").hidden = true;
  byId("disciplineDemoView").hidden = true;
  byId("detailView").hidden = true;
}

function configureSwitch(demo) {
  const nav = byId("viewSwitch");
  nav.hidden = demo === "landing";
  nav.querySelector("[data-view='overview']").textContent = demo === "discipline" ? "画像" : "总览";
  nav.querySelector("[data-view='topics']").textContent = demo === "discipline" ? "领导舱" : "专题";
  nav.querySelector("[data-view='supervision']").hidden = demo === "discipline";
  nav.querySelectorAll("[data-view]").forEach((button) => {
    const active = demo === "plan" ? state.activePlanView : state.activeDisciplineView;
    button.classList.toggle("is-active", button.dataset.view === active || (demo === "discipline" && button.dataset.view === "overview" && active === "board") || (demo === "discipline" && button.dataset.view === "topics" && active === "cockpit"));
  });
}

function renderLandingView() {
  const planCount = state.planData.indicators.length;
  const disciplineCount = state.disciplineData.subjects.length;
  const traffic = state.disciplineData.subjects.find((item) => item["一级学科名称"] === "交通运输工程");
  byId("landingView").innerHTML = `
    
    <div class="landing-grid">
      <article class="demo-card plan-card">
        <div>
          <p class="eyebrow">十五五监测 demo</p>
          <h3>规划执行驾驶舱</h3>
          <p>总览、专题、指标分析、督办闭环，覆盖附件2全部 ${planCount} 条指标明细。</p>
        </div>
        <div class="demo-metrics">
          <span><strong>${planCount}</strong>规划指标</span>
          <span><strong>8</strong>指标域</span>
          <span><strong>4</strong>监测层级</span>
        </div>
        <button class="drill-btn" type="button" data-demo="plan">进入十五五监测</button>
      </article>
      <article class="demo-card discipline-card">
        <div>
          <p class="eyebrow">学科画像 demo</p>
          <h3>学科布局与交通运输工程下钻</h3>
          <p> </p>
        </div>
        <div class="demo-metrics">
          <span><strong>${disciplineCount}</strong>一级学科</span>
          <span><strong>${traffic?.百分位 ?? "-"}%</strong>交通运输工程百分位</span>
          <span><strong>${state.disciplineData.trafficDetail["二级学科"].length}</strong>二级学科</span>
        </div>
        <button class="drill-btn" type="button" data-demo="discipline">进入学科画像</button>
      </article>
    </div>
  `;
}

function showLanding() {
  state.activeDemo = "landing";
  hideAllShells();
  byId("landingView").hidden = false;
  configureSwitch("landing");
  setHeader("大连海事大学综合演示入口", "选择要进入的演示看板", "");
  window.scrollTo(0, 0);
}

function enterDemo(demo) {
  state.activeDemo = demo;
  hideAllShells();
  if (demo === "plan") {
    byId("planDemoView").hidden = false;
    setHeader("十五五发展规划监测 Demo", "大连海事大学规划执行驾驶舱", "依据《高校十五五指标监测驾驶舱》设计，承载《大连海事大学十五五发展规划指标分解表》指标、年度分解、责任部门、风险预警和督办闭环。");
    setPlanView(state.activePlanView);
  } else {
    byId("disciplineDemoView").hidden = false;
    setHeader("学科发展画像 Demo", "大连海事大学学科布局看板", "从全校一级学科布局下钻到交通运输工程学科明细，展示定位、排名、学院、团队和支撑平台。");
    setDisciplineView(state.activeDisciplineView);
  }
  configureSwitch(demo);
  window.scrollTo(0, 0);
}

function getOwners(item) {
  return String(item.owner || "").split(/[、，,;；]/).map((part) => part.trim()).filter(Boolean);
}

function getPrimaryOwner(item) {
  return getOwners(item)[0] || item.owner || "待明确";
}

function getStatusCounts(items) {
  return { 正常: 0, 预警: 0, 异常: 0, ...countBy(items, "status") };
}

function getPlanHealth(items) {
  const score = items.reduce((sum, item) => sum + (statusWeight[item.status] || 0.5), 0) / Math.max(1, items.length);
  return Math.round(score * 100);
}

function getTopicStats(items = state.planData.indicators) {
  return topicOrder.filter((topic) => items.some((item) => item.category === topic)).map((topic) => {
    const rows = items.filter((item) => item.category === topic);
    const statusCounts = getStatusCounts(rows);
    return { topic, total: rows.length, health: getPlanHealth(rows), normal: statusCounts.正常, warning: statusCounts.预警, danger: statusCounts.异常 };
  });
}

function statusPill(status) {
  return `<span class="status-pill ${statusClass[status] || ""}">${escapeText(status)}</span>`;
}

function metricCard(label, value, note, extra = "") {
  return `<article class="plan-metric ${extra}"><span>${escapeText(label)}</span><strong>${escapeText(value)}</strong><em>${escapeText(note)}</em></article>`;
}

function renderProgressBar(value, status) {
  return `<div class="progress-meter ${statusClass[status] || ""}"><div class="progress-track"><div style="width:${Math.max(4, Math.min(100, value))}%"></div></div><strong>${escapeText(value)}%</strong></div>`;
}

function renderOverviewHero(indicators) {
  const counts = getStatusCounts(indicators);
  const health = getPlanHealth(indicators);
  const supervision = counts.异常 + counts.预警;
  return `
    <section class="overview-hero">
      <div class="overview-copy">
        <p class="eyebrow">总览驾驶舱</p>
        <h2>规划执行情况、指标风险、责任督办一屏联动</h2>
        <p>按照设计文档的“总览—专题—指标—督办”四级监测架构，将附件2中的 ${indicators.length} 条指标明细转为可下钻、可筛选、可督办的静态演示数据。</p>
        <div class="source-line">数据来源：附件2指标分解表；页面框架来源：《高校十五五指标监测驾驶舱》。</div>
      </div>
      <div class="health-score"><span>规划健康度指数</span><strong>${health}</strong><small>PHI · 按正常/预警/异常加权模拟</small></div>
    </section>
    <div class="plan-metric-grid">
      ${metricCard("指标总数", indicators.length, "覆盖附件2全部明细行")}
      ${metricCard("已达标指标数", counts.正常, "状态为绿色正常")}
      ${metricCard("正常指标数", counts.正常, "完成率 ≥95%")}
      ${metricCard("预警指标数", counts.预警, "完成率 80%-95%", "is-warning")}
      ${metricCard("异常指标数", counts.异常, "完成率 <80%", "is-danger")}
      ${metricCard("督办事项数", supervision, "异常与预警纳入闭环")}
    </div>
  `;
}

function renderTopicRadar(stats) {
  const max = Math.max(...stats.map((item) => item.total));
  return `<section class="panel topic-radar"><div class="panel-title"><h2>战略目标达成情况</h2><span>点击专题进入专题驾驶舱</span></div><div class="topic-radar-list">${stats.map((item) => `<button class="topic-radar-row" type="button" data-topic="${escapeText(item.topic)}"><span>${escapeText(item.topic)}</span><div class="topic-radar-bar"><div style="width:${Math.max(10, Math.round((item.total / max) * 100))}%"></div></div><strong>${item.health}</strong><small>${item.total} 项</small></button>`).join("")}</div></section>`;
}

function renderRiskTop(indicators) {
  const rows = [...indicators].sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.progress - b.progress).slice(0, 10).map((item) => `<button class="risk-row" type="button" data-indicator-id="${item.id}"><span>${escapeText(item.category)}</span><strong>${escapeText(item.name)}</strong>${renderProgressBar(item.progress, item.status)}${statusPill(item.status)}</button>`).join("");
  return `<section class="panel"><div class="panel-title"><h2>风险指标TOP10</h2><span>按状态与进度排序</span></div><div class="risk-list">${rows}</div></section>`;
}

function renderOwnerRanking(indicators) {
  const map = new Map();
  indicators.forEach((item) => {
    const owner = getPrimaryOwner(item);
    if (!map.has(owner)) map.set(owner, { owner, total: 0, warning: 0, danger: 0 });
    const row = map.get(owner);
    row.total += 1;
    if (item.status === "预警") row.warning += 1;
    if (item.status === "异常") row.danger += 1;
  });
  const rows = [...map.values()].sort((a, b) => b.danger - a.danger || b.warning - a.warning || b.total - a.total).slice(0, 8).map((row) => `<div class="owner-row"><strong>${escapeText(row.owner)}</strong><span>异常 ${row.danger}</span><span>预警 ${row.warning}</span><span>督办 ${row.danger + row.warning}</span></div>`).join("");
  return `<section class="panel"><div class="panel-title"><h2>责任部门风险排行</h2><span>异常 / 预警 / 督办事项</span></div><div class="owner-list">${rows}</div></section>`;
}

function renderPrediction(indicators) {
  const yellow = indicators.filter((item) => item.status === "正常" && item.progress < 98).slice(0, 4);
  const red = indicators.filter((item) => item.status === "预警" && item.progress < 88).slice(0, 4);
  const render = (items) => items.map((item) => `<button type="button" data-indicator-id="${item.id}"><strong>${escapeText(item.name)}</strong><span>${escapeText(item.category)} · ${item.progress}%</span></button>`).join("") || `<p class="muted">暂无模拟预测项</p>`;
  return `<section class="panel prediction-panel"><div class="panel-title"><h2>未来12个月风险预测</h2><span>演示预测规则</span></div><div class="prediction-grid"><div><h3>可能转黄指标</h3>${render(yellow)}</div><div><h3>可能转红指标</h3>${render(red)}</div></div></section>`;
}

function renderOverviewView() {
  const indicators = state.planData.indicators;
  byId("overviewView").innerHTML = `${renderOverviewHero(indicators)}<div class="overview-grid">${renderTopicRadar(getTopicStats(indicators))}${renderRiskTop(indicators)}${renderOwnerRanking(indicators)}${renderPrediction(indicators)}</div>`;
}

function renderSelect(label, key, options, filterName = "planning") {
  const stateKey = filterName === "discipline" ? state.disciplineFilters : state.planningFilters;
  const attr = filterName === "discipline" ? "data-discipline-filter" : "data-planning-filter";
  return `<label class="board-control"><span>${escapeText(label)}</span><select ${attr}="${key}">${options.map((option) => `<option value="${escapeText(option.value)}" ${stateKey[key] === option.value ? "selected" : ""}>${escapeText(option.label)}</option>`).join("")}</select></label>`;
}

function renderTopicControls() {
  const indicators = state.planData.indicators;
  const topicOptions = [{ label: "全部专题", value: "全部" }, ...topicOrder.filter((topic) => indicators.some((item) => item.category === topic)).map((topic) => ({ label: topic, value: topic }))];
  const statusOptions = [{ label: "全部状态", value: "全部" }, ...["异常", "预警", "正常"].map((value) => ({ label: value, value }))];
  const ownerOptions = [{ label: "全部责任部门", value: "全部" }, ...uniqueValues(indicators, getPrimaryOwner).sort((a, b) => a.localeCompare(b, "zh-Hans-CN")).map((value) => ({ label: value, value }))];
  const sortOptions = [{ label: "风险优先", value: "riskDesc" }, { label: "进度从低到高", value: "progressAsc" }, { label: "进度从高到低", value: "progressDesc" }, { label: "指标名称", value: "nameAsc" }];
  return `<div class="board-toolbar topic-toolbar">${renderSelect("专题", "topic", topicOptions)}${renderSelect("状态", "status", statusOptions)}${renderSelect("责任部门", "owner", ownerOptions)}${renderSelect("排序", "sort", sortOptions)}</div>`;
}

function getFilteredIndicators() {
  const filters = state.planningFilters;
  return state.planData.indicators.filter((item) => filters.topic === "全部" || item.category === filters.topic).filter((item) => filters.status === "全部" || item.status === filters.status).filter((item) => filters.owner === "全部" || getPrimaryOwner(item) === filters.owner).sort((a, b) => {
    if (filters.sort === "progressAsc") return a.progress - b.progress;
    if (filters.sort === "progressDesc") return b.progress - a.progress;
    if (filters.sort === "nameAsc") return a.name.localeCompare(b.name, "zh-Hans-CN");
    return statusOrder[a.status] - statusOrder[b.status] || a.progress - b.progress;
  });
}

function renderIndicatorCard(item) {
  const annualCount = Object.keys(item.annual || {}).length;
  return `<article class="indicator-card ${statusClass[item.status] || ""}"><div class="indicator-card-head"><div><span class="indicator-code">${escapeText(item.id)} · ${escapeText(item.category)}</span><h3>${escapeText(item.name)}</h3></div>${statusPill(item.status)}</div><p>目标值：<strong>${escapeText(compactText(item.target, 34))}</strong></p><p>责任部门：${escapeText(compactText(item.owner, 34))}</p>${renderProgressBar(item.progress, item.status)}<div class="indicator-meta"><span>年度分解 ${annualCount}/5</span><span>源表行 ${item.sourceRow}</span></div><button class="drill-btn" type="button" data-indicator-id="${item.id}">指标分析</button></article>`;
}

function renderTopicSummary(stats) {
  return `<div class="topic-summary-grid">${stats.map((item) => `<button type="button" class="topic-summary-card" data-topic="${escapeText(item.topic)}"><span>${escapeText(item.topic)}</span><strong>${item.health}</strong><em>${item.total} 项 · 异常 ${item.danger} · 预警 ${item.warning}</em></button>`).join("")}</div>`;
}

function renderTopicView() {
  const indicators = getFilteredIndicators();
  const activeTopic = state.planningFilters.topic === "全部" ? "专题驾驶舱" : `${state.planningFilters.topic}专题驾驶舱`;
  byId("topicView").innerHTML = `<section class="section-lead"><div><p class="eyebrow">专题驾驶舱</p><h2>${escapeText(activeTopic)}</h2><p>设计文档中的五类专题在附件2中扩展为八类指标域；页面同时保留办学条件、党的建设、人才培养等实际指标分组，避免遗漏源表数据。</p></div><button class="drill-btn" type="button" data-view-jump="supervision">进入督办闭环中心</button></section>${renderTopicSummary(getTopicStats())}${renderTopicControls()}<section class="panel"><div class="panel-title"><h2>指标清单</h2><span id="indicatorCount">当前显示 ${indicators.length} / ${state.planData.indicators.length} 项</span></div><div class="indicator-grid">${indicators.length ? indicators.map(renderIndicatorCard).join("") : '<div class="empty-state">当前条件下暂无指标。</div>'}</div></section>`;
}

function renderSupervisionCenter() {
  const risky = state.planData.indicators.filter((item) => item.status !== "正常");
  const abnormal = state.planData.indicators.filter((item) => item.status === "异常");
  const owners = countBy(risky, getPrimaryOwner);
  const ownerRows = Object.entries(owners).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([owner, count]) => `<div><strong>${escapeText(owner)}</strong><span>${count} 项待跟踪</span></div>`).join("");
  const taskRows = risky.slice().sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.progress - b.progress).slice(0, 16).map((item, index) => `<button type="button" class="supervision-task" data-indicator-id="${item.id}"><span>${index < 5 ? "一级督办" : item.status === "异常" ? "二级督办" : "部门跟踪"}</span><strong>${escapeText(item.name)}</strong><em>${escapeText(getPrimaryOwner(item))}</em>${statusPill(item.status)}</button>`).join("");
  return `<section class="section-lead"><div><p class="eyebrow">督办闭环中心</p><h2>异常指标池、督办任务池、整改进度看板</h2><p>将预警和异常指标纳入督办池，模拟待签收、整改中、待审核、已完成、销号管理的闭环流程。</p></div></section><div class="supervision-board"><article><span>异常指标池</span><strong>${abnormal.length}</strong><em>红色异常</em></article><article><span>督办任务池</span><strong>${risky.length}</strong><em>异常 + 预警</em></article><article><span>责任部门</span><strong>${Object.keys(owners).length}</strong><em>涉及部门</em></article><article><span>销号条件</span><strong>3</strong><em>连续正常 / 完成目标 / 审核通过</em></article></div><div class="supervision-grid"><section class="panel"><div class="panel-title"><h2>整改进度看板</h2><span>待签收 → 整改中 → 待审核 → 已完成</span></div><div class="workflow-steps"><div><strong>${Math.ceil(risky.length * 0.22)}</strong><span>待签收</span></div><div><strong>${Math.ceil(risky.length * 0.48)}</strong><span>整改中</span></div><div><strong>${Math.ceil(risky.length * 0.2)}</strong><span>待审核</span></div><div><strong>${Math.max(1, Math.floor(risky.length * 0.1))}</strong><span>已完成</span></div></div><div class="supervision-task-list">${taskRows}</div></section><section class="panel"><div class="panel-title"><h2>责任落实</h2><span>按待跟踪指标数</span></div><div class="owner-accountability">${ownerRows}</div></section></div>`;
}

function renderAnnualGrid(item) {
  const years = ["2026", "2027", "2028", "2029", "2030"];
  return `<div class="annual-grid">${years.map((year) => `<div class="annual-cell ${item.annual?.[year] ? "has-value" : ""}"><span>${year}</span><strong>${escapeText(item.annual?.[year] || "未分解")}</strong></div>`).join("")}</div>`;
}

function renderIndicatorDetail(id) {
  const item = state.planData.indicators.find((row) => row.id === id);
  if (!item) return;
  hideAllShells();
  byId("detailView").hidden = false;
  byId("detailView").className = "view-panel plan-shell";
  byId("detailView").innerHTML = `<div class="detail-actions"><button class="back-btn" type="button" data-back>返回驾驶舱</button></div><section class="indicator-detail-hero ${statusClass[item.status] || ""}"><div><p class="eyebrow">指标分析页</p><h2>${escapeText(item.name)}</h2><div class="detail-tags"><span>${escapeText(item.id)}</span><span>${escapeText(item.category)}</span>${statusPill(item.status)}</div><p>目标值：${escapeText(item.target)}</p></div><div class="detail-progress"><span>当前完成率</span><strong>${item.progress}%</strong><small>${escapeText(item.current)}</small></div></section><div class="indicator-detail-grid"><section class="panel"><div class="panel-title"><h2>指标概览</h2><span>源表行 ${item.sourceRow}</span></div><div class="detail-kv"><div><span>当前值</span><strong>${escapeText(item.current)}</strong></div><div><span>目标值</span><strong>${escapeText(item.target)}</strong></div><div><span>责任部门</span><strong>${escapeText(item.owner)}</strong></div><div><span>协办部门</span><strong>${escapeText(item.coowner || "无")}</strong></div></div></section><section class="panel"><div class="panel-title"><h2>趋势分析 / 年度分解</h2><span>2026-2030</span></div>${renderAnnualGrid(item)}</section><section class="panel"><div class="panel-title"><h2>差距分析与风险分析</h2></div><div class="analysis-block"><p><strong>差距分析：</strong>${escapeText(item.gap)}</p><p><strong>风险原因：</strong>${escapeText(item.riskReason)}</p><p><strong>指标备注：</strong>${escapeText(item.remark || "源表未提供备注")}</p></div></section><section class="panel"><div class="panel-title"><h2>整改措施 / 督办记录</h2></div><div class="analysis-block"><p><strong>整改措施：</strong>${escapeText(item.rectification)}</p><p><strong>督办记录：</strong>${item.status === "正常" ? "保持季度例行监测。" : "已进入规划执行督办池，待责任部门提交节点进展。"}</p><p><strong>完成时限：</strong>${Object.keys(item.annual || {}).length ? "按年度分解节点推进" : "需补充年度节点后锁定"}</p></div></section></div>`;
  window.scrollTo(0, 0);
}

function setPlanView(view) {
  state.activePlanView = view;
  byId("overviewView").hidden = view !== "overview";
  byId("topicView").hidden = view !== "topics";
  byId("supervisionView").hidden = view !== "supervision";
  configureSwitch("plan");
}

function getDisciplineStats(subjects) {
  const degreeCounts = countBy(subjects, "学位点授予层次");
  const positionCounts = countBy(subjects, "学科定位（优势/重点/支撑/特色）");
  const topPercentile = subjects.filter((item) => typeof item.百分位 === "number").sort((a, b) => a.百分位 - b.百分位)[0];
  return { total: subjects.length, doctoral: degreeCounts["博士一级"] || 0, master: degreeCounts["硕士一级"] || 0, advantage: positionCounts["优势学科"] || 0, topPercentile };
}

function renderDisciplineKpis(subjects) {
  const stats = getDisciplineStats(subjects);
  return `<div class="kpi-grid"><button class="kpi-card kpi-button" type="button" data-discipline-kpi="total"><span class="kpi-label">一级学科总数</span><p class="kpi-value">${stats.total}</p><span class="kpi-hint">查看全部学科结构</span></button><button class="kpi-card kpi-button" type="button" data-discipline-kpi="doctoral"><span class="kpi-label">博士一级学科</span><p class="kpi-value">${stats.doctoral}</p><span class="kpi-hint">查看博士学科矩阵</span></button><button class="kpi-card kpi-button" type="button" data-discipline-kpi="master"><span class="kpi-label">硕士一级学科</span><p class="kpi-value">${stats.master}</p><span class="kpi-hint">查看硕士学科矩阵</span></button><button class="kpi-card kpi-button" type="button" data-discipline-kpi="advantage"><span class="kpi-label">优势学科</span><p class="kpi-value">${stats.advantage}</p><span class="kpi-hint">查看优势学科画像</span></button></div>`;
}

function renderBars(title, counts) {
  const max = Math.max(...Object.values(counts));
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => `<div class="bar-row"><span>${escapeText(name)}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.max(6, Math.round((value / max) * 100))}%"></div></div><strong>${value}</strong></div>`).join("");
  return `<section class="panel"><div class="panel-title"><h2>${escapeText(title)}</h2></div><div class="bar-list">${rows}</div></section>`;
}

function renderDisciplineSubjectCard(subject) {
  const isTraffic = subject["一级学科名称"] === "交通运输工程";
  const position = subject["学科定位（优势/重点/支撑/特色）"];
  const paperRate = subject["横向论文完成度"];
  const isPaperWarning = subject["横向论文预警"];
  const action = isTraffic ? '<button class="drill-btn" type="button" data-drill="traffic">查看明细</button>' : '<span class="muted">明细待补充</span>';
  return `<article class="subject-card ${isTraffic ? "is-clickable" : ""} ${isPaperWarning ? "is-warning" : ""}"><div><h3>${escapeText(subject["一级学科名称"])}</h3><div class="tag-row">${tag(subject["学科代码"])}${tag(subject["学位点授予层次"], "blue")}${tag(position, positionClass[position])}${isPaperWarning ? tag("横向论文红灯", "red") : ""}</div></div><p class="rank-line">软科排名/百分位段：<strong>${escapeText(subject["软科排名/百分位段（2026年5月）"])}</strong></p><p class="rank-line">学科门类：<strong>${escapeText(subject["学科门类"])}</strong> · 第五轮评估：<strong>${escapeText(subject["第五轮学科评估结果"])}</strong></p><div class="paper-meter ${isPaperWarning ? "is-low" : ""}"><div><span>横向论文完成度</span><strong>${escapeText(paperRate)}%</strong></div><div class="paper-track"><div style="width:${Math.min(100, paperRate)}%"></div></div><small>已完成 ${subject["横向论文数"]} / 目标 ${subject["横向论文2026年目标值"]}</small></div><div>${action}</div></article>`;
}

function renderDisciplineControls() {
  const subjects = state.disciplineData.subjects;
  const positionOptions = [{ label: "全部定位", value: "全部" }, ...positionOrder.map((value) => ({ label: value, value }))];
  const categoryOptions = [{ label: "全部门类", value: "全部" }, ...uniqueValues(subjects, "学科门类").map((value) => ({ label: value, value }))];
  const degreeOptions = [{ label: "全部层次", value: "全部" }, ...uniqueValues(subjects, "学位点授予层次").map((value) => ({ label: value, value }))];
  const sortOptions = [{ label: "软科百分位从优到后", value: "percentileAsc" }, { label: "软科百分位从后到优", value: "percentileDesc" }, { label: "学科名称 A-Z", value: "nameAsc" }, { label: "学科代码从小到大", value: "codeAsc" }];
  return `<div class="board-toolbar">${renderSelect("学科定位", "position", positionOptions, "discipline")}${renderSelect("学科门类", "category", categoryOptions, "discipline")}${renderSelect("授予层次", "degree", degreeOptions, "discipline")}${renderSelect("排序方式", "sort", sortOptions, "discipline")}</div>`;
}

function getDisciplineSubjects() {
  const filters = state.disciplineFilters;
  return state.disciplineData.subjects.filter((item) => (filters.position === "全部" || item["学科定位（优势/重点/支撑/特色）"] === filters.position) && (filters.category === "全部" || item["学科门类"] === filters.category) && (filters.degree === "全部" || item["学位点授予层次"] === filters.degree)).sort((a, b) => {
    if (filters.sort === "percentileDesc") return (typeof b.百分位 === "number" ? b.百分位 : 999) - (typeof a.百分位 === "number" ? a.百分位 : 999);
    if (filters.sort === "nameAsc") return String(a["一级学科名称"]).localeCompare(String(b["一级学科名称"]), "zh-Hans-CN");
    if (filters.sort === "codeAsc") return String(a["学科代码"]).localeCompare(String(b["学科代码"]), "zh-Hans-CN", { numeric: true });
    return (typeof a.百分位 === "number" ? a.百分位 : 999) - (typeof b.百分位 === "number" ? b.百分位 : 999);
  });
}

function renderDisciplineCards() {
  const subjects = getDisciplineSubjects();
  byId("disciplineCardCount").textContent = `当前显示 ${subjects.length} / ${state.disciplineData.subjects.length} 个学科`;
  byId("disciplineSubjectGrid").innerHTML = subjects.length ? subjects.map(renderDisciplineSubjectCard).join("") : '<div class="empty-state">当前筛选条件下暂无学科，请调整筛选项。</div>';
}

function renderPaperWarningPanel(subjects) {
  const redWarnings = subjects.filter((item) => item["横向论文预警"]);
  const averageRate = Math.round(subjects.reduce((sum, item) => sum + item["横向论文完成度"], 0) / subjects.length);
  const warningRows = redWarnings.map((item) => `<article><div><strong>${escapeText(item["一级学科名称"])}</strong><span>${escapeText(item["学科门类"])} · ${escapeText(item["学位点授予层次"])}</span></div><b>${escapeText(item["横向论文完成度"])}%</b><small>${item["横向论文数"]} / ${item["横向论文2026年目标值"]}</small></article>`).join("");
  return `<section class="warning-panel"><div><p class="eyebrow">横向论文 2026 目标对比</p><h2>红灯预警：${redWarnings.length} 个学科完成度低于 20%</h2><p>法学、数学、物理学横向论文完成度明显低于其他学科，用于演示目标达成差异和预警识别。</p></div><div class="warning-summary"><div><span>全校平均完成度</span><strong>${averageRate}%</strong></div><div><span>红灯阈值</span><strong>&lt;20%</strong></div></div><div class="warning-list">${warningRows}</div></section>`;
}

function renderDisciplineBoardView() {
  const subjects = state.disciplineData.subjects;
  byId("disciplineBoardView").innerHTML = `${renderDisciplineKpis(subjects)}${renderPaperWarningPanel(subjects)}<div class="dashboard-grid">${renderBars("学科定位分布", countBy(subjects, "学科定位（优势/重点/支撑/特色）"))}${renderBars("学科门类分布", countBy(subjects, "学科门类"))}</div><section class="panel" style="margin-top:18px"><div class="panel-title"><h2>一级学科画像卡片</h2><span class="muted" id="disciplineCardCount">当前显示 0 / ${subjects.length} 个学科</span></div>${renderDisciplineControls()}<div class="subject-grid" id="disciplineSubjectGrid"></div></section>`;
  renderDisciplineCards();
}

function renderDisciplineCockpitView() {
  const subjects = state.disciplineData.subjects;
  const stats = getDisciplineStats(subjects);
  const traffic = subjects.find((item) => item["一级学科名称"] === "交通运输工程");
  const positionCounts = countBy(subjects, "学科定位（优势/重点/支撑/特色）");
  const positionTiles = positionOrder.map((name) => `<div><strong>${positionCounts[name] || 0}</strong><span>${name}</span></div>`).join("");
  const ranking = subjects.filter((item) => typeof item.百分位 === "number").sort((a, b) => a.百分位 - b.百分位).slice(0, 8).map((item) => `<div class="cockpit-rank-row ${item["一级学科名称"] === "交通运输工程" ? "is-focus" : ""}"><span class="rank-badge">${item.百分位}%</span><div><strong>${escapeText(item["一级学科名称"])}</strong><small>${escapeText(item["软科排名/百分位段（2026年5月）"])} · ${escapeText(item["学科定位（优势/重点/支撑/特色）"])}</small></div>${item["一级学科名称"] === "交通运输工程" ? '<button class="cockpit-link" type="button" data-drill="traffic">进入画像</button>' : '<span class="cockpit-muted">待接入</span>'}</div>`).join("");
  byId("disciplineCockpitView").innerHTML = `<section class="cockpit-hero"><div class="cockpit-copy"><p class="eyebrow">领导驾驶舱</p><h2>全校学科发展态势一屏总览</h2><p>面向校级决策的互联网风格驾驶舱，突出规模、结构、优势学科与可下钻重点对象。</p><div class="cockpit-actions"><button class="drill-btn" type="button" data-drill="traffic">下钻交通运输工程</button><span>数据来源：附件 1 / 附件 3 范例</span></div></div><div class="cockpit-score"><span>优势学科占比</span><strong>${Math.round((stats.advantage / stats.total) * 100)}%</strong><small>${stats.advantage} 个优势学科 / ${stats.total} 个一级学科</small></div></section><div class="cockpit-metrics">${metricCard("一级学科", stats.total, "覆盖全校布局", "cockpit-metric")}${metricCard("博士一级", stats.doctoral, "高层次学位点", "cockpit-metric")}${metricCard("硕士一级", stats.master, "支撑学科群", "cockpit-metric")}${metricCard("最优百分位", `前${stats.topPercentile.百分位}%`, stats.topPercentile["一级学科名称"], "cockpit-metric")}</div><div class="cockpit-grid"><section class="cockpit-panel cockpit-focus"><div class="panel-title"><h2>重点下钻对象</h2><span>可进入二级画像</span></div><h3>${escapeText(traffic["一级学科名称"])}</h3><p>${escapeText(traffic["软科排名/百分位段（2026年5月）"])} · ${escapeText(traffic["学科门类"])} · ${escapeText(traffic["学位点授予层次"])}</p><div class="cockpit-focus-strip"><span>定位 <strong>${escapeText(traffic["学科定位（优势/重点/支撑/特色）"])}</strong></span><span>代码 <strong>${escapeText(traffic["学科代码"])}</strong></span><span>评估 <strong>${escapeText(traffic["第五轮学科评估结果"])}</strong></span></div><button class="drill-btn" type="button" data-drill="traffic">查看交通运输工程画像</button></section><section class="cockpit-panel"><div class="panel-title"><h2>学科定位结构</h2><span>优势 / 重点 / 支撑 / 特色</span></div><div class="cockpit-position-grid">${positionTiles}</div></section><section class="cockpit-panel"><div class="panel-title"><h2>软科百分位 TOP 8</h2><span>越靠前越优</span></div><div class="cockpit-rank-list">${ranking}</div></section></div>`;
}

function setDisciplineView(view) {
  state.activeDisciplineView = view === "topics" ? "cockpit" : view;
  byId("disciplineBoardView").hidden = state.activeDisciplineView !== "board";
  byId("disciplineCockpitView").hidden = state.activeDisciplineView !== "cockpit";
  configureSwitch("discipline");
}

function renderInfoItem(label, value) {
  return `<div class="info-item"><span>${escapeText(label)}</span><strong>${escapeText(value || "未填")}</strong></div>`;
}

function renderDirection(direction) {
  const entries = [["主要团队", direction["主要团队"]], ["负责人", direction["团队负责人"]], ["团队成员", direction["团队成员"]], ["支撑平台", direction["支撑平台"]], ["本科专业", direction["对应本科专业"]]];
  return `<article class="direction-card"><h4>${escapeText(direction["学科方向"])}</h4><dl>${entries.map(([label, value]) => `<div><dt>${escapeText(label)}</dt><dd>${escapeText(value || "未填")}</dd></div>`).join("")}</dl></article>`;
}

function renderSecondary(item) {
  return `<article class="secondary-block"><div class="secondary-head"><div><h3>${escapeText(item["名称"])}</h3><div class="tag-row">${tag(item["建设学院"] || "未填")}${tag(`带头人：${item["二级学科带头人"] || "未填"}`, "blue")}</div></div><span class="muted">方向 ${item["方向"].length} 个</span></div><div class="direction-grid">${item["方向"].map(renderDirection).join("")}</div></article>`;
}

function renderDisciplineTrafficDetail() {
  const detail = state.disciplineData.trafficDetail;
  hideAllShells();
  byId("detailView").hidden = false;
  byId("detailView").className = "view-panel discipline-shell";
  byId("detailView").innerHTML = `<div class="detail-actions"><button class="back-btn" type="button" data-back>返回学科画像</button></div><section class="detail-hero"><div><p class="eyebrow">下钻明细</p><h2>${escapeText(detail["一级学科"])}</h2><div class="tag-row">${tag(detail["学科代码"])}${tag(detail["学位点授予层次"], "blue")}${tag(detail["学科定位"], "gold")}${tag(detail["学科门类"])}</div><p class="subhead" style="margin-top:16px">建设学院：${escapeText(detail["建设学院"])}。页面保留附件中的占位信息，用于演示数据口径、层级关系和后续填报位置。</p></div><div class="stat-stack"><div class="stat-box"><span>软科排名/百分位段</span><strong>${escapeText(detail["软科排名/百分位段"])}</strong></div><div class="stat-box"><span>一级学科带头人</span><strong>${escapeText(detail["一级学科带头人"])}</strong></div><div class="stat-box"><span>二级学科数量</span><strong>${detail["二级学科"].length}</strong></div></div></section><div class="detail-grid"><aside class="panel"><div class="panel-title"><h2>一级学科概况</h2></div><div class="info-list">${renderInfoItem("第五轮学科评估结果", detail["第五轮学科评估结果"])}${renderInfoItem("一级学科专任教师人数", detail["一级学科专任教师人数"])}${renderInfoItem("师资结构", detail["师资结构"])}${renderInfoItem("建设学院", detail["建设学院"])}</div></aside><section class="panel"><div class="panel-title"><h2>二级学科、方向与团队</h2><span class="muted">来自附件 3 范例</span></div><div class="secondary-list">${detail["二级学科"].map(renderSecondary).join("")}</div></section></div>`;
  window.scrollTo(0, 0);
}

function showBack() {
  if (state.activeDemo === "plan") enterDemo("plan");
  else if (state.activeDemo === "discipline") enterDemo("discipline");
  else showLanding();
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const home = event.target.closest("[data-home]");
    if (home) { showLanding(); return; }
    const demo = event.target.closest("[data-demo]");
    if (demo) { enterDemo(demo.dataset.demo); return; }
    const viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      if (state.activeDemo === "plan") setPlanView(viewButton.dataset.view);
      if (state.activeDemo === "discipline") setDisciplineView(viewButton.dataset.view === "overview" ? "board" : "cockpit");
      return;
    }
    const viewJump = event.target.closest("[data-view-jump]");
    if (viewJump) { setPlanView(viewJump.dataset.viewJump); return; }
    const topicButton = event.target.closest("[data-topic]");
    if (topicButton) { state.planningFilters.topic = topicButton.dataset.topic; renderTopicView(); setPlanView("topics"); return; }
    const indicatorButton = event.target.closest("[data-indicator-id]");
    if (indicatorButton) { renderIndicatorDetail(indicatorButton.dataset.indicatorId); return; }
    const kpi = event.target.closest("[data-discipline-kpi]");
    if (kpi) { state.disciplineFilters.position = kpi.dataset.disciplineKpi === "advantage" ? "优势学科" : "全部"; state.disciplineFilters.degree = kpi.dataset.disciplineKpi === "doctoral" ? "博士一级" : kpi.dataset.disciplineKpi === "master" ? "硕士一级" : "全部"; renderDisciplineBoardView(); setDisciplineView("board"); return; }
    const drill = event.target.closest("[data-drill='traffic']");
    if (drill) { renderDisciplineTrafficDetail(); return; }
    const back = event.target.closest("[data-back]");
    if (back) showBack();
  });

  document.addEventListener("change", (event) => {
    const planFilter = event.target.closest("[data-planning-filter]");
    if (planFilter) { state.planningFilters[planFilter.dataset.planningFilter] = planFilter.value; renderTopicView(); return; }
    const disciplineFilter = event.target.closest("[data-discipline-filter]");
    if (disciplineFilter) { state.disciplineFilters[disciplineFilter.dataset.disciplineFilter] = disciplineFilter.value; renderDisciplineCards(); }
  });
}

async function init() {
  const [planResponse, disciplineResponse] = await Promise.all([
    fetch("data/fifteen-five-indicators.json"),
    fetch("data/discipline-data.json"),
  ]);
  state.planData = await planResponse.json();
  state.disciplineData = await disciplineResponse.json();
  renderLandingView();
  renderOverviewView();
  renderTopicView();
  byId("supervisionView").innerHTML = renderSupervisionCenter();
  renderDisciplineBoardView();
  renderDisciplineCockpitView();
  bindEvents();
  showLanding();
}

init().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<main class="view-panel"><section class="panel"><h1>数据加载失败</h1><p>${escapeText(error.message)}</p></section></main>`;
});
