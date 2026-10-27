(() => {
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
  const list = $('#chronology-list');
  if (!list) return;
  let records = [];

  function render() {
    const year = $('#chronology-year').value;
    const query = $('#chronology-search').value.trim();
    const selected = records.filter(record => (!year || record.date.startsWith(year)) && (!query || [record.title, record.place, record.program, record.contribution, record.contributors].join(' ').toLowerCase().includes(query.toLowerCase())));
    $('#chronology-count').textContent = query || year ? `Activities${year ? ` in ${year}` : ''}${query ? ` matching “${query}”` : ''}.` : 'Explore activities by year, class or group.';
    list.innerHTML = selected.map(record => `
      <article class="chronology-record" id="record-${escape(record.id)}">
        <div class="chronology-date"><time datetime="${escape(record.date)}">${escape(record.dateLabel)}</time></div>
        <div><p class="chronology-program">${escape(record.program)} · ${escape(record.place)}</p><h3>${escape(record.title)}</h3><p>${escape(record.contribution)}</p>
          <p class="chronology-credit">${escape(record.contributors)}<br>${escape(record.institution)}</p>
          <details><summary>Context and sources</summary><p>${escape(record.context)}</p>
            ${(record.sources || []).map(source => `<a href="${escape(source.url)}" target="_blank" rel="noopener">${escape(source.title)} ↗</a>`).join(' · ')}
            ${record.relatedCollection ? `<p><a href="#${escape(record.relatedCollection)}">View the related photographs and products ↓</a></p>` : ''}
          </details>
        </div>
      </article>`).join('') || '<p>No activities match these filters. Try another year or search term.</p>';
  }

  async function init() {
    try {
      const response = await fetch('assets/data/teaching-event-register.json?v=4');
      if (!response.ok) throw Error('The activity chronology is unavailable. The CSV download remains available below.');
      const data = await response.json();
      records = data.events;
      const years = [...new Set(records.map(record => record.date.slice(0, 4)))];
      $('#chronology-year').innerHTML = '<option value="">All years</option>' + years.map(year => `<option>${escape(year)}</option>`).join('');
      $('#chronology-scope').textContent = data.scope;
      $('#chronology-year').addEventListener('change', render);
      $('#chronology-search').addEventListener('input', render);
      render();
    } catch (error) { list.textContent = error.message; }
  }
  init();
})();
