/**
 * 脑洞测试局（网站版）全局配置
 * ------------------------------------------------------------------
 * 集中放置上线前需要替换的占位配置，方便维护。
 * 所有测试均为趣味脑洞向，仅供娱乐，不含占卜/命理/心理诊断。
 */
window.APP_CONFIG = {
  // 固定声明文案（所有测试相关页面顶部展示）
  DISCLAIMER: '温馨提示：本测试仅供娱乐，不具备科学测评、心理诊断效力',

  // 会员价格（展示用）
  MEMBER_PRICE: '9.9',

  // 付款说明：扫码付款后点「我已付款」即可自助领码并立即开通（无需商户号）
  PAY_NOTE: '扫码付款后，点击上方「我已付款」按钮，系统会自动为你生成激活码并立即开通会员、解锁全部内容。每个设备 24 小时内可自助领取一次；换设备时可用激活码兑换。',

  // ============ 客服联系通道 ============
  // 直接联系方式：填了会在「联系客服」页展示，并支持一键复制；留空则只显示站内留言。
  // 建议至少填一个微信号；QQ/邮箱可选。改成你自己的即可，无需改代码。
  SERVICE_WECHAT: '',   // 例如：naodong_service
  SERVICE_QQ: '',       // 例如：123456789
  SERVICE_EMAIL: '',    // 例如：hello@example.com
  // 引导话术（展示在客服页顶部）
  SERVICE_TIP: '扫码付款后在弹窗点「我已付款」，系统会自动发你激活码并立即解锁会员，通常无需联系客服。如果点击后没有自动开通，或遇到其他问题，请在这里留言，我会尽快处理。',

  // 激励广告（网站版说明）：
  // 网站没有微信激励视频广告能力。这里用「演示解锁」模拟流程。
  // 真正上线如需广告变现，可接入 Google AdSense / 穿山甲等激励广告平台，
  // 在 APP_CONFIG.AD_DEMO 关闭后改为真实广告回调解锁。
  AD_DEMO: true,
  AD_DEMO_SECONDS: 5,
  // 看广告免费解锁完整报告的机会：每台设备仅 1 次。
  // 用过之后仍想看完整报告，需要开通会员（会员无广告、全部报告直接解锁）。
  AD_FREE_TIMES: 1,

  // 会员专享测试：这里的 id 对应的测试，未开通会员不能开始答题。
  // 目前「恋爱搭子适配测试」(partner) 为会员专享。
  // 也可在管理后台的「基本信息」里给单个测试打开「会员专享」开关。
  MEMBER_ONLY_TESTS: ['partner'],

  // 支付服务：
  // 同源部署时 API 前缀留空即可（本服务同时托管网站）。
  // 若网站在 GitHub Pages、支付服务在别处，填服务完整地址如 https://pay.example.com
  API_BASE: 'https://naodong-test.app.workbuddy.host',
  // 当网站在 GitHub Pages 等静态站点、后端在平台托管域名时，
  // 平台网关要求带上分享码才能访问接口。填后端分享链接里的 sharecode。
  // 同源部署（本站自己托管）保持空字符串即可。
  API_SHARECODE: 'QKCUX5Q6A5',

  // 会员价（分），与服务端 config.js 的 priceFen 保持一致
  PRICE_FEN: 990,

  // 种子题库版本：改动 seed-data.js 后 +1，老用户打开时会自动升级到新题库
  // （否则浏览器本地缓存的旧题库不会更新）
  SEED_VERSION: 3,
  SEED_VERSION_KEY: 'nd_web_seed_version',

  // 存储 key
  KEYS: {
    TESTS: 'nd_web_tests',
    MEMBER: 'nd_web_member',
    RESULTS: 'nd_web_results',
    UNLOCKS: 'nd_web_unlocks',
    ORDERS: 'nd_web_orders',
    PAY_CONFIG: 'nd_web_pay_config',
    CLIENT_ID: 'nd_web_client_id',
    // 看广告免费解锁已使用次数（每台设备仅 1 次）
    AD_FREE_USED: 'nd_web_ad_free_used'
  }
};
