import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const settingsJs = fs.readFileSync(new URL("../settings.js", import.meta.url), "utf8");

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
    this.style = { setProperty() {} };
    this.classList = new FakeClassList();
  }
  addEventListener() {}
  appendChild(node) { return node; }
  prepend() {}
  querySelector() { return new FakeElement(); }
  querySelectorAll() { return []; }
  setAttribute() {}
  remove() {}
  select() {}
}

function makeDocument() {
  const elements = new Map();
  return {
    body: new FakeElement("body"),
    documentElement: new FakeElement("html"),
    createElement: tag => new FakeElement(tag),
    querySelector: () => new FakeElement(),
    querySelectorAll: () => [],
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id));
      return elements.get(id);
    },
    addEventListener() {},
    execCommand() {},
  };
}

function makeStorage(seed) {
  const data = new Map(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)]));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
  };
}

const spots = [
  { id: "hnd-meet", name: "羽田空港 (HND)", spotCategory: "airport", airportId: "airport-hnd", iata: "HND", spotRoles: ["meet"], lat: 35.5494, lng: 139.7798, airportCheckinOffsetMin: 90 },
  { id: "hnd-dismiss", name: "羽田空港 (HND)", spotCategory: "airport", airportId: "airport-hnd", iata: "HND", spotRoles: ["dismiss"], lat: 35.5494, lng: 139.7798, airportCheckinOffsetMin: 90 },
  { id: "tpe", name: "桃園国際空港・台北 (TPE)", spotCategory: "airport", airportId: "airport-tpe", iata: "TPE", lat: 25.0777, lng: 121.2327 },
  { id: "a", name: "台北101", spotCategory: "tourist", lat: 25.0339, lng: 121.5645, defaultStayMinutes: 60 },
  { id: "b", name: "龍山寺", spotCategory: "tourist", lat: 25.0372, lng: 121.4999, defaultStayMinutes: 60 },
  { id: "c", name: "九份", spotCategory: "tourist", lat: 25.1097, lng: 121.8442, defaultStayMinutes: 120 },
];

const activeList = { id: "list-1", name: "Taipei provisional trip", spots };
const schedule = {
  listId: activeList.id,
  tripMeetDate: "2026-06-01",
  tripDismissDate: "2026-06-02",
  tripMeetTime: "09:00",
  tripDismissTime: "18:00",
  tripMeetPlace: "羽田空港 (HND)",
  tripDismissPlace: "羽田空港 (HND)",
  travelMode: "transit",
  days: [
    { id: "d1", label: "1日目", date: "2026-06-01", travelMinutes: 20, stayTimes: {}, entries: [{ spotId: "a" }, { spotId: "b" }], endTime: "21:00" },
    { id: "d2", label: "2日目", date: "2026-06-02", travelMinutes: 20, stayTimes: {}, entries: [{ spotId: "c" }], startTime: "09:00" },
  ],
  defaultStayTimes: {},
};

const context = {
  console,
  assert,
  Date,
  Math,
  JSON,
  Number,
  String,
  Array,
  Object,
  RegExp,
  setTimeout() {},
  history: { back() {} },
  navigator: { clipboard: { writeText: async () => {} } },
  document: makeDocument(),
  localStorage: makeStorage({
    "spot-map-lists.v1": { activeListId: activeList.id, lists: [activeList] },
    "spot-map-schedule.v1": { [activeList.id]: schedule },
  }),
};
context.window = { __SETTINGS_TEST_MODE__: true, addEventListener() {}, confirm: () => true };
context.globalThis = context;

vm.createContext(context);
vm.runInContext(settingsJs, context, { filename: "settings.js" });

const log = context.window.__settingsTestApi.buildDebugLog();

assert.match(log, /航空券: 未登録/);
assert.match(log, /実配置枠:/);
assert.match(log, /仮往路フライト到着後/);
assert.match(log, /仮復路フライト/);
assert.match(log, /仮の宿泊エリア/);
assert.match(log, /airportId:airport-hnd/);
assert.match(log, /未配置スポット: なし/);

console.log("settings debug log scenario passed");
