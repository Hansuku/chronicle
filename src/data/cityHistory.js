/**
 * Qualitative history model for the Earth Chronicle comparison view.
 *
 * The text deliberately describes institutions, techniques and networks rather
 * than assigning a single "civilization score". Dates for the formation of a
 * city are approximate: they identify a recognisable urban identity, not the
 * beginning of human settlement in the surrounding landscape.
 */

export const HISTORY_ANCHORS = Object.freeze([
  {
    year: -3400,
    title: "城市与文字",
    range: "公元前3400—前3000",
    description: "灌溉、城市组织与早期文字，让知识第一次能够跨越世代积累。",
  },
  {
    year: -1000,
    title: "铁器时代扩展",
    range: "公元前1200—前800",
    description: "铁器、迁徙与新的政治组织，以不同节奏改变各地的生产和权力边界。",
  },
  {
    year: 0,
    title: "欧亚帝国网络",
    range: "公元前27—公元220",
    description: "道路、驿站与长距离商贸，把多个帝国及其边缘地区连接进更广阔的交流网络。",
  },
  {
    year: 1000,
    title: "商业与知识复兴",
    range: "960—1100",
    description: "跨区域贸易、城市教育与技术传播，推动多个彼此不同的知识中心兴起。",
  },
  {
    year: 1500,
    title: "海洋网络形成",
    range: "1450—1600",
    description: "远洋航线加速连接世界，知识、作物、疾病与权力也随之重新分布。",
  },
  {
    year: 1785,
    title: "工业革命",
    range: "1760—1840",
    description: "机械化首先集中在少数地区，同时世界多数社会仍由农业、手工业与区域贸易支撑。",
  },
  {
    year: 1900,
    title: "工业化全球扩张",
    range: "1870—1914",
    description: "电气、铁路和大规模生产重塑世界，但殖民体系与区域差异也深刻影响其扩散。",
  },
  {
    year: 2026,
    title: "数字文明互联",
    range: "2000—2026",
    description: "计算、能源与全球网络正在同步改变知识生产、经济协作和日常生活。",
  },
]);

const DIMENSION_KEYS = ["technology", "economy", "society", "belief"];

const ERA_DIMENSIONS = Object.freeze({
  "-3400": {
    technology: "石器工具、灌溉与早期冶金并存，传播范围很不均衡",
    economy: "亲族生产、农业聚落与局部交换网络并存",
    society: "从季节性聚落到城市共同体，各地组织形式差异显著",
    belief: "祖先、自然与多神祭祀传统，通过口述和仪式延续",
  },
  "-1000": {
    technology: "青铜工艺成熟，铁器正以不同速度进入生产与军事",
    economy: "农牧业、贡赋与区域商路共同支撑社会",
    society: "城邦、王国、部落联盟与村社组织并存",
    belief: "地方神祇、祖先崇拜与成文宗教传统并存",
  },
  0: {
    technology: "道路、冶金、水利、历法与建筑知识跨区域交流",
    economy: "农业税赋、城市市场与长距离商贸相互连接",
    society: "帝国治理、城邦传统与地方共同体层层叠合",
    belief: "多神、祖先与伦理传统并存，新兴宗教网络逐步扩展",
  },
  1000: {
    technology: "农业、水利、航海、建筑与书写技术在多个中心创新",
    economy: "城市市场、行会、贡赋和海陆贸易网络共同增长",
    society: "王朝、宗教机构、领地与自治城市形成多样秩序",
    belief: "佛教、基督教、伊斯兰教及众多地方传统交汇",
  },
  1500: {
    technology: "印刷、火器、航海与实用知识传播加速，但覆盖并不均一",
    economy: "农业、手工业与跨洋贸易开始进入更紧密的全球交换",
    society: "帝国、王国、城市共和国与地方共同体并存",
    belief: "世界性宗教、地方信仰与改革运动共同塑造公共生活",
  },
  1785: {
    technology: "机械化在英国率先聚集，各地仍广泛依赖成熟手工技术",
    economy: "农业、手工业、商业资本与早期工厂体系并存",
    society: "王朝、殖民秩序、城市市民与乡村社会彼此交织",
    belief: "宗教传统仍深刻影响生活，启蒙与世俗思想在部分地区扩展",
  },
  1900: {
    technology: "铁路、电报、电力与现代科学扩散，普及程度受制度和资本制约",
    economy: "工业生产、殖民贸易与传统生计并存且相互牵动",
    society: "大众城市、帝国治理、民族国家与改革运动同时发展",
    belief: "宗教复兴、世俗化与新政治思想在全球多向交汇",
  },
  2026: {
    technology: "数字网络、人工智能、先进制造与绿色能源协同演进",
    economy: "全球供应链、服务业、平台经济与地方生产网络并存",
    society: "高度城市化与跨国连接并存，也面临人口和机会差异",
    belief: "世俗生活、多元宗教与地方传统在公共空间持续协商",
  },
});

const REGION_CONTEXT = Object.freeze({
  global: {
    label: "区域待确认",
    notes: Object.fromEntries(
      HISTORY_ANCHORS.map(({ year, description }) => [
        String(year),
        `${description} 当前地点缺少可用于区域判断的坐标，因此不追加具体地域结论。`,
      ]),
    ),
  },
  eastAsia: {
    label: "东亚区域网络",
    notes: {
      "-3400": "河谷农业与多处新石器聚落网络发展，尚不能套用后世国家边界。",
      "-1000": "青铜礼制、稻旱作农业与区域政体并存，文字使用集中于部分中心。",
      0: "帝国行政、农耕市场与海陆交通扩展，边缘区域仍保有多样政治传统。",
      1000: "印刷、城市商业与海贸活跃，宋、辽、高丽及日本诸政权各有路径。",
      1500: "手工业、出版与区域海贸兴盛，国家对海洋交流的态度随时地变化。",
      1785: "人口、农业与手工业体系成熟，机械化工业尚未成为区域生产主轴。",
      1900: "铁路、工厂与新式教育进入快速转型期，同时受到帝国竞争影响。",
      2026: "制造、服务与数字基础设施密集连接，区域内部发展模式仍高度多样。",
    },
  },
  southAsia: {
    label: "南亚区域网络",
    notes: {
      "-3400": "印度河及周边农业聚落发展，成熟城市化将在随后数百年出现。",
      "-1000": "恒河流域聚落扩大，铁器、农业与吠陀传统的变化并非同步发生。",
      0: "城市、港口与跨印度洋贸易活跃，多种王国和思想传统并存。",
      1000: "寺院、宫廷、市场与海贸共同构成知识和商品流动网络。",
      1500: "苏丹国、地方王国和海港商业并存，印度洋贸易连接东非与东南亚。",
      1785: "手工业和农业生产庞大，殖民公司的政治与贸易控制正在扩张。",
      1900: "铁路、工厂和现代教育扩展，同时处于殖民统治与民族运动之中。",
      2026: "数字服务、制造和城市网络快速增长，与庞大非正规经济并存。",
    },
  },
  southeastAsia: {
    label: "东南亚海陆网络",
    notes: {
      "-3400": "河谷、海岸和岛屿社群发展稻作、渔业与航海，考古材料在各地分布不均。",
      "-1000": "稻作、青铜工艺与跨海交换扩展，不同语言和生态区域保持多样路径。",
      0: "港口与河谷政体逐步连接印度洋和南海贸易网络。",
      1000: "海峡商路、稻作国家和寺院网络繁盛，区域政治呈多中心格局。",
      1500: "港市、内陆王国与伊斯兰商业网络交汇，欧洲势力刚开始介入。",
      1785: "港口贸易、稻作经济和地方手工业延续，殖民控制范围因地而异。",
      1900: "殖民出口经济和港口铁路扩张，本地王国、乡村和反殖民组织持续回应。",
      2026: "制造、物流、旅游和数字服务快速连接，群岛与大陆地区差异显著。",
    },
  },
  centralAsia: {
    label: "中亚草原与绿洲网络",
    notes: {
      "-3400": "草原牧业、绿洲农业与山地社群逐步形成跨生态交换。",
      "-1000": "骑乘、冶金和移动牧业推动更广范围联系，政治组织保持多样。",
      0: "草原联盟与绿洲商路连接东西欧亚，人员和技术持续流动。",
      1000: "突厥语和波斯语文化圈、伊斯兰城市与游牧政权交汇。",
      1500: "帖木儿遗产、汗国与商队城市构成多中心区域秩序。",
      1785: "汗国、牧业网络和绿洲手工业延续，同时面对俄清两侧扩张。",
      1900: "帝国铁路、定居政策与商品农业改变区域，地方社会仍具多样性。",
      2026: "能源、交通走廊、农业与城市服务并存，跨境联系重要。",
    },
  },
  middleEast: {
    label: "西亚与东地中海网络",
    notes: {
      "-3400": "两河流域城市化和文字发展突出，周边高地与海岸社会路径各异。",
      "-1000": "铁器王国、商贸城市与帝国竞争重组区域交通。",
      0: "罗马、帕提亚及地方政体连接地中海、红海和丝路支线。",
      1000: "城市学术、工艺与商贸网络横跨伊斯兰世界，区域政治多中心并存。",
      1500: "奥斯曼、萨法维等政权与商路城市重塑区域秩序。",
      1785: "手工业、农业和商队贸易延续，帝国改革与外部竞争逐渐加深。",
      1900: "铁路、港口和现代行政发展，奥斯曼改革与列强介入交错。",
      2026: "能源、物流和数字城市并存，战争、迁移与转型造成显著区域差异。",
    },
  },
  northAfrica: {
    label: "北非与尼罗河网络",
    notes: {
      "-3400": "尼罗河沿岸政治整合加速，撒哈拉环境变化影响人口与交通。",
      "-1000": "河谷王国、地中海港口与撒哈拉边缘社群形成多向联系。",
      0: "罗马统治、尼罗河农业和红海贸易构成层叠网络。",
      1000: "伊斯兰城市、农业灌溉和跨撒哈拉贸易持续发展。",
      1500: "马穆鲁克与奥斯曼秩序、地中海贸易和地方共同体并存。",
      1785: "奥斯曼行省、地方权力和商贸城市相互交织。",
      1900: "殖民统治、运河和铁路改变经济地理，本地社会持续回应。",
      2026: "人口密集城市、旅游、制造与能源经济共同塑造区域。",
    },
  },
  subSaharanAfrica: {
    label: "撒哈拉以南非洲网络",
    notes: {
      "-3400": "不同生态区的农牧、采集与渔业社群各自发展，材料证据分布不均。",
      "-1000": "农牧扩散、冶铁早期发展和区域迁徙呈现多条路径。",
      0: "红海、印度洋与内陆交换网络扩大，多种政治组织并存。",
      1000: "萨赫勒王国、斯瓦希里海岸与内陆贸易网络蓬勃发展。",
      1500: "跨撒哈拉、印度洋和大西洋网络交汇，各王国和城邦各有轨迹。",
      1785: "本地王国与贸易网络延续，大西洋奴隶贸易造成深刻破坏。",
      1900: "殖民征服重画政治边界，铁路和采掘经济服务于帝国体系。",
      2026: "快速城市化、移动互联网与多元产业并存，地区差异巨大。",
    },
  },
  europe: {
    label: "欧洲区域网络",
    notes: {
      "-3400": "农业聚落、巨石传统与冶金交流并存，城市化尚局限于少数边缘地区。",
      "-1000": "铁器传播、海上交流与多种部落和城邦组织逐步重组。",
      0: "罗马帝国覆盖广阔区域，但帝国边界外仍有多样社会。",
      1000: "领地、教会、商镇与拜占庭等政体共同构成多中心格局。",
      1500: "印刷、文艺复兴与海洋扩张兴起，欧洲内部差距依然明显。",
      1785: "机械化集中于英国及少数地区，欧洲大部分人口仍从事农业。",
      1900: "工业、电气与大众政治扩展，也伴随帝国主义和阶级冲突。",
      2026: "服务经济、绿色技术和区域协作并存，政治文化保持多样。",
    },
  },
  northAmerica: {
    label: "北美洲区域网络",
    notes: {
      "-3400": "不同环境中的原住民社群发展农耕、渔猎与长途交换。",
      "-1000": "聚落、土丘传统与区域贸易网络以不同节奏扩展。",
      0: "中部大型聚落传统与遍布大陆的多样原住民社会并存。",
      1000: "密西西比文化城市网络、普韦布洛聚落及北方社群各自发展。",
      1500: "原住民政治和贸易网络广布，欧洲殖民刚开始造成剧烈变化。",
      1785: "新生共和国、殖民地与原住民领地并存，领土冲突持续。",
      1900: "工业城市和铁路网络扩张，同时伴随移民、排斥与原住民失地。",
      2026: "数字产业、金融和先进制造高度集中，也存在显著空间不平等。",
    },
  },
  southAmerica: {
    label: "南美洲区域网络",
    notes: {
      "-3400": "安第斯、亚马孙和海岸社群发展出多样农业与交换传统。",
      "-1000": "灌溉农业、仪式中心与高地交通网络持续发展。",
      0: "安第斯区域国家与低地多样社群并存，生态带交换活跃。",
      1000: "高地政权、海岸城市与亚马孙复杂聚落形成多中心格局。",
      1500: "印加道路体系扩张，欧洲征服将很快造成政治和人口剧变。",
      1785: "殖民城市、矿业与农业出口体系并存，原住民和非裔社群持续塑造社会。",
      1900: "出口型经济、铁路和移民城市增长，土地与劳工矛盾突出。",
      2026: "大型城市、资源产业、农业和数字服务并存，生态议题关键。",
    },
  },
  oceania: {
    label: "大洋洲与太平洋网络",
    notes: {
      "-3400": "澳大利亚原住民社会延续深厚土地知识，南岛语族航海扩张尚在后期展开。",
      "-1000": "远洋航海把更多太平洋岛屿连接起来，澳洲社群保持多样生活方式。",
      0: "岛屿航海、交换与地方政治传统持续发展。",
      1000: "波利尼西亚远航扩展，跨岛亲缘和交换网络连接广阔海域。",
      1500: "太平洋社群拥有成熟航海知识，欧洲船只尚未广泛介入。",
      1785: "原住民和岛屿社会仍是主体，欧洲殖民据点正开始建立。",
      1900: "殖民城市和牧业经济扩张，原住民遭遇剥夺但文化持续。",
      2026: "高城市化经济与太平洋岛国网络并存，气候变化影响突出。",
    },
  },
});

const CITY_DEFINITIONS = Object.freeze({
  beijing: ["北京", "Beijing", "eastAsia", -1045, "蓟城等早期聚落是后世北京城市谱系的一部分，具体连续性需谨慎理解。", ["Peking", "北京城"]],
  xian: ["西安／长安", "Xi'an / Chang'an", "eastAsia", -1100, "关中盆地早有聚落；‘长安’和现代‘西安’并非所有时代都指同一城市范围。", ["西安", "长安", "Xi'an", "Xian", "Chang'an", "Changan"]],
  guangzhou: ["广州", "Guangzhou", "eastAsia", -214, "珠江三角洲长期有人群活动，广州作为行政城市通常追溯至秦汉时期。", ["Canton", "广州城"]],
  shanghai: ["上海", "Shanghai", "eastAsia", 700, "长江口聚落早于上海建制；后世港市身份不能直接投射到古代。", ["申城"]],
  kyoto: ["京都", "Kyoto", "eastAsia", 794, "平安京于794年建立，周边地区此前已有更早聚落。", ["平安京", "Heian-kyo", "Heian Kyo"]],
  tokyo: ["东京／江户", "Tokyo / Edo", "eastAsia", 1457, "江户地区早有人居；作为政治都会的城市形态主要形成于近世。", ["东京", "江户", "Tokyo", "Edo"]],
  seoul: ["首尔／汉城", "Seoul", "eastAsia", -18, "汉江流域早有聚落，历代都城名称和范围多次变化。", ["首尔", "汉城", "Seoul", "Hanseong"]],
  bangkok: ["曼谷", "Bangkok", "southeastAsia", 1782, "湄南河下游早有聚落和港口，今日曼谷作为都城在18世纪末形成。", ["Krung Thep", "กรุงเทพ", "曼谷市"]],
  hanoi: ["河内", "Hanoi", "southeastAsia", 1010, "红河三角洲有更早聚落；升龙、东京与河内等名称对应不同时代身份。", ["升龙", "Thang Long", "Thăng Long"]],
  jakarta: ["雅加达／巴达维亚", "Jakarta / Batavia", "southeastAsia", 397, "巽他格拉巴、雅加达和巴达维亚代表港口在不同时代的城市身份。", ["雅加达", "巴达维亚", "Jakarta", "Batavia", "Sunda Kelapa"]],
  singapore: ["新加坡", "Singapore", "southeastAsia", 1300, "淡马锡等港口活动早于1819年殖民港，连续性与规模随时代变化。", ["新加坡市", "Singapura", "Temasek", "淡马锡"]],
  samarkand: ["撒马尔罕", "Samarkand", "centralAsia", -700, "古城年代为近似范围，历代城址和政治身份曾多次变化。", ["Samarqand", "撒马尔干"]],
  delhi: ["德里", "Delhi", "southAsia", 1050, "德里地区有更早聚落和传统叙事，但可考的连续城市谱系与具体地点复杂。", ["New Delhi", "新德里", "Dilli"]],
  mumbai: ["孟买", "Mumbai", "southAsia", 1534, "七岛上的渔业社群远早于殖民港市，现代孟买的城市身份在近世逐步形成。", ["Bombay"]],
  kolkata: ["加尔各答", "Kolkata", "southAsia", 1690, "殖民城市建立在既有村落与区域经济之上，1690作为‘建城年’存在争议。", ["Calcutta"]],
  varanasi: ["瓦拉纳西", "Varanasi", "southAsia", -1000, "恒河沿岸城市历史悠久，但早期年代多为考古与文献的近似范围。", ["贝拿勒斯", "Benares", "Kashi", "迦尸"]],
  istanbul: ["伊斯坦布尔／君士坦丁堡", "Istanbul / Constantinople", "middleEast", -660, "拜占庭、君士坦丁堡与伊斯坦布尔代表同一地点在不同政治时代的城市身份。", ["伊斯坦布尔", "君士坦丁堡", "拜占庭", "Istanbul", "Constantinople", "Byzantium"]],
  baghdad: ["巴格达", "Baghdad", "middleEast", 762, "圆城建立前两河流域已有密集聚落，但不应统称为巴格达。", ["Bagdad", "巴格达城"]],
  jerusalem: ["耶路撒冷", "Jerusalem", "middleEast", -1800, "早期城史年代与统治序列存在学术争议，本概览只作宽范围表达。", ["Al-Quds", "القدس", "耶城"]],
  tehran: ["德黑兰", "Tehran", "middleEast", 1200, "雷伊等更早城市位于附近，德黑兰自身到中世纪后期才逐渐显著。", ["Teheran"]],
  cairo: ["开罗", "Cairo", "northAfrica", 969, "今日开罗形成于福斯塔特等更早聚落旁，不能把所有早期尼罗河事件都称作开罗史。", ["Al-Qahirah", "القاهرة"]],
  timbuktu: ["廷巴克图", "Timbuktu", "subSaharanAfrica", 1100, "建城年代约在11至12世纪，确切年份并不确定。", ["Tombouctou", "Timbuctoo"]],
  lagos: ["拉各斯", "Lagos", "subSaharanAfrica", 1400, "潟湖区域早有人居，城市与王国关系在口述史和文献中有不同表述。", ["Eko", "埃科"]],
  addis_ababa: ["亚的斯亚贝巴", "Addis Ababa", "subSaharanAfrica", 1886, "现代首都建于19世纪末，周边高地的人类活动远早于此。", ["Addis", "亚的斯"]],
  cape_town: ["开普敦", "Cape Town", "subSaharanAfrica", 1652, "殖民城镇建立前，科伊科伊人等社群已长期生活在开普地区。", ["Kaapstad", "开普城"]],
  nairobi: ["内罗毕", "Nairobi", "subSaharanAfrica", 1899, "现代城市随殖民铁路形成，周边土地早有马赛等社群活动。", ["内罗毕市"]],
  london: ["伦敦", "London", "europe", 43, "罗马城伦迪尼乌姆建立前，泰晤士河流域已有更早社群活动。", ["Londinium", "伦敦城"]],
  rome: ["罗马", "Rome", "europe", -753, "公元前753年是传统纪年；考古显示城市形成是更长的过程。", ["Roma", "罗马城"]],
  paris: ["巴黎", "Paris", "europe", -250, "巴黎西人的聚落与后来的罗马城市共同构成巴黎早期谱系。", ["Lutetia", "Parisii"]],
  lisbon: ["里斯本", "Lisbon", "europe", -1200, "早期港口与腓尼基联系的年代仍有争论，应视作大致范围。", ["Lisboa", "Olisipo"]],
  moscow: ["莫斯科", "Moscow", "europe", 1147, "1147年是首次文献记载，不代表周边定居从这一年才开始。", ["Moskva", "Москва"]],
  athens: ["雅典", "Athens", "europe", -1400, "阿提卡聚落更早，迈锡尼时代的城市形态与后来的古典城邦不同。", ["Athina", "雅典城"]],
  mexico_city: ["墨西哥城／特诺奇蒂特兰", "Mexico City / Tenochtitlan", "northAmerica", 1325, "特诺奇蒂特兰建立在既有湖区社群网络中；殖民城市在其遗址上重建。", ["墨西哥城", "特诺奇蒂特兰", "Mexico City", "Tenochtitlan", "Ciudad de México", "CDMX"]],
  new_york: ["纽约", "New York", "northAmerica", 1624, "殖民城市建立前，莱纳佩人长期生活并经营这一河口区域。", ["New Amsterdam", "新阿姆斯特丹", "NYC"]],
  boston: ["波士顿", "Boston", "northAmerica", 1630, "殖民城镇建立前，马萨诸塞等原住民社群长期生活在此。", ["Boston MA"]],
  los_angeles: ["洛杉矶", "Los Angeles", "northAmerica", 1781, "殖民城镇建立前，通瓦人等社群在盆地长期生活。", ["LA", "洛城"]],
  havana: ["哈瓦那", "Havana", "northAmerica", 1519, "西班牙殖民港建立前，古巴岛上已有原住民社群。", ["La Habana"]],
  cusco: ["库斯科", "Cusco", "southAmerica", 1200, "印加建城年代主要来自后世叙事，确切年份并不确定。", ["Cuzco", "Qosqo"]],
  buenos_aires: ["布宜诺斯艾利斯", "Buenos Aires", "southAmerica", 1580, "1536年的据点曾被放弃，1580年重建；河口地区此前已有原住民社群。", ["Buenos Ayres", "布宜诺斯"]],
  lima: ["利马", "Lima", "southAmerica", 1535, "殖民城市建立在已有安第斯聚落与灌溉景观之中。", ["Ciudad de los Reyes"]],
  rio: ["里约热内卢", "Rio de Janeiro", "southAmerica", 1565, "殖民城市建立前，图皮语族社群长期生活在海湾地区。", ["Rio", "里约"]],
  sao_paulo: ["圣保罗", "São Paulo", "southAmerica", 1554, "殖民聚落建立前，皮拉蒂宁加高原已有原住民社群。", ["Sao Paulo", "圣保罗市"]],
  sydney: ["悉尼", "Sydney", "oceania", 1788, "英国殖民城镇建立前，盖迪加尔等原住民社群已在悉尼湾生活数万年。", ["Sydney Cove", "悉尼湾"]],
  melbourne: ["墨尔本", "Melbourne", "oceania", 1835, "殖民城市建立前，库林民族联盟的社群长期生活在此。", ["墨尔本市"]],
  auckland: ["奥克兰", "Auckland", "oceania", 1840, "殖民城市建立前，毛利社群长期经营塔玛基地峡。", ["Tāmaki Makaurau", "Tamaki Makaurau"]],
});

function aliasKey(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[’']/g, "")
    .replace(/[／/·,，.。()（）_-]/g, " ")
    .replace(/\s+/g, " ");
}

/** Chinese and English search aliases resolve to a stable canonical city id. */
export const CITY_ALIASES = Object.freeze(
  Object.fromEntries(
    Object.entries(CITY_DEFINITIONS).flatMap(([id, definition]) => {
      const [zhName, enName, , , , aliases] = definition;
      return [id, zhName, enName, ...aliases].flatMap((name) => [
        [String(name), id],
        [aliasKey(name), id],
      ]);
    }),
  ),
);

export const CURATED_CITIES = Object.freeze(
  Object.fromEntries(
    Object.entries(CITY_DEFINITIONS).map(([id, definition]) => [
      id,
      Object.freeze({ id, zhName: definition[0], enName: definition[1] }),
    ]),
  ),
);

function dimensions(technology, economy, society, belief) {
  return { technology, economy, society, belief };
}

function curated(civilization, eventTitle, summary, values) {
  return { civilization, eventTitle, summary, dimensions: values };
}

const PROFILE_OVERRIDES = Object.freeze({
  london: {
    1785: curated(
      "英国工业化城市网络",
      "伦敦：帝国贸易与早期工业时代",
      "伦敦既是金融、港口和消费中心，也承接由英国工场与机器生产带来的城市增长；蒸汽工业并非均匀覆盖整座城市。",
      dimensions("工程、航海与蒸汽知识加速应用", "金融、港口贸易与手工／工厂生产并存", "快速扩张的城市社会，阶层与卫生差异明显", "国教传统、非国教派与启蒙思想并存"),
    ),
    1900: curated(
      "全球工业与帝国首都",
      "伦敦：铁路、电力与大众都市",
      "庞大的港口、铁路和行政体系连接全球，同时住房拥挤、劳工处境与帝国不平等构成另一面。",
      dimensions("电气、铁路、公共卫生与现代科学", "金融、制造、港运和帝国贸易", "大众政治扩展，阶级和性别权利仍受限制", "基督教传统、世俗化与宗教多元化并行"),
    ),
  },
  guangzhou: {
    1785: curated(
      "清代岭南商贸与手工业中心",
      "广州：一口通商时期的全球港市",
      "广州以十三行体系连接海外贸易，腹地农业和专业手工业成熟；生产仍主要依靠手工组织，不能简单视作‘落后’或工业城市。",
      dimensions("造船、陶瓷、纺织等实用工艺成熟", "农业腹地、手工业与受规制的海外贸易", "行商、工匠、移民与宗族网络交织", "儒释道、祖先祭祀与地方信仰并存"),
    ),
    1900: curated(
      "晚清口岸与改革网络",
      "广州：商贸传统与近代转型",
      "口岸经济、新式教育和革命社群与传统行业并存，城市变化受到列强体系和清末改革共同影响。",
      dimensions("轮船、电报及近代教育逐步扩散", "口岸贸易、手工业与侨汇网络", "行会、宗族与新式公共组织并存", "传统信仰、基督教与新思想交汇"),
    ),
  },
  rome: {
    0: curated(
      "罗马帝国首都",
      "罗马：地中海帝国的行政中心",
      "道路、输水道、法律和粮食供给维系庞大都市；其繁荣同时依赖行省税赋与奴隶劳动。",
      dimensions("道路、混凝土、输水与大型公共工程", "税赋、港运、市场与奴隶制生产", "公民身份分层，帝国人口高度多元", "罗马多神传统、新兴宗教与皇帝崇拜并存"),
    ),
    1500: curated(
      "教廷与文艺复兴城市",
      "罗马：宗教中心与艺术营造",
      "教廷赞助推动建筑、艺术和学术，城市同时仍在恢复中；其影响力主要来自宗教与政治网络。",
      dimensions("印刷、建筑与艺术工坊知识", "朝圣、地产、宫廷和工匠经济", "教廷、贵族、行会与平民社会", "拉丁基督教居主导，也存在犹太社群"),
    ),
  },
  xian: {
    0: curated(
      "汉帝国都城长安",
      "长安：帝国治理与丝路东端",
      "长安聚集行政、手工业和跨区域来往；‘丝绸之路’是多段网络，不是一条由都城直接控制的单线。",
      dimensions("冶铁、水利、车马与天文历法", "农业税赋、官营工坊与商路交换", "郡县帝国下的都城社会与多族群往来", "礼制、儒学、方术及多种祭祀传统"),
    ),
    1000: curated(
      "宋初关中区域城市",
      "长安旧都：政治重心转移后的区域枢纽",
      "唐都辉煌已过，城市仍依靠关中农业、交通和宗教遗产维持区域意义，不宜把盛唐景象直接延续到1000年。",
      dimensions("印刷和农业技术传播，旧有城市设施延续", "区域市场、农业与交通服务", "地方行政、军镇与寺院网络", "佛教、道教、儒学与地方信仰并存"),
    ),
  },
  cairo: {
    1000: curated(
      "法蒂玛王朝新都",
      "开罗：宫廷城市与尼罗河商路",
      "新建的开罗与邻近福斯塔特共同构成都会区，连接地中海、红海与尼罗河腹地。",
      dimensions("建筑、水利、医学和书写知识", "河运、手工业与跨区域贸易", "宫廷、军政群体、商人和多宗教社群", "伊斯兰传统为主，基督徒与犹太社群持续存在"),
    ),
    1500: curated(
      "马穆鲁克晚期商贸都会",
      "开罗：学术、手工业与商队枢纽",
      "开罗仍是重要学术和商贸中心，同时面对瘟疫、财政压力与葡萄牙新航线带来的变化。",
      dimensions("宗教教育、建筑与成熟城市工艺", "香料转运、手工业、河运和市场", "马穆鲁克统治与多层城市共同体", "逊尼派伊斯兰为主，科普特等社群延续"),
    ),
  },
  istanbul: {
    1000: curated(
      "拜占庭帝国首都",
      "君士坦丁堡：欧亚海峡上的帝国都会",
      "城墙、港口和宫廷体系支撑城市，连接黑海、地中海与巴尔干贸易。",
      dimensions("堡垒、航海、建筑与手稿知识", "港运、工坊、税赋与跨海贸易", "宫廷、教会、行会和多语社群", "东正教居核心，犹太及其他基督教社群并存"),
    ),
    1500: curated(
      "奥斯曼帝国首都",
      "君士坦丁堡：征服后的重建与汇聚",
      "1453年后奥斯曼推动迁入、营造和市场恢复，城市成为多宗教帝国的政治与贸易中心。",
      dimensions("火器、建筑、制图与成熟工艺", "宫廷供给、行会、港运和长途贸易", "米利特等制度下多社群共居但地位不完全平等", "伊斯兰居主导，东正教、亚美尼亚教会和犹太传统并存"),
    ),
  },
  baghdad: {
    1000: curated(
      "阿拔斯时代学术与商业中心",
      "巴格达：知识网络与两河贸易",
      "尽管哈里发政治权力已变化，巴格达仍汇集学者、工匠与商人，并连接广阔书籍和商品网络。",
      dimensions("医学、数学、天文、翻译与造纸知识", "河运、市场、手工业与远程贸易", "宫廷、学者、商人及多语言社群", "伊斯兰多派传统与基督徒、犹太社群并存"),
    ),
  },
  delhi: {
    1500: curated(
      "德里苏丹国晚期都城网络",
      "德里：多座都城叠合的政治中心",
      "德里并非一座静止城市，而是多个相邻都城遗址和市场的集合；不久后将进入莫卧儿时代。",
      dimensions("建筑、灌溉、金属与波斯语文书传统", "农业税赋、手工业和内陆商路", "宫廷、军政集团、商人和村社网络", "伊斯兰、印度教、耆那教及苏非传统交汇"),
    ),
    1900: curated(
      "英属印度区域城市",
      "德里：旧城、铁路与殖民治理",
      "铁路和殖民行政改变城市联系；新德里尚未建成，旧城商业与宗教生活仍是核心。",
      dimensions("铁路、电报、印刷和现代教育", "手工业、区域市场与殖民贸易", "旧城社群、殖民机构与民族政治兴起", "印度教、伊斯兰教、锡克教、耆那教等并存"),
    ),
  },
  kyoto: {
    1000: curated(
      "平安时代宫廷都城",
      "平安京：宫廷文化与寺院网络",
      "都城礼制、文学与宗教机构集中发展，但其繁荣建立在地方庄园和农民生产之上。",
      dimensions("建筑、历法、书写与成熟手工艺", "宫廷供给、市场和庄园经济", "朝廷贵族、寺院与城市工匠", "神祇信仰与多种佛教传统交织"),
    ),
    1785: curated(
      "江户时代文化与手工业城市",
      "京都：旧都工艺与知识中心",
      "政治中心已在江户，京都仍以宫廷、寺社、出版和高品质工艺维持影响。",
      dimensions("出版、纺织、陶瓷及精密手工艺", "城市市场、工坊和区域贸易", "町人、工匠、寺社与宫廷网络", "神道、佛教及儒学伦理并存"),
    ),
  },
  timbuktu: {
    1500: curated(
      "桑海时代萨赫勒学术与商贸城市",
      "廷巴克图：手稿、盐金贸易与宗教教育",
      "城市连接跨撒哈拉商路并拥有重要学术社群，但不应把整个西非知识传统缩减为一座城市。",
      dimensions("手稿抄写、天文、法学与建筑工艺", "盐、金、书籍和区域商品贸易", "学者、商人、工匠与帝国治理共存", "伊斯兰学术传统与地方社会实践交织"),
    ),
  },
  mexico_city: {
    1500: curated(
      "墨西加联盟都城特诺奇蒂特兰",
      "特诺奇蒂特兰：湖上都市与贡赋网络",
      "堤道、渡槽和密集市场支撑大型城市；它是多族群中部美洲世界的一部分，而非唯一中心。",
      dimensions("湖区水利、堤道、历法与精细工艺", "市场、浮园农业与贡赋体系", "卡尔普利社群、贵族与联盟政治", "多神仪式、祖先传统与政治祭祀"),
    ),
    1900: curated(
      "墨西哥共和国首都",
      "墨西哥城：铁路、工业与国家现代化",
      "铁路和公共工程推动首都扩张，但土地集中和社会不平等正积累革命前夜的矛盾。",
      dimensions("铁路、电报、公共工程与现代教育", "制造、行政、商业与全国市场", "精英现代化与工人、乡村移民并存", "天主教传统、自由主义世俗化与民间信仰"),
    ),
  },
  cusco: {
    1500: curated(
      "印加国家政治与仪式中心",
      "库斯科：安第斯道路体系的核心",
      "城市通过道路、仓储和互惠／劳役制度连接多生态区域；其秩序将在西班牙征服中遭到剧烈破坏。",
      dimensions("石砌、道路、梯田、结绳记事与天文知识", "农业仓储、垂直生态交换与国家劳役", "王族、艾柳共同体和多族群迁移体系", "太阳崇拜、祖先与各地瓦卡传统并存"),
    ),
  },
  new_york: {
    1785: curated(
      "新生美国的大西洋港市",
      "纽约：革命后的港口与商业城市",
      "城市人口和贸易开始增长，但奴隶制遗产、财产资格与原住民失地限制了‘共和’的普遍性。",
      dimensions("印刷、航海、港口与早期制造技术", "大西洋贸易、商行、手工作坊和金融萌芽", "移民港市与有限公民权并存", "新教多派、犹太社群与世俗共和思想"),
    ),
    1900: curated(
      "美国工业与移民都会",
      "纽约：摩天楼、港口与大众文化",
      "金融、制造和大规模移民推动城市爆发式扩张，也带来拥挤住房、劳工冲突与族群排斥。",
      dimensions("电力、地铁前期工程、钢结构与大众印刷", "金融、港运、服装制造和全国市场", "多族群移民社区、改革运动与严重不平等", "基督教、犹太传统及日益多元的公共生活"),
    ),
  },
  buenos_aires: {
    1900: curated(
      "阿根廷出口经济首都",
      "布宜诺斯艾利斯：移民、港口与铁路城市",
      "粮肉出口、欧洲移民和公共工程推动快速增长，同时劳工政治与土地集中问题日益显著。",
      dimensions("铁路、冷藏运输、电气和公共卫生", "港口出口、金融、加工和服务业", "大规模移民、工人组织与国家精英并存", "天主教传统、世俗教育及移民信仰多元"),
    ),
  },
  sydney: {
    1900: curated(
      "澳大利亚殖民港市",
      "悉尼：联邦前夜的港口都会",
      "港运、铁路和服务业扩张；城市繁荣伴随对白澳政策的支持及对原住民土地的持续剥夺。",
      dimensions("铁路、电报、港口工程与公共卫生", "羊毛出口、航运、制造和金融", "工会与自治政治成长，种族排斥制度化", "基督教多派为主，原住民文化持续存在"),
    ),
  },
  cape_town: {
    1785: curated(
      "荷兰殖民地补给港",
      "开普敦：海上补给与殖民边疆",
      "港口连接欧洲与印度洋航线，城市经济依靠被奴役劳动和殖民土地扩张，科伊科伊等社群承受严重冲击。",
      dimensions("航海、堡垒、农业与工匠技术", "补给贸易、农牧业与奴隶制劳动", "殖民官员、自由市民、被奴役者与原住民社群", "荷兰归正宗传统、伊斯兰社群与本地信仰并存"),
    ),
    1900: curated(
      "英属开普殖民地港市",
      "开普敦：铁路、港口与殖民分层",
      "矿业腹地和海运推动增长，种族化的居住与政治权利制度正不断强化。",
      dimensions("铁路、蒸汽港口、电报和现代行政", "航运、商贸和矿业服务", "多族群城市社会与制度化种族不平等", "基督教、伊斯兰教与本地传统并存"),
    ),
  },
});

export function formatHistoricalYear(year) {
  const value = Number(year);
  if (!Number.isFinite(value)) return "时间未知";

  const rounded = Math.round(value);
  if (rounded < 0) return `公元前${Math.abs(rounded)}年`;
  if (rounded === 0) return "公元元年前后";
  return `公元${rounded}年`;
}

/**
 * Return the nearest display era plus its bounding anchors. `progress` is a
 * 0..1 interpolation value useful for smoothly animating between time stops.
 */
export function getEraForYear(year) {
  const parsed = Number(year);
  const requestedYear = Number.isFinite(parsed) ? parsed : HISTORY_ANCHORS.at(-1).year;
  const first = HISTORY_ANCHORS[0];
  const last = HISTORY_ANCHORS.at(-1);
  const clampedYear = Math.min(last.year, Math.max(first.year, requestedYear));

  let lower = first;
  let upper = first;
  for (let index = 1; index < HISTORY_ANCHORS.length; index += 1) {
    upper = HISTORY_ANCHORS[index];
    if (clampedYear <= upper.year) break;
    lower = upper;
  }

  if (clampedYear <= first.year) upper = first;
  if (clampedYear >= last.year) lower = last;

  const span = upper.year - lower.year;
  const progress = span === 0 ? 0 : (clampedYear - lower.year) / span;
  const nearest = progress < 0.5 ? lower : upper;

  return Object.freeze({
    ...nearest,
    requestedYear,
    clampedYear,
    lowerAnchor: lower,
    upperAnchor: upper,
    progress,
  });
}

function inferRegion(city) {
  const coordinatePair = city?.loc?.coordinates;
  const latitude = Number(city?.lat ?? city?.latitude ?? coordinatePair?.[1]);
  const longitude = Number(city?.lng ?? city?.lon ?? city?.longitude ?? coordinatePair?.[0]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "global";

  if (longitude < -30) {
    if (latitude < 13) return "southAmerica";
    return "northAmerica";
  }
  if (longitude > 110 && latitude < -10) return "oceania";
  if (longitude >= 90 && longitude <= 150 && latitude >= -10 && latitude < 22) return "southeastAsia";
  if (longitude > 100 && latitude >= 22) return "eastAsia";
  if (longitude >= 60 && longitude <= 100 && latitude >= 35) return "centralAsia";
  if (longitude > 60 && latitude >= 5) return "southAsia";
  if (latitude >= 15 && latitude < 38 && longitude >= -20 && longitude <= 34.5) return "northAfrica";
  if (longitude > 25 && latitude >= 12) return "middleEast";
  if (latitude < 15) return "subSaharanAfrica";
  return "europe";
}

function resolveCity(city) {
  const rawName = typeof city === "string"
    ? city
    : city?.name ?? city?.city ?? city?.ascii ?? city?.name_en ?? city?.label ?? "未知地点";
  const normalized = aliasKey(rawName);
  const directId = CITY_ALIASES[normalized];
  const partialId = directId ?? (normalized.length >= 3
    ? Object.keys(CITY_ALIASES).find(
      (alias) => alias.length >= 3 && (normalized.includes(alias) || alias.includes(normalized)),
    )
    : undefined);
  const id = directId ?? (partialId ? CITY_ALIASES[partialId] : undefined);

  if (id) {
    const [zhName, enName, region, originYear, preCityNote] = CITY_DEFINITIONS[id];
    return { id, displayName: zhName, enName, region, originYear, preCityNote };
  }

  return {
    id: null,
    displayName: String(rawName || "未知地点"),
    enName: "",
    region: inferRegion(city),
    originYear: null,
    preCityNote: "该地点的早期城市谱系尚未收录，以下仅展示区域层面的谨慎概览。",
  };
}

function freezeProfile(profile) {
  const completeDimensions = Object.fromEntries(
    DIMENSION_KEYS.map((key) => [key, profile.dimensions[key]]),
  );
  return Object.freeze({
    civilization: profile.civilization,
    eventTitle: profile.eventTitle,
    summary: profile.summary,
    dimensions: Object.freeze(completeDimensions),
  });
}

export function getCityProfile(city, year) {
  const place = resolveCity(city);
  const era = getEraForYear(year);
  const anchorYear = era.year;
  const region = REGION_CONTEXT[place.region] ?? REGION_CONTEXT.global;

  if (place.originYear !== null && era.clampedYear < place.originYear) {
    return freezeProfile({
      civilization: `${region.label} · 后来城市尚未形成`,
      eventTitle: `${place.displayName}在${formatHistoricalYear(era.clampedYear)}尚未形成今日城市`,
      summary: `${place.preCityNote} 不应把现代城市名称、边界或身份直接投射到这一时期。`,
      dimensions: ERA_DIMENSIONS[String(anchorYear)],
    });
  }

  const override = place.id ? PROFILE_OVERRIDES[place.id]?.[anchorYear] : null;
  if (override) return freezeProfile(override);

  const eraNote = region.notes[String(anchorYear)];
  return freezeProfile({
    civilization: `${region.label} · ${era.title}`,
    eventTitle: `${place.displayName}所在区域：${era.title}`,
    summary: `${eraNote} 这是区域层面的概览，并不代表区域内所有城市、社群或个人经历相同。`,
    dimensions: ERA_DIMENSIONS[String(anchorYear)],
  });
}
