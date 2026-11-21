// Title Screen & Pause Menu

export class MenuManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'playing'; // 'title' | 'playing' | 'paused'
  }

  renderTitle(w, h) {
    const ctx = this.ctx;
    ctx.save();

    // Gradient overlay (clean bottom and vignette, allowing 3D background to shine)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(10, 15, 25, 0.45)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
    grad.addColorStop(1, 'rgba(10, 15, 25, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Title Logo
    const centerX = w * 0.5;
    const centerY = h * 0.42;

    ctx.textAlign = 'center';

    // Main Header: HEATWAVE
    ctx.font = '900 68px "Segoe UI", Impact, sans-serif';
    ctx.fillStyle = '#ff6f59'; // Warm neon coral
    ctx.fillText('HEATWAVE', centerX + 2, centerY - 28);
    ctx.fillStyle = '#fff4d0';
    ctx.fillText('HEATWAVE', centerX, centerY - 30);

    // Subtitle: CORAL VISTA
    ctx.font = '800 48px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#1fb5c9'; // Turquoise
    ctx.fillText('CORAL VISTA', centerX + 2, centerY + 28);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CORAL VISTA', centerX, centerY + 26);

    // Tagline (Spec requirement: "A Coral Vista crime story")
    ctx.font = 'italic 20px "Segoe UI", Georgia, serif';
    ctx.fillStyle = '#ffd3a8';
    ctx.fillText('A Coral Vista Crime Story', centerX, centerY + 72);

    // Menu Action Buttons
    const btnY = centerY + 130;
    const buttons = ['[ NEW GAME ]', '[ CONTINUE ]', '[ CONTROLS ]'];

    buttons.forEach((btn, idx) => {
      const bx = centerX;
      const by = btnY + idx * 36;
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillStyle = (idx === 0) ? '#f1c40f' : '#ffffff';
      ctx.fillText(btn, bx, by);
    });

    // Rodapé / Footer (Spec requirement: credits & version)
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillText('HEATWAVE: Coral Vista v2.0 · make.fun original open-world entry · Built with Three.js offline', centerX, h - 28);

    ctx.restore();
  }

  renderPause(w, h) {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(5, 10, 18, 0.75)';
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.45;

    ctx.textAlign = 'center';
    ctx.font = 'bold 44px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('GAME PAUSED', cx, cy - 60);

    const opts = ['RESUME (ESC)', 'SAVE GAME', 'LOAD GAME', 'MAP (M)'];
    opts.forEach((opt, idx) => {
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(opt, cx, cy + idx * 38);
    });

    ctx.restore();
  }
}
