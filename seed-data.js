/**
 * 内置测试内容（种子数据）
 * ------------------------------------------------------------------
 * 结构说明（后续新增测试照此格式即可，后台管理页也能可视化编辑）：
 *
 * test = {
 *   id,                // 唯一标识，新增时不要和已有重复
 *   title,             // 卡片标题
 *   subtitle,          // 卡片副标题
 *   emoji,             // 封面装饰符号（不用外部图片也能好看）
 *   coverColors,       // 封面渐变色 [起始, 结束]
 *   desc,              // 进入测试页的介绍
 *   questions: [       // 6~8 道题
 *     {
 *       id, title,
 *       options: [     // 每题固定 4 个选项
 *         { key:'A', text, weights: { 结果id: 分值, ... } },
 *         ...
 *       ]
 *     }
 *   ],
 *   results: [         // 结果画像
 *     {
 *       id, tag,           // 专属人设标签
 *       title,             // 结果标题
 *       short,             // 免费短评（几十字）
 *       full,              // 完整长报告（看广告/会员解锁）
 *       emoji, colors      // 结果配图用
 *     }
 *   ]
 * }
 *
 * 计分：把用户每个选项的 weights 累加到对应结果，得分最高的结果即为匹配报告。
 */

const tests = [
  // ==================== 测试 1：穿越 ====================
  {
    id: 'travel',
    title: '穿越后你是什么角色',
    subtitle: '一睁眼到了陌生世界，你的开局会是怎样？',
    emoji: '🌿',
    coverColors: ['#8FD3B6', '#5FB99A'],
    desc: '假如某天你穿越进一部没有剧本的剧，7 道题看看你会拿到什么开局身份。',
    questions: [
      {
        id: 't1q1', title: '醒来发现自己躺在陌生的草地，你第一件事是？',
        options: [
          { key: 'A', text: '先找个高处，看看这是哪儿', weights: { scout: 3, knight: 1, scholar: 0, artisan: 0 } },
          { key: 'B', text: '摸摸身上有没有带吃的', weights: { artisan: 3, scout: 1, knight: 0, scholar: 0 } },
          { key: 'C', text: '回忆一下自己为什么会在这', weights: { scholar: 3, artisan: 1, scout: 0, knight: 0 } },
          { key: 'D', text: '管它是哪，先喊两声有没有人', weights: { knight: 3, scholar: 1, scout: 0, artisan: 0 } }
        ]
      },
      {
        id: 't1q2', title: '遇到一条湍急的河，你会？',
        options: [
          { key: 'A', text: '观察水流，找最窄的地方过', weights: { scout: 3, scholar: 1, knight: 0, artisan: 0 } },
          { key: 'B', text: '找木头扎个简易筏子', weights: { artisan: 3, scout: 1, knight: 0, scholar: 0 } },
          { key: 'C', text: '想想有没有别的绕路办法', weights: { scholar: 3, knight: 1, scout: 0, artisan: 0 } },
          { key: 'D', text: '挽起袖子直接蹚过去', weights: { knight: 3, artisan: 1, scout: 0, scholar: 0 } }
        ]
      },
      {
        id: 't1q3', title: '村里人请你帮忙，你更可能被夸？',
        options: [
          { key: 'A', text: '"你把周围摸得真清楚"', weights: { scout: 3, knight: 1, scholar: 0, artisan: 0 } },
          { key: 'B', text: '"你做的东西真好用"', weights: { artisan: 3, scholar: 1, knight: 0, scout: 0 } },
          { key: 'C', text: '"你懂得真多"', weights: { scholar: 3, artisan: 1, scout: 0, knight: 0 } },
          { key: 'D', text: '"有你在我们就不怕了"', weights: { knight: 3, scout: 1, scholar: 0, artisan: 0 } }
        ]
      },
      {
        id: 't1q4', title: '夜里听到奇怪的声音，你的反应是？',
        options: [
          { key: 'A', text: '悄悄摸过去看个究竟', weights: { scout: 3, knight: 1, scholar: 0, artisan: 0 } },
          { key: 'B', text: '先检查门窗牢不牢', weights: { artisan: 3, scholar: 1, knight: 0, scout: 0 } },
          { key: 'C', text: '在心里推演可能的来源', weights: { scholar: 3, scout: 1, knight: 0, artisan: 0 } },
          { key: 'D', text: '拿起家伙就往外走', weights: { knight: 3, artisan: 1, scout: 0, scholar: 0 } }
        ]
      },
      {
        id: 't1q5', title: '给你一样随身物件，你会选？',
        options: [
          { key: 'A', text: '一张自己画的地图', weights: { scout: 3, artisan: 1, scholar: 0, knight: 0 } },
          { key: 'B', text: '一把万能小工具', weights: { artisan: 3, knight: 1, scout: 0, scholar: 0 } },
          { key: 'C', text: '一本写满笔记的册子', weights: { scholar: 3, scout: 1, knight: 0, artisan: 0 } },
          { key: 'D', text: '一件趁手的护身装备', weights: { knight: 3, scholar: 1, scout: 0, artisan: 0 } }
        ]
      },
      {
        id: 't1q6', title: '别人遇到难处，你通常？',
        options: [
          { key: 'A', text: '帮他看清局势，指出路在哪', weights: { scout: 3, scholar: 1, knight: 0, artisan: 0 } },
          { key: 'B', text: '动手帮他修好、搞定', weights: { artisan: 3, knight: 1, scout: 0, scholar: 0 } },
          { key: 'C', text: '帮他想明白问题出在哪', weights: { scholar: 3, artisan: 1, scout: 0, knight: 0 } },
          { key: 'D', text: '直接站出来替他挡着', weights: { knight: 3, scout: 1, scholar: 0, artisan: 0 } }
        ]
      },
      {
        id: 't1q7', title: '如果要在新世界留下点什么，你想？',
        options: [
          { key: 'A', text: '把每一处角落都记录成图', weights: { scout: 3, scholar: 1, knight: 0, artisan: 0 } },
          { key: 'B', text: '造一件大家都用得上的东西', weights: { artisan: 3, scout: 1, scholar: 0, knight: 0 } },
          { key: 'C', text: '写下这里的故事和规矩', weights: { scholar: 3, knight: 1, scout: 0, artisan: 0 } },
          { key: 'D', text: '成为一个被人记住的名字', weights: { knight: 3, artisan: 1, scout: 0, scholar: 0 } }
        ]
      }
    ],
    results: [
      {
        id: 'scout', tag: '荒野领航员', title: '你是那个总先找到路的人',
        short: '方向感是你的超能力，别人还在原地打转，你已经把地图画好了。',
        full: '在这个没有导航的世界里，你天生就是活体指南针。你不慌不忙，习惯先站高一点、看远一点，把混乱拆成一条条清晰的线。\n\n你的开局身份是「荒野领航员」：队伍里最被依赖的方向担当。哪里有捷径、哪里有风险，你总能提前嗅到。别人跟着你走，心里就踏实。\n\n小彩蛋：你的隐藏技能是「认路式直觉」——就算真的迷路了，你也能把迷路变成一场有趣的探索。',
        emoji: '🧭', colors: ['#8FD3B6', '#4FA98A']
      },
      {
        id: 'artisan', tag: '造物小能手', title: '你把日子过成了手工作坊',
        short: '别人还在发愁，你已经用石头和树枝做出了第三代升级版工具。',
        full: '你的世界里没有「将就」两个字。给你一堆不起眼的材料，你能捣鼓出让大家惊呼「这也能行？」的东西。\n\n你的开局身份是「造物小能手」：走到哪儿都能把生活 resurrect 得有滋有味。你相信动手就能解决大半问题，剩下的交给时间。\n\n小彩蛋：你的隐藏技能是「万物皆可改造」，据传说给你一把剪刀，你能给这个世界缝一件新外套。',
        emoji: '🛠️', colors: ['#F6D58A', '#E8AE54']
      },
      {
        id: 'scholar', tag: '好奇智者', title: '你是行走的十万个为什么',
        short: '你不一定跑得最快，但你一定是最先搞明白「为什么」的那个。',
        full: '你对世界永远有一股孩子气的好奇。遇到现象，你先想的是背后的道理；遇到难题，你先把前因后果理清楚。\n\n你的开局身份是「学者智者」：团队里负责想明白的那个人。你沉稳、靠谱，用知识给大家兜底。别人忙着走路，你负责告诉大家为什么要往这儿走。\n\n小彩蛋：你的隐藏技能是「一秒看穿剧本」，穿越这种事，你大概翻两页就猜到结局了。',
        emoji: '📚', colors: ['#8FA9D6', '#5C7FBA']
      },
      {
        id: 'knight', tag: '热血守护者', title: '有你在，大家就不慌了',
        short: '你不是想得最多的，但一定是第一个冲上去的。勇气是你最闪亮的名片。',
        full: '你身上有一股让人安心的力量。事情发生时，你或许没想太多，但脚步已经迈了出去。你不擅长观望，你擅长扛事。\n\n你的开局身份是「热血守护者」：队伍的盾，也是大家的底气。你把「我来」挂在嘴边，把危险挡在身后。\n\n小彩蛋：你的隐藏技能是「遇强则强」，越是关键时刻，你越能爆发出让人惊讶的能量。',
        emoji: '🛡️', colors: ['#F2A9A0', '#E07B72']
      }
    ]
  },

  // ==================== 测试 2：隐藏人格 ====================
  {
    id: 'hidden',
    title: '你的隐藏人格',
    subtitle: '表面之下的你，藏着怎样的一面？',
    emoji: '🫧',
    coverColors: ['#B8A6E6', '#8E7BCB'],
    desc: '每个人都有自己的 B 面。6 道题，看看平时不为人知的那个你是什么样。',
    questions: [
      {
        id: 't2q1', title: '周末突然空出一整天，你更想？',
        options: [
          { key: 'A', text: '约朋友出门热闹一下', weights: { warm: 3, calm: 0, curious: 1, dream: 0 } },
          { key: 'B', text: '宅着，享受一个人的安静', weights: { calm: 3, dream: 1, warm: 0, curious: 0 } },
          { key: 'C', text: '去尝试一家新店或新地方', weights: { curious: 3, warm: 1, calm: 0, dream: 0 } },
          { key: 'D', text: '窝着看剧、发呆、想事情', weights: { dream: 3, calm: 1, warm: 0, curious: 0 } }
        ]
      },
      {
        id: 't2q2', title: '朋友心情不好找你，你通常？',
        options: [
          { key: 'A', text: '陪他说话，想办法逗他开心', weights: { warm: 3, calm: 1, curious: 0, dream: 0 } },
          { key: 'B', text: '安静听着，给足他空间', weights: { calm: 3, dream: 1, warm: 0, curious: 0 } },
          { key: 'C', text: '帮他一起分析、想办法', weights: { curious: 3, warm: 1, calm: 0, dream: 0 } },
          { key: 'D', text: '分享一部治愈他的作品', weights: { dream: 3, calm: 1, warm: 0, curious: 0 } }
        ]
      },
      {
        id: 't2q3', title: '你更害怕哪种情况？',
        options: [
          { key: 'A', text: '被冷落、没人回应', weights: { warm: 3, curious: 1, calm: 0, dream: 0 } },
          { key: 'B', text: '计划被打乱、失去掌控', weights: { calm: 3, dream: 1, warm: 0, curious: 0 } },
          { key: 'C', text: '一成不变、没有新鲜事', weights: { curious: 3, warm: 1, calm: 0, dream: 0 } },
          { key: 'D', text: '日子太现实、没有想象空间', weights: { dream: 3, calm: 1, warm: 0, curious: 0 } }
        ]
      },
      {
        id: 't2q4', title: '朋友圈里你更像？',
        options: [
          { key: 'A', text: '热闹的组局发起人', weights: { warm: 3, curious: 1, calm: 0, dream: 0 } },
          { key: 'B', text: '偶尔冒泡的潜水员', weights: { calm: 3, dream: 1, warm: 0, curious: 0 } },
          { key: 'C', text: '什么都敢尝鲜的探店达人', weights: { curious: 3, warm: 1, calm: 0, dream: 0 } },
          { key: 'D', text: '分享灵感和碎碎念的文艺咖', weights: { dream: 3, calm: 1, warm: 0, curious: 0 } }
        ]
      },
      {
        id: 't2q5', title: '做决定时你更依赖？',
        options: [
          { key: 'A', text: '大家的意见和感受', weights: { warm: 3, calm: 1, curious: 0, dream: 0 } },
          { key: 'B', text: '自己内心的笃定', weights: { calm: 3, dream: 1, warm: 0, curious: 0 } },
          { key: 'C', text: '收集到的信息和数据', weights: { curious: 3, warm: 1, calm: 0, dream: 0 } },
          { key: 'D', text: '一瞬间的灵感和直觉', weights: { dream: 3, curious: 1, calm: 0, warm: 0 } }
        ]
      },
      {
        id: 't2q6', title: '如果有个超能力，你想要？',
        options: [
          { key: 'A', text: '让身边的人永远开心', weights: { warm: 3, dream: 1, calm: 0, curious: 0 } },
          { key: 'B', text: '让时间慢下来、从容一点', weights: { calm: 3, dream: 1, warm: 0, curious: 0 } },
          { key: 'C', text: '一秒学会任何新东西', weights: { curious: 3, warm: 1, calm: 0, dream: 0 } },
          { key: 'D', text: '把想象变成现实', weights: { dream: 3, calm: 1, warm: 0, curious: 0 } }
        ]
      }
    ],
    results: [
      {
        id: 'warm', tag: '暖光小太阳', title: '你藏着一团温暖的光',
        short: '你把别人照顾得很好，其实那份热乎劲儿，是你最珍贵的隐藏人格。',
        full: '在人前你可能只是随和好相处，但真正熟悉你的人知道，你身上有一股暖烘烘的力量。你在意别人，也擅长让气氛变好。\n\n你的隐藏人格是「暖光小太阳」：你可能不觉得自己特别，但你总在默默把周围照亮。谁难过，你第一个察觉；谁需要，你第一个到位。\n\n小彩蛋：你最该记得的是——照顾别人的同时，也要给自己留一份光。',
        emoji: '☀️', colors: ['#F6D58A', '#EFB95A']
      },
      {
        id: 'calm', tag: '静水深流', title: '你的平静是一种超能力',
        short: '外界的热闹很难扰动你，你心里有一片自己安静的湖。',
        full: '你不一定话多，但你的稳定让人安心。在这个吵闹的世界里，你像一处可以让人歇脚的角落，不张扬，却很可靠。\n\n你的隐藏人格是「静水深流」：你拥有自己的节奏，不容易被别人的评价带着跑。你更愿意想清楚再行动，质量永远比速度重要。\n\n小彩蛋：你的隐藏技能是「情绪稳定泡泡盾」，靠近你的人都会不知不觉慢下来。',
        emoji: '🌊', colors: ['#8FA9D6', '#5C7FBA']
      },
      {
        id: 'curious', tag: '好奇探索家', title: '你的心里住着十万个好奇',
        short: '你对世界永远保持新鲜感，是那种会把平凡日子过出花的人。',
        full: '你的眼睛总是亮亮的，对没见过的事物有一股天然的兴奋。你不满足于「一直这样」，总想再多看一点、多试一点。\n\n你的隐藏人格是「好奇探索家」：你把生活当成一场开放式游戏，支线任务比主线还精彩。你擅长发现，也乐于分享。\n\n小彩蛋：你的隐藏技能是「新鲜感雷达」，哪里有好玩的事，你总能第一个闻到味道。',
        emoji: '🔭', colors: ['#8FD3B6', '#4FA98A']
      },
      {
        id: 'dream', tag: '梦境造物者', title: '你的脑海里有一整个宇宙',
        short: '你看起来安静，脑子里的剧情却已经更新到第八季了。',
        full: '你的内心世界异常丰富。别人看到的是现实，你看到的是现实加上一层只有你懂的滤镜和剧情。你爱想象，也爱把想象藏起来。\n\n你的隐藏人格是「梦境造物者」：你用一个温柔的想象世界，给平凡生活加了糖。你的敏感不是弱点，是你的天线。\n\n小彩蛋：你的隐藏技能是「脑内小剧场」，据说到你这儿，一杯奶茶都能演出一部电影。',
        emoji: '🌙', colors: ['#B8A6E6', '#8E7BCB']
      }
    ]
  },

  // ==================== 测试 3：恋爱搭子 ====================
  {
    id: 'partner',
    title: '恋爱搭子适配测试',
    subtitle: '什么样的相处方式，最让你心动？',
    emoji: '🍃',
    coverColors: ['#F2A9A0', '#E07B72'],
    desc: '不谈玄学，只聊相处。7 道题看看什么样的人最可能对上你的频率。',
    questions: [
      {
        id: 't3q1', title: '理想的周末约会是？',
        options: [
          { key: 'A', text: '去一个没去过的地方冒险', weights: { explore: 3, food: 0, home: 0, talk: 1 } },
          { key: 'B', text: '找一家好吃的店慢慢吃', weights: { food: 3, home: 1, explore: 0, talk: 0 } },
          { key: 'C', text: '窝在一起各干各的也很好', weights: { home: 3, food: 1, explore: 0, talk: 0 } },
          { key: 'D', text: '找个咖啡馆聊到天黑', weights: { talk: 3, explore: 1, food: 0, home: 0 } }
        ]
      },
      {
        id: 't3q2', title: '对方做了什么最让你有好感？',
        options: [
          { key: 'A', text: '拉你一起去尝试新鲜事', weights: { explore: 3, talk: 1, food: 0, home: 0 } },
          { key: 'B', text: '记得你喜欢吃什么并安排好', weights: { food: 3, home: 1, explore: 0, talk: 0 } },
          { key: 'C', text: '尊重你想安静待着的时间', weights: { home: 3, food: 0, explore: 0, talk: 1 } },
          { key: 'D', text: '认真听你说话并接得住梗', weights: { talk: 3, food: 1, explore: 0, home: 0 } }
        ]
      },
      {
        id: 't3q3', title: '两个人意见不一致时，你希望？',
        options: [
          { key: 'A', text: '各让一步，然后一起去试试', weights: { explore: 3, talk: 1, food: 0, home: 0 } },
          { key: 'B', text: '先吃点好的，冷静下来再说', weights: { food: 3, talk: 1, home: 0, explore: 0 } },
          { key: 'C', text: '先各自待一会儿，不急着争', weights: { home: 3, food: 1, talk: 0, explore: 0 } },
          { key: 'D', text: '把话说开，聊透就好了', weights: { talk: 3, explore: 1, food: 0, home: 0 } }
        ]
      },
      {
        id: 't3q4', title: '你最想和对方一起做的事是？',
        options: [
          { key: 'A', text: '来一场说走就走的旅行', weights: { explore: 3, food: 1, home: 0, talk: 0 } },
          { key: 'B', text: '把城市里的好店刷个遍', weights: { food: 3, explore: 1, talk: 0, home: 0 } },
          { key: 'C', text: '在家做饭、看剧、发呆', weights: { home: 3, food: 1, explore: 0, talk: 0 } },
          { key: 'D', text: '彻夜长聊，交换彼此的故事', weights: { talk: 3, home: 1, explore: 0, food: 0 } }
        ]
      },
      {
        id: 't3q5', title: '你眼中的「浪漫」更接近？',
        options: [
          { key: 'A', text: '带我去看看从没见过的风景', weights: { explore: 3, talk: 1, food: 0, home: 0 } },
          { key: 'B', text: '记得我所有的小口味', weights: { food: 3, home: 1, talk: 0, explore: 0 } },
          { key: 'C', text: '允许我安心做自己', weights: { home: 3, talk: 1, food: 0, explore: 0 } },
          { key: 'D', text: '懂我话里没说出口的意思', weights: { talk: 3, food: 0, home: 1, explore: 0 } }
        ]
      },
      {
        id: 't3q6', title: '如果只能发一条消息，你会说？',
        options: [
          { key: 'A', text: '"周末有没有好玩的计划？"', weights: { explore: 3, food: 0, home: 0, talk: 1 } },
          { key: 'B', text: '"发现一家超好吃的，带你去"', weights: { food: 3, explore: 1, home: 0, talk: 0 } },
          { key: 'C', text: '"今天想在家躺平，陪我吗"', weights: { home: 3, food: 0, explore: 0, talk: 0 } },
          { key: 'D', text: '"突然想到你，想跟你说说话"', weights: { talk: 3, home: 1, food: 0, explore: 0 } }
        ]
      },
      {
        id: 't3q7', title: '一段关系里，你最看重？',
        options: [
          { key: 'A', text: '一起成长，不断有新鲜感', weights: { explore: 3, talk: 1, food: 0, home: 0 } },
          { key: 'B', text: '把日常的小日子过好', weights: { food: 3, home: 1, explore: 0, talk: 0 } },
          { key: 'C', text: '舒服自在，不用伪装', weights: { home: 3, food: 1, talk: 0, explore: 0 } },
          { key: 'D', text: '精神同频，聊得来', weights: { talk: 3, explore: 1, food: 0, home: 0 } }
        ]
      }
    ],
    results: [
      {
        id: 'explore', tag: '探险搭子', title: '你是天生的冒险队友',
        short: '和你在一起，生活永远不缺下一站。你适合那个愿意陪你闯的人。',
        full: '你骨子里讨厌一成不变。对你来说，最好的关系不是两个人静静待着，而是并肩去看看更大的世界。\n\n你的适配画像是「探险搭子」：你和另一半的默契，是在一次次新鲜体验里磨出来的。你们可能会为了赶一趟车手忙脚乱，但回头看全是笑着的故事。\n\n小彩蛋：你最怕的不是吵架，而是「每天都一样」。给生活留点未知，你会更快乐。',
        emoji: '🎒', colors: ['#8FD3B6', '#4FA98A']
      },
      {
        id: 'food', tag: '干饭搭子', title: '你把爱藏在每一餐里',
        short: '对你来说，一起好好吃饭就是最踏实的浪漫，烟火气里全是温柔。',
        full: '你相信「一起吃饭」是人与人之间最温暖的仪式。你会记得对方爱吃什么，也会在ta疲惫时端上一碗热乎的。\n\n你的适配画像是「干饭搭子」：你们的感情是在一餐一饭里慢慢炖出来的。没有轰轰烈烈，但每一顿都算数。\n\n小彩蛋：你的隐藏情话是「多吃点」，简单，却很真。',
        emoji: '🍲', colors: ['#F6D58A', '#E8AE54']
      },
      {
        id: 'home', tag: '宅家搭子', title: '舒服，是你最高的相处标准',
        short: '你不需要太多热闹，能安心做自己的人，就是最合拍的那个。',
        full: '你在关系里最看重的，是一种「不必用力」的自在。你不需要对方时时精彩，只需要在彼此身边可以彻底放松。\n\n你的适配画像是「宅家搭子」：你们的浪漫是一起窝着，各干各的也亲密。外界再吵，回到两个人的小世界就安静了。\n\n小彩蛋：你能分辨「孤独」和「独处」——和对了的人在一起，独处也是一种甜。',
        emoji: '🏡', colors: ['#8FA9D6', '#5C7FBA']
      },
      {
        id: 'talk', tag: '唠嗑搭子', title: '聊得来，是你心动的第一名',
        short: '一个接得住你所有碎碎念的人，比什么都珍贵。你是为对话而生的。',
        full: '你在意的是那种「被听懂」的感觉。一个眼神、一句玩笑对方都能接住，对你来说就是最高级的默契。\n\n你的适配画像是「唠嗑搭子」：你们的感情是在无数次聊天里长出来的。从琐事到梦想，聊着聊着就离不开了。\n\n小彩蛋：你的终极浪漫，是「我想跟你说说话」——简单一句，已经是很重的告白。',
        emoji: '💬', colors: ['#B8A6E6', '#8E7BCB']
      }
    ]
  }
];

// 浏览器环境：挂载到全局，供 data.js 读取
window.SEED_TESTS = tests;
