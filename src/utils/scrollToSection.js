
export function scrollToSection(id, { gap = 20, minOffset = 64 } = {}) {
  const target = document.getElementById(id);
  if (!target) return;

  // Space covered by whatever is pinned to the top RIGHT NOW.
  // Called every frame, so it follows the info bar hiding or showing.
  const getOffset = () => {
    let measured = 0;
    document.querySelectorAll("header, nav, [data-site-header]").forEach((el) => {
      const { position } = getComputedStyle(el);
      if (position !== "fixed" && position !== "sticky") return;

      const rect = el.getBoundingClientRect();
      if (rect.top <= 0 && rect.bottom > 0) measured = Math.max(measured, rect.bottom);
    });
    return Math.max(measured, minOffset);
  };

  // Where the page should be scrolled to, based on the current layout.
  const getTargetTop = () =>
    Math.max(
      0,
      target.getBoundingClientRect().top + window.scrollY - getOffset() - gap,
    );

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });

  if (reduce) {
    window.scrollTo({ top: getTargetTop() });
    // Layout can still shift after the jump, so correct once more.
    setTimeout(() => window.scrollTo({ top: getTargetTop() }), 150);
    return;
  }

  const start = window.scrollY;
  const duration = 600;
  const startTime = performance.now();
  let frame = 0;
  let settled = 0;

  const cancel = () => {
    cancelAnimationFrame(frame);
    ["wheel", "touchstart", "keydown"].forEach((type) =>
      window.removeEventListener(type, cancel),
    );
  };

  // Let the user take over at any time.
  ["wheel", "touchstart", "keydown"].forEach((type) =>
    window.addEventListener(type, cancel, { passive: true }),
  );

  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out
    const goal = getTargetTop();

    window.scrollTo({ top: start + (goal - start) * eased });

    if (progress < 1) {
      frame = requestAnimationFrame(tick);
      return;
    }

    // Animation is done, but keep correcting until the layout stops moving.
    if (Math.abs(window.scrollY - goal) < 1) settled += 1;
    else settled = 0;

    if (settled >= 5 || now - startTime > duration + 1500) {
      cancel();
      return;
    }

    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);
}

































// export function scrollToSection(id, gap = 16) {
//   const target = document.getElementById(id);
//   if (!target) return;

//   // Measure whatever is currently pinned to the top (navbar, info bar).
//   // A header that has hidden itself on scroll is ignored automatically.
//   let offset = 0;
//   document.querySelectorAll("header, nav").forEach((el) => {
//     const { position } = getComputedStyle(el);
//     if (position !== "fixed" && position !== "sticky") return;

//     const rect = el.getBoundingClientRect();
//     if (rect.top <= 0 && rect.bottom > 0) offset = Math.max(offset, rect.bottom);
//   });

//   const top = target.getBoundingClientRect().top + window.scrollY - offset - gap;
//   const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

//   window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });

//   // Move keyboard focus to the form section without scrolling again.
//   target.setAttribute("tabindex", "-1");
//   target.focus({ preventScroll: true });
// }