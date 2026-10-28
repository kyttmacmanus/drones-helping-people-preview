// Set to 'efpl' for the EFPL GitLab deployment; query parameters can preview either edition.
window.DRONE_DEFAULT_EDITION = 'personal';
// Changed product displays must refresh for returning visitors as well.
window.DRONE_ASSET_URL = path => path + (path.includes('?') ? '&' : '?') + 'v=6';
window.DRONE_BRANDING = {
  personal: {name: 'Columbia University · Kytt MacManus', footer: 'Drones Helping People · Kytt MacManus · Columbia University'},
  efpl: {name: 'Columbia University · Environmental Flow Physics Laboratory', footer: 'Drones Helping People · Environmental Flow Physics Laboratory · Columbia University'}
};
