let lockInput = false;

const LOCK_TIME = 320;

export function isCarouselLocked() {
  return lockInput;
}

export function lockCarouselInput() {
  lockInput = true;

  setTimeout(() => {
    lockInput = false;
  }, LOCK_TIME);
}

export function scrollCarousel(direction) {

  const sections = Array.from(
    document.querySelectorAll(".carousel-section")
  );

  const viewportCenter = window.innerHeight / 2;

  let closestIndex = 0;
  let closestDistance = Infinity;

  sections.forEach((section, i) => {

    const rect = section.getBoundingClientRect();

    const sectionCenter =
      rect.top + rect.height / 2;

    const distance = Math.abs(
      viewportCenter - sectionCenter
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }

  });

  let next = closestIndex + direction;

  if (next < 0) next = 0;
  if (next >= sections.length) next = sections.length - 1;

  sections[next].scrollIntoView({
    behavior: "smooth"
  });

  lockCarouselInput();
}