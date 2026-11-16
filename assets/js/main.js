/* Green Advanced — progressive enhancement. The site is fully readable without this file. */
(() => {
  window.__ga = true;
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Entrance: wait for fonts (capped) so headline masks don't reflow mid-animation */
  const markLoaded = () => requestAnimationFrame(() => root.classList.add("is-loaded"));
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]).then(markLoaded);
  } else {
    markLoaded();
  }

  /* Header: solid background once the page has scrolled */
  const header = document.querySelector(".site-header");
  let scrollQueued = false;
  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    scrollQueued = false;
  };
  window.addEventListener("scroll", () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateHeader);
    }
  }, { passive: true });
  updateHeader();

  /* Mobile menu */
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.getElementById("mobile-menu");
  const main = document.getElementById("main");
  const footer = document.querySelector(".site-footer");

  const setMenu = (open) => {
    root.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.inert = !open;
    if (main) main.inert = open;
    if (footer) footer.inert = open;
    if (open) {
      const first = menu.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    }
  };

  if (toggle && menu) {
    menu.inert = true;
    menu.querySelectorAll("li a").forEach((a, i) => a.style.setProperty("--i", i));
    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && root.classList.contains("menu-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 960px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });
  }

  /* Split headlines into masked words */
  let wordIndex = 0;
  const splitNode = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          const outer = document.createElement("span");
          outer.className = "w";
          const inner = document.createElement("span");
          inner.className = "w__i";
          inner.style.setProperty("--i", wordIndex++);
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
        splitNode(child);
      }
    });
  };

  if (!reduceMotion.matches) {
    document.querySelectorAll("[data-split]").forEach((el) => {
      wordIndex = 0;
      splitNode(el);
      el.classList.add("is-split");
      if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "fade");
    });
  }

  /* Scroll-linked word highlight, only where CSS scroll timelines exist */
  if (!reduceMotion.matches && window.CSS && CSS.supports("animation-timeline: view()")) {
    document.querySelectorAll("[data-scrub]").forEach((el) => {
      const walk = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
              const s = document.createElement("span");
              s.className = "scrub-word";
              s.textContent = part;
              frag.appendChild(s);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            walk(child);
          }
        });
      };
      walk(el);
      el.classList.add("scrub");
    });
  }

  /* Stagger indices */
  document.querySelectorAll("[data-stagger]").forEach((group) => {
    group.querySelectorAll(":scope > [data-reveal]").forEach((el, i) => el.style.setProperty("--i", i));
  });

  /* Reveal on scroll */
  const revealables = document.querySelectorAll("[data-reveal], .sheet, .process__step");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("is-in"));
  }

  /* Process rail fills as the steps scroll into view */
  document.querySelectorAll(".process").forEach((list) => {
    const rail = list.querySelector(".process__rail span");
    const steps = [...list.querySelectorAll(".process__step")];
    if (!rail || !steps.length) return;
    const update = () => {
      const done = steps.filter((s) => s.classList.contains("is-in")).length;
      rail.style.setProperty("--progress", steps.length > 1 ? (done - 1) / (steps.length - 1) : 1);
    };
    rail.style.transition = "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)";
    const mo = new MutationObserver(update);
    steps.forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ["class"] }));
    update();
  });

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
