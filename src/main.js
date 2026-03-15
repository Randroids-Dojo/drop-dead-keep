// Drop Dead Keep — Main Entry Point
// Fling boulders to shatter bridges and send the undead tumbling into the abyss

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// Placeholder title screen
function drawTitleScreen() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars
  for (let i = 0; i < 50; i++) {
    const x = (Math.sin(i * 127.1) * 0.5 + 0.5) * canvas.width;
    const y = (Math.cos(i * 311.7) * 0.5 + 0.5) * canvas.height * 0.6;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.7})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Title
  ctx.fillStyle = '#e67e22';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DROP DEAD KEEP', canvas.width / 2, canvas.height / 2 - 40);

  // Tagline
  ctx.fillStyle = '#bdc3c7';
  ctx.font = '18px monospace';
  ctx.fillText('Fling boulders. Shatter bridges. Send the undead tumbling.', canvas.width / 2, canvas.height / 2 + 10);

  // Coming soon
  ctx.fillStyle = '#666';
  ctx.font = '14px monospace';
  ctx.fillText('COMING SOON', canvas.width / 2, canvas.height / 2 + 60);
}

drawTitleScreen();
