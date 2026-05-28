/* ══ BACKGROUND CANVAS ══ */
(function () {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let W, H, pts = [];

    let phase = 'crawl';
    let phaseStart = performance.now();

    const CRAWL_DURATION = 18000;
    const N = 110;
    const CONN = 150;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    class Pt {
        constructor() {
            this.startX = 20 + Math.random() * 80;
            this.startY = 20 + Math.random() * 80;
            this.centerX = 0;
            this.centerY = 0;
            this.spreadAngle = Math.random() * Math.PI * 2;
            this.spreadRadius = 80 + Math.random() * 320;
            this.x = this.startX;
            this.y = this.startY;
            const a = Math.random() * Math.PI * 2;
            const s = 0.04 + Math.random() * 0.08;
            this.vx = Math.cos(a) * s;
            this.vy = Math.sin(a) * s;
            this.r = 1.4 + Math.random() * 1.6;
            this.alpha = 0.4 + Math.random() * 0.6;
            this.wanderX = 0;
            this.wanderY = 0;
            this.wanderReady = false;
        }

        getOpenPos(cx, cy) {
            return {
                x: cx + Math.cos(this.spreadAngle) * this.spreadRadius,
                y: cy + Math.sin(this.spreadAngle) * this.spreadRadius
            };
        }
    }

    pts = Array.from({ length: N }, () => new Pt());

    function frame(now) {
        requestAnimationFrame(frame);

        const cx = W / 2;
        const cy = H / 2;
        const elapsed = now - phaseStart;

        if (phase === 'crawl' && elapsed >= CRAWL_DURATION) {
            phase = 'wander';
            phaseStart = now;
            pts.forEach(p => {
                const open = p.getOpenPos(cx, cy);
                p.wanderX = open.x;
                p.wanderY = open.y;
                p.wanderReady = true;
            });
        }

        ctx.clearRect(0, 0, W, H);

        pts.forEach(p => {
            if (phase === 'crawl') {
                const t = Math.min(elapsed / CRAWL_DURATION, 1);
                const et = easeInOut(t);
                const shellCX = lerp(50, cx, et);
                const shellCY = lerp(50, cy, et);
                const openAmount = et;
                const open = p.getOpenPos(shellCX, shellCY);
                p.x = lerp(shellCX, open.x, openAmount);
                p.y = lerp(shellCY, open.y, openAmount);
            } else {
                p.wanderX += p.vx;
                p.wanderY += p.vy;
                if (p.wanderX < 15 || p.wanderX > W - 15) p.vx *= -1;
                if (p.wanderY < 15 || p.wanderY > H - 15) p.vy *= -1;
                p.x = p.wanderX;
                p.y = p.wanderY;
            }
        });

        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const a = pts[i], b = pts[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < CONN) {
                    const op = (1 - d / CONN) * 0.32;
                    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
                    g.addColorStop(0, `rgba(77,166,255,${op})`);
                    g.addColorStop(1, `rgba(168,85,247,${op})`);
                    ctx.strokeStyle = g;
                    ctx.lineWidth = 0.7;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        pts.forEach(p => {
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
            g.addColorStop(0, `rgba(100,120,255,${p.alpha * 0.4})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(160,180,255,${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    requestAnimationFrame(frame);
})();

/* ══ SCROLL UTILITY ══
   FIX #2: Renamed from scrollTo → scrollToSection to avoid overriding
   the native browser window.scrollTo(x, y) function, which caused
   broken/inconsistent scroll behaviour across browsers.
*/
function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ══ SCROLL SPY ══ */
const secs = ['home', 'about', 'skills', 'projects', 'experience', 'education', 'testimonials', 'contact'];
const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            document.querySelectorAll('.nav-links a').forEach(a =>
                a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)
            );
        }
    });
}, { threshold: .25 });
secs.forEach(s => { const el = document.getElementById(s); if (el) spy.observe(el); });

/* ══ REVEAL ON SCROLL ══ */
const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: .1 });
document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

/* ══ ABOUT SKILLS ══ */
const aboutSkillData = [
    { n: 'AI/ML Engineering', p: 95 },
    { n: 'LLMs & RAG', p: 90 },
    { n: 'AI Application Development', p: 92 },
    { n: 'Prompt Engineering & Gen AI', p: 88 },
];
document.getElementById('aboutSkills').innerHTML = aboutSkillData.map(s => `
  <div class="about-skill-item">
    <div class="about-skill-row">
      <span class="about-skill-name">${s.n}</span>
      <span class="about-skill-pct">${s.p}%</span>
    </div>
    <div class="about-track"><div class="about-fill" data-w="${s.p}"></div></div>
  </div>`).join('');

new IntersectionObserver(([e]) => {
    if (e.isIntersecting)
        document.querySelectorAll('.about-fill').forEach((b, i) =>
            setTimeout(() => b.style.width = b.dataset.w + '%', i * 150)
        );
}, { threshold: .3 }).observe(document.getElementById('about'));

/* ══ SKILLS GRID ══ */
const skillsData = [
    { icon: '🧠', grad: 'linear-gradient(135deg,#3b82f6,#6366f1)', title: 'AI/ML', tags: ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras', 'XGBoost'] },
    { icon: '💬', grad: 'linear-gradient(135deg,#a855f7,#ec4899)', title: 'LLMs & RAG', tags: ['OpenAI', 'LangChain', 'Vector DBs', 'Fine-tuning', 'Embeddings'] },
    { icon: '⚡', grad: 'linear-gradient(135deg,#06b6d4,#3b82f6)', title: 'Tools & Frameworks', tags: ['Python', 'FastAPI', 'React', 'TypeScript', 'Docker'] },
    { icon: '🤖', grad: 'linear-gradient(135deg,#ec4899,#a855f7)', title: 'AI Developer', tags: ['Chatbots', 'AI Agents', 'Automation', 'OpenAI API', 'Anthropic API'] },
    { icon: '✍️', grad: 'linear-gradient(135deg,#6366f1,#06b6d4)', title: 'Prompt Engineer', tags: ['Prompt Design', 'Chain-of-Thought', 'Few-Shot', 'System Prompts', 'Evaluation'] },
    { icon: '🔮', grad: 'linear-gradient(135deg,#10b981,#6366f1)', title: 'Generative AI', tags: ['GPT-4', 'Claude', 'Stable Diffusion', 'DALL-E', 'Midjourney API'] },
];
document.getElementById('skillsGrid').innerHTML = skillsData.map(s => `
  <div class="skill-card">
    <div class="skill-icon" style="background:${s.grad}">${s.icon}</div>
    <h3>${s.title}</h3>
    <div class="skill-tags">${s.tags.map(t => `<span class="stag">${t}</span>`).join('')}</div>
  </div>`).join('');

/* ══════════════════════════════════════════════════════════════════
   PROJECTS  ←  EDIT THIS SECTION WITH YOUR OWN PROJECTS
   ══════════════════════════════════════════════════════════════════
   For each project you can set:
   ─ image   : path to a screenshot  e.g. "images/proj1.png"
               OR leave empty ("") to use the emoji fallback
   ─ emoji   : shown when no image is provided
   ─ bg      : gradient shown when no image is provided
   ─ title   : project name
   ─ desc    : one-two sentence description
   ─ tags    : tech stack badges
   ─ liveUrl : URL of the live demo  (use "#" if not deployed)
   ─ codeUrl : GitHub repo URL       (use "#" if private)
   ══════════════════════════════════════════════════════════════════ */
const projData = [
    {
        image: '',
        emoji: '🤖',
        bg: 'linear-gradient(135deg,#1a1040,#2d1260)',
        title: 'AI-Powered RAG System',
        desc: 'Built an enterprise RAG system using LangChain and vector databases for intelligent document retrieval and question answering.',
        tags: ['Python', 'LangChain', 'Pinecone', 'OpenAI', 'FastAPI'],
        liveUrl: '#',
        codeUrl: '#',
    },
    {
        image: '',
        emoji: '🦾',
        bg: 'linear-gradient(135deg,#0f1a30,#1a2a50)',
        title: 'Multi-Agent Orchestration',
        desc: 'Developed a multi-agent system for automated task decomposition and execution using LLMs and custom orchestration logic.',
        tags: ['Python', 'LLMs', 'Redis', 'Docker', 'Kubernetes'],
        liveUrl: '#',
        codeUrl: '#',
    },
    {
        image: '',
        emoji: '🔬',
        bg: 'linear-gradient(135deg,#1a1a30,#2a2040)',
        title: 'ML Model Pipeline',
        desc: 'Created an end-to-end MLOps pipeline for model training, evaluation, and deployment on GCP with automated retraining.',
        tags: ['GCP', 'TensorFlow', 'MLflow', 'Airflow', 'Python'],
        liveUrl: '#',
        codeUrl: '#',
    },
    {
        image: '',
        emoji: '🤖',
        bg: 'linear-gradient(135deg,#1a2a1a,#2a4020)',
        title: 'AI Application Development',
        desc: 'Engineered production-ready AI applications integrating GPT-4 and Claude APIs, delivering conversational interfaces and intelligent automation for clients.',
        tags: ['OpenAI', 'Claude API', 'FastAPI', 'React', 'Python'],
        liveUrl: '#',
        codeUrl: 'https://github.com/MuhammadAsadKhan-11/ElectraGuard',
    },
    {
        image: '',
        emoji: '📊',
        bg: 'linear-gradient(135deg,#0f2030,#1a3050)',
        title: 'Real-time Analytics Dashboard',
        desc: 'Built a real-time ML analytics dashboard for monitoring model performance and data drift in production environments.',
        tags: ['React', 'TypeScript', 'WebSockets', 'PostgreSQL', 'Chart.js'],
        liveUrl: '#',
        codeUrl: '#',
    },
    {
        image: '',
        emoji: '🔍',
        bg: 'linear-gradient(135deg,#1a2030,#2a3050)',
        title: 'LLM Fine-tuning Platform',
        desc: 'Developed a platform for fine-tuning large language models on custom datasets with automated evaluation metrics.',
        tags: ['Hugging Face', 'PyTorch', 'PEFT', 'LoRA', 'Python'],
        liveUrl: '#',
        codeUrl: '#',
    },
];
/* ══ END OF PROJECTS CONFIG ══ */

document.getElementById('projGrid').innerHTML = projData.map(p => {
    const imgContent = p.image
        ? `<img src="${p.image}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
        : `<span style="font-size:3rem">${p.emoji}</span>`;
    return `
  <div class="proj-card">
    <div class="proj-img-placeholder" style="background:${p.image ? '#0a0a1a' : p.bg}">${imgContent}</div>
    <div class="proj-body">
      <div class="proj-title">${p.title}</div>
      <div class="proj-desc">${p.desc}</div>
      <div class="proj-tags">${p.tags.map(t => `<span class="ptag">${t}</span>`).join('')}</div>
      <div class="proj-links">
        <a class="plink" href="${p.liveUrl}" target="_blank" rel="noopener">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Live Demo
        </a>
        <a class="plink code" href="${p.codeUrl}" target="_blank" rel="noopener">
          <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          Code
        </a>
      </div>
    </div>
  </div>`;
}).join('');

/* ══ EXPERIENCE ══ */
const expData = [
    {
        period: '2026 - Present',
        role: 'AI/ML Intern',
        company: 'decodeslab',
        bullets: [
            'Led development of enterprise RAG systems serving 100K+ users',
            'Architected multi-agent AI systems reducing processing time by 60%',
            'Implemented MLOps pipelines on GCP with 99.9% uptime'
        ],
        align: 'right'
    },
    {
        period: '2025 - 2026',
        role: 'ML Engineer',
        company: 'Bixforge Solutions',
        bullets: [
            'Built production ML models improving prediction accuracy by 35%',
            'Developed real-time inference APIs handling 10M+ requests/day',
            'Mentored junior engineers on ML best practices and system design'
        ],
        align: 'left'
    },
];

const expWrap = document.getElementById('expWrap');
expData.forEach((e) => {
    const isRight = e.align === 'right';
    const div = document.createElement('div');
    div.className = 'exp-item';
    div.innerHTML = `
    ${isRight ? `<div class="exp-right"><div class="exp-card">
      <div class="exp-period"><svg fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>${e.period}</div>
      <div class="exp-role">${e.role}</div><div class="exp-company">${e.company}</div>
      <ul class="exp-bullets">${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
    </div></div>` : '<div class="exp-left"></div>'}
    <div class="exp-center"><div class="exp-dot-wrap"></div></div>
    ${!isRight ? `<div class="exp-right"><div class="exp-card">
      <div class="exp-period"><svg fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>${e.period}</div>
      <div class="exp-role">${e.role}</div><div class="exp-company">${e.company}</div>
      <ul class="exp-bullets">${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
    </div></div>` : '<div class="exp-right"></div>'}
  `;
    expWrap.appendChild(div);
});

/* ══ TESTIMONIALS ══ */
const testimonials = [
    { text: 'Asad transformed our AI infrastructure completely. The RAG system he built has become the backbone of our product, serving thousands of users daily with exceptional accuracy.', name: 'Sarah Johnson', role: 'CTO, Tech Innovations Inc.', color: '#6366f1', initials: 'SJ' },
    { text: 'Working with Asad on our ML pipeline was a game-changer. He delivered a scalable, production-ready system that reduced our model deployment time from weeks to hours.', name: 'Michael Chen', role: 'Head of AI, DataScale Solutions', color: '#a855f7', initials: 'MC' },
    { text: "Asad's expertise in LLMs and multi-agent systems is unmatched. He built our entire AI stack and it consistently exceeds performance benchmarks we set at the start.", name: 'Emily Rodriguez', role: 'VP Engineering, NeuralLab', color: '#3b82f6', initials: 'ER' },
];
let testiIdx = 0;

function renderTesti(idx) {
    const t = testimonials[idx];
    document.getElementById('testiText').textContent = `"${t.text}"`;
    document.getElementById('testiName').textContent = t.name;
    document.getElementById('testiRole').textContent = t.role;
    const av = document.getElementById('testiAvatar');
    av.textContent = t.initials;
    av.style.background = `linear-gradient(135deg,${t.color},${t.color}aa)`;
    document.querySelectorAll('.tdot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

const dots = document.getElementById('testiDots');
testimonials.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'tdot' + (i === 0 ? ' active' : '');
    d.onclick = () => { testiIdx = i; renderTesti(i); };
    dots.appendChild(d);
});

document.getElementById('testiPrev').onclick = () => {
    testiIdx = (testiIdx - 1 + testimonials.length) % testimonials.length;
    renderTesti(testiIdx);
};
document.getElementById('testiNext').onclick = () => {
    testiIdx = (testiIdx + 1) % testimonials.length;
    renderTesti(testiIdx);
};
renderTesti(0);

setInterval(() => {
    testiIdx = (testiIdx + 1) % testimonials.length;
    renderTesti(testiIdx);
}, 5000);

/* ══ CONTACT FORM — EmailJS ══
   FIX #3: EmailJS placeholders clearly marked — replace before deploying.

   SETUP STEPS:
   1. Go to https://www.emailjs.com/ and sign up (free)
   2. Add Gmail as an Email Service → copy the Service ID
   3. Create an Email Template → copy the Template ID
   4. Create an Auto-Reply Template → copy its Template ID
   5. Go to Account → copy your Public Key
   6. Replace the four placeholder strings below with your real values
*/
(function loadEmailJS() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = () => {
        emailjs.init('YOUR_PUBLIC_KEY'); // ← Step 4: replace with your Public Key
    };
    document.head.appendChild(script);
})();

document.querySelector('.cf-submit').addEventListener('click', async function () {
    const nameEl  = document.querySelector('.cf-input[placeholder="Your name"]');
    const emailEl = document.querySelector('.cf-input[type="email"]');
    const msgEl   = document.querySelector('.cf-textarea');

    const name    = nameEl.value.trim();
    const email   = emailEl.value.trim();
    const message = msgEl.value.trim();

    if (!name || !email || !message) {
        showToast('Please fill in all fields.', 'error');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
    }

    const btn = this;
    btn.disabled = true;
    btn.innerHTML = `<span style="opacity:.7">Sending…</span>`;

    try {
        await emailjs.send(
            'YOUR_SERVICE_ID',           // ← Step 2: replace with your Service ID
            'YOUR_TEMPLATE_ID',          // ← Step 3: replace with your Template ID
            {
                from_name:  name,
                from_email: email,
                message:    message,
                to_email:   'asadkhans2310861@gmail.com',
                reply_to:   email,
            }
        );

        await emailjs.send(
            'YOUR_SERVICE_ID',           // ← same Service ID
            'YOUR_AUTOREPLY_TEMPLATE_ID',// ← Step 3b: replace with your Auto-Reply Template ID
            {
                to_name:   name,
                to_email:  email,
                from_name: 'Muhammad Asad Khan',
            }
        );

        showToast("Message sent! I'll get back to you soon.", 'success');
        nameEl.value  = '';
        emailEl.value = '';
        msgEl.value   = '';
    } catch (err) {
        console.error(err);
        showToast('Something went wrong. Please email me directly.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<svg fill="none" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Send Message`;
    }
});

function showToast(msg, type) {
    const existing = document.querySelector('.cf-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'cf-toast';
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed; bottom: 32px; right: 32px; z-index: 9999;
        padding: 14px 22px; border-radius: 10px; font-size: 14px; font-weight: 500;
        background: ${type === 'success'
            ? 'linear-gradient(135deg,#10b981,#3b82f6)'
            : 'linear-gradient(135deg,#ef4444,#a855f7)'};
        color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,.4);
        animation: fadeInUp .3s ease; pointer-events: none;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}