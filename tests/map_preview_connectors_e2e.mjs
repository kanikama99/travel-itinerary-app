import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const debugDir = path.join(root, "debug_logs");
fs.mkdirSync(debugDir, { recursive: true });

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

function isPortOpen(port) {
  return new Promise(resolve => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.onmessage = e => this.onMessage(e.data);
  }

  onMessage(raw) {
    const msg = JSON.parse(raw);
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result || {});
    } else if (msg.method) {
      this.events.push(msg);
    }
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  drain() {
    const out = this.events;
    this.events = [];
    return out;
  }

  close() {
    this.ws.close();
  }
}

async function startServer() {
  if (await isPortOpen(8000)) return null;
  const py = process.env.PYTHON || "python";
  const proc = spawn(py, ["server.py"], { cwd: root, windowsHide: true, stdio: "ignore" });
  for (let i = 0; i < 30; i++) {
    if (await isPortOpen(8000)) return proc;
    await wait(300);
  }
  proc.kill();
  throw new Error("local server did not start");
}

async function startChrome() {
  const chrome = fs.existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe")
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  const port = 9440 + Math.floor(Math.random() * 300);
  const profile = path.join(debugDir, `map-preview-profile-${Date.now()}`);
  const proc = spawn(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--disable-extensions",
    "--window-size=1365,1200",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { windowsHide: true, stdio: "ignore" });
  for (let i = 0; i < 40; i++) {
    try {
      const info = await httpJson(`http://127.0.0.1:${port}/json/version`);
      return { proc, port, browserWs: info.webSocketDebuggerUrl };
    } catch {
      await wait(250);
    }
  }
  proc.kill();
  throw new Error("headless browser did not start");
}

async function newPage(browserPort) {
  const tabs = await httpJson(`http://127.0.0.1:${browserPort}/json/list`);
  const tab = tabs.find(t => t.type === "page");
  if (!tab) throw new Error("no browser page target");
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
    setTimeout(() => reject(new Error("websocket connect timeout")), 5000);
  });
  return new Cdp(ws);
}

async function navigate(cdp, url) {
  cdp.drain();
  await cdp.send("Page.navigate", { url });
  for (let i = 0; i < 80; i++) {
    const events = cdp.drain();
    if (events.some(e => e.method === "Page.loadEventFired")) return;
    await wait(100);
  }
  throw new Error(`timeout loading ${url}`);
}

async function evalJs(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  return result.result?.value;
}

async function seed(cdp) {
  const spots = [
    ["taroko", "太魯閣渓谷", 24.1587, 121.6210],
    ["jiufen", "九份", 25.1097, 121.8452],
    ["taipei101", "台北101", 25.0339, 121.5645],
    ["palace", "国立故宮博物院", 25.1024, 121.5485],
    ["shilin", "士林夜市", 25.0878, 121.5242],
    ["longshan", "龍山寺", 25.0370, 121.4999],
    ["sunmoon", "日月潭", 23.8661, 120.9160],
    ["alishan", "阿里山", 23.5089, 120.8050],
    ["miyahara", "宮原眼科", 24.1383, 120.6839],
  ].map(([id, name, lat, lng]) => ({
    id,
    name,
    lat,
    lng,
    type: "spot",
    spotCategory: "tourist",
    spotRoles: [],
    priority: 3,
    defaultStayMinutes: 60,
  }));
  await navigate(cdp, "http://127.0.0.1:8000/spots.html");
  await evalJs(cdp, `{
    const spots = ${JSON.stringify(spots)};
    localStorage.setItem("spot-map-lists.v1", JSON.stringify({ activeListId: "taiwan", lists: [{ id: "taiwan", name: "Taiwan connector test", spots, clusterLabelDeltas: {} }] }));
    localStorage.setItem("spot-map-settings.v1", JSON.stringify({ mapStyle: "osm-bright", bgTheme: "warm", clusterThreshold: 0.20 }));
    true;
  }`);
}

async function runCheck(cdp) {
  await navigate(cdp, "http://127.0.0.1:8000/spots.html");
  await wait(1600);
  const result = await evalJs(cdp, `(async () => {
    const area = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
      * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const visible = selector => [...document.querySelectorAll(selector)].filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2 && getComputedStyle(el).visibility !== "hidden";
    });
    const items = visible(".leaflet-tooltip.spot-label,.cluster-label,.map-pin:not(.map-pin-cluster-member)").map(el => ({
      text: el.textContent.trim() || el.className,
      cls: el.className,
      rect: el.getBoundingClientRect(),
      map: el.closest(".map-card")?.id || "",
    }));
    const issues = [];
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      if (items[i].map !== items[j].map) continue;
      const a = area(items[i].rect, items[j].rect);
      if (a > 4) issues.push({ a: items[i].text, b: items[j].text, area: Math.round(a), map: items[i].map });
    }
    const jump = document.querySelector(".cluster-map-jump");
    let scrolled = false;
    let targetExists = false;
    if (jump) {
      const n = jump.textContent.match(/MAP(\\d+)/)?.[1];
      targetExists = !!document.getElementById("map-card-" + n);
      const before = window.scrollY;
      jump.click();
      await new Promise(resolve => setTimeout(resolve, 700));
      scrolled = targetExists && window.scrollY !== before;
    }
    return {
      mapCards: document.querySelectorAll(".map-card").length,
      jumps: document.querySelectorAll(".cluster-map-jump").length,
      connectors: document.querySelectorAll(".map-connector-arrowhead").length,
      arrows: document.querySelectorAll(".map-connector-arrowhead").length,
      targetExists,
      scrolled,
      issues: issues.slice(0, 8),
    };
  })()`);
  if (result.mapCards < 2) throw new Error(`expected multiple map cards: ${JSON.stringify(result)}`);
  if (result.jumps < 1 || result.connectors < 1 || result.arrows < 1) throw new Error(`missing map jump or connector: ${JSON.stringify(result)}`);
  if (!result.targetExists || !result.scrolled) throw new Error(`MAP jump did not scroll: ${JSON.stringify(result)}`);
  if (result.issues.length) throw new Error(`map label overlap: ${JSON.stringify(result.issues)}`);
  const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  const out = path.join(debugDir, "map-preview-connectors-taiwan.png");
  fs.writeFileSync(out, Buffer.from(screenshot.data, "base64"));
  return { ...result, screenshot: out };
}

const server = await startServer();
const browser = await startChrome();
const cdp = await newPage(browser.port);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Log.enable");

try {
  await seed(cdp);
  const result = await runCheck(cdp);
  console.log(JSON.stringify(result, null, 2));
} finally {
  cdp.close();
  browser.proc.kill();
  if (server) server.kill();
}
