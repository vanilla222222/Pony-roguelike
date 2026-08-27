'use strict';
// ui/music-test.js — a preview panel for audio.js's background tracks
// (Sound.startMusic/stopMusic/listMusicTracks/currentMusicTrackId),
// reachable from the main menu's #musicTestBtn. Lets a track be
// auditioned without starting a run — built mainly so tracks can actually
// be listened to and iterated on (see audio.js's MUSIC_TRACKS), but it's
// just as useful later for checking what's landed.
//
// Follows the same overlay-panel shape as achievements/bestiary/skill
// tree (see main.js's openOverlay/toggleOverlay and the backdrop-click-
// to-close wiring) — reuses their .achv-summary/.achv-list/.achv-row/
// .achv-icon/.achv-text/.achv-name/.achv-desc classes rather than
// inventing a parallel set, plus two small new ones (see style.css's
// "Music Test panel" block) for the playing-row highlight and the
// per-row Play/Stop button.

function buildMusicTestPanel(){
  const list = document.getElementById('musicTestList');
  if (!list) return;
  list.innerHTML = '';
  const tracks = Sound.listMusicTracks();
  const currentId = Sound.currentMusicTrackId();
  if (!tracks.length) {
    const empty = document.createElement('p');
    empty.className = 'achv-desc';
    empty.textContent = 'No tracks yet.';
    list.appendChild(empty);
    return;
  }
  for (const t of tracks) {
    const isPlaying = currentId === t.id;
    const row = document.createElement('div');
    row.className = 'achv-row done music-test-row' + (isPlaying ? ' playing' : '');

    const icon = document.createElement('div');
    icon.className = 'achv-icon';
    icon.textContent = isPlaying ? '🔊' : '🎵';
    row.appendChild(icon);

    const text = document.createElement('div');
    text.className = 'achv-text';
    const name = document.createElement('div');
    name.className = 'achv-name';
    name.textContent = t.name;
    text.appendChild(name);
    const desc = document.createElement('div');
    desc.className = 'achv-desc';
    desc.textContent = isPlaying ? 'Now playing.' : 'Press Play to preview.';
    text.appendChild(desc);
    row.appendChild(text);

    const btn = document.createElement('button');
    btn.className = 'music-test-btn';
    btn.textContent = isPlaying ? '⏹ Stop' : '▶ Play';
    btn.onclick = () => {
      // Bug fix ("none of the music is actually in the menu") — a click
      // here IS a real user gesture, but nothing before this point
      // guaranteed one had ever fired yet (the #musicTestBtn click that
      // opened this panel now calls unlock() too — see main.js — but this
      // handles anyone who somehow reaches a Play click without that,
      // and unlock() is idempotent/cheap either way). Without this, a
      // still-suspended AudioContext schedules every node correctly and
      // silently produces no sound at all.
      Sound.unlock();
      Sound.play('uiClick');
      if (Sound.currentMusicTrackId() === t.id) {
        Sound.stopMusic();
        Sound.startAmbient(); // bring the menu drone back once nothing's previewing
      } else {
        Sound.stopAmbient(); // never layer a track under the menu drone
        Sound.startMusic(t.id);
      }
      buildMusicTestPanel(); // rebuild so the playing row/icon/button relabel immediately
    };
    row.appendChild(btn);
    list.appendChild(row); // bug fix ("no play buttons showing up") — the row was fully built but never actually attached to the panel
  }
}

// Called whenever the panel closes (Close button or clicking the dimmed
// backdrop — see main.js) so leaving the panel never leaves a preview
// track looping silently behind the main menu forever.
function closeMusicTestPanel(){
  if (Sound.currentMusicTrackId()) { Sound.stopMusic(); Sound.startAmbient(); }
}
