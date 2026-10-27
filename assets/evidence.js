(() => {
  const mode = (new URLSearchParams(location.search).get('edition') || window.DRONE_DEFAULT_EDITION) === 'efpl' ? 'efpl' : 'personal';
  const brand = window.DRONE_BRANDING[mode];
  document.querySelector('#brand-name').textContent = brand.name;
  document.querySelector('#footer-brand').textContent = brand.footer;
  document.querySelectorAll('a[href]').forEach(link => {
    const target = link.getAttribute('href');
    if (link.id !== 'edition-link' && /^[a-z-]+\.html(?:[?#]|$)/.test(target) && mode === 'efpl') {
      const url = new URL(target, location.href);
      url.searchParams.set('edition', 'efpl');
      link.href = url.href;
    }
  });
  const editionLink = document.querySelector('#edition-link');
  editionLink.href = `evidence.html?edition=${mode === 'efpl' ? 'personal' : 'efpl'}`;
  editionLink.textContent = mode === 'efpl' ? 'View Kytt MacManus perspective' : 'View EFPL perspective';
  if (window.DRONE_EDUCATION) document.querySelector('#education-destination').href = window.DRONE_EDUCATION.catalog_url;

  async function loadMissions() {
    try {
      const response = await fetch('assets/data/missions.json?v=4');
      if (!response.ok) throw Error('Capture metadata can be downloaded below.');
      const rows = await response.json();
      const body = document.querySelector('#mission-table tbody');
      rows.forEach(row => {
        const record = document.createElement('tr');
        [row.mission, row.type, row.area_ha.toFixed(3), row.flight_minutes, row.reported_mapped_images, row.capture_gsd_cm.toFixed(3), row.processed_pixel_cm].forEach((value, index) => {
          const cell = document.createElement(index === 0 ? 'th' : 'td');
          if (index === 0) cell.scope = 'row';
          cell.textContent = value;
          record.append(cell);
        });
        body.append(record);
      });
    } catch (error) { document.querySelector('#mission-table caption').textContent = error.message; }
  }

  function textCell(text, heading = false) {
    const cell = document.createElement(heading ? 'th' : 'td');
    if (heading) cell.scope = 'row';
    cell.textContent = text;
    return cell;
  }
  async function loadProjectProducts() {
    try {
      const response = await fetch('assets/data/project-products.json?v=4');
      if (!response.ok) return;
      const data = await response.json();
      if (!data.projects?.length) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'table-scroll';
      const table = document.createElement('table');
      const caption = document.createElement('caption');
      caption.textContent = 'Project products, source platforms and interpretation limits';
      const head = document.createElement('thead');
      const headings = document.createElement('tr');
      ['Project / place', 'Selected products', 'Sources and interpretation'].forEach(label => {
        const cell = document.createElement('th');
        cell.scope = 'col';
        cell.textContent = label;
        headings.append(cell);
      });
      head.append(headings);
      const body = document.createElement('tbody');
      data.projects.forEach(project => {
        const row = document.createElement('tr');
        row.id = `products-${project.case_study_id}`;
        row.append(textCell(`${project.title} · ${project.place}`, true));
        row.append(textCell((project.products || []).map(product => typeof product === 'string' ? product : product.label).filter(Boolean).join('; ')));
        const sources = document.createElement('td');
        const platform = document.createElement('p');
        platform.textContent = (project.source_platforms || []).join(' · ');
        sources.append(platform);
        const limits = document.createElement('p');
        limits.textContent = project.limitations || '';
        sources.append(limits);
        (project.source_links || []).forEach(source => {
          const url = new URL(source.url, location.href);
          if (!['https:', 'http:'].includes(url.protocol)) return;
          const paragraph = document.createElement('p');
          const link = document.createElement('a');
          link.href = url.href;
          link.textContent = `${source.title} ↗`;
          link.target = '_blank';
          link.rel = 'noopener';
          paragraph.append(link);
          sources.append(paragraph);
        });
        row.append(sources);
        body.append(row);
      });
      table.append(caption, head, body);
      wrapper.append(table);
      document.querySelector('#project-product-register').replaceChildren(wrapper);
    } catch (_) { /* The atlas link remains available if this optional table cannot load. */ }
  }
  loadMissions();
  loadProjectProducts();
})();
