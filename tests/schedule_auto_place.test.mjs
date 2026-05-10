import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const scheduleHtml = fs.readFileSync(new URL("schedule.html", root), "utf8");
const mainScript = scheduleHtml.match(/<script>\s*([\s\S]*?)\s*<\/script>\s*<script src="\.\/theme\.js"><\/script>/)?.[1];
assert(mainScript, "schedule.html inline script not found");

const AIRPORTS = [
  { id: "airport-hnd", iata: "HND", code: "HND", name: "羽田空港 (HND)", displayName: "羽田空港 (HND)", country: "日本", city: "東京", lat: 35.5494, lng: 139.7798, aliases: ["Haneda Airport"] },
  { id: "airport-itm", iata: "ITM", code: "ITM", name: "大阪伊丹空港 (ITM)", displayName: "大阪伊丹空港 (ITM)", country: "日本", city: "大阪", lat: 34.7855, lng: 135.4381, aliases: ["Osaka Itami Airport"] },
  { id: "airport-tpe", iata: "TPE", code: "TPE", name: "桃園国際空港・台北 (TPE)", displayName: "桃園国際空港・台北 (TPE)", country: "台湾", city: "台北", lat: 25.0777, lng: 121.2327, aliases: ["Taipei Taoyuan Airport"] },
  { id: "airport-cdg", iata: "CDG", code: "CDG", name: "パリ・シャルル・ド・ゴール空港 (CDG)", displayName: "パリ・シャルル・ド・ゴール空港 (CDG)", country: "フランス", city: "パリ", lat: 49.0097, lng: 2.5479, aliases: ["Paris CDG"] },
];

class FakeClassList {
  add() {}
  remove() {}
  toggle() {}
  contains() { return false; }
}

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.value = "";
    this.textContent = "";
    this.innerHTML = "";
    this.disabled = false;
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.classList = new FakeClassList();
    this.listeners = {};
  }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.children.push(node); return node; }
  prepend(...nodes) { this.children.unshift(...nodes); }
  remove() {}
  focus() {}
  setAttribute() {}
  contains() { return false; }
  addEventListener(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }
  querySelector() { return new FakeElement(); }
  querySelectorAll() { return []; }
}

function makeDocument() {
  const elements = new Map();
  const doc = {
    body: new FakeElement("body"),
    documentElement: new FakeElement("html"),
    createElement: tag => new FakeElement(tag),
    querySelector: () => new FakeElement(),
    querySelectorAll: () => [],
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id));
      return elements.get(id);
    },
  };
  return doc;
}

function makeStorage(seed) {
  const data = new Map(Object.entries(seed).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    dump(key) { return JSON.parse(data.get(key)); },
  };
}

function normalizeAirportName(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function boot(spots, schedule) {
  const document = makeDocument();
  const list = { id: "list-1", name: "Test Trip", spots };
  const localStorage = makeStorage({
    "spot-map-lists.v1": { activeListId: list.id, lists: [list] },
    "spot-map-schedule.v1": { [list.id]: schedule },
  });
  const context = {
    console,
    assert,
    document,
    localStorage,
    Date,
    Math,
    JSON,
    Number,
    String,
    Array,
    Object,
    RegExp,
    URLSearchParams,
    location: { href: "" },
    alert: message => { throw new Error(`Unexpected alert: ${message}`); },
    fetch: async () => ({ ok: false, json: async () => [] }),
    setTimeout: () => 0,
    clearTimeout: () => {},
  };
  context.window = {
    __SCHEDULE_TEST_MODE__: true,
    TRIP_AIRPORTS: AIRPORTS,
    CalendarPicker: { updateDisplay() {} },
    normalizeTripAirportName: normalizeAirportName,
    findTripAirport(name) {
      const key = normalizeAirportName(name);
      return AIRPORTS.find(ap =>
        normalizeAirportName(ap.name) === key
        || normalizeAirportName(ap.iata) === key
        || (ap.aliases || []).some(alias => normalizeAirportName(alias) === key)
      ) || null;
    },
    sameTripAirport(a, b) {
      return !!a && !!b && (
        (a.airportId && (a.airportId === b.id || a.airportId === b.airportId))
        || (a.iata && (a.iata === b.iata || a.iata === b.code))
      );
    },
    addEventListener() {},
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(mainScript, context, { filename: "schedule.html" });
  return context.window.__scheduleTestApi;
}

const spot = (id, name, lat, lng, extra = {}) => ({
  id, name, lat, lng, type: "spot", spotCategory: "tourist", priority: 3, ...extra,
});
const airportSpot = (id, airportId, role, extra = {}) => {
  const ap = AIRPORTS.find(a => a.id === airportId);
  return spot(id, ap.name, ap.lat, ap.lng, {
    spotCategory: "airport",
    airportId: ap.id,
    iata: ap.iata,
    spotRole: role,
    spotRoles: role ? [role] : [],
    defaultStayMinutes: 90,
    airportCheckinOffsetMin: 90,
    ...extra,
  });
};

function baseSchedule(overrides = {}) {
  return {
    listId: "list-1",
    tripMeetDate: "2026-06-01",
    tripDismissDate: "2026-06-01",
    tripMeetTime: "09:00",
    tripDismissTime: "18:00",
    tripMeetPlace: "start",
    tripDismissPlace: "end",
    days: [{ id: "d1", label: "1日目", date: "2026-06-01", travelMinutes: 20, stayTimes: {}, entries: [] }],
    defaultStayTimes: {},
    transitCache: {},
    travelMode: "transit",
    ...overrides,
  };
}

function runScenario(name, spots, schedule, verify) {
  const api = boot(spots, schedule);
  const result = api.runAutoPlacement();
  assert.equal(result.ok, true, name);
  const state = api.getState();
  state.schedule.days.forEach((day, idx) => {
    const plan = api.generatePlan(day, idx, state.schedule.days.length, { strictCapacity: true });
    verify({ api, state, day, idx, plan, result });
  });
}

function assertNoOverflow(plan, label) {
  const bad = plan.steps.filter(step => step.overflow || step.airportCheckinWarning);
  assert.equal(bad.length, 0, `${label}: ${bad.map(step => `${step.type}:${step.name || step.role}`).join(", ")}`);
}

runScenario(
  "domestic day trip respects explicit 08:00-17:00 window",
  [
    spot("meet", "大阪駅", 34.7025, 135.4959, { spotRoles: ["meet"] }),
    spot("dismiss", "大阪駅", 34.7025, 135.4959, { spotRoles: ["dismiss"] }),
    spot("a", "大阪城", 34.6873, 135.5262),
    spot("b", "道頓堀", 34.6687, 135.5010),
    spot("c", "海遊館", 34.6545, 135.4289),
  ],
  baseSchedule({ tripMeetTime: "08:00", tripDismissTime: "17:00" }),
  ({ plan }) => {
    assertNoOverflow(plan, "domestic day trip should fit");
    const meet = plan.steps.find(s => s.type === "meet");
    const dismiss = plan.steps.find(s => s.type === "dismiss");
    assert.equal(meet.time, 8 * 60);
    assert.ok(dismiss.time <= 17 * 60);
  },
);

runScenario(
  "short day skips overflow instead of violating 09:00-12:00",
  [
    spot("meet", "京都駅", 34.9858, 135.7588, { spotRoles: ["meet"] }),
    spot("dismiss", "京都駅", 34.9858, 135.7588, { spotRoles: ["dismiss"] }),
    spot("a", "清水寺", 34.9949, 135.7850, { defaultStayMinutes: 90 }),
    spot("b", "金閣寺", 35.0394, 135.7292, { defaultStayMinutes: 90 }),
    spot("c", "嵐山", 35.0094, 135.6668, { defaultStayMinutes: 90 }),
  ],
  baseSchedule({ tripMeetTime: "09:00", tripDismissTime: "12:00" }),
  ({ plan, result }) => {
    assert.ok(result.skipped.length >= 1, "short day should report skipped spots");
    assertNoOverflow(plan, "short day placed spots must stay in window");
    assert.ok(plan.steps.find(s => s.type === "dismiss").time <= 12 * 60);
  },
);

runScenario(
  "registered inbound flight keeps trip start and places visits after arrival",
  [
    airportSpot("hnd", "airport-hnd", "meet"),
    spot("dismiss", "台北駅", 25.0478, 121.5170, { spotRoles: ["dismiss"] }),
    airportSpot("tpe", "airport-tpe", ""),
    spot("a", "台北101", 25.0339, 121.5645),
    spot("b", "龍山寺", 25.0372, 121.4999),
  ],
  baseSchedule({
    tripMeetTime: "07:00",
    tripDismissTime: "20:00",
    tripMeetPlace: "羽田空港 (HND)",
    tripDismissPlace: "台北駅",
    flights: {
      "meet:hnd:2026-06-01": {
        role: "meet", airport: "羽田空港 (HND)", arrivalAirport: "桃園国際空港・台北 (TPE)",
        departureSpotId: "hnd", arrivalSpotId: "tpe", time: "08:30", arrivalTime: "11:30",
      },
    },
  }),
  ({ plan }) => {
    assert.equal(plan.steps.find(s => s.type === "meet").time, 7 * 60);
    const visits = plan.steps.filter(s => s.type === "spot");
    assert.ok(visits.length > 0);
    assert.ok(visits.every(s => s.time >= 11 * 60 + 30), "visits must start after flight arrival");
    assertNoOverflow(plan, "inbound flight day should fit");
  },
);

runScenario(
  "explicit late start is not pulled earlier by an airport arrival",
  [
    airportSpot("hnd", "airport-hnd", "meet"),
    spot("dismiss", "台北駅", 25.0478, 121.5170, { spotRoles: ["dismiss"] }),
    airportSpot("tpe", "airport-tpe", ""),
    spot("a", "台北101", 25.0339, 121.5645),
  ],
  baseSchedule({
    tripMeetTime: "15:00",
    tripDismissTime: "21:00",
    tripMeetPlace: "羽田空港 (HND)",
    tripDismissPlace: "台北駅",
    flights: {
      "meet:hnd:2026-06-01": {
        role: "meet", airport: "羽田空港 (HND)", arrivalAirport: "桃園国際空港・台北 (TPE)",
        departureSpotId: "hnd", arrivalSpotId: "tpe", time: "08:30", arrivalTime: "11:30",
      },
    },
  }),
  ({ plan }) => {
    assert.equal(plan.steps.find(s => s.type === "meet").time, 15 * 60);
    assert.ok(plan.steps.filter(s => s.type === "spot").every(s => s.time >= 15 * 60));
  },
);

runScenario(
  "registered return flight uses airport check-in limit before trip end",
  [
    spot("meet", "台北駅", 25.0478, 121.5170, { spotRoles: ["meet"] }),
    airportSpot("hnd", "airport-hnd", "dismiss"),
    airportSpot("tpe", "airport-tpe", ""),
    spot("a", "台北101", 25.0339, 121.5645),
    spot("b", "九份", 25.1097, 121.8442, { defaultStayMinutes: 120 }),
    spot("c", "淡水", 25.1677, 121.4457, { defaultStayMinutes: 120 }),
  ],
  baseSchedule({
    tripMeetTime: "09:00",
    tripDismissTime: "21:00",
    tripMeetPlace: "台北駅",
    tripDismissPlace: "羽田空港 (HND)",
    flights: {
      "dismiss:hnd:2026-06-01": {
        role: "dismiss", airport: "桃園国際空港・台北 (TPE)", arrivalAirport: "羽田空港 (HND)",
        departureSpotId: "tpe", arrivalSpotId: "hnd", time: "18:00", arrivalTime: "22:00",
      },
    },
  }),
  ({ plan }) => {
    assertNoOverflow(plan, "return flight should honor check-in limit");
    const dismiss = plan.steps.find(s => s.type === "dismiss");
    assert.ok(dismiss.time <= 16 * 60 + 30, `dismiss ${dismiss.time} should be by 16:30 check-in`);
  },
);

runScenario(
  "closed business-hour window is skipped rather than forced into the day",
  [
    spot("meet", "京都駅", 34.9858, 135.7588, { spotRoles: ["meet"] }),
    spot("dismiss", "京都駅", 34.9858, 135.7588, { spotRoles: ["dismiss"] }),
    spot("a", "午前だけの寺", 34.9949, 135.7850, { businessHours: { mon: "15:00-17:00" } }),
    spot("b", "朝の庭園", 34.9910, 135.7600, { businessHours: { mon: "09:00-11:00" } }),
  ],
  baseSchedule({ tripMeetTime: "09:00", tripDismissTime: "12:00" }),
  ({ plan, result }) => {
    assert.ok(result.skipped.includes("午前だけの寺"));
    assert.ok(plan.steps.some(s => s.type === "spot" && s.name === "朝の庭園"));
    assertNoOverflow(plan, "business-hour scenario should keep only valid visits");
  },
);

runScenario(
  "multi-day provisional airport trip keeps visits between arrival and return check-in",
  [
    airportSpot("hnd-meet", "airport-hnd", "meet"),
    airportSpot("hnd-dismiss", "airport-hnd", "dismiss"),
    airportSpot("tpe", "airport-tpe", ""),
    spot("a", "台北101", 25.0339, 121.5645),
    spot("b", "龍山寺", 25.0372, 121.4999),
    spot("c", "九份", 25.1097, 121.8442, { defaultStayMinutes: 120 }),
    spot("d", "淡水", 25.1677, 121.4457, { defaultStayMinutes: 120 }),
  ],
  baseSchedule({
    tripMeetDate: "2026-06-01",
    tripDismissDate: "2026-06-02",
    tripMeetTime: "09:00",
    tripDismissTime: "18:00",
    tripMeetPlace: "羽田空港 (HND)",
    tripDismissPlace: "羽田空港 (HND)",
    days: [
      { id: "d1", label: "1日目", date: "2026-06-01", travelMinutes: 20, stayTimes: {}, entries: [], endTime: "21:00" },
      { id: "d2", label: "2日目", date: "2026-06-02", travelMinutes: 20, stayTimes: {}, entries: [], startTime: "09:00" },
    ],
  }),
  ({ plan, idx }) => {
    assertNoOverflow(plan, `provisional airport day ${idx + 1} should fit`);
    if (idx === 0) {
      assert.ok(plan.steps.filter(s => s.type === "spot").every(s => s.time >= 12 * 60 + 30));
    }
    if (idx === 1) {
      const dismiss = plan.steps.find(s => s.type === "dismiss");
      assert.ok(dismiss.time <= 16 * 60 + 30, "return airport arrival should be by provisional check-in");
    }
  },
);

assert.equal(boot([], baseSchedule()).parseClockMinutes(""), null);
assert.equal(boot([], baseSchedule()).parseClockMinutes(undefined), null);
assert.equal(boot([], baseSchedule()).parseClockMinutes("07:05"), 425);

console.log("schedule auto-placement scenarios passed");
