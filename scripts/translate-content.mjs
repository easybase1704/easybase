import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CASES_PATH = path.join(__dirname, '..', 'src', '_data', 'cases.json');
const NEWS_PATH = path.join(__dirname, '..', 'src', '_data', 'news.json');

// ============================================================
// 翻译规则（与 translate-products.mjs 共享）
// ============================================================
const REPLACE_RULES = [
  // ─── 处理器/平台 ───
  [/英特尔®?/g, 'Intel®'],
  [/英特尔/g, 'Intel'],
  [/至强/g, 'Xeon'],
  [/酷睿™/g, 'Core™'],
  [/赛扬/g, 'Celeron'],
  [/飞腾/g, 'Phytium'],
  [/腾珑/g, 'Tenglong'],
  [/兆芯/g, 'Zhaoxin'],
  [/海光/g, 'Hygon'],
  [/龙芯/g, 'Loongson'],
  [/国产/g, 'Domestic'],
  [/处理器/g, 'Processor'],
  [/芯片组/g, 'Chipset'],
  [/芯片/g, 'Chip'],
  [/全系列/g, 'Full Series'],
  [/系列处理器/g, 'Series Processor'],
  [/系列/g, 'Series'],
  [/平台/g, 'Platform'],
  [/封装/g, 'Package'],
  [/代数/g, 'Generation'],
  [/(\d+)代/g, '$1th Gen'],
  [/代 /g, ' Gen '],
  [/代/g, ' Gen'],

  // ─── 内存/存储 ───
  [/内存/g, 'Memory'],
  [/固态硬盘/g, 'SSD'],
  [/硬盘/g, 'HDD'],
  [/存储/g, 'Storage'],
  [/板载/g, 'Onboard'],
  [/颗粒/g, 'Chip'],
  [/通道/g, 'Channel'],
  [/双通道/g, 'Dual Channel'],
  [/单通道/g, 'Single Channel'],

  // ─── 接口/端口 ───
  [/接口/g, 'Port'],
  [/网口/g, 'Ethernet Port'],
  [/网卡/g, 'NIC'],
  [/千兆/g, 'Gigabit'],
  [/以太网/g, 'Ethernet'],
  [/串口/g, 'Serial Port'],
  [/并口/g, 'Parallel Port'],
  [/显示/g, 'Display'],
  [/扩展/g, 'Expansion'],
  [/插槽/g, 'Slot'],
  [/转接卡/g, 'Riser Card'],

  // ─── 显卡/图形 ───
  [/显卡/g, 'GPU'],
  [/集成显卡/g, 'Integrated Graphics'],
  [/核心显卡/g, 'Core Graphics'],
  [/独立显卡/g, 'Discrete GPU'],
  [/独显/g, 'Discrete GPU'],
  [/图形/g, 'Graphics'],
  [/显示输出/g, 'Display Output'],
  [/分辨率/g, 'Resolution'],

  // ─── USB/IO ───
  [/前置IO/g, 'Front IO'],
  [/后置IO/g, 'Rear IO'],
  [/前面板/g, 'Front Panel'],
  [/后面板/g, 'Rear Panel'],
  [/前置/g, 'Front'],
  [/后置/g, 'Rear'],
  [/后IO/g, 'Rear IO'],
  [/前IO/g, 'Front IO'],
  [/加密卡/g, 'Encryption Card'],
  [/内置/g, 'Built-in'],
  [/内部/g, 'Internal'],
  [/外部/g, 'External'],
  [/GPU卡/g, 'GPU'],

  // ─── 电源 ───
  [/电源/g, 'Power'],
  [/电压/g, 'Voltage'],
  [/功率/g, 'Power Consumption'],
  [/适配器/g, 'Adapter'],
  [/冗余/g, 'Redundant'],
  [/热插拔/g, 'Hot-Swap'],
  [/直流输入/g, 'DC Input'],
  [/直流/g, 'DC'],
  [/输入/g, 'Input'],
  [/输出/g, 'Output'],

  // ─── 散热/机箱 ───
  [/风扇/g, 'Fan'],
  [/散热/g, 'Cooling'],
  [/无风扇/g, 'Fanless'],
  [/静音/g, 'Silent'],
  [/机箱/g, 'Chassis'],
  [/铝合金/g, 'Aluminum Alloy'],
  [/材质/g, 'Material'],
  [/钣金/g, 'Sheet Metal'],
  [/镀锌钢板/g, 'Galvanized Steel'],
  [/结构/g, 'Structure'],

  // ─── 安装/尺寸 ───
  [/安装方式/g, 'Mounting'],
  [/安装/g, 'Mounting'],
  [/壁挂/g, 'Wall Mount'],
  [/桌面/g, 'Desktop'],
  [/机架式/g, 'Rackmount'],
  [/塔式/g, 'Tower'],
  [/嵌入式/g, 'Embedded'],
  [/尺寸/g, 'Dimensions'],
  [/长宽高/g, 'L×W×H'],
  [/重量/g, 'Weight'],

  // ─── 环境 ───
  [/工作温度/g, 'Operating Temp'],
  [/存储温度/g, 'Storage Temp'],
  [/存储湿度/g, 'Storage Humidity'],
  [/相对湿度/g, 'Relative Humidity'],
  [/工作环境/g, 'Operating Environment'],
  [/无冷凝/g, 'Non-condensing'],
  [/无凝结/g, 'Non-condensing'],
  [/温度/g, 'Temp'],
  [/湿度/g, 'Humidity'],
  [/环境/g, 'Environment'],

  // ─── 认证 ───
  [/认证/g, 'Certification'],
  [/节能/g, 'Energy Saving'],

  // ─── 颜色 ───
  [/黑色/g, 'Black'],
  [/白色/g, 'White'],
  [/银色/g, 'Silver'],
  [/铁灰色/g, 'Iron Gray'],
  [/亮黑色/g, 'Glossy Black'],
  [/蓝黑色/g, 'Blue Black'],
  [/银\+黑/g, 'Silver+Black'],

  // ─── 系统/软件 ───
  [/操作系统/g, 'OS'],
  [/系统/g, 'System'],
  [/固件/g, 'Firmware'],
  [/昆仑/g, 'Kunlun'],
  [/百傲/g, 'Baiao'],
  [/软件/g, 'Software'],

  // ─── 功能特性 ───
  [/上电自启/g, 'Auto Power-On'],
  [/上电开机/g, 'Power-On Boot'],
  [/来电开机/g, 'Power-On on AC'],
  [/网络唤醒/g, 'Wake-on-LAN'],
  [/看门狗/g, 'Watchdog'],
  [/一键还原/g, 'One-Key Recovery'],
  [/锁孔/g, 'Lock Slot'],
  [/肯辛通锁孔/g, 'Kensington Lock Slot'],
  [/防尘网/g, 'Dust Filter'],
  [/可拆卸/g, 'Removable'],

  // ─── 显示器 ───
  [/可升降/g, 'Height Adjustable'],
  [/可旋转/g, 'Rotatable'],
  [/底座/g, 'Stand'],
  [/支柱/g, 'Pillar'],
  [/摄像头/g, 'Camera'],
  [/隐藏式/g, 'Concealed'],
  [/麦克风/g, 'Microphone'],
  [/耳机/g, 'Headphone'],
  [/喇叭/g, 'Speaker'],
  [/腔体/g, 'Chamber'],
  [/音频/g, 'Audio'],

  // ─── 型号/类型 ───
  [/型号/g, 'Model'],
  [/类型/g, 'Type'],
  [/特性/g, 'Features'],
  [/机械特性/g, 'Mechanical Specs'],
  [/功能/g, 'Function'],

  // ─── 动词/形容词 ───
  [/可选支持/g, 'Optional Support for'],
  [/可选配/g, 'Optional'],
  [/可选/g, 'Optional'],
  [/最大支持/g, 'Max'],
  [/最大可选/g, 'Max Optional'],
  [/最大可拓展/g, 'Max Expandable'],
  [/可拓展/g, 'Expandable'],
  [/可扩展/g, 'Expandable'],
  [/支持/g, 'Supports'],
  [/提供/g, 'Provides'],
  [/使用/g, 'Uses'],
  [/采用/g, 'Uses'],
  [/搭配/g, 'with'],
  [/默认/g, 'Default'],
  [/按需/g, 'On Demand'],
  [/高性能/g, 'High-Performance'],
  [/高保真/g, 'High-Fidelity'],
  [/低功耗/g, 'Low-Power'],
  [/书本型/g, 'Book-sized'],
  [/超薄/g, 'Ultra-Slim'],
  [/超小/g, 'Ultra-Compact'],
  [/巴掌/g, 'Palm-sized'],

  // ─── 产品形态 ───
  [/云终端/g, 'Cloud Terminal'],
  [/商务机/g, 'Business PC'],
  [/商务办公机/g, 'Business PC'],
  [/办公机/g, 'Office PC'],
  [/工作站/g, 'Workstation'],
  [/服务器/g, 'Server'],
  [/迷你主机/g, 'Mini PC'],
  [/迷你电脑/g, 'Mini PC'],
  [/迷你PC/g, 'Mini PC'],
  [/主机/g, 'PC'],
  [/台式主机/g, 'Desktop PC'],
  [/边缘计算盒子/g, 'Edge Computing Box'],
  [/电脑棒/g, 'PC Stick'],
  [/一体机/g, 'All-in-One'],
  [/工控机/g, 'Industrial PC'],
  [/工控准系统/g, 'Industrial Control System'],
  [/准系统/g, 'Barebone System'],

  // ─── 通讯 ───
  [/无线/g, 'Wireless'],
  [/蓝牙/g, 'Bluetooth'],
  [/天线/g, 'Antenna'],
  [/模块/g, 'Module'],
  [/通讯/g, 'Communication'],

  // ─── 管理 ───
  [/管理/g, 'Management'],
  [/远程/g, 'Remote'],
  [/控制/g, 'Control'],

  // ─── 指示灯/开关 ───
  [/指示灯/g, 'LED'],
  [/电源指示灯/g, 'Power LED'],
  [/硬盘指示灯/g, 'HDD LED'],
  [/开关/g, 'Switch'],
  [/复位/g, 'Reset'],
  [/按键/g, 'Button'],

  // ─── 端口序号格式化 ───
  [/(\d+) \*([A-Z])/g, '$1× $2'],
  [/(\d+)\*([A-Z])/g, '$1× $2'],
  [/(\d+) x ([A-Z])/g, '$1× $2'],
  [/(\d+)x([A-Z])/g, '$1× $2'],
  [/个 /g, '× '],
  [/个/g, ''],

  // ─── 显示模式 ───
  [/双显/g, 'Dual Display'],
  [/三显/g, 'Triple Display'],
  [/四显/g, 'Quad Display'],
  [/独三显/g, 'Triple Independent Display'],
  [/双显模式/g, 'Dual Display Mode'],
  [/显示接口/g, 'Display Port'],
  [/同步/g, 'Sync'],

  // ─── 量词/单位 ───
  [/寸/g, '"'],
  [/英寸/g, '"'],
  [/(\d+)核/g, '$1-Core'],
  [/(\d+)线程/g, '$1-Thread'],
  [/级/g, 'Level'],
  [/摄氏度/g, '°C'],
  [/摄氏/g, '°C'],
  [/升/g, 'L'],

  // ─── 残留词汇 ───
  [/双/g, 'Dual'],
  [/参考/g, 'Reference'],
  [/其他/g, 'Other'],
  [/机械/g, 'Mechanical'],
  [/网络(?!唤醒|灯)/g, 'Network'],
  [/联网/g, 'Network'],
  [/耳麦/g, 'Headset'],
  [/肯辛通/g, 'Kensington'],
  [/按处理器选配/g, 'Per CPU Config'],
  [/按/g, 'Per'],
  [/选配/g, 'Optional Config'],
  [/商务/g, 'Business'],
  [/大屏/g, 'Large Display'],
  [/卡座/g, 'Card Slot'],
  [/数字/g, 'Digital'],
  [/超时/g, 'Timeout'],
  [/中断/g, 'Interrupt'],
  [/可编程/g, 'Programmable'],
  [/复位/g, 'Reset'],
  [/秒\/分/g, 'sec/min'],
  [/秒/g, 'sec'],
  [/分/g, 'min'],
  [/切换/g, 'Switch'],
  [/带电/g, 'Powered'],
  [/腔体/g, 'Chamber'],
  [/三路/g, 'Triple'],
  [/同时/g, 'Simultaneous'],

  // ─── 特殊/杂项 ───
  [/转/g, 'Rotate'],
  [/翻转/g, 'Tilt'],
  [/时钟方向/g, 'Clockwise'],
  [/度/g, '°'],
  [/读卡器/g, 'Card Reader'],
  [/三合一/g, '3-in-1'],
  [/二合一/g, '2-in-1'],
  [/四段式/g, '4-Pole'],
  [/三段式/g, '3-Pole'],
  [/美标/g, 'CTIA Standard'],
  [/光驱/g, 'DVD Drive'],
  [/AI套件/g, 'AI Suite'],
  [/开发套件/g, 'Dev Kit'],
  [/加密/g, 'Encryption'],
  [/安全/g, 'Security'],
  [/段式/g, 'Pole'],
  [/段/g, 'Pole'],

  // ─── 批量残词 ───
  [/灯(?!泡)/g, 'LED'],
  [/翻/g, 'Tilt'],
  [/小(?!时)/g, 'Small'],
  [/尺寸(?!寸)/g, 'Size'],
  [/至 /g, 'to '],
  [/最大\b/g, 'Max '],
  [/和 /g, 'and '],
  [/加速卡/g, 'Accelerator Card'],
  [/冗/g, 'Redundancy'],
  [/亮/g, 'Glossy'],
  [/型/g, 'Type'],
  [/主板/g, 'Motherboard'],
  [/核核/g, 'Core '],
  [/拨钮/g, 'Toggle'],
  [/应用/g, 'Application'],
  [/其中/g, 'Where'],
  [/串行/g, 'Serial'],
  [/最高/g, 'Up to'],
  [/硬件/g, 'Hardware'],
  [/需求/g, 'Requirement'],
  [/外接/g, 'External'],
  [/(\d+)核\b/g, '$1-Core'],
  [/核$/g, 'Core'],
  [/核 /g, 'Core '],
  [/制$/g, ''],
  [/志强/g, 'Xeon'],
  [/双核/g, 'Dual-Core'],
  [/二线程/g, 'Dual-Thread'],
  [/二/g, 'Two'],
  [/卡槽/g, 'Card Slot'],
  [/技术/g, 'Technology'],
  [/络/g, 'work'],
  [/网络work/g, 'Network'],
  [/版/g, 'Version'],
  [/与 /g, 'with '],
  [/球/g, 'Ball'],
  [/合(?![一三二四])/g, 'in'],
  [/雷电/g, 'Thunderbolt'],
  [/用于/g, 'for'],
  [/盘位/g, 'Drive Bay'],
  [/位/g, 'Bay'],
  [/显/g, 'Display'],
  [/兼容/g, 'Compatible with'],
  [/景嘉微/g, 'Jingjia Micro'],
  [/可信/g, 'Trusted'],
  [/电口/g, 'RJ45 Port'],
  [/电/g, 'RJ45'],
  [/两/g, 'Two'],
  [/卡$/g, 'Card'],
  [/卡 /g, 'Card '],
  [/国产化/g, 'Domestic'],
  [/化/g, 'ized'],
  [/网 work/g, 'Network'],
  [/网 /g, 'Network'],
  [/符合/g, 'Compliant with'],
  [/符 in/g, 'Compliant with'],
  [/加速/g, 'Accelerator'],
  [/原生/g, 'Native'],
  [/四/g, 'Quad'],
  [/最大功耗/g, 'Max Power Consumption'],
  [/功耗/g, 'Power Consumption'],
  [/装配/g, 'Install'],
  [/脑/g, 'PC'],
  [/蓝/g, 'Blue'],
  [/连接器/g, 'Connector'],
  [/带 RJ45/g, 'Powered RJ45'],
  [/带 /g, 'Powered'],
  [/为 /g, 'is '],
  [/至 /g, 'to '],
  [/高达/g, 'Up to'],
  [/拓展/g, 'Expandable'],
  [/集 /g, 'Integrated'],
  [/  +/g, ' '],

  // ─── 新闻/案例领域词汇 ───
  [/智慧教育/g, 'Smart Education'],
  [/智慧办公/g, 'Smart Office'],
  [/智慧园区/g, 'Smart Park'],
  [/智慧零售/g, 'Smart Retail'],
  [/智慧交通/g, 'Smart Transportation'],
  [/智慧医疗/g, 'Smart Healthcare'],
  [/智能制造/g, 'Smart Manufacturing'],
  [/机器视觉/g, 'Machine Vision'],
  [/人工智能/g, 'AI'],
  [/信息化/g, 'Informatization'],
  [/数字化/g, 'Digitalization'],
  [/智能化/g, 'Intelligence'],
  [/虚拟化/g, 'Virtualization'],
  [/云计算/g, 'Cloud Computing'],
  [/大数据/g, 'Big Data'],
  [/物联网/g, 'IoT'],
  [/互联网/g, 'Internet'],
  [/解决方案/g, 'Solution'],
  [/普教/g, 'K-12 Education'],
  [/成教/g, 'Adult Education'],
  [/政府/g, 'Government'],
  [/中小企业/g, 'SMEs'],
  [/医院/g, 'Hospitals'],
  [/酒店/g, 'Hotels'],
  [/桌面虚拟化/g, 'Desktop Virtualization'],
  [/部署/g, 'Deployment'],
  [/客户端/g, 'Client'],
  [/园区/g, 'Park'],
  [/综合体/g, 'Complex'],
  [/设备/g, 'Device'],
  [/消费者/g, 'Consumer'],
  [/商户/g, 'Merchants'],
  [/交易/g, 'Transaction'],
  [/营销/g, 'Marketing'],
  [/门店/g, 'Stores'],
  [/数据/g, 'Data'],
  [/联网/g, 'Network'],
  [/智能/g, 'Smart'],
  [/机器/g, 'Machine'],
  [/制造/g, 'Manufacturing'],
  [/自动化/g, 'Automation'],
  [/图像/g, 'Image'],
  [/判断/g, 'Judgment'],
  [/测量/g, 'Measurement'],
  [/公司/g, 'Company'],
  [/新闻/g, 'News'],
  [/行业/g, 'Industry'],
  [/产品/g, 'Product'],
  [/资讯/g, 'Information'],
  [/中国/g, 'China'],
  [/科技/g, 'Technology'],
  [/教育/g, 'Education'],
  [/展会/g, 'Exhibition'],
  [/展示/g, 'Display'],
  [/创新/g, 'Innovation'],
  [/服务/g, 'Service'],
  [/场景/g, 'Scenario'],
  [/体验/g, 'Experience'],
  [/设计/g, 'Design'],
  [/方案/g, 'Plan'],
  [/解决/g, 'Solve'],
  [/保障/g, 'Ensure'],
  [/提供/g, 'Provides'],
  [/融合/g, 'Integration'],
  [/通过/g, 'Through'],
  [/实现/g, 'Achieve'],
  [/核心/g, 'Core'],
  [/高效/g, 'Efficient'],
  [/运营/g, 'Operation'],
  [/能力/g, 'Capability'],
  [/提出/g, 'Propose'],
  [/要求/g, 'Requirement'],
  [/合理/g, 'Reasonable'],
  [/保证/g, 'Guarantee'],
  [/完善/g, 'Comprehensive'],
  [/功能/g, 'Feature'],
  [/不断/g, 'Continuously'],
  [/新型/g, 'New Type'],
  [/模式/g, 'Mode'],
  [/特征/g, 'Characteristic'],
  [/信息/g, 'Information'],
  [/联通/g, 'Connectivity'],
  [/实时监控/g, 'Real-time Monitoring'],
  [/协同/g, 'Collaboration'],
  [/人物合一/g, 'Human-Machine Integration'],
  [/路网/g, 'Road Network'],
  [/装备/g, 'Equipment'],
  [/出行/g, 'Travel'],
  [/专有/g, 'Proprietary'],
  [/名词/g, 'Term'],
  [/打造/g, 'Build'],
  [/档案/g, 'Archive'],
  [/机构/g, 'Institution'],
  [/患者/g, 'Patient'],
  [/医务人员/g, 'Medical Staff'],
  [/互动/g, 'Interaction'],
  [/逐步/g, 'Gradually'],
  [/专家/g, 'Expert'],
  [/组成/g, 'Compose'],
  [/分析/g, 'Analysis'],
  [/推理/g, 'Reasoning'],
  [/构思/g, 'Concept'],
  [/决策/g, 'Decision'],
  [/合作/g, 'Collaboration'],
  [/取代码/g, 'Replace'],
  [/更新/g, 'Update'],
  [/柔性化/g, 'Flexibility'],
  [/高度集成/g, 'High Integration'],
  [/快速/g, 'Rapid'],
  [/分支/g, 'Branch'],
  [/摄取/g, 'Capture'],
  [/装置/g, 'Device'],
  [/目标/g, 'Target'],
  [/信号/g, 'Signal'],
  [/形态/g, 'Morphology'],
  [/像素/g, 'Pixel'],
  [/亮度/g, 'Brightness'],
  [/运算/g, 'Computation'],
  [/特征/g, 'Feature'],
  [/判别/g, 'Discrimination'],
  [/现场/g, 'On-site'],
  [/动作/g, 'Action'],
  [/计算/g, 'Computing'],
  [/触摸屏/g, 'Touchscreen'],
  [/触屏/g, 'Touchscreen'],
  [/协同/g, 'Synergy'],

  // ─── 通用中文词汇（案例/新闻用） ───
  [/的 /g, ' '],
  [/的$/g, ''],
  [/是/g, 'is'],
  [/等/g, 'etc.'],
  [/及/g, 'and'],
  [/从/g, 'from'],
  [/到/g, 'to'],
  [/中/g, 'in'],
  [/对/g, 'for'],
  [/被/g, 'by'],
  [/将/g, 'will'],
  [/能/g, 'can'],
  [/它/g, 'it'],
  [/更/g, 'more'],
  [/每/g, 'each'],
  [/即/g, 'i.e.'],
  [/给/g, 'to'],
  [/用/g, 'with'],
  [/做/g, 'do'],
  [/人/g, 'human'],
  [/共/g, 'common'],
  [/替/g, 'replace'],
  [/子/g, ''],
  [/布/g, 'distribution'],
  [/体/g, 'body'],
  [/种/g, 'type'],
  [/析/g, 'analysis'],
  [/部/g, 'part'],
  [/地/g, ''],
  [/全/g, 'full'],
  [/新/g, 'new'],
  [/最/g, 'most'],
  [/已/g, 'already'],
  [/可/g, 'can'],
  [/所/g, 'so'],
  [/让/g, 'let'],
  [/运行/g, 'running'],
  [/运行/g, 'running'],
  [/企业/g, 'enterprise'],
  [/办公(?!机)/g, 'office'],
  [/统一/g, 'unified'],
  [/交付/g, 'delivery'],
  [/商住/g, 'commercial/residential'],
  [/落成/g, 'completed'],
  [/提出/g, 'raise'],
  [/高效/g, 'efficient'],
  [/彻底/g, 'thorough'],
  [/问题/g, 'issue'],
  [/经济/g, 'economic'],
  [/效益/g, 'benefit'],
  [/交通/g, 'transportation'],
  [/发展/g, 'development'],
  [/具有/g, 'have'],
  [/基本/g, 'basic'],
  [/简称/g, 'abbreviation'],
  [/最近/g, 'recent'],
  [/兴起/g, 'emerging'],
  [/健康/g, 'health'],
  [/区域/g, 'regional'],
  [/利用/g, 'utilize'],
  [/先进/g, 'advanced'],
  [/之间/g, 'between'],
  [/人类/g, 'human'],
  [/共同/g, 'joint'],
  [/一体/g, 'integrated'],
  [/过程/g, 'process'],
  [/诸如/g, 'such as'],
  [/扩大/g, 'expand'],
  [/延伸/g, 'extend'],
  [/取代/g, 'replace'],
  [/劳动/g, 'labor'],
  [/概念/g, 'concept'],
  [/正在/g, 'is being'],
  [/简单/g, 'simple'],
  [/说来/g, 'speaking'],
  [/就是/g, 'is'],
  [/测量/g, 'measurement'],
  [/传送/g, 'transmit'],
  [/得到/g, 'obtain'],
  [/根据/g, 'based on'],
  [/变成/g, 'transform'],
  [/各种/g, 'various'],
  [/抽取/g, 'extract'],
  [/进而/g, 'then'],
  [/结果/g, 'result'],
  [/综合/g, 'comprehensive'],
  [/不断/g, 'continuously'],
  [/合理/g, 'reasonable'],
  [/完善/g, 'comprehensive'],
  [/软/g, 'software'],
  [/硬/g, 'hardware'],
  [/业务/g, 'business'],
  [/需/g, 'needed'],
  [/消费/g, 'consumption'],
  [/店铺/g, 'store'],
  [/物/g, 'object'],
  [/联/g, 'connection'],
  [/原基科技/g, 'EasyBase Technology'],
  [/原基/g, 'EasyBase'],
  [/闪耀/g, 'Shines at'],
  [/第(\d+)/g, '$1'],  // "第64届" → "64届"
  [/届/g, 'th '],
  [/博览会/g, 'Expo'],
  [/亮相/g, 'Debuts at'],
  [/展示会/g, 'Exhibition'],
  [/会/g, 'Conference'],
  [/探索/g, 'Exploring'],
  [/未来/g, 'Future'],
  [/智算/g, 'Intelligent Computing'],
  [/发(?!展|现)/g, 'Release'],
  [/新品/g, 'New Product'],
  [/品/g, 'Product'],
  [/乔迁/g, 'Relocation'],
  [/新址/g, 'New Address'],
  [/址/g, 'Address'],
  [/有限/g, 'Ltd.'],
  [/迁/g, 'Move'],
  [/写字楼/g, 'Office Building'],
  [/光明街道/g, 'Guangming Street'],
  [/云智科园/g, 'Yunzhi Science Park'],
  [/深圳市/g, 'Shenzhen'],
  [/理/g, 'Manage'],
  [/闪耀第/g, 'Shines at'],
  [/第 /g, ''],
  [/第/g, ''],
  [/处/g, 'Place'],
  [/智慧(?!教育|办公|园区|零售|交通|医疗|制造)/g, 'Smart '],
  [/门店/g, 'Store'],
  [/管理/g, 'Management'],
  [/组合/g, 'Combination'],
  [/机器(?!视觉)/g, 'Machine'],
  [/视觉/g, 'Vision'],
  [/虚拟/g, 'Virtual'],
  [/多样/g, 'Diverse'],
  [/进行/g, 'Conduct'],
  [/利用/g, 'Utilize'],
  [/综合/g, 'Comprehensive'],
  [/融合/g, 'Integration'],
  [/基础/g, 'Foundation'],
  [/作为/g, 'as'],
  [/重要/g, 'Important'],
  [/内容/g, 'Content'],
  [/英文/g, 'English'],
  [/医疗/g, 'Medical'],
  [/自动/g, 'Automatic'],
  [/柔性/g, 'Flexible'],
  [/集成/g, 'Integrated'],
  [/处理/g, 'Process'],
  [/颜色/g, 'Color'],
  [/创造/g, 'Create'],
  [/活动/g, 'Activity'],
  [/这些/g, 'These'],
  [/换成/g, 'Convert to'],
  [/基于/g, 'Based on'],
  [/模式/g, 'Mode'],

  // ─── 单字（不用\b，中文不是\w） ───
  [/了/g, ''],
  [/一/g, 'A '],
  [/高/g, 'High '],
  [/并/g, 'and '],
  [/互/g, 'Mutual '],
  [/以/g, 'by '],
  [/加/g, 'Add '],
  [/融/g, 'Integrated '],
  [/近/g, 'Near '],
  [/综/g, 'Comprehensive '],
  [/利/g, 'Utilize '],
  [/达/g, 'Reach '],
  [/由/g, 'by '],
  [/类/g, 'Type '],
  [/同/g, 'Same '],
  [/在/g, 'in '],
  [/作/g, 'as '],
  [/事/g, 'Thing '],
  [/去/g, 'to '],
  [/取/g, 'Get '],
  [/力/g, 'Force '],
  [/把/g, ''],
  [/支/g, 'Branch '],
  [/就/g, 'Just '],
  [/眼/g, 'Eye '],
  [/专/g, 'Special '],
  [/摄/g, 'Capture '],
  [/得/g, 'Get '],
  [/来/g, 'Come '],
  [/表/g, 'Table '],
  [/具/g, 'With '],
  [/各/g, 'Various '],
  [/相/g, 'Phase '],
  [/商/g, 'Business '],
  [/务/g, 'Service '],
  [/业/g, 'Industry '],
  [/组/g, 'Group '],
  [/机(?!器)/g, 'Machine '],

  // ─── 标点 ───

  // ─── 标点 ───
  [/，/g, ', '],
  [/；/g, '; '],
  [/、/g, ', '],
  [/（/g, ' ('],
  [/）/g, ') '],
  [/：/g, ': '],
  [/　/g, ' '],
  [/～/g, '~'],

  // ─── 修正 ───
  [/Mini-PC Ie/g, 'Mini PCIe'],
  [/PC Ie/g, 'PCIe'],
  [/PCIe Ie/g, 'PCIe'],
  [/G Hz/g, 'GHz'],
  [/M Hz/g, 'MHz'],
  [/mSAT A/g, 'mSATA'],
  [/SAT A/g, 'SATA'],
  [/([a-z])([A-Z])/g, '$1 $2'],
  [/  +/g, ' '],
];

function hasChinese(text) {
  return /[一-鿿]/.test(text);
}

function applyRules(text) {
  let result = text;

  // 第一遍
  for (const [pattern, replacement] of REPLACE_RULES) {
    result = result.replace(pattern, replacement);
  }

  // 边界空格
  result = result.replace(/([一-鿿])([a-zA-Z0-9])/g, '$1 $2');
  result = result.replace(/([a-zA-Z0-9])([一-鿿])/g, '$1 $2');

  // 第二遍
  for (const [pattern, replacement] of REPLACE_RULES) {
    result = result.replace(pattern, replacement);
  }

  result = result.replace(/  +/g, ' ');
  result = result.replace(/\s+([,.;:!)])/g, '$1');
  result = result.replace(/\(\s+/g, '(');
  result = result.replace(/\s+\)/g, ')');
  return result.trim();
}

function translate(text) {
  if (!text || !text.trim()) return text;
  const trimmed = text.trim();
  if (!hasChinese(trimmed)) return text;
  let result = applyRules(trimmed);
  if (hasChinese(result)) result = applyRules(result);
  return result;
}

function translateHTML(html) {
  if (!html) return '';
  return html.replace(/>([^<]+)</g, (match, text) => {
    const trimmed = text.trim();
    if (!trimmed || !hasChinese(trimmed)) return match;
    const translated = translate(trimmed);
    return '>' + text.replace(trimmed, translated) + '<';
  });
}

// ============================================================
// 主流程
// ============================================================

function main() {
  // ─── 处理案例 ───
  console.log('=== 处理行业方案 ===');
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, 'utf-8'));
  let caseCount = 0;
  for (const sol of cases.solutions) {
    sol.duibiEn = translate(sol.duibi);
    if (sol.duibiEn && hasChinese(sol.duibiEn)) {
      console.log(`  ⚠ 案例 "${sol.name}" duibi 仍有中文残留`);
    } else {
      caseCount++;
      console.log(`  ✅ ${sol.name}: ${sol.duibiEn.substring(0, 60)}...`);
    }
  }
  fs.writeFileSync(CASES_PATH, JSON.stringify(cases, null, 2), 'utf-8');
  console.log(`  案例 duibi 翻译完成: ${caseCount}/${cases.solutions.length}\n`);

  // ─── 处理新闻 ───
  console.log('=== 处理新闻 ===');
  const news = JSON.parse(fs.readFileSync(NEWS_PATH, 'utf-8'));
  let newsTitleCount = 0, newsDescCount = 0, newsBodyCount = 0;

  for (const article of news.articles) {
    // title
    article.titleEn = translate(article.title);
    if (!hasChinese(article.titleEn)) newsTitleCount++;

    // description
    article.descriptionEn = article.description ? translate(article.description) : '';
    if (!article.description || !hasChinese(article.descriptionEn)) newsDescCount++;

    // body (HTML)
    article.bodyEn = translateHTML(article.body);

    console.log(`  ✅ ${article.title.substring(0, 40)}... → ${article.titleEn?.substring(0, 40)}...`);
  }
  fs.writeFileSync(NEWS_PATH, JSON.stringify(news, null, 2), 'utf-8');
  console.log(`  新闻翻译完成: title ${newsTitleCount}/${news.articles.length}, desc ${newsDescCount}/${news.articles.length}`);

  console.log('\n全部完成!');
}

main();
