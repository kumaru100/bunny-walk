const toggle = document.querySelector("input");
const status = document.querySelector("#status");

function render(enabled) {
  toggle.checked = enabled;
  status.textContent = enabled ? "Bunny is wandering" : "Bunny is napping";
}

browser.storage.local.get({ enabled: true }).then(({ enabled }) => render(enabled));
toggle.addEventListener("change", () => {
  browser.storage.local.set({ enabled: toggle.checked });
  render(toggle.checked);
});
