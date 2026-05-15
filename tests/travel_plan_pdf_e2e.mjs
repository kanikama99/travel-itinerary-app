import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";

const root = path.resolve(new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const debugDir = path.join(root, "debug_logs", "pdf-e2e");
fs.mkdirSync(debugDir, { recursive: true });

const pages = [
  "index.html", "top.html", "bookmarks.html", "spots.html", "tripplan.html",
  "schedule.html", "hotel.html", "flight.html", "tour.html", "rental.html",
  "gourmet.html", "checklist.html", "travelchecklist.html", "print.html",
  "settings.html", "howto.html", "legal.html",
];

const airports = {
  HND: ["airport-hnd", "Haneda Airport (HND)", 35.5494, 139.7798],
  ITM: ["airport-itm", "Osaka Itami Airport (ITM)", 34.7855, 135.4381],
  KIX: ["airport-kix", "Kansai International Airport (KIX)", 34.4270, 135.2440],
  NRT: ["airport-nrt", "Narita Airport (NRT)", 35.7719, 140.3929],
  ICN: ["airport-icn", "Incheon Airport (ICN)", 37.4602, 126.4407],
  GMP: ["airport-gmp", "Gimpo Airport (GMP)", 37.5589, 126.7950],
  CDG: ["airport-cdg", "Charles de Gaulle Airport (CDG)", 49.0097, 2.5479],
  LHR: ["airport-lhr", "Heathrow Airport (LHR)", 51.47, -0.4543],
  HNL: ["airport-hnl", "Honolulu Airport (HNL)", 21.3245, -157.9251],
  LAX: ["airport-lax", "Los Angeles Airport (LAX)", 33.9425, -118.4081],
  JFK: ["airport-jfk", "New York JFK Airport (JFK)", 40.6413, -73.7781],
  SYD: ["airport-syd", "Sydney Airport (SYD)", -33.9399, 151.1753],
};

function spot(list, id, name, lat, lng, extra = {}) {
  return {
    id: `${list}-${id}`,
    name,
    lat,
    lng,
    type: "spot",
    spotCategory: extra.spotCategory || "tourist",
    spotRoles: extra.spotRoles || [],
    spotRole: (extra.spotRoles || [])[0] || "",
    priority: extra.priority || 3,
    defaultStayMinutes: extra.defaultStayMinutes ?? 70,
    description: extra.description || "Draft memo: confirm hours, routes, and booking terms before departure.",
    budget: extra.budget || 0,
    ...extra,
  };
}

function airportSpot(list, code, role = "") {
  const [airportId, name, lat, lng] = airports[code];
  return spot(list, `${code.toLowerCase()}-${role || "airport"}`, name, lat, lng, {
    spotCategory: "airport",
    airportId,
    iata: code,
    spotRoles: role ? [role] : [],
    defaultStayMinutes: 90,
    airportCheckinOffsetMin: 90,
    description: "Draft airport placeholder. Confirm terminal, ticket, and baggage conditions.",
  });
}

function day(id, date, label, entries, startTime = "09:00", endTime = "21:00") {
  return {
    id,
    date,
    label,
    startTime,
    endTime,
    travelMinutes: 25,
    stayTimes: {},
    entries: entries.map(spotId => ({ spotId })),
  };
}

function flight(role, from, to, date, time, arrivalTime, flightNumber, pricePerPerson = 0) {
  const f = airports[from];
  const t = airports[to];
  return {
    role,
    airport: f[1],
    arrivalAirport: t[1],
    departureSpotId: "",
    arrivalSpotId: "",
    airportId: f[0],
    iata: from,
    arrivalAirportId: t[0],
    arrivalIata: to,
    date,
    time,
    arrivalTime,
    flightNumber,
    pricePerPerson,
    memo: "Draft flight. Confirm reservation before travel.",
  };
}

function makePlan(id, name, dates, meet, dismiss, visits, hotels, flights, extras = {}) {
  const spots = [...(extras.airports || []), ...visits];
  const days = dates.map((date, i) => day(
    `${id}-d${i + 1}`,
    date,
    `Day ${i + 1}`,
    extras.dayEntries?.[i] || visits.slice(i * 3, i * 3 + 3).map(s => s.id),
    i ? "09:00" : extras.startTime || "08:30",
    i === dates.length - 1 ? extras.endTime || "18:00" : "21:00",
  ));
  return {
    list: { id, name, spots, clusterLabelDeltas: {} },
    schedule: {
      listId: id,
      tripMeetDate: dates[0],
      tripDismissDate: dates.at(-1),
      tripMeetTime: extras.startTime || "08:30",
      tripDismissTime: extras.endTime || "18:00",
      tripMeetPlace: meet,
      tripDismissPlace: dismiss,
      travelMode: extras.travelMode || "transit",
      days,
      hotels,
      flights,
      tours: extras.tours || {},
      rental: extras.rental || null,
      defaultStayTimes: {},
      transitCache: {},
    },
    cover: {
      title: name,
      subtitle: `${dates[0]} - ${dates.at(-1)} / draft plan`,
      pageOrder: ["cover", "map", "spots", "schedule", "packing", "back"],
      pageNames: { map: "Maps", spots: "Spots", schedule: "Schedule", packing: "Packing" },
    },
    packing: [
      { cat: "Basics", items: ["Wallet", "Phone", "Charger", "ID"].map(item => ({ name: item, done: false })) },
      { cat: "Bookings", items: ["Hotel memo", "Flight memo", "Tour voucher"].map(item => ({ name: item, done: false })) },
    ],
    travel: [
      { id: "hotel", label: "Book hotel", done: false, na: false },
      { id: "flight", label: "Book flight", done: false, na: false },
      { id: "tour", label: "Book tour", done: false, na: false },
      { id: "rental", label: "Book rental car", done: !!extras.rental, na: !extras.rental },
    ],
  };
}

const plans = [
  makePlan("plan-osaka", "Osaka Draft Trip", ["2026-06-05", "2026-06-06"], "Osaka Station", "Shin-Osaka Station", [
    spot("osaka", "castle", "Osaka Castle", 34.6873, 135.5262),
    spot("osaka", "doutonbori", "Dotonbori", 34.6687, 135.501),
    spot("osaka", "umeda", "Umeda Sky Building", 34.7053, 135.4896),
    spot("osaka", "kaiyukan", "Osaka Aquarium Kaiyukan", 34.6545, 135.4289),
    spot("osaka", "shinsekai", "Shinsekai", 34.6525, 135.5063),
    spot("osaka", "market", "Kuromon Market", 34.6652, 135.5066),
  ], {
    "plan-osaka-d1": { name: "Osaka Riverside Hotel (draft)", pricePerPerson: 14000, checkinTime: "18:00", checkoutTime: "09:00" },
  }, {}, {
    tours: { "tour-osaka-food": { name: "Dotonbori Food Walk (draft)", area: "Namba", date: "2026-06-05", time: "17:30", pricePerPerson: 5000, memo: "Meet at the local guide desk." } },
  }),
  makePlan("plan-ogasawara", "Ogasawara Draft Trip", ["2026-07-03", "2026-07-04", "2026-07-05"], "Takeshiba Pier", "Takeshiba Pier", [
    spot("ogasawara", "takeshiba", "Takeshiba Pier", 35.6548, 139.7628, { spotRoles: ["meet"], spotCategory: "station" }),
    spot("ogasawara", "futami", "Futami Port", 27.0959, 142.1948),
    spot("ogasawara", "kominato", "Kominato Beach", 27.0616, 142.186),
    spot("ogasawara", "weather", "Weather Station Lookout", 27.1048, 142.2006),
    spot("ogasawara", "heart", "Heart Rock Lookout", 27.051, 142.215),
    spot("ogasawara", "dolphin", "Dolphin Watch Meeting Point", 27.094, 142.195),
  ], {
    "plan-ogasawara-d1": { name: "Chichijima Pension (draft)", pricePerPerson: 11000, checkinTime: "17:30", checkoutTime: "08:30" },
    "plan-ogasawara-d2": { name: "Chichijima Pension (draft)", pricePerPerson: 11000, checkinTime: "18:00", checkoutTime: "08:30" },
  }, {}, {
    tours: { "tour-ogasawara-sea": { name: "Dolphin Watching Tour (draft)", area: "Chichijima", date: "2026-07-04", time: "09:00", pricePerPerson: 12000, memo: "Depends on sea conditions." } },
  }),
  makePlan("plan-korea", "Korea Draft Trip", ["2026-06-12", "2026-06-13", "2026-06-14"], airports.HND[1], airports.HND[1], [
    airportSpot("korea", "HND", "meet"),
    airportSpot("korea", "ICN"),
    airportSpot("korea", "GMP", "dismiss"),
    spot("korea", "gyeongbok", "Gyeongbokgung Palace", 37.5796, 126.977),
    spot("korea", "myeongdong", "Myeongdong", 37.5636, 126.9834),
    spot("korea", "bukchon", "Bukchon Hanok Village", 37.5826, 126.983),
    spot("korea", "hongdae", "Hongdae", 37.5563, 126.9236),
    spot("korea", "namsan", "N Seoul Tower", 37.5512, 126.9882),
  ], {
    "plan-korea-d1": { name: "Myeongdong Hotel (draft)", pricePerPerson: 17000, checkinTime: "18:00", checkoutTime: "09:00" },
    "plan-korea-d2": { name: "Myeongdong Hotel (draft)", pricePerPerson: 17000, checkinTime: "18:30", checkoutTime: "09:00" },
  }, {
    "meet:korea-hnd-meet:2026-06-12": flight("meet", "HND", "ICN", "2026-06-12", "09:20", "11:50", "JL091", 36000),
    "dismiss:korea-gmp-dismiss:2026-06-14": flight("dismiss", "GMP", "HND", "2026-06-14", "18:20", "20:35", "JL094", 36000),
  }),
  makePlan("plan-europe", "Europe Draft Trip", ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04"], airports.HND[1], airports.HND[1], [
    airportSpot("europe", "HND", "meet"),
    airportSpot("europe", "CDG"),
    airportSpot("europe", "LHR", "dismiss"),
    spot("europe", "louvre", "Louvre Museum", 48.8606, 2.3376),
    spot("europe", "eiffel", "Eiffel Tower", 48.8584, 2.2945),
    spot("europe", "mont", "Montmartre", 48.8867, 2.3431),
    spot("europe", "british", "British Museum", 51.5194, -0.127),
    spot("europe", "tower", "Tower of London", 51.5081, -0.0759),
    spot("europe", "rome", "Colosseum", 41.8902, 12.4922),
  ], {
    "plan-europe-d1": { name: "Paris Left Bank Hotel (draft)", pricePerPerson: 26000, checkinTime: "19:00", checkoutTime: "08:30" },
    "plan-europe-d2": { name: "London Central Hotel (draft)", pricePerPerson: 28000, checkinTime: "20:00", checkoutTime: "08:30" },
    "plan-europe-d3": { name: "Rome Station Hotel (draft)", pricePerPerson: 24000, checkinTime: "19:30", checkoutTime: "08:00" },
  }, {
    "meet:europe-hnd-meet:2026-08-01": flight("meet", "HND", "CDG", "2026-08-01", "00:05", "07:55", "AF293", 180000),
    "dismiss:europe-lhr-dismiss:2026-08-04": flight("dismiss", "LHR", "HND", "2026-08-04", "19:00", "16:00", "JL044", 180000),
  }),
  makePlan("plan-hawaii", "Hawaii Draft Trip", ["2026-09-10", "2026-09-11", "2026-09-12"], airports.NRT[1], airports.NRT[1], [
    airportSpot("hawaii", "NRT", "meet"),
    airportSpot("hawaii", "HNL", "dismiss"),
    spot("hawaii", "waikiki", "Waikiki Beach", 21.2766, -157.8268),
    spot("hawaii", "diamond", "Diamond Head", 21.262, -157.805),
    spot("hawaii", "ala", "Ala Moana Center", 21.291, -157.843),
    spot("hawaii", "pearl", "Pearl Harbor", 21.365, -157.95),
    spot("hawaii", "kualoa", "Kualoa Ranch", 21.5205, -157.837),
  ], {
    "plan-hawaii-d1": { name: "Waikiki Resort (draft)", pricePerPerson: 30000, checkinTime: "16:00", checkoutTime: "10:00" },
    "plan-hawaii-d2": { name: "Waikiki Resort (draft)", pricePerPerson: 30000, checkinTime: "18:00", checkoutTime: "10:00" },
  }, {
    "meet:hawaii-nrt-meet:2026-09-10": flight("meet", "NRT", "HNL", "2026-09-10", "20:30", "08:55", "HA822", 120000),
    "dismiss:hawaii-hnl-dismiss:2026-09-12": flight("dismiss", "HNL", "NRT", "2026-09-12", "13:10", "16:30", "HA821", 120000),
  }, {
    rental: { pickup: "Honolulu Airport (draft)", dropoff: "Honolulu Airport (draft)", startDate: "2026-09-10", endDate: "2026-09-12", price: 26000, memo: "Confirm insurance and driving rules." },
  }),
  makePlan("plan-world", "Round The World Draft Trip", ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05"], airports.HND[1], airports.HND[1], [
    airportSpot("world", "HND", "meet"),
    airportSpot("world", "LAX"),
    airportSpot("world", "JFK"),
    airportSpot("world", "LHR"),
    airportSpot("world", "SYD", "dismiss"),
    spot("world", "santa", "Santa Monica", 34.0094, -118.4973),
    spot("world", "times", "Times Square", 40.758, -73.9855),
    spot("world", "westminster", "Westminster", 51.4995, -0.1248),
    spot("world", "opera", "Sydney Opera House", -33.8568, 151.2153),
  ], {
    "plan-world-d1": { name: "LAX Airport Hotel (draft)", pricePerPerson: 22000, checkinTime: "19:00", checkoutTime: "08:00" },
    "plan-world-d2": { name: "NY Midtown Hotel (draft)", pricePerPerson: 30000, checkinTime: "20:00", checkoutTime: "08:00" },
    "plan-world-d3": { name: "London Station Hotel (draft)", pricePerPerson: 28000, checkinTime: "19:00", checkoutTime: "08:00" },
    "plan-world-d4": { name: "Sydney Hotel (draft)", pricePerPerson: 26000, checkinTime: "18:00", checkoutTime: "08:00" },
  }, {
    "meet:world-hnd-meet:2026-10-01": flight("meet", "HND", "LAX", "2026-10-01", "16:45", "10:50", "NH106", 260000),
    "dismiss:world-syd-dismiss:2026-10-05": flight("dismiss", "SYD", "HND", "2026-10-05", "21:30", "05:20", "NH880", 260000),
  }),
];

function storageFor(activeId) {
  const lists = plans.map(p => p.list);
  const schedules = Object.fromEntries(plans.map(p => [p.list.id, p.schedule]));
  const covers = Object.fromEntries(plans.map(p => [p.list.id, p.cover]));
  const scoped = {};
  plans.forEach(p => {
    scoped[`trip-packing-list.v1:${p.list.id}`] = p.packing;
    scoped[`trip-travel-checklist.v1:${p.list.id}`] = p.travel;
  });
  return {
    "spot-map-lists.v1": { activeListId: activeId, lists },
    "spot-map-schedule.v1": schedules,
    "trip-print-cover.v1": covers,
    "spot-map-settings.v1": { bgTheme: 0, mapStyle: "osm-bright", showBudget: true, calendarStyle: "standard" },
    ...scoped,
  };
}

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
  const port = 9333 + Math.floor(Math.random() * 400);
  const profile = path.join(debugDir, `profile-${Date.now()}`);
  const proc = spawn(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--disable-extensions",
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
    if (events.some(e => e.method === "Page.loadEventFired")) return events;
    await wait(100);
  }
  throw new Error(`timeout loading ${url}`);
}

async function evalJs(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  return result.result?.value;
}

async function seed(cdp, activeId) {
  await navigate(cdp, "http://127.0.0.1:8000/index.html");
  const data = storageFor(activeId);
  await evalJs(cdp, `{
    const data = ${JSON.stringify(data)};
    for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value));
    true;
  }`);
}

async function checkPage(cdp, url) {
  const events = await navigate(cdp, url);
  await wait(250);
  const title = await evalJs(cdp, "document.title");
  const body = await evalJs(cdp, "document.body ? document.body.innerText.slice(0, 2000) : ''");
  const late = cdp.drain();
  const bad = [...events, ...late].filter(e =>
    e.method === "Runtime.exceptionThrown"
    || (e.method === "Log.entryAdded" && ["error", "warning"].includes(e.params?.entry?.level))
  );
  if (!title || !body.trim()) throw new Error(`blank page: ${url}`);
  const mojibakePattern = new RegExp("[\\u7e67\\u7e3a\\u8b41\\u86df\\u870a\\u8b16\\u9a5b\\u8b8c\\ufffd]");
  if (mojibakePattern.test(body)) throw new Error(`mojibake visible on ${url}`);
  if (bad.length) throw new Error(`browser error on ${url}: ${JSON.stringify(bad[0]).slice(0, 500)}`);
  return title;
}

async function printPdf(cdp, plan) {
  await navigate(cdp, "http://127.0.0.1:8000/print.html");
  await evalJs(cdp, "preparePrintLayout(); true");
  await wait(1400);
  const mapCount = await evalJs(cdp, "document.querySelectorAll('#printMapPanels .print-map-card').length");
  const spotCount = await evalJs(cdp, "document.querySelectorAll('.spot-print-card').length");
  if (mapCount < 1 || spotCount < 1) throw new Error(`${plan.name}: print preview missing maps or spots`);
  const overlaps = await evalJs(cdp, `(() => {
    const area = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
      * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    const items = [...document.querySelectorAll("#printMapPanels .leaflet-map")].flatMap((map, mapIndex) =>
      [...map.querySelectorAll(".leaflet-tooltip.spot-label,.cluster-label,.overview-zoom-badge,.map-pin")]
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.width > 2 && r.height > 2 && getComputedStyle(el).visibility !== "hidden";
        })
        .map(el => ({ mapIndex, cls: el.className, text: el.textContent.trim(), rect: el.getBoundingClientRect() }))
    );
    const issues = [];
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      if (items[i].mapIndex !== items[j].mapIndex) continue;
      const a = area(items[i].rect, items[j].rect);
      if (a > 4) issues.push({ a: items[i].text || items[i].cls, b: items[j].text || items[j].cls, area: Math.round(a), mapIndex: items[i].mapIndex });
    }
    return issues.slice(0, 8);
  })()`);
  if (overlaps.length) throw new Error(`${plan.name}: map label overlap ${JSON.stringify(overlaps)}`);
  await cdp.send("Emulation.setEmulatedMedia", { media: "print" });
  const pdf = await cdp.send("Page.printToPDF", { printBackground: true, preferCSSPageSize: true });
  const out = path.join(debugDir, `${plan.list.id}.pdf`);
  fs.writeFileSync(out, Buffer.from(pdf.data, "base64"));
  const size = fs.statSync(out).size;
  if (size < 20_000) throw new Error(`${plan.name}: PDF too small (${size})`);
  await cdp.send("Emulation.setEmulatedMedia", { media: "" });
  return { out, size, mapCount, spotCount };
}

const server = await startServer();
const browser = await startChrome();
const cdp = await newPage(browser.port);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Log.enable");

const report = [];
try {
  for (const plan of plans) {
    await seed(cdp, plan.list.id);
    const titles = [];
    for (const page of pages) titles.push(await checkPage(cdp, `http://127.0.0.1:8000/${page}`));
    const pdf = await printPdf(cdp, plan);
    report.push({ plan: plan.list.name, pages: titles.length, ...pdf });
  }
} finally {
  cdp.close();
  browser.proc.kill();
  if (server) server.kill();
}

console.log(JSON.stringify(report, null, 2));
