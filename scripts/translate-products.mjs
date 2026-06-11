import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_PATH = path.join(__dirname, '..', 'src', '_data', 'products.json');

// ============================================================
// 翻译规则表 — 逐词/逐模式替换（按顺序应用）
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
  [/最高分辨率/g, 'Max Resolution'],

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

  // ─── 显卡卡 → GPU（重复修复） ───
  [/GPU卡/g, 'GPU'],
  [/显卡/g, 'GPU'],

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
  [/全铝合金/g, 'All-Aluminum Alloy'],

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
  [/宽\*深\*高/g, 'W×D×H'],
  [/长\*宽\*总高/g, 'L×W×Total H'],
  [/重量/g, 'Weight'],
  [/包装/g, 'Package'],

  // ─── 环境 ───
  [/工作温度/g, 'Operating Temp'],
  [/存储温度/g, 'Storage Temp'],
  [/存储湿度/g, 'Storage Humidity'],
  [/工作湿度/g, 'Operating Humidity'],
  [/相对湿度/g, 'Relative Humidity'],
  [/工作环境/g, 'Operating Environment'],
  [/工作震动/g, 'Operating Vibration'],
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
  [/黑\/白可选/g, 'Black/White Optional'],
  [/黑\/银可选/g, 'Black/Silver Optional'],
  [/白\/黑可选/g, 'White/Black Optional'],
  [/颜色/g, 'Color'],

  // ─── 系统/软件 ───
  [/操作系统/g, 'OS'],
  [/系统/g, 'System'],
  [/软件支持/g, 'Software Support'],
  [/固件/g, 'Firmware'],
  [/昆仑/g, 'Kunlun'],
  [/百傲/g, 'Baiao'],

  // ─── 功能特性 ───
  [/上电自启/g, 'Auto Power-On'],
  [/上电开机/g, 'Power-On Boot'],
  [/来电开机/g, 'Power-On on AC'],
  [/来电自启/g, 'Auto Start on AC'],
  [/定时开机/g, 'Scheduled Power-On'],
  [/网络唤醒/g, 'Wake-on-LAN'],
  [/看门狗/g, 'Watchdog'],
  [/一键还原/g, 'One-Key Recovery'],
  [/一键clear cmos/g, 'One-Key Clear CMOS'],
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
  [/机箱特性/g, 'Chassis Specs'],
  [/其他特性/g, 'Other Features'],
  [/其他功能/g, 'Other Functions'],
  [/模块扩展/g, 'Module Expansion'],
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
  [/按处理器选配/g, 'Per Processor Config'],
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
  [/计算盒子/g, 'Computing Box'],
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
  [/硬盘灯/g, 'HDD LED'],
  [/网络指示灯/g, 'Network LED'],
  [/报警灯/g, 'Alarm LED'],
  [/网络灯/g, 'Network LED'],
  [/呼吸灯/g, 'Breathing LED'],
  [/开关/g, 'Switch'],
  [/复位/g, 'Reset'],
  [/按键/g, 'Button'],

  // ─── 端口序号格式化 ───
  [/(\d+) \*([A-Z])/g, '$1× $2'],
  [/(\d+)\*([A-Z])/g, '$1× $2'],
  [/(\d+) x ([A-Z])/g, '$1× $2'],
  [/(\d+)x([A-Z])/g, '$1× $2'],

  // ─── 数量单位 ───
  [/个 /g, '× '],
  [/个/g, ''],
  [/支持可选/g, 'Optional'],

  // ─── 显示模式 ───
  [/双显/g, 'Dual Display'],
  [/三显/g, 'Triple Display'],
  [/四显/g, 'Quad Display'],
  [/独三显/g, 'Triple Independent Display'],
  [/独立双显/g, 'Independent Dual Display'],
  [/独立三显/g, 'Independent Triple Display'],
  [/独立四显/g, 'Independent Quad Display'],
  [/双显模式/g, 'Dual Display Mode'],
  [/显示模式/g, 'Display Mode'],
  [/显示接口/g, 'Display Port'],
  [/同步/g, 'Sync'],

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

  // ─── 第六波：最后残词 ───
  [/网 work/g, 'Network'],
  [/网 /g, 'Network '],
  [/符合/g, 'Compliant with '],
  [/符 in/g, 'Compliant with '],
  [/加速/g, 'Accelerator '],
  [/原生/g, 'Native '],
  [/四/g, 'Quad '],
  [/方 de/g, 'Mode'],
  [/最大功耗/g, 'Max Power Consumption'],
  [/功耗/g, 'Power Consumption'],
  [/装配/g, 'Install '],
  [/脑/g, 'PC'],
  [/蓝/g, 'Blue'],
  [/连接器/g, 'Connector'],
  [/带 RJ45/g, 'Powered RJ45'],
  [/带 /g, 'Powered '],
  [/为 /g, 'is '],
  [/至 /g, 'to '],
  [/最大 Can/g, 'Max Expandable'],
  [/Can Supports/g, 'Supports'],
  [/Can Expansion/g, 'Expansion'],
  [/ChannelChannel/g, 'Channel'],
  [/Gigabit 网 work/g, 'Gigabit Network'],
  [/ 网 work/g, ' Network'],
  [/Dual-Core 核/g, 'Dual-Core'],
  [/核 /g, 'Core '],
  [/核$/g, 'Core'],

  // ─── 修正大小写和格式 ───
  [/(\d+)Power/g, '$1 Power'],
  [/(\d+)Gigabit/g, '$1 Gigabit'],
  [/(\d+)HDD/g, '$1 HDD'],
  [/Provides(\d)/g, 'Provides $1'],
  [/Supports(\d)/g, 'Supports $1'],
  [/([a-z])GHz/g, '$1 GHz'],
  [/(\d)G Hz/g, '$1GHz'],
  [/ACCELERATOR/g, 'Accelerator'],
  [/  +/g, ' '],
  [/Accelerator Card Card/g, 'Accelerator Card'],

  // ─── 第七波：绝对最后残词 ───
  [/卡;/g, 'Card;'],
  [/卡,/g, 'Card,'],
  [/卡\b\s*$/g, 'Card'],
  [/器$/g, 'ler'],
  [/器 /g, 'ler '],
  [/控制器/g, 'Controller'],
  [/Audio Controlller/g, 'Audio Controller'],
  [/独 /g, 'Independent '],
  [/路 /g, 'Socket '],
  [/高达/g, 'Up to '],
  [/拓展/g, 'Expandable '],
  [/集 /g, 'Integrated '],
  [/ChannelHigh/g, 'Channel High'],
  [/OutputDP/g, 'Output DP'],
  [/Displays/g, 'Display'],
  [/SupportsExpansion/g, 'Supports Expansion'],
  [/GPU Accelerator 卡/g, 'GPU Accelerator Card'],
  [/  +/g, ' '],
  [/双核/g, 'Dual-Core'],
  [/二线程/g, 'Dual-Thread'],
  [/二/g, 'Two '],
  [/卡槽/g, 'Card Slot'],
  [/技术/g, 'Technology'],
  [/络/g, 'work'],
  [/网络work/g, 'Network'],
  [/版/g, 'Version'],
  [/台 /g, ''],
  [/与 /g, 'with '],
  [/球/g, 'Ball'],  // BGA package
  [/合(?![一三二四])/g, 'in'],
  [/雷电/g, 'Thunderbolt'],
  [/用于/g, 'for '],
  [/盘位/g, 'Drive Bay'],
  [/位/g, 'Bay'],
  [/显/g, 'Display'],
  [/兼容/g, 'Compatible with '],
  [/景嘉微/g, 'Jingjia Micro'],
  [/可信/g, 'Trusted'],
  [/电口/g, 'RJ45 Port'],
  [/电/g, 'RJ45 '],
  [/两/g, 'Two '],
  [/卡$/g, 'Card'],
  [/卡 /g, 'Card '],
  [/国产化/g, 'Domestic'],
  [/产/g, ''],
  [/化/g, 'ized'],

  // ─── 再修正 ───
  [/Two ×/g, 'Two'],
  [/work 络/g, 'Network'],
  [/络 Port/g, 'Network Port'],
  [/HzDual/g, 'Hz Dual'],
  [/ThreadProcessor/g, 'Thread Processor'],
  [/Onboard([A-Z])/g, 'Onboard $1'],
  [/ModuleApplication/g, 'Module Application'],
  [/Application\b(?!\s)/g, 'Application '],
  [/PortDisplayPort/g, 'Port Display Port'],
  [/DisplayPort \(/g, 'Display ('],
  [/Max(\d)/g, 'Max $1'],
  [/Provides(\d)/g, 'Provides $1'],
  [/Supports(\d)/g, 'Supports $1'],
  [/GigabitEthernet/g, 'Gigabit Ethernet'],
  [/络 /g, 'Network '],
  [/Ethernet 络/g, 'Ethernet Network'],
  [/with GPU/g, 'with GPU'],
  [/RJ45 Port Port/g, 'RJ45 Port'],
  [/  +/g, ' '],
  [/段式/g, 'Pole '],
  [/段/g, 'Pole '],
  [/灯(?!泡)/g, 'LED'],
  [/翻/g, 'Tilt'],
  [/小(?!时)/g, 'Small '],
  [/尺寸(?!寸)/g, 'Size '],
  [/至 /g, 'to '],
  [/至$/g, 'to'],
  [/最大\b/g, 'Max '],
  [/和 /g, 'and '],
  [/和$/g, 'and'],
  [/加速卡/g, 'Accelerator Card'],
  [/冗/g, 'Redundancy'],
  [/亮/g, 'Glossy'],
  [/型/g, 'Type'],
  [/主板/g, 'Motherboard'],
  [/核核/g, '核 '],
  [/拨钮/g, 'Toggle'],
  [/应用/g, 'Application'],
  [/其中/g, 'Where '],
  [/串行/g, 'Serial'],
  [/最高/g, 'Up to'],
  [/硬件/g, 'Hardware'],
  [/需求/g, 'Requirement'],
  [/外接/g, 'External'],
  [/(\d+)核\b/g, '$1-Core'],
  [/核\s+核/g, 'Core '],
  [/核$/g, 'Core'],
  [/制$/g, ''],
  [/制,/g, ','],
  [/志强/g, 'Xeon'],
  [/冗,/g, 'Redundancy,'],

  // ─── 修正错误替换 ───
  [/Pole de/g, 'Pole'],
  [/4 Pole/g, '4-Pole'],
  [/de Stand/g, 'Stand'],
  [/de 3/g, '3-'],
  [/Full-Function Type/g, 'Full-Function Type'],
  [/Full Function/g, 'Full-Function'],
  [/Led LED/g, 'LED'],
  [/HDD LEDLED/g, 'HDD LED'],
  [/etc\. Multiple/g, 'etc. Multiple'],
  [/Multiple Types/g, 'Various'],
  [/G Hz/g, 'GHz'],
  [/M Hz/g, 'MHz'],
  [/  +/g, ' '],
  [/可(?!选|拆|编|伸|扩|升|旋)/g, 'Can '],
  [/可$/g, 'Yes'],
  [/级/g, ''],
  [/超/g, 'Super '],
  [/会有/g, 'May Have '],
  [/第(\d)/g, '$1'],  // "第12" → "12"
  [/第 /g, ''],
  [/至第/g, '~'],
  [/单/g, 'Single '],
  [/插座/g, 'Socket'],
  [/总线/g, 'Bus'],
  [/三层/g, '3-Layer'],
  [/全功能/g, 'Full-Function'],
  [/全(?!系列|高|长|铝|金|球)/g, 'Full '],
  [/基于/g, 'Based on '],
  [/种/g, ' Types'],
  [/等 /g, 'etc. '],
  [/等$/g, 'etc.'],
  [/三/g, 'Triple '],
  [/前后/g, 'Front/Rear'],
  [/后(?!IO|置)/g, 'Rear '],
  [/前(?!IO|置|面板)/g, 'Front '],
  [/最大可选/g, 'Max Optional '],
  [/Hz\b/g, 'Hz'],
  [/G Hz/g, 'GHz'],
  [/M Hz/g, 'MHz'],
  [/mSAT A/g, 'mSATA'],
  [/SAT A/g, 'SATA'],
  [/Mini PC Ie/g, 'Mini PCIe'],
  [/PC Ie/g, 'PCIe'],
  [/PCIe Ie/g, 'PCIe'],
  [/NIC Ie/g, 'NIC'],
  [/槽位/g, 'Slot'],
  [/槽/g, 'Slot'],
  [/模/g, 'Mo'],
  [/式/g, 'de'],
  [/模de/g, 'Mode'],
  [/英\"/g, '"'],  // 修复"英寸"拆分问题
  [/英寸/g, '"'],
  [/DesignSpec/g, 'Design'],
  [/PortDual/g, 'Port Dual'],
  [/Audios/g, 'Audio'],
  [/SupportsSupports/g, 'Supports'],
  [/Multiple Expansion/g, 'Multiple Expansion'],
  [/ ExpansionMultiple/g, ' Expansion Multiple'],
  [/专用/g, 'Dedicated '],
  [/PCB背面/g, 'PCB Back'],
  [/背面/g, 'Back'],
  [/采用/g, 'Uses '],
  [/  +/g, ' '],
  [/的 /g, ' '],
  [/的/g, ' '],
  [/或/g, 'or'],
  [/和 /g, 'and '],
  [/时/g, ''],
  [/多/g, 'Multiple '],
  [/几/g, 'and '], // typo: 几 → 及
  [/式/g, '-Style'],
  [/灯\b/g, 'LED'],
  [/控/g, 'Control'],
  [/虚拟/g, 'Virtual'],
  [/媒体/g, 'Media'],
  [/运行/g, 'Running '],
  [/设计/g, 'Design'],
  [/独立/g, 'Independent '],
  [/无(?!冷凝|线|风|论)/g, 'No '],
  [/小尺寸/g, 'Small Form Factor '],
  [/口/g, 'Jack'],
  [/标准/g, 'Standard '],
  [/专用/g, 'Dedicated '],
  [/选(?!项|配)/g, 'Select '],
  [/插孔/g, 'Jack'],
  [/模式/g, 'Mode'],
  [/集成/g, 'Integrated '],
  [/旋转/g, 'Rotation'],
  [/旋/g, 'Rotate'],
  [/前后/g, 'Front/Back'],
  [/板载显示/g, 'Onboard Display'],
  [/板载/g, 'Onboard '],
  [/条形/g, 'Stick '],
  [/白\/黑/g, 'White/Black'],
  [/黑\/白/g, 'Black/White'],
  [/黑\/银/g, 'Black/Silver'],
  [/白/g, 'White'],
  [/银白/g, 'Silver White'],
  [/银/g, 'Silver'],

  // ─── 格式标准化 ───
  [/Mini-PC Ie/g, 'Mini PCIe'],
  [/PC Ie/g, 'PCIe'],
  [/PCIe Ie/g, 'PCIe'],

  // ─── 大小写校正 ───
  [/\bGpu\b/g, 'GPU'],
  [/\bCpu\b/g, 'CPU'],
  [/\bSsd\b/g, 'SSD'],
  [/\bHdd\b/g, 'HDD'],
  [/\bNic\b/g, 'NIC'],
  [/\bPc\b/g, 'PC'],
  [/\bPcie\b/g, 'PCIe'],
  [/\bDc\b/g, 'DC'],
  [/\bIo\b/g, 'IO'],
  [/\bLed\b/g, 'LED'],
  [/\bOs\b/g, 'OS'],
  [/\bMxm\b/g, 'MXM'],
  [/\bTpm\b/g, 'TPM'],
  [/\bTcm\b/g, 'TCM'],

  // ─── 残留中文清理 ───
  [/双宽全长/g, 'Dual-Width Full-Length'],
  [/全长/g, 'Full-Length'],
  [/全高/g, 'Full-Height'],
  [/半高/g, 'Half-Height'],
  [/单路/g, 'Single Socket'],
  [/双路/g, 'Dual Socket'],
  [/四路/g, '4-Socket'],
  [/颗/g, '×'],
  [/张/g, '×'],
  [/条/g, ''],
  [/组/g, ''],
  [/位/g, '-bit'],
  [/声/g, 'Channel'],
  [/道/g, 'Channel'],
  [/高保真/g, 'HD'],
  [/核心/g, 'Core'],
  [/线程/g, 'Thread'],
  [/主频/g, 'Base Freq'],
  [/移动/g, 'Mobile'],
  [/移动版/g, 'Mobile'],
  [/桌面/g, 'Desktop'],
  [/配置/g, 'Config'],
  [/差异/g, 'Varies'],
  [/不同/g, 'Different'],
  [/信号/g, 'Signal'],
  [/带宽/g, 'Bandwidth'],
  [/总线/g, 'Bus'],
  [/协议/g, 'Protocol'],
  [/依据/g, 'Per'],
  [/依赖/g, 'Dependent on'],
  [/符合/g, 'Compliant with'],
  [/和其他/g, 'and'],
  [/和 /g, 'and '],

  // ─── 量词/单位 ───
  [/寸/g, '"'],
  [/英寸/g, '"'],
  [/(\d+)核/g, '$1-Core'],
  [/(\d+)线程/g, '$1-Thread'],
  [/级/g, ' Level'],
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
  [/第(\d+)pin/g, 'Pin $1'],
  [/腔体/g, 'Chamber'],
  [/三路/g, 'Triple'],
  [/同时/g, 'Simultaneous'],
  [/显示输出,支持/g, 'Display Output, Supports'],

  // ─── 逗号/分号清理 ───
  [/，/g, ', '],
  [/；/g, '; '],
  [/、/g, ', '],
  [/（/g, ' ('],
  [/）/g, ') '],
  [/：/g, ': '],
  [/　/g, ' '],
  [/～/g, '~'],
  [/~/g, '~'],

  // ─── 空格清理 ───
  [/([A-Z])([A-Z][a-z])/g, '$1 $2'],  // 驼峰分词
  [/  +/g, ' '],
  [/\n+/g, '\n'],
  [/^\s+/gm, ''],
  [/\s+$/gm, ''],
  [/\s+([,.;:!)])/g, '$1'],
  [/\(\s+/g, '('],
  [/\s+\)/g, ')'],

  // ─── 第二轮清理（处理新增伪词） ───
  [/Dual Channel/g, 'Dual Channel'],
  [/Single Channel/g, 'Single Channel'],
  [/\bNetworkEthernet\b/g, 'Network Ethernet'],
  [/SystemReset/g, 'System Reset'],
  [/Auto Power-on/g, 'Auto Power-On'],
  [/Per CPU Config/g, 'Per CPU Configuration'],
  [/Optional Config/g, 'Optional Configuration'],
];

// duibi 专用翻译映射
const DUIBI_MAP = {
  '1L云终端': '1L Cloud Terminal',
  '书本型高性能商务机': 'Book-sized High-Performance Business PC',
  '高性能独显终端': 'High-Performance Discrete GPU Terminal',
  'E60系列产品是一款高性能、风扇散热结构的工控准系统，机箱使用全铝合金材质；': 'The E60 series is a high-performance, fan-cooled industrial control system with an all-aluminum alloy chassis.',
  '21升高性能商务办公机': '21L High-Performance Business PC',
  '20升高性能商务办公机': '20L High-Performance Business PC',
  '28升高性能工作站': '28L High-Performance Workstation',
  '支持 Intel®  Apollo Lake平台系列处理器；': 'Supports Intel® Apollo Lake Platform Series Processors.',
  '2L Intel平台迷你主机': '2L Intel Platform Mini PC',
  '性价比1L云终端': 'Cost-Effective 1L Cloud Terminal',
  '7L桌面高性能工作站': '7L Desktop High-Performance Workstation',
  '桌面高性能工作站': 'Desktop High-Performance Workstation',
  '19升高性能商务办公机': '19L High-Performance Business PC',
};

// 产品名翻译映射
const PRODUCT_NAME_MAP = {
  // 特殊产品描述
  'E60系列产品是一款高性能、风扇散热结构的工控准系统，机箱使用全铝合金材质': 'The E60 series is a high-performance, fan-cooled industrial control barebone system with an all-aluminum alloy chassis.',
  'E85产品是一款高性能、嵌入式风扇散热结构的边缘计算准系统，机箱使用全铝合金材质': 'The E85 is a high-performance, embedded fan-cooled edge computing barebone system with an all-aluminum alloy chassis.',
  'EB16产品是一款高性能、风扇散热结构的边缘计算准系统，机箱使用钣金材质': 'The EB16 is a high-performance, fan-cooled edge computing barebone system with a sheet metal chassis.',
  'E60系列产品是一款高性能、风扇散热结构的工控准系统，机箱使用全铝合金材质；': 'The E60 series is a high-performance, fan-cooled industrial control barebone system with an all-aluminum alloy chassis.',
  'E85产品是一款高性能、嵌入式风扇散热结构的边缘计算准系统，机箱使用全铝合金材质；': 'The E85 is a high-performance, embedded fan-cooled edge computing barebone system with an all-aluminum alloy chassis.',
  'EB16产品是一款高性能、风扇散热结构的边缘计算准系统，机箱使用钣金材质；': 'The EB16 is a high-performance, fan-cooled edge computing barebone system with a sheet metal chassis.',
};

function applyRules(text) {
  let result = text;

  // 第一遍：应用所有替换规则
  for (const [pattern, replacement] of REPLACE_RULES) {
    result = result.replace(pattern, replacement);
  }

  // 第二遍：在中英文边界插入空格（处理规则未覆盖的残留中文）
  result = result.replace(/([一-鿿])([a-zA-Z0-9])/g, '$1 $2');
  result = result.replace(/([a-zA-Z0-9])([一-鿿])/g, '$1 $2');

  // 对边界修复后的文本再跑一遍规则
  for (const [pattern, replacement] of REPLACE_RULES) {
    result = result.replace(pattern, replacement);
  }

  // 后处理：清理多余空格
  result = result.replace(/  +/g, ' ');
  result = result.replace(/\s+([,.;:!)])/g, '$1');
  result = result.replace(/\(\s+/g, '(');
  result = result.replace(/\s+\)/g, ')');

  return result.trim();
}

function hasChinese(text) {
  return /[一-鿿]/.test(text);
}

function translate(text) {
  if (!text || !text.trim()) return text;
  const trimmed = text.trim();

  // 1. 查 duibi 专用映射
  if (DUIBI_MAP[trimmed]) return DUIBI_MAP[trimmed];

  // 2. 查产品专用映射
  if (PRODUCT_NAME_MAP[trimmed]) return PRODUCT_NAME_MAP[trimmed];

  // 3. 无中文，原样返回
  if (!hasChinese(trimmed)) return text;

  // 4. 应用规则翻译
  let result = applyRules(trimmed);

  // 5. 如果仍有中文，再走一遍规则（处理规则顺序依赖）
  if (hasChinese(result)) {
    result = applyRules(result);
  }

  return result;
}

// ============================================================
// 主流程
// ============================================================

function main() {
  console.log('读取产品数据...');
  const data = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));

  // 第一遍：收集未覆盖文本
  const uncovered = new Map(); // text → count
  for (const product of data.products) {
    if (product.duibi && product.duibi.trim() && hasChinese(product.duibi.trim())) {
      const tr = translate(product.duibi.trim());
      if (hasChinese(tr)) {
        uncovered.set(product.duibi.trim(), (uncovered.get(product.duibi.trim()) || 0) + 1);
      }
    }
    for (const field of ['yiwaibao', 'lifekit']) {
      if (!product[field]) continue;
      const matches = product[field].matchAll(/>([^<]+)</g);
      for (const m of matches) {
        const text = m[1].trim();
        if (text && hasChinese(text) && text.length >= 2) {
          const tr = translate(text);
          if (hasChinese(tr)) {
            uncovered.set(text, (uncovered.get(text) || 0) + 1);
          }
        }
      }
    }
  }

  if (uncovered.size > 0) {
    console.log(`\n⚠ 仍有 ${uncovered.size} 条文本无法翻译：`);
    const sorted = [...uncovered.entries()].sort((a, b) => b[1] - a[1]);
    sorted.forEach(([text, count]) => {
      const tr = translate(text);
      console.log(`  [×${count}] "${text.substring(0, 80)}"`);
      console.log(`        → "${tr.substring(0, 80)}"`);
    });

    if (uncovered.size > 50) {
      console.log(`\n未覆盖文本太多 (${uncovered.size})，需要继续补充规则。`);
      console.log('请将未覆盖文本保存到文件后人工补充。');
      // 仍然保存
    }
  }

  // 第二遍：实际翻译
  console.log('\n应用翻译到所有产品...');
  let htmlTranslated = 0;

  for (const product of data.products) {
    // duibi
    product.duibiEn = product.duibi ? translate(product.duibi.trim()) : '';

    // yiwaibao - 文本节点翻译
    if (product.yiwaibao) {
      product.yiwaibaoEn = product.yiwaibao.replace(/>([^<]+)</g, (match, text) => {
        const trimmed = text.trim();
        if (!trimmed) return match;
        const translated = translate(trimmed);
        if (translated !== text) htmlTranslated++;
        return '>' + text.replace(trimmed, translated) + '<';
      });
    } else {
      product.yiwaibaoEn = '';
    }

    // lifekit
    if (product.lifekit) {
      product.lifekitEn = product.lifekit.replace(/>([^<]+)</g, (match, text) => {
        const trimmed = text.trim();
        if (!trimmed) return match;
        const translated = translate(trimmed);
        if (translated !== text) htmlTranslated++;
        return '>' + text.replace(trimmed, translated) + '<';
      });
    } else {
      product.lifekitEn = '';
    }
  }

  console.log(`翻译了 ${htmlTranslated} 处 HTML 文本节点`);

  // 保存
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`保存到 ${PRODUCTS_PATH}`);

  // 验证示例
  const sample = data.products[0];
  console.log('\n=== 第一个产品翻译示例 ===');
  console.log('duibi:', sample.duibi, '→', sample.duibiEn);
  console.log('yiwaibao 片段:', sample.yiwaibaoEn?.substring(0, 200));
}

main();
