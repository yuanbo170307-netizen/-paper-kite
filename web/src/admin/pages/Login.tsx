import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../../services/api'

/* 纸鸢飞翔动画 - 使用与 logo 完全一致的造型 */
const KiteAnimation = () => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
      setMouse({ x, y })
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  const kiteX = (mouse.x - 0.5) * 20
  const kiteY = (mouse.y - 0.5) * 14

  return (
    <svg ref={svgRef} viewBox="0 0 600 700" fill="none" className="w-full max-w-[480px]">
      <style>{`
        @keyframes kiteFloat {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(8px, -14px) rotate(3deg); }
          50% { transform: translate(-6px, -22px) rotate(-4deg); }
          75% { transform: translate(10px, -8px) rotate(2deg); }
        }
        @keyframes cloud1 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(20px)} }
        @keyframes cloud2 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-16px)} }
        @keyframes cloud3 { 0%,100%{transform:translateX(0)} 50%{transform:translateX(12px)} }
        @keyframes windDash {
          0% { stroke-dashoffset: 40; opacity: 0; }
          20% { opacity: 0.4; }
          80% { opacity: 0.4; }
          100% { stroke-dashoffset: -40; opacity: 0; }
        }
        @keyframes ribbonWave1 {
          0%, 100% { d: path("M210 360 Q180 400, 195 440 Q210 480, 185 510 Q160 540, 180 580"); }
          33% { d: path("M210 360 Q235 405, 215 445 Q195 485, 220 515 Q245 545, 225 580"); }
          66% { d: path("M210 360 Q175 398, 190 438 Q205 478, 180 508 Q155 538, 175 580"); }
        }
        @keyframes ribbonWave2 {
          0%, 100% { d: path("M230 360 Q260 398, 245 438 Q230 478, 255 508 Q280 538, 260 580"); }
          33% { d: path("M230 360 Q205 402, 220 442 Q235 482, 210 512 Q185 542, 205 580"); }
          66% { d: path("M230 360 Q265 395, 250 435 Q235 475, 260 505 Q285 535, 265 580"); }
        }
        @keyframes stringSwing {
          0%, 100% { d: path("M300 300 Q290 380, 350 440 Q400 490, 470 560"); }
          50% { d: path("M300 300 Q330 385, 310 445 Q290 500, 470 560"); }
        }
        @keyframes treeSway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(1.5deg); }
        }
        @keyframes leafSway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-2deg); }
        }
        @keyframes grassWave {
          0%, 100% { transform: skewX(0deg); }
          50% { transform: skewX(3deg); }
        }
        @keyframes flowerBob {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(5deg); }
        }
        .kite-float { transform-origin: 300px 240px; animation: kiteFloat 6s ease-in-out infinite; }
        .cl1 { animation: cloud1 9s ease-in-out infinite; }
        .cl2 { animation: cloud2 11s ease-in-out infinite 1.5s; }
        .cl3 { animation: cloud3 8s ease-in-out infinite 3s; }
        .wd { stroke-dasharray: 20 20; animation: windDash 3.5s ease-in-out infinite; }
        .wd2 { stroke-dasharray: 16 20; animation: windDash 3.5s ease-in-out infinite 1.2s; }
        .wd3 { stroke-dasharray: 18 20; animation: windDash 3.5s ease-in-out infinite 2.4s; }
        .rb1 { animation: ribbonWave1 3.2s ease-in-out infinite; }
        .rb2 { animation: ribbonWave2 3.6s ease-in-out infinite 0.4s; }
        .kstr { animation: stringSwing 5s ease-in-out infinite; }
        .tree-sway { transform-origin: 480px 620px; animation: treeSway 4s ease-in-out infinite; }
        .leaf-sway1 { transform-origin: 480px 440px; animation: leafSway 3.5s ease-in-out infinite; }
        .leaf-sway2 { transform-origin: 460px 470px; animation: leafSway 4.2s ease-in-out infinite 0.5s; }
        .grass-w1 { transform-origin: bottom; animation: grassWave 3s ease-in-out infinite; }
        .grass-w2 { transform-origin: bottom; animation: grassWave 3.5s ease-in-out infinite 0.8s; }
        .grass-w3 { transform-origin: bottom; animation: grassWave 2.8s ease-in-out infinite 1.5s; }
        .flower1 { transform-origin: 95px 620px; animation: flowerBob 3s ease-in-out infinite 0.3s; }
        .flower2 { transform-origin: 165px 620px; animation: flowerBob 3.6s ease-in-out infinite 1s; }
        .flower3 { transform-origin: 350px 620px; animation: flowerBob 2.8s ease-in-out infinite 0.6s; }
        .flower4 { transform-origin: 550px 620px; animation: flowerBob 3.2s ease-in-out infinite 1.4s; }
      `}</style>

      {/* 云朵 */}
      <g className="cl1" opacity="0.3">
        <ellipse cx="90" cy="100" rx="50" ry="18" fill="#d4b5e0" />
        <ellipse cx="65" cy="93" rx="32" ry="14" fill="#d4b5e0" />
        <ellipse cx="120" cy="95" rx="35" ry="13" fill="#d4b5e0" />
      </g>
      <g className="cl2" opacity="0.22">
        <ellipse cx="460" cy="70" rx="55" ry="17" fill="#d4b5e0" />
        <ellipse cx="430" cy="62" rx="34" ry="14" fill="#d4b5e0" />
        <ellipse cx="495" cy="64" rx="28" ry="11" fill="#d4b5e0" />
      </g>
      <g className="cl3" opacity="0.18">
        <ellipse cx="500" cy="300" rx="38" ry="13" fill="#d4b5e0" />
        <ellipse cx="475" cy="294" rx="25" ry="11" fill="#d4b5e0" />
      </g>

      {/* 风线 */}
      <line x1="40" y1="200" x2="110" y2="196" stroke="#d4b5e0" strokeWidth="1.5" strokeLinecap="round" className="wd" />
      <line x1="60" y1="310" x2="120" y2="307" stroke="#d4b5e0" strokeWidth="1.2" strokeLinecap="round" className="wd2" />
      <line x1="440" y1="180" x2="510" y2="177" stroke="#d4b5e0" strokeWidth="1.2" strokeLinecap="round" className="wd3" />

      {/* 外层：鼠标跟随（inline transform） */}
      <g style={{ transform: `translate(${kiteX}px, ${kiteY}px)`, transition: 'transform 0.3s ease-out' }}>
        {/* 内层：CSS 浮动动画 */}
        <g className="kite-float">

          {/* 风筝线 */}
          <path className="kstr" d="M300 300 Q290 380, 350 440 Q400 490, 470 560" stroke="#94005C" strokeWidth="1" fill="none" opacity="0.4" />

          {/* logo 原始造型 - 缩放居中 */}
          <g transform="translate(30, 64) scale(0.4)">
            {/* 右翼 */}
            <path d="M760.581657 551.793365s213.624395-139.470818-402.710046-450.41432c0 0 804.524518 104.483704 402.710046 450.41432z" fill="#94005C" />
            {/* 左翼 */}
            <path d="M739.983441 544.628768s-90.094805-226.878899-446.414086-330.049093c-0.179115 0 542.718209 93.259169 446.414086 330.049093z" fill="#94005C" />
            {/* 头部 + 身体 + 眼睛 */}
            <path d="M1053.912192 202.63868l-48.599849 25.494024c-22.32966 3.224069-62.988747 7.164597-62.988747 7.164596-47.047519 23.16553-33.49449 24.717859-42.271121 166.636581-7.224302 117.618798-124.60428 172.786193-164.546907 188.249782a97.080287 97.080287 0 0 1-22.628185 4.656988c-87.467786 11.940995-183.533088 68.660719-237.088449 104.662818 70.093639-36.240919 190.697685-65.675471 190.697685-65.675471-25.494024 13.553029-82.154043 113.976794-82.154044 113.976795 63.824617-102.0358 197.026412-146.69512 197.026413-146.69512 224.789225-80.482304 210.460031-302.943035 210.460031-302.943035-1.671739-13.433619 62.093172-95.527958 62.093173-95.527958z m-87.646901 75.705906a13.553029 13.553029 0 1 1 13.553029-13.553029 13.493324 13.493324 0 0 1-13.553029 13.553029zM433.696927 729.594776s16.060638-12.597749 42.092007-29.852487c-18.687657 9.433386-33.85272 19.583231-42.092007 29.852487z" fill="#94005C" />
          </g>

          {/* 飘带 */}
          <path className="rb1" d="M210 360 Q180 400, 195 440 Q210 480, 185 510 Q160 540, 180 580" stroke="#94005C" strokeWidth="2.5" fill="none" opacity="0.55" strokeLinecap="round" />
          <path className="rb2" d="M230 360 Q260 398, 245 438 Q230 478, 255 508 Q280 538, 260 580" stroke="#b3007a" strokeWidth="2" fill="none" opacity="0.45" strokeLinecap="round" />

          {/* 飘带小菱形装饰 */}
          <g opacity="0.5">
            <polygon points="195,438 190,445 195,452 200,445" fill="#94005C">
              <animate attributeName="opacity" values="0.5;0.3;0.5" dur="3s" repeatCount="indefinite" />
            </polygon>
            <polygon points="245,436 240,443 245,450 250,443" fill="#b3007a">
              <animate attributeName="opacity" values="0.4;0.2;0.4" dur="3.5s" repeatCount="indefinite" />
            </polygon>
            <polygon points="185,508 180,514 185,520 190,514" fill="#94005C">
              <animate attributeName="opacity" values="0.4;0.2;0.4" dur="4s" repeatCount="indefinite" />
            </polygon>
            <polygon points="255,506 250,512 255,518 260,512" fill="#b3007a">
              <animate attributeName="opacity" values="0.3;0.15;0.3" dur="3.8s" repeatCount="indefinite" />
            </polygon>
          </g>
        </g>
      </g>

      {/* 远处小纸鸢剪影 */}
      <g opacity="0.1" className="cl2">
        <g transform="translate(55, 320) scale(0.1)">
          <path d="M760.581657 551.793365s213.624395-139.470818-402.710046-450.41432c0 0 804.524518 104.483704 402.710046 450.41432z" fill="#94005C" />
          <path d="M739.983441 544.628768s-90.094805-226.878899-446.414086-330.049093c-0.179115 0 542.718209 93.259169 446.414086 330.049093z" fill="#94005C" />
        </g>
      </g>
      <g opacity="0.07" className="cl3">
        <g transform="translate(420, 360) scale(0.07)">
          <path d="M760.581657 551.793365s213.624395-139.470818-402.710046-450.41432c0 0 804.524518 104.483704 402.710046 450.41432z" fill="#94005C" />
          <path d="M739.983441 544.628768s-90.094805-226.878899-446.414086-330.049093c-0.179115 0 542.718209 93.259169 446.414086 330.049093z" fill="#94005C" />
        </g>
      </g>

      {/* ===== 地面场景 ===== */}

      {/* 参天大树 - 右侧 */}
      <g className="tree-sway">
        {/* 树干 */}
        <path d="M475 620 L472 540 Q470 520, 468 500 L466 460 Q465 440, 468 420 L470 400" stroke="#6B4226" strokeWidth="14" fill="none" strokeLinecap="round" />
        {/* 树干纹理 */}
        <path d="M472 580 Q476 560, 471 540" stroke="#5A3520" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M470 500 Q475 480, 469 460" stroke="#5A3520" strokeWidth="2" fill="none" opacity="0.3" />
        {/* 右侧分支 */}
        <path d="M474 480 Q500 460, 520 440" stroke="#6B4226" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M520 440 Q535 428, 545 420" stroke="#6B4226" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        {/* 左侧分支 */}
        <path d="M468 450 Q440 430, 420 415" stroke="#6B4226" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M420 415 Q408 405, 400 395" stroke="#6B4226" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* 上方分支 */}
        <path d="M470 400 Q465 380, 455 365" stroke="#6B4226" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M470 400 Q478 375, 490 360" stroke="#6B4226" strokeWidth="4" fill="none" strokeLinecap="round" />

        {/* 树冠 - 多层叠加 */}
        <g className="leaf-sway1">
          <ellipse cx="480" cy="380" rx="65" ry="45" fill="#2d8a56" opacity="0.7" />
          <ellipse cx="455" cy="395" rx="50" ry="38" fill="#34a065" opacity="0.65" />
          <ellipse cx="510" cy="400" rx="45" ry="35" fill="#2d8a56" opacity="0.6" />
        </g>
        <g className="leaf-sway2">
          <ellipse cx="470" cy="360" rx="55" ry="40" fill="#3dba75" opacity="0.6" />
          <ellipse cx="500" cy="370" rx="40" ry="32" fill="#2d8a56" opacity="0.55" />
          <ellipse cx="440" cy="375" rx="35" ry="28" fill="#3dba75" opacity="0.5" />
          {/* 顶部 */}
          <ellipse cx="475" cy="340" rx="38" ry="30" fill="#34a065" opacity="0.6" />
        </g>
        {/* 右侧分支树叶 */}
        <ellipse cx="538" cy="425" rx="25" ry="20" fill="#3dba75" opacity="0.55" />
        {/* 左侧分支树叶 */}
        <ellipse cx="405" cy="400" rx="22" ry="18" fill="#2d8a56" opacity="0.5" />

        {/* 树根 */}
        <path d="M468 618 Q455 625, 445 628" stroke="#6B4226" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M482 618 Q495 625, 505 627" stroke="#6B4226" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </g>

      {/* 草地基底 */}
      <path d="M0 630 Q150 615, 300 625 Q450 618, 600 628 L600 700 L0 700 Z" fill="#4abe7a" opacity="0.25" />
      <path d="M0 640 Q100 632, 200 638 Q350 630, 500 636 Q550 633, 600 638 L600 700 L0 700 Z" fill="#3da86a" opacity="0.2" />

      {/* 小草丛 - 分散在底部 */}
      <g className="grass-w1">
        <path d="M30 630 Q32 610, 28 595" stroke="#4abe7a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M35 630 Q40 608, 38 590" stroke="#3da86a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M40 630 Q46 612, 50 598" stroke="#4abe7a" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      <g className="grass-w2">
        <path d="M120 628 Q118 612, 115 600" stroke="#3da86a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M126 628 Q130 608, 128 595" stroke="#4abe7a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M132 628 Q138 610, 140 598" stroke="#3da86a" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      <g className="grass-w3">
        <path d="M250 626 Q248 608, 244 594" stroke="#4abe7a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M256 626 Q260 606, 258 592" stroke="#3da86a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M262 626 Q268 610, 272 596" stroke="#4abe7a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      <g className="grass-w1">
        <path d="M310 628 Q308 614, 305 604" stroke="#3da86a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M316 628 Q320 610, 318 598" stroke="#4abe7a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      <g className="grass-w2">
        <path d="M395 625 Q392 608, 388 596" stroke="#4abe7a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M401 625 Q406 606, 404 594" stroke="#3da86a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M407 625 Q414 610, 416 598" stroke="#4abe7a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      <g className="grass-w3">
        <path d="M560 630 Q558 614, 554 602" stroke="#3da86a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M566 630 Q570 612, 568 600" stroke="#4abe7a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M572 630 Q578 616, 582 604" stroke="#3da86a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>

      {/* 花朵 1 - 粉色小花 */}
      <g className="flower1">
        <path d="M95 620 Q93 600, 90 585" stroke="#5ab87a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="88" cy="595" rx="3" ry="5" fill="#5ab87a" opacity="0.7" transform="rotate(-20, 88, 595)" />
        <circle cx="89" cy="582" r="5" fill="#f4a0c0" opacity="0.8" />
        <circle cx="83" cy="585" r="4.5" fill="#f0899e" opacity="0.7" />
        <circle cx="95" cy="585" r="4.5" fill="#f0899e" opacity="0.7" />
        <circle cx="86" cy="579" r="4.5" fill="#f4a0c0" opacity="0.7" />
        <circle cx="92" cy="579" r="4.5" fill="#f0899e" opacity="0.7" />
        <circle cx="89" cy="582" r="2.5" fill="#f7d26b" />
      </g>

      {/* 花朵 2 - 紫色小花 */}
      <g className="flower2">
        <path d="M165 622 Q167 600, 170 582" stroke="#5ab87a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="174" cy="592" rx="3" ry="5" fill="#5ab87a" opacity="0.7" transform="rotate(15, 174, 592)" />
        <circle cx="170" cy="578" r="4.5" fill="#c4a0e8" opacity="0.8" />
        <circle cx="164" cy="581" r="4" fill="#b48ed8" opacity="0.7" />
        <circle cx="176" cy="581" r="4" fill="#b48ed8" opacity="0.7" />
        <circle cx="167" cy="575" r="4" fill="#c4a0e8" opacity="0.7" />
        <circle cx="173" cy="575" r="4" fill="#b48ed8" opacity="0.7" />
        <circle cx="170" cy="578" r="2.2" fill="#f7d26b" />
      </g>

      {/* 花朵 3 - 橙色小花 */}
      <g className="flower3">
        <path d="M350 624 Q348 604, 345 588" stroke="#5ab87a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="340" cy="598" rx="3" ry="4.5" fill="#5ab87a" opacity="0.7" transform="rotate(-25, 340, 598)" />
        <circle cx="344" cy="585" r="4.5" fill="#f4b86b" opacity="0.8" />
        <circle cx="338" cy="588" r="4" fill="#e8a55a" opacity="0.7" />
        <circle cx="350" cy="588" r="4" fill="#e8a55a" opacity="0.7" />
        <circle cx="341" cy="582" r="4" fill="#f4b86b" opacity="0.7" />
        <circle cx="347" cy="582" r="4" fill="#e8a55a" opacity="0.7" />
        <circle cx="344" cy="585" r="2.2" fill="#f7d26b" />
      </g>

      {/* 花朵 4 - 粉红小花 */}
      <g className="flower4">
        <path d="M550 628 Q552 608, 555 592" stroke="#5ab87a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="555" cy="589" r="4" fill="#f08090" opacity="0.8" />
        <circle cx="549" cy="592" r="3.5" fill="#e07080" opacity="0.7" />
        <circle cx="561" cy="592" r="3.5" fill="#e07080" opacity="0.7" />
        <circle cx="552" cy="586" r="3.5" fill="#f08090" opacity="0.7" />
        <circle cx="558" cy="586" r="3.5" fill="#e07080" opacity="0.7" />
        <circle cx="555" cy="589" r="2" fill="#f7d26b" />
      </g>
    </svg>
  )
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!username || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(username, password)
      localStorage.setItem('appspaces_token', res.data.token)
      localStorage.setItem('appspaces_user', res.data.username)
      navigate('/admin')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* 左侧：卡通角色 */}
      <div className="hidden w-[55%] flex-col items-center justify-center overflow-hidden bg-[#f8f8f8] lg:flex">
        <div className="absolute left-8 top-6 flex items-center gap-2.5">
          <img src="/logo.svg" alt="纸鸢" className="h-8 w-8" />
          <span className="text-[17px] font-bold text-gray-800">纸鸢</span>
        </div>
        <p className="mb-4 text-[15px] font-medium tracking-widest text-gray-400">努力工作，快乐生活</p>
        <KiteAnimation />
      </div>

      {/* 右侧：登录表单 */}
      <div className="flex w-full items-center justify-center px-8 lg:w-[45%]">
        <div className="w-full max-w-[360px]">
          {/* 移动端 Logo */}
          <div className="mb-10 flex items-center justify-center gap-2 lg:hidden">
            <img src="/logo.svg" alt="纸鸢" className="h-9 w-9" />
            <span className="text-xl font-bold text-gray-800">纸鸢</span>
          </div>

          <h2 className="text-center text-[28px] font-semibold tracking-wider text-gray-800">登 录</h2>
          <p className="mt-2 text-center text-[13px] text-gray-400">请输入您的登录信息</p>

          <div className="mt-10 space-y-6">
            {/* 用户名 */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-gray-500">用户名或邮箱</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                  <svg className="h-[18px] w-[18px] text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="5" width="18" height="14" rx="3" />
                    <path d="M3 8l9 5 9-5" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  autoFocus
                  className="h-10 w-full border-b border-gray-200 bg-transparent pl-7 pr-3 text-[14px] text-gray-800 placeholder-gray-300 outline-none transition focus:border-gray-800"
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-gray-500">密码</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                  <svg className="h-[18px] w-[18px] text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="5" y="11" width="14" height="10" rx="3" />
                    <path d="M8 11V7a4 4 0 1 1 8 0v4" />
                  </svg>
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="h-10 w-full border-b border-gray-200 bg-transparent pl-7 pr-10 text-[14px] text-gray-800 placeholder-gray-300 outline-none transition focus:border-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute inset-y-0 right-0 flex items-center pr-1 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? (
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-600">
              {error}
            </div>
          )}

          {/* 继续按钮 */}
          <button
            onClick={handleLogin}
            disabled={loading || !username || !password}
            className="mt-8 h-11 w-full rounded-full border border-gray-800 bg-white text-[14px] font-medium text-gray-800 transition hover:bg-gray-800 hover:text-white active:scale-[0.98] disabled:opacity-40"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                登录中...
              </span>
            ) : '继续'}
          </button>

          <p className="mt-10 text-center text-[12px] text-gray-300">
            Powered by 纸鸢
          </p>
        </div>
      </div>
    </div>
  )
}
