import assert from "node:assert/strict";
import fs from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => fs.readFile(new URL(path, root), "utf8");

const [html, css, js, rawPlanData, rawDisciplineData] = await Promise.all([
  read("index.html"),
  read("styles.css"),
  read("app.js"),
  read("data/fifteen-five-indicators.json"),
  read("data/discipline-data.json"),
]);

const planData = JSON.parse(rawPlanData);
const disciplineData = JSON.parse(rawDisciplineData);
const indicators = planData.indicators;
const categories = new Set(indicators.map((item) => item.category));

assert.match(html, /大连海事大学综合演示入口/, "index should default to a landing page");
assert.match(html, /id="landingView"/, "index should include landing mount");
assert.match(html, /id="planDemoView"/, "index should include fifteen-five demo mount");
assert.match(html, /id="disciplineDemoView"/, "index should include discipline demo mount");
assert.match(html, /id="detailView"/, "index should include shared drilldown detail mount");

assert.match(js, /renderLandingView/, "script should render landing page");
assert.match(js, /enterDemo/, "script should switch between demos");
assert.match(js, /data-demo="plan"/, "script should expose fifteen-five entry button");
assert.match(js, /data-demo="discipline"/, "script should expose discipline portrait entry button");
assert.match(js, /fetch\("data\/discipline-data.json"\)/, "script should load discipline data separately");
assert.match(js, /renderDisciplineBoardView/, "script should render discipline board");
assert.match(js, /renderDisciplineTrafficDetail/, "script should restore traffic discipline drilldown");
assert.match(js, /交通运输工程/, "script should include traffic discipline drilldown copy");
assert.match(js, /十五五监测 demo/, "script should include plan demo landing copy");
assert.match(js, /学科画像 demo/, "script should include discipline demo landing copy");

assert.equal(planData.planTitle, "大连海事大学“十五五”发展规划指标监测", "plan data should describe the fifteen-five monitoring demo");
assert.equal(indicators.length, 90, "plan demo should cover every indicator/detail row from attachment 2");
assert.equal(planData.sourceFiles.length, 2, "plan data should cite both the design doc and indicator workbook");
assert.ok(planData.design.sections.includes("总览驾驶舱"), "plan data should preserve overview cockpit design intent");
assert.ok(planData.design.sections.includes("督办闭环中心"), "plan data should preserve supervision loop design intent");

for (const category of ["办学规模", "办学条件", "党的建设", "学科建设", "人才培养", "科技创新", "人才队伍", "国际合作"]) {
  assert.ok(categories.has(category), `category ${category} should be represented`);
}

assert.equal(indicators.filter((item) => item.category === "科技创新").length, 32, "technology innovation split rows should be retained");
assert.equal(indicators.filter((item) => item.category === "国际合作").length, 13, "international cooperation rows should be retained");
assert.ok(indicators.every((item) => item.name && item.target && item.owner), "every plan row should include name, target, and owner");
assert.ok(indicators.some((item) => item.annual[2030] === "1000" && item.name === "留学生"), "annual decomposition should include 留学生 2030 target");
assert.ok(indicators.some((item) => item.name === "科研项目到款额" && item.annual[2030] === "7亿元"), "currency milestones should be retained");
assert.ok(indicators.some((item) => item.status === "异常"), "plan demo should include abnormal status");
assert.ok(indicators.some((item) => item.status === "预警"), "plan demo should include warning status");
assert.ok(indicators.some((item) => item.status === "正常"), "plan demo should include normal status");

assert.equal(disciplineData.subjects.length, 25, "discipline demo should still cover all 25 disciplines");
assert.ok(disciplineData.subjects.some((item) => item["一级学科名称"] === "交通运输工程"), "discipline demo should include traffic discipline");
assert.equal(disciplineData.trafficDetail["一级学科"], "交通运输工程", "discipline detail should describe traffic discipline");
assert.ok(disciplineData.trafficDetail["二级学科"].length >= 6, "traffic drilldown should retain secondary disciplines");

assert.match(css, /\.landing-grid/, "dashboard should style landing choices");
assert.match(css, /\.demo-card/, "dashboard should style demo cards");
assert.match(css, /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/s, "hidden views and nav should not be overridden by display styles");
assert.match(css, /\.discipline-shell/, "dashboard should style restored discipline shell");
assert.match(css, /\.subject-grid/, "dashboard should style discipline subject cards");
assert.match(css, /\.direction-grid/, "dashboard should style traffic drilldown direction cards");
assert.match(css, /\.plan-shell/, "dashboard should still style fifteen-five shell");
assert.match(css, /\.supervision-board/, "dashboard should still style supervision center");

console.log("combined demo validation passed");
