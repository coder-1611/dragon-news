export function mountFooter() {
  const host = document.getElementById('foot');
  if (!host) return;
  host.className = 'foot';
  host.innerHTML = `
    <div class="wrap foot-grid">
      <div class="foot-brand"><span class="foot-name">Dragon News</span><p>Student journalism at Round Rock High School since 1913. Written, edited and published by Dragons.</p></div>
      <div class="foot-col mono"><h2>Read</h2><a href="/paper">Today's Paper</a><a href="/archive">Archive</a><a href="/about">About &amp; Crew</a></div>
      <div class="foot-col mono"><h2>Newsroom</h2><a href="/newsroom">Sign in</a><a href="/newsroom?join=1">Join the staff</a><a href="/newsroom/desk">Your desk</a></div>
      <div class="foot-col mono"><h2>Find us</h2><address>Round Rock High School<br>201 Deep Wood Drive<br>Round Rock, TX 78681<br>512-464-6000</address></div>
    </div>
    <div class="wrap foot-colophon mono"><span>© ${new Date().getFullYear()} Dragon News · Round Rock High School</span><span>Set in Grenze Gotisch, Bodoni Moda, Source Serif &amp; Martian Mono</span></div>`;
}
