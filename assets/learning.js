(() => {
  const mode = (new URLSearchParams(location.search).get('edition') || window.DRONE_DEFAULT_EDITION) === 'efpl' ? 'efpl' : 'personal';
  const brand = window.DRONE_BRANDING?.[mode];
  if (brand) {
    document.querySelector('#brand-name').textContent = brand.name;
    document.querySelector('#footer-brand').textContent = brand.footer;
  }
  document.querySelectorAll('a[href]').forEach(link => {
    const target = link.getAttribute('href');
    if (link.id !== 'edition-link' && /^[a-z-]+\.html(?:[?#]|$)/.test(target) && mode === 'efpl') {
      const url = new URL(target, location.href);
      url.searchParams.set('edition', 'efpl');
      link.href = url.href;
    }
  });
  const editionLink = document.querySelector('#edition-link');
  editionLink.href = `?edition=${mode === 'efpl' ? 'personal' : 'efpl'}`;
  editionLink.textContent = mode === 'efpl' ? 'View Kytt MacManus perspective' : 'View EFPL perspective';
  const education = window.DRONE_EDUCATION;
  if (education) {
    const destination = document.querySelector('#education-destination');
    destination.href = education.module_url || education.catalog_url;
    destination.textContent = education.module_url ? 'Explore the Mtukuzi module at TOPSTSCHOOL ↗' : 'Explore the TOPSTSCHOOL learning catalog ↗';
  }
})();
