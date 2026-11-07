const navigationLinks = [...document.querySelectorAll('nav a[href^="#"]')];
const linkedSections = navigationLinks
  .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
  .filter((item) => item.section);

function setActiveLink(activeLink) {
  navigationLinks.forEach((link) => {
    const isActive = link === activeLink;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const match = linkedSections.find((item) => item.section === visible.target);
    if (match) setActiveLink(match.link);
  },
  { rootMargin: '-25% 0px -60% 0px', threshold: [0.1, 0.35, 0.65] },
);

linkedSections.forEach(({ section }) => sectionObserver.observe(section));
