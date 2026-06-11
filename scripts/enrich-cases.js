const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE = 'http://easy-base.com.cn';
const OUT = path.join(__dirname, '..', 'src', 'images', 'cases');

// 缩略图列表 (从老网站列表页提取)
const thumbs = [
  { oid: 1, url: '/images/ProImg/2022-08-11210942pic_solution1.jpg', name: '智慧教育' },
  { oid: 2, url: '/images/ProImg/2023-04-17174234.jpg', name: '智慧办公' },
  { oid: 3, url: '/images/ProImg/2022-08-11 210046pic_solution3.jpg', name: '智慧园区' },
  { oid: 4, url: '/images/ProImg/2023-04-1594302.png', name: '智慧零售' },
  { oid: 6, url: '/images/ProImg/2024-07-12153721智慧交通2.jpg', name: '智慧交通' },
  { oid: 7, url: '/images/ProImg/2024-07-1215402020210916053622171.jpg', name: '智慧医疗' },
  { oid: 8, url: '/images/ProImg/2024-07-12154126智能制造1.jfif', name: '智能制造' },
  { oid: 9, url: '/images/ProImg/2024-07-121543505e796d7fc743a.jpg', name: '机器视觉' },
];

// 老网站上更丰富的描述
const richerDesc = {
  4: '智慧门店是融合大数据、智能软件和硬件，并通过CRM实现店铺互联网化、数据化、电子化的消费管理和营销服务平台，核心是彻底解决商户和消费者的交易管理问题，为门店创造更加高效的经济效益。',
  6: '智慧交通是以互联网、物联网等网络组合为基础，以智慧路网、智慧装备、智慧出行、智慧管理为重要内容的交通发展新模式，具有信息联通、实时监控、管理协同、人物合一的基本特征。',
  7: '智慧医疗英文简称WITMED，是最近兴起的专有医疗名词，通过打造健康档案区域医疗信息平台，利用最先进的物联网技术，实现患者与医务人员、医疗机构、医疗设备之间的互动，逐步达到信息化。',
  8: '智能制造（Intelligent Manufacturing，IM）是一种由智能机器和人类专家共同组成的人机一体化智能系统，它在制造过程中能进行智能活动，诸如分析、推理、判断、构思和决策等。通过人与智能机器的合作共事，去扩大、延伸和部分地取代人类专家在制造过程中的脑力劳动。它把制造自动化的概念更新，扩展到柔性化、智能化和高度集成化。',
  9: '机器视觉是人工智能正在快速发展的一个分支。简单说来，机器视觉就是用机器代替人眼来做测量和判断。机器视觉系统是通过机器视觉产品(即图像摄取装置，分CMOS和CCD两种)将被摄取目标转换成图像信号，传送给专用的图像处理系统，得到被摄目标的形态信息，根据像素分布和亮度、颜色等信息，转变成数字化信号;图像系统对这些信号进行各种运算来抽取目标的特征，进而根据判别的结果来控制现场的设备动作。',
};

// 同时修正：老网站上部分描述比我们短（被截断），用老网站的版本
const correctedDesc = {
  2: '智慧办公是一种利用云计算技术对办公业务所需的软硬件设备进行智能化管理,实现企业应用软件统一部署与交付的新型办公模式',
  3: '功能完善的商住办公综合体不断落成，对园区综合管理能力提出了更高的要求。合理利用智能化设备和数据，可以保证园区高效运营。',
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location.startsWith('http') ? res.headers.location : BASE + res.headers.location, dest)
          .then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  // === Part 1: Download thumbnails ===
  console.log('=== 下载缩略图 ===');
  for (const t of thumbs) {
    const fullUrl = encodeURI(BASE + t.url);
    const ext = path.extname(t.url).split('?')[0]; // .jpg, .png, .jfif
    const dest = path.join(OUT, `case-${t.oid}-thumb${ext}`);
    try {
      console.log(`[下载] ${t.name} 缩略图: ${fullUrl}`);
      await download(fullUrl, dest);
      const stat = fs.statSync(dest);
      console.log(`  → case-${t.oid}-thumb${ext} (${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ 失败: ${err.message}`);
    }
  }

  // === Part 2: Update cases.json descriptions ===
  console.log('\n=== 更新描述文字 ===');
  const casesPath = path.join(__dirname, '..', 'src', '_data', 'cases.json');
  const data = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));

  for (const sol of data.solutions) {
    // Add thumbnail field
    const t = thumbs.find(t => t.oid === sol.oid);
    if (t) {
      const ext = path.extname(t.url).split('?')[0];
      sol.thumb = `/images/cases/case-${sol.oid}-thumb${ext}`;
    }

    // Update descriptions
    if (richerDesc[sol.oid]) {
      console.log(`[描述] ${sol.name}: 更新为老网站丰富版 (${richerDesc[sol.oid].length} 字)`);
      sol.duibi = richerDesc[sol.oid];
    } else if (correctedDesc[sol.oid]) {
      console.log(`[描述] ${sol.name}: 微调对齐老网站 (${correctedDesc[sol.oid].length} 字)`);
      sol.duibi = correctedDesc[sol.oid];
    } else {
      console.log(`[描述] ${sol.name}: 无需变更`);
    }
  }

  fs.writeFileSync(casesPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log('\n写入完成: ' + casesPath);
  console.log('全部完成！');
})();
