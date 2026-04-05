/**
 * particles.js — Floating particles + mouse glow tracking
 * Adds a premium interactive background to any page.
 */

(function () {
    // === Mouse glow tracking ===
    document.addEventListener("mousemove", (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        document.body.style.setProperty("--mouse-x", x + "%");
        document.body.style.setProperty("--mouse-y", y + "%");
    });

    // === Floating Particles ===
    const canvas = document.createElement("canvas");
    canvas.id = "particles-canvas";
    canvas.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 0; opacity: 0.6;
  `;
    document.body.prepend(canvas);

    const ctx = canvas.getContext("2d");
    let w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const particles = [];
    const PARTICLE_COUNT = 50;
    const colors = [
        "rgba(124, 58, 237, 0.3)",   // purple
        "rgba(59, 130, 246, 0.25)",   // blue
        "rgba(6, 182, 212, 0.2)",     // cyan
        "rgba(236, 72, 153, 0.15)",   // pink
        "rgba(16, 185, 129, 0.15)",   // green
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 2 + 0.5,
            dx: (Math.random() - 0.5) * 0.4,
            dy: (Math.random() - 0.5) * 0.3,
            color: colors[Math.floor(Math.random() * colors.length)],
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.01 + Math.random() * 0.02,
        });
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);

        particles.forEach((p) => {
            p.x += p.dx;
            p.y += p.dy;
            p.pulse += p.pulseSpeed;

            // Wrap around
            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;

            const scale = 0.7 + Math.sin(p.pulse) * 0.3;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * scale, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });

        // Draw connections between nearby particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(124, 58, 237, ${0.08 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
})();
