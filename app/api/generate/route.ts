import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Setting max duration for Vercel/Next.js function (if applicable, up to tier limit)
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const input = {
      lyrics: "[inst]\n（清澈钢琴＋电子音色，像清晨第一束光）\n\n[verse]\n在还没醒来的世界线\n灵感轻轻敲响我房间\n一句故事 像流星划过天边\n未来在这一刻出现\n\n空白页面 无限可能\n心跳比倒计时更快\n角色睁开双眼的瞬间\n我听见世界在呼喊\n\n[chorus]\nAniKuku——\n把梦想写进每一帧画面\n从故事开始的冒险\n现在就向未来出发\n\nAniKuku——\n我站在世界的正中央\n分镜指向希望的方向\n这部动画 由我开场\n\n[verse]\n一致的笑容 不变的信念\n在时间轴中并肩向前\n镜头拉近 命运交叠\n每一次生成都是誓言\n\n不需要重来 不怕失败\n想象就是最强武器\n只要按下开始的瞬间\n世界就会回应你\n\n[chorus]\nAniKuku——\n把梦想写进每一帧画面\n从故事开始的冒险\n现在就向未来出发\n\nAniKuku——\n我站在世界的正中央\n角色为我奔向终章\n这部动画 由我开场\n\n[bridge]\n如果现实太过安静\n那就用想象打破边界\n就算明天还看不清\n此刻也要全力向前\n\nAI 不只是工具\n它听得懂我的心跳\n当世界按下暂停\n我选择继续燃烧\n\n[chorus]\nAniKuku——\n让世界看见我的名字\n一格一秒都是真实\n这是属于我的故事\n\nAniKuku——\n导演席上只有我\n命运镜头已经对焦\n下一幕 现在就到\n\n[inst]\n（吉他扫弦＋鼓点渐强，热血收尾）",
      caption: prompt,
      duration: 60,
      timeout_seconds: 30 // from the original snippet
    };

    const output = await replicate.run(
      "visoar/ace-step-1.5:fd851baef553cb1656f4a05e8f2f8641672f10bc808718f5718b4b4bb2b07794",
      { input }
    );

    let audioUrl = "";
    if (Array.isArray(output) && output.length > 0) {
      audioUrl = typeof output[0] === 'string' ? output[0] : (typeof output[0].url === 'function' ? output[0].url() : output[0]);
    } else {
      audioUrl = output as string;
    }

    return NextResponse.json({ url: audioUrl });
  } catch (error: any) {
    console.error('Replicate error:', error);
    return NextResponse.json({ error: error.message || 'Error generating music' }, { status: 500 });
  }
}
