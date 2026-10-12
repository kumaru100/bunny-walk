const BUNNY_ID = "bunny-walk-extension";
const BUNNY_WIDTH = 32;
let cleanupBunny;

function mountBunny() {
  if (document.getElementById(BUNNY_ID)) return;

  const host = document.createElement("div");
  host.id = BUNNY_ID;
  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      left: 0;
      bottom: 0;
      width: ${BUNNY_WIDTH}px;
      height: 26px;
      pointer-events: none;
    }
    button {
      all: initial;
      display: block;
      width: ${BUNNY_WIDTH}px;
      height: 26px;
      cursor: pointer;
      pointer-events: auto;
      background: url("${browser.runtime.getURL("assets/rabbit-idle.png")}") no-repeat 0 0;
      background-size: 320px 26px;
      image-rendering: pixelated;
      filter: grayscale(1) brightness(2.8);
      animation: bunny-idle 1.4s steps(10, end) infinite;
    }
    button.walking {
      background-image: url("${browser.runtime.getURL("assets/rabbit.png")}");
      background-size: 192px 26px;
      animation: bunny-walk 0.9s steps(6, end) infinite;
    }
    button.facing-right { transform: scaleX(-1); }
    button.paused { animation-play-state: paused; }
    @keyframes bunny-idle {
      from { background-position: 0 0; }
      to { background-position: -320px 0; }
    }
    @keyframes bunny-walk {
      from { background-position: 0 0; }
      to { background-position: -192px 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      button { animation-play-state: paused; }
    }
  `;
  const pet = document.createElement("button");
  pet.type = "button";
  pet.setAttribute("aria-label", "Pause the bunny");
  pet.title = "Click to pause the bunny";

  let timer;
  let paused = false;
  let left = Math.random() * Math.max(0, innerWidth - BUNNY_WIDTH);
  host.style.left = `${left}px`;

  function wander() {
    if (paused) return;
    const limit = Math.max(0, innerWidth - BUNNY_WIDTH);
    if (limit === 0) {
      timer = setTimeout(wander, 1500 + Math.random() * 1500);
      return;
    }
    left = Math.min(left, limit);
    let direction = Math.random() < 0.5 ? -1 : 1;
    if ((direction < 0 && left === 0) || (direction > 0 && left === limit)) {
      direction *= -1;
    }
    const available = direction < 0 ? left : limit - left;
    const distance = Math.min(available, 45 + Math.random() * 200);
    const target = left + direction * distance;
    const duration = (distance / (35 + Math.random() * 25)) * 1000;

    pet.classList.add("walking");
    pet.classList.toggle("facing-right", direction > 0);
    host.style.transition = `left ${duration}ms linear`;
    requestAnimationFrame(() => { host.style.left = `${target}px`; });
    timer = setTimeout(() => {
      left = target;
      pet.classList.remove("walking");
      timer = setTimeout(wander, 900 + Math.random() * 3500);
    }, duration);
  }

  pet.addEventListener("click", () => {
    paused = !paused;
    clearTimeout(timer);
    if (paused) {
      left = host.getBoundingClientRect().left;
      host.style.transition = "none";
      host.style.left = `${left}px`;
      pet.classList.remove("walking");
      pet.classList.add("paused");
      pet.setAttribute("aria-label", "Resume the bunny");
      pet.title = "Click to resume the bunny";
    } else {
      pet.classList.remove("paused");
      pet.setAttribute("aria-label", "Pause the bunny");
      pet.title = "Click to pause the bunny";
      wander();
    }
  });

  const handleResize = () => {
    clearTimeout(timer);
    left = Math.min(host.getBoundingClientRect().left, Math.max(0, innerWidth - BUNNY_WIDTH));
    host.style.transition = "none";
    host.style.left = `${left}px`;
    if (!paused) timer = setTimeout(wander, 500);
  };
  window.addEventListener("resize", handleResize);

  shadow.append(style, pet);
  document.documentElement.append(host);
  timer = setTimeout(wander, 1000 + Math.random() * 2500);
  cleanupBunny = () => {
    clearTimeout(timer);
    window.removeEventListener("resize", handleResize);
    host.remove();
  };
}

function removeBunny() {
  cleanupBunny?.();
  cleanupBunny = null;
}

browser.storage.local.get({ enabled: true }).then(({ enabled }) => {
  if (enabled) mountBunny();
});
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.enabled) return;
  changes.enabled.newValue ? mountBunny() : removeBunny();
});
