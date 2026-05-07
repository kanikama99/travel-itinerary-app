(function () {
  const rawAirports = [
    ["NRT", "成田国際空港 (NRT)", "日本", "東京/成田", 35.7719, 140.3929, ["成田空港", "東京成田", "Narita Airport", "Tokyo Narita Airport"]],
    ["HND", "羽田空港 (HND)", "日本", "東京", 35.5494, 139.7798, ["東京国際空港", "東京羽田", "Tokyo Haneda Airport", "Haneda Airport"]],
    ["KIX", "関西国際空港 (KIX)", "日本", "大阪", 34.4270, 135.2440, ["関空", "大阪関西", "Kansai International Airport"]],
    ["ITM", "大阪伊丹空港 (ITM)", "日本", "大阪/伊丹", 34.7855, 135.4381, ["伊丹空港", "大阪国際空港", "Osaka Itami Airport"]],
    ["NGO", "中部国際空港 (NGO)", "日本", "名古屋", 34.8584, 136.8054, ["セントレア", "中部空港", "Chubu Centrair International Airport"]],
    ["CTS", "新千歳空港 (CTS)", "日本", "札幌/千歳", 42.7752, 141.6922, ["千歳空港", "New Chitose Airport"]],
    ["FUK", "福岡空港 (FUK)", "日本", "福岡", 33.5863, 130.4511, ["Fukuoka Airport"]],
    ["OKA", "那覇空港 (OKA)", "日本", "那覇", 26.1959, 127.6459, ["Naha Airport"]],
    ["SDJ", "仙台空港 (SDJ)", "日本", "仙台", 38.1398, 140.9169, ["Sendai Airport"]],
    ["HIJ", "広島空港 (HIJ)", "日本", "広島", 34.4361, 132.9194, ["Hiroshima Airport"]],
    ["NGS", "長崎空港 (NGS)", "日本", "長崎", 32.9169, 129.9135, ["Nagasaki Airport"]],
    ["KMJ", "熊本空港 (KMJ)", "日本", "熊本", 32.8373, 130.8554, ["阿蘇くまもと空港", "Kumamoto Airport"]],
    ["OIT", "大分空港 (OIT)", "日本", "大分", 33.4794, 131.7369, ["Oita Airport"]],
    ["KMI", "宮崎空港 (KMI)", "日本", "宮崎", 31.8772, 131.4486, ["Miyazaki Airport"]],
    ["KOJ", "鹿児島空港 (KOJ)", "日本", "鹿児島", 31.8034, 130.7194, ["Kagoshima Airport"]],
    ["MYJ", "松山空港 (MYJ)", "日本", "松山", 33.8272, 132.6996, ["Matsuyama Airport"]],
    ["KCZ", "高知空港 (KCZ)", "日本", "高知", 33.5463, 133.6692, ["高知龍馬空港", "Kochi Airport"]],
    ["OKJ", "岡山空港 (OKJ)", "日本", "岡山", 34.7569, 133.8555, ["岡山桃太郎空港", "Okayama Airport"]],
    ["TOY", "富山空港 (TOY)", "日本", "富山", 36.6483, 137.1883, ["Toyama Airport"]],
    ["KMQ", "小松空港 (KMQ)", "日本", "小松/金沢", 36.3946, 136.4072, ["Komatsu Airport"]],
    ["KIJ", "新潟空港 (KIJ)", "日本", "新潟", 37.9559, 139.1223, ["Niigata Airport"]],
    ["AXT", "秋田空港 (AXT)", "日本", "秋田", 39.6156, 140.2186, ["Akita Airport"]],
    ["AOJ", "青森空港 (AOJ)", "日本", "青森", 40.7347, 140.6908, ["Aomori Airport"]],
    ["HKD", "函館空港 (HKD)", "日本", "函館", 41.7700, 140.8220, ["Hakodate Airport"]],
    ["AKJ", "旭川空港 (AKJ)", "日本", "旭川", 43.6708, 142.4474, ["Asahikawa Airport"]],
    ["KUH", "釧路空港 (KUH)", "日本", "釧路", 43.0413, 144.1929, ["Kushiro Airport"]],
    ["ISG", "石垣空港 (ISG)", "日本", "石垣", 24.3965, 124.1867, ["新石垣空港", "南ぬ島石垣空港", "Ishigaki Airport"]],
    ["MMY", "宮古空港 (MMY)", "日本", "宮古島", 24.7828, 125.2946, ["Miyako Airport"]],
    ["ASJ", "奄美空港 (ASJ)", "日本", "奄美大島", 28.4313, 129.7125, ["Amami Airport"]],
    ["GAJ", "山形空港 (GAJ)", "日本", "山形", 38.4119, 140.3719, ["Yamagata Airport"]],
    ["HNA", "花巻空港 (HNA)", "日本", "花巻/盛岡", 39.4286, 141.1350, ["いわて花巻空港", "Hanamaki Airport"]],
    ["UBJ", "山口宇部空港 (UBJ)", "日本", "山口/宇部", 33.9300, 131.2789, ["Yamaguchi Ube Airport"]],
    ["ICN", "仁川国際空港 (ICN)", "韓国", "ソウル/仁川", 37.4602, 126.4407, ["仁川空港", "Incheon Airport", "Seoul Incheon Airport"]],
    ["GMP", "金浦空港 (GMP)", "韓国", "ソウル", 37.5589, 126.7950, ["ソウル金浦", "Gimpo Airport", "Seoul Gimpo Airport"]],
    ["PUS", "金海国際空港・釜山 (PUS)", "韓国", "釜山", 35.1795, 128.9386, ["金海空港", "Busan Airport", "Gimhae Airport"]],
    ["TPE", "桃園国際空港・台北 (TPE)", "台湾", "台北/桃園", 25.0777, 121.2327, ["桃園空港", "台湾桃園国際空港", "台北桃園", "Taiwan Taoyuan International Airport", "Taipei Taoyuan Airport"]],
    ["HKG", "香港国際空港 (HKG)", "香港", "香港", 22.3080, 113.9185, ["香港空港", "Hong Kong International Airport"]],
    ["PVG", "上海浦東国際空港 (PVG)", "中国", "上海", 31.1434, 121.8052, ["浦東空港", "Shanghai Pudong Airport"]],
    ["PEK", "北京首都国際空港 (PEK)", "中国", "北京", 40.0799, 116.6031, ["北京首都空港", "Beijing Capital Airport"]],
    ["SIN", "シンガポール・チャンギ空港 (SIN)", "シンガポール", "シンガポール", 1.3644, 103.9915, ["チャンギ空港", "Singapore Changi Airport"]],
    ["BKK", "バンコク・スワンナプーム空港 (BKK)", "タイ", "バンコク", 13.6900, 100.7501, ["スワンナプーム空港", "Suvarnabhumi Airport", "Bangkok Airport"]],
    ["KUL", "クアラルンプール国際空港 (KUL)", "マレーシア", "クアラルンプール", 2.7456, 101.7099, ["KLIA", "Kuala Lumpur International Airport"]],
    ["MNL", "マニラ・ニノイアキノ国際空港 (MNL)", "フィリピン", "マニラ", 14.5086, 121.0197, ["ニノイアキノ空港", "Manila Airport", "Ninoy Aquino International Airport"]],
    ["DPS", "バリ・ングラライ空港 (DPS)", "インドネシア", "バリ", -8.7482, 115.1674, ["デンパサール空港", "Ngurah Rai Airport", "Bali Airport"]],
    ["CGK", "ジャカルタ・スカルノハッタ空港 (CGK)", "インドネシア", "ジャカルタ", -6.1256, 106.6559, ["Soekarno Hatta Airport", "Jakarta Airport"]],
    ["SGN", "ホーチミン・タンソンニャット空港 (SGN)", "ベトナム", "ホーチミン", 10.8188, 106.6520, ["タンソンニャット空港", "Tan Son Nhat Airport"]],
    ["HAN", "ハノイ・ノイバイ空港 (HAN)", "ベトナム", "ハノイ", 21.2212, 105.8072, ["ノイバイ空港", "Noi Bai Airport"]],
    ["DXB", "ドバイ国際空港 (DXB)", "UAE", "ドバイ", 25.2532, 55.3657, ["Dubai International Airport"]],
    ["CDG", "パリ・シャルル・ド・ゴール空港 (CDG)", "フランス", "パリ", 49.0097, 2.5479, ["シャルルドゴール空港", "Charles de Gaulle Airport", "Paris CDG"]],
    ["LHR", "ロンドン・ヒースロー空港 (LHR)", "イギリス", "ロンドン", 51.4700, -0.4543, ["ヒースロー空港", "Heathrow Airport", "London Heathrow"]],
    ["FRA", "フランクフルト空港 (FRA)", "ドイツ", "フランクフルト", 50.0379, 8.5622, ["Frankfurt Airport"]],
    ["AMS", "アムステルダム・スキポール空港 (AMS)", "オランダ", "アムステルダム", 52.3086, 4.7639, ["スキポール空港", "Schiphol Airport", "Amsterdam Airport"]],
    ["FCO", "ローマ・フィウミチーノ空港 (FCO)", "イタリア", "ローマ", 41.8003, 12.2389, ["フィウミチーノ空港", "Leonardo da Vinci Airport", "Rome Fiumicino"]],
    ["MAD", "マドリード・バラハス空港 (MAD)", "スペイン", "マドリード", 40.4936, -3.5669, ["バラハス空港", "Madrid Barajas Airport"]],
    ["VIE", "ウィーン国際空港 (VIE)", "オーストリア", "ウィーン", 48.1103, 16.5697, ["Vienna International Airport"]],
    ["JFK", "ニューヨーク・JFK空港 (JFK)", "アメリカ", "ニューヨーク", 40.6413, -73.7781, ["ジョンFケネディ空港", "John F. Kennedy International Airport", "New York JFK"]],
    ["LAX", "ロサンゼルス国際空港 (LAX)", "アメリカ", "ロサンゼルス", 33.9425, -118.4081, ["Los Angeles International Airport"]],
    ["SYD", "シドニー空港 (SYD)", "オーストラリア", "シドニー", -33.9399, 151.1753, ["Sydney Airport", "Kingsford Smith Airport"]],
    ["BOM", "ムンバイ空港 (BOM)", "インド", "ムンバイ", 19.0896, 72.8656, ["チャトラパティ・シヴァージー国際空港", "Mumbai Airport"]],
    ["DEL", "デリー空港 (DEL)", "インド", "デリー", 28.5665, 77.1031, ["インディラ・ガンディー国際空港", "Delhi Airport"]],
  ];

  const normalize = value => String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[（）]/g, m => (m === "（" ? "(" : ")"))
    .replace(/[\s・･,，.．\-ー_]/g, "");

  const airports = rawAirports.map(([iata, name, country, city, lat, lng, aliases]) => ({
    id: `airport-${iata.toLowerCase()}`,
    iata,
    code: iata,
    name,
    displayName: name,
    country,
    city,
    lat,
    lng,
    aliases,
    searchText: [iata, name, country, city, ...(aliases || [])].join(" "),
  }));

  function airportCodeFromName(value) {
    const m = String(value || "").match(/\(([A-Z0-9]{3})\)/);
    return m ? m[1] : "";
  }

  function findAirport(value) {
    const key = normalize(value);
    if (!key) return null;
    const directCode = String(value || "").trim().toUpperCase();
    const parenCode = airportCodeFromName(value);
    return airports.find(ap => ap.iata === directCode || ap.iata === parenCode || normalize(ap.id) === key)
      || airports.find(ap => normalize(ap.name) === key || normalize(ap.displayName) === key)
      || airports.find(ap => (ap.aliases || []).some(alias => normalize(alias) === key))
      || airports.find(ap => {
        const tokens = [ap.iata, ap.name, ap.country, ap.city, ...(ap.aliases || [])].map(normalize);
        return tokens.some(token => token && (key.includes(token) || token.includes(key)));
      })
      || null;
  }

  function searchAirports(query, limit = 12) {
    const key = normalize(query);
    if (!key) return airports.slice(0, limit);
    return airports
      .map(ap => {
        const fields = [ap.iata, ap.name, ap.country, ap.city, ...(ap.aliases || [])];
        const exact = fields.some(field => normalize(field) === key);
        const partial = fields.some(field => normalize(field).includes(key) || key.includes(normalize(field)));
        return { ap, score: exact ? 0 : partial ? 1 : 9 };
      })
      .filter(row => row.score < 9)
      .sort((a, b) => a.score - b.score || a.ap.name.localeCompare(b.ap.name, "ja"))
      .slice(0, limit)
      .map(row => row.ap);
  }

  function sameAirport(a, b) {
    const apA = findAirport(a?.airportId || a?.iata || a?.name || a);
    const apB = findAirport(b?.airportId || b?.iata || b?.name || b);
    return !!apA && !!apB && apA.id === apB.id;
  }

  window.TRIP_AIRPORTS = airports;
  window.normalizeTripAirportName = normalize;
  window.findTripAirport = findAirport;
  window.searchTripAirports = searchAirports;
  window.sameTripAirport = sameAirport;
})();
