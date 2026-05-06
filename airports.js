(function () {
  const airports = [
    { name: "成田国際空港 (NRT)", lat: 35.7719, lng: 140.3929 },
    { name: "羽田空港 (HND)", lat: 35.5494, lng: 139.7798 },
    { name: "関西国際空港 (KIX)", lat: 34.4270, lng: 135.2440 },
    { name: "大阪伊丹空港 (ITM)", lat: 34.7855, lng: 135.4381 },
    { name: "中部国際空港 (NGO)", lat: 34.8584, lng: 136.8054 },
    { name: "新千歳空港 (CTS)", lat: 42.7752, lng: 141.6922 },
    { name: "福岡空港 (FUK)", lat: 33.5863, lng: 130.4511 },
    { name: "那覇空港 (OKA)", lat: 26.1959, lng: 127.6459 },
    { name: "仙台空港 (SDJ)", lat: 38.1398, lng: 140.9169 },
    { name: "広島空港 (HIJ)", lat: 34.4361, lng: 132.9194 },
    { name: "長崎空港 (NGS)", lat: 32.9169, lng: 129.9135 },
    { name: "熊本空港 (KMJ)", lat: 32.8373, lng: 130.8554 },
    { name: "大分空港 (OIT)", lat: 33.4794, lng: 131.7369 },
    { name: "宮崎空港 (KMI)", lat: 31.8772, lng: 131.4486 },
    { name: "鹿児島空港 (KOJ)", lat: 31.8034, lng: 130.7194 },
    { name: "松山空港 (MYJ)", lat: 33.8272, lng: 132.6996 },
    { name: "高知空港 (KCZ)", lat: 33.5463, lng: 133.6692 },
    { name: "岡山空港 (OKJ)", lat: 34.7569, lng: 133.8555 },
    { name: "富山空港 (TOY)", lat: 36.6483, lng: 137.1883 },
    { name: "小松空港 (KMQ)", lat: 36.3946, lng: 136.4072 },
    { name: "新潟空港 (KIJ)", lat: 37.9559, lng: 139.1223 },
    { name: "秋田空港 (AXT)", lat: 39.6156, lng: 140.2186 },
    { name: "青森空港 (AOJ)", lat: 40.7347, lng: 140.6908 },
    { name: "函館空港 (HKD)", lat: 41.7700, lng: 140.8220 },
    { name: "旭川空港 (AKJ)", lat: 43.6708, lng: 142.4474 },
    { name: "釧路空港 (KUH)", lat: 43.0413, lng: 144.1929 },
    { name: "石垣空港 (ISG)", lat: 24.3965, lng: 124.1867 },
    { name: "宮古空港 (MMY)", lat: 24.7828, lng: 125.2946 },
    { name: "奄美空港 (ASJ)", lat: 28.4313, lng: 129.7125 },
    { name: "山形空港 (GAJ)", lat: 38.4119, lng: 140.3719 },
    { name: "花巻空港 (HNA)", lat: 39.4286, lng: 141.1350 },
    { name: "山口宇部空港 (UBJ)", lat: 33.9300, lng: 131.2789 },
    { name: "仁川国際空港 (ICN)", lat: 37.4602, lng: 126.4407 },
    { name: "金浦空港 (GMP)", lat: 37.5589, lng: 126.7950 },
    { name: "金海国際空港・釜山 (PUS)", lat: 35.1795, lng: 128.9386 },
    { name: "桃園国際空港・台北 (TPE)", lat: 25.0777, lng: 121.2327 },
    { name: "香港国際空港 (HKG)", lat: 22.3080, lng: 113.9185 },
    { name: "上海浦東国際空港 (PVG)", lat: 31.1434, lng: 121.8052 },
    { name: "北京首都国際空港 (PEK)", lat: 40.0799, lng: 116.6031 },
    { name: "シンガポール・チャンギ空港 (SIN)", lat: 1.3644, lng: 103.9915 },
    { name: "バンコク・スワンナプーム空港 (BKK)", lat: 13.6900, lng: 100.7501 },
    { name: "クアラルンプール国際空港 (KUL)", lat: 2.7456, lng: 101.7099 },
    { name: "マニラ・ニノイアキノ国際空港 (MNL)", lat: 14.5086, lng: 121.0197 },
    { name: "バリ・ングラライ空港 (DPS)", lat: -8.7482, lng: 115.1674 },
    { name: "ジャカルタ・スカルノハッタ空港 (CGK)", lat: -6.1256, lng: 106.6559 },
    { name: "ホーチミン・タンソンニャット空港 (SGN)", lat: 10.8188, lng: 106.6520 },
    { name: "ハノイ・ノイバイ空港 (HAN)", lat: 21.2212, lng: 105.8072 },
    { name: "ドバイ国際空港 (DXB)", lat: 25.2532, lng: 55.3657 },
    { name: "パリ・シャルル・ド・ゴール空港 (CDG)", lat: 49.0097, lng: 2.5479 },
    { name: "ロンドン・ヒースロー空港 (LHR)", lat: 51.4700, lng: -0.4543 },
    { name: "フランクフルト空港 (FRA)", lat: 50.0379, lng: 8.5622 },
    { name: "アムステルダム・スキポール空港 (AMS)", lat: 52.3086, lng: 4.7639 },
    { name: "ローマ・フィウミチーノ空港 (FCO)", lat: 41.8003, lng: 12.2389 },
    { name: "マドリード・バラハス空港 (MAD)", lat: 40.4936, lng: -3.5669 },
    { name: "ウィーン国際空港 (VIE)", lat: 48.1103, lng: 16.5697 },
    { name: "ニューヨーク・JFK空港 (JFK)", lat: 40.6413, lng: -73.7781 },
    { name: "ロサンゼルス国際空港 (LAX)", lat: 33.9425, lng: -118.4081 },
    { name: "シドニー空港 (SYD)", lat: -33.9399, lng: 151.1753 },
    { name: "ムンバイ空港 (BOM)", lat: 19.0896, lng: 72.8656 },
    { name: "デリー空港 (DEL)", lat: 28.5665, lng: 77.1031 },
  ];

  window.TRIP_AIRPORTS = airports;
  window.normalizeTripAirportName = function (value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  };
  window.findTripAirport = function (name) {
    const key = window.normalizeTripAirportName(name);
    if (!key) return null;
    return airports.find(ap => window.normalizeTripAirportName(ap.name) === key)
      || airports.find(ap => {
        const code = (ap.name.match(/\(([A-Z0-9]{3})\)/) || [])[1];
        return code && key.includes(code.toLowerCase());
      })
      || airports.find(ap => {
        const plain = window.normalizeTripAirportName(ap.name.replace(/（.*?）|\(.*?\)/g, ""));
        return plain && (key.includes(plain) || plain.includes(key));
      })
      || null;
  };
})();
