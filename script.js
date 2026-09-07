const button = document.querySelector(".love-button");
const heartLayer = document.querySelector(".floating-hearts");

button.addEventListener("click", () => {
  for (let index = 0; index < 14; index += 1) {
    const heart = document.createElement("span");
    heart.className = "float-heart";
    heart.textContent = index % 3 === 0 ? "♥" : "♡";
    heart.style.left = `${42 + Math.random() * 16}%`;
    heart.style.setProperty("--size", `${12 + Math.random() * 18}px`);
    heart.style.setProperty("--duration", `${2.4 + Math.random() * 1.8}s`);
    heart.style.setProperty("--drift", `${-100 + Math.random() * 200}px`);
    heart.style.setProperty("--spin", `${-25 + Math.random() * 50}deg`);
    heart.style.animationDelay = `${Math.random() * 0.45}s`;
    heartLayer.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove());
  }
});
