const PRODUCTS = {
  qhurricane: { name: 'Qompact Hurricane Shutters', url: 'https://qmiusa.com/products/qompact-hurricane-shutters/', type: 'Rolling shutter' },
  qsecure: { name: 'Qompact Residential Security Shutters', url: 'https://qmiusa.com/products/qompact-residential-security-shutters/', type: 'Rolling shutter' },
  al2: { name: 'AL2 Privacy Shutters', url: 'https://qmiusa.com/products/al2-privacy-shutters/', type: 'Privacy shutter' },
  fixed: { name: 'Fixed Window Security Screens', url: 'https://qmiusa.com/products/fixed-window-security-screens/', type: 'Stainless-steel screen' },
  egress: { name: 'Egress Window Security Screens', url: 'https://qmiusa.com/products/egress-window-security-screens/', type: 'Stainless-steel screen' },
  al8: { name: 'AL8 Commercial Security Shutters', url: 'https://qmiusa.com/products/al8-commercial-security-shutters/', type: 'Rolling shutter' },
  xl: { name: 'XL Commercial Security Shutters', url: 'https://qmiusa.com/products/xl-commercial-security-shutters/', type: 'Wide-span shutter' },
  lx6: { name: 'LX6 Clear Security Shutters', url: 'https://qmiusa.com/products/lx-6-clear-security-shutters/', type: 'Clear shutter' },
  tr4: { name: 'TR4 Transparoll Clear Shutters', url: 'https://qmiusa.com/products/tr-4-transparoll-clear-security-shutters/', type: 'Clear shutter' },
  hd1: { name: 'HD1 High-Security Exit Door', url: 'https://qmiusa.com/products/hd-1-exit-security-door/', type: 'Exit door' },
  performance: { name: 'Performance Line Side-Folding Grilles', url: 'https://qmiusa.com/products/performance-line/', type: 'Side-folding grille' },
  profile: { name: 'Profile Line Side-Folding Grilles', url: 'https://qmiusa.com/products/profile-line/', type: 'Side-folding grille' },
  freestanding: { name: 'Freestanding Security Cases', url: 'https://qmiusa.com/products/freestanding-security-cases/', type: 'Security case' },
  modular: { name: 'Modular / Custom Casework', url: 'https://qmiusa.com/products/modular-custom-commercial-security-cases/', type: 'Security casework' },
  riot: { name: 'Riot Glass Security Glazing', url: 'https://www.riotglass.com/products/', type: 'Security glazing' }
};

// Images are from the corresponding QMi product pages. The glazing photo is
// from QMi's storefront application page, which features Riot Glass.
const FLOW_IMAGES = {
  default: './assets/al8-roll.jpg',
  qhurricane: './assets/flow-qhurricane.jpg',
  qsecure: './assets/flow-qsecure.jpg',
  al2: './assets/flow-al2.jpg',
  fixed: './assets/flow-fixed.jpg',
  egress: './assets/flow-egress.jpg',
  al8: './assets/flow-al8.jpg',
  xl: './assets/flow-xl.jpg',
  lx6: './assets/flow-lx6.jpg',
  tr4: './assets/flow-tr4.jpg',
  hd1: './assets/flow-hd1.jpeg',
  performance: './assets/flow-performance.jpg',
  profile: './assets/flow-profile.jpg',
  freestanding: './assets/flow-freestanding.jpg',
  modular: './assets/flow-modular.jpg',
  riot: './assets/flow-riot.jpg'
};

const LABELS = {
  storm: 'Storm protection', security: 'Break-in security', privacy: 'Privacy and comfort',
  forced: 'Forced-entry security', visibility: 'Clear visibility', airflow: 'Light and airflow',
  goods: 'Merchandise protection', access: 'Access control', ballistic: 'Ballistic resistance', fire: 'Fire-rated assembly',
  storefront: 'Storefront / windows', counter: 'Counter / service opening', merchandise: 'Merchandise / display',
  inventory: 'Inventory / stockroom', door: 'Rear or side door', specialty: 'Kiosk / specialty',
  window: 'Window', home_door: 'Entry or patio door', patio: 'Patio / outdoor opening', multiple: 'Several areas', unsure: 'Not sure'
};

const state = { stage: 'audience', answers: {}, history: [], saved: [], quote: { email: '', property: '', openings: null, zip: '', message: '' } };
const app = document.getElementById('app');
const breadcrumb = document.getElementById('breadcrumb');
const progress = document.getElementById('progress');

// One Lucide outline language throughout; reuse a symbol for the same idea in every path.
const OPTION_ICONS = {
  audience: { residential: 'house', commercial: 'store' },
  res_goal: { storm: 'cloud-lightning', security: 'door-closed-locked', privacy: 'blinds' },
  res_opening: { window: 'window-frame', home_door: 'door-closed', patio: 'sliding-door', multiple: 'layout-grid', unsure: 'circle-question-mark' },
  res_first_opening: { window: 'window-frame', home_door: 'door-closed', patio: 'sliding-door' },
  res_egress: { yes: 'square-arrow-right-exit', no: 'circle-x', unsure: 'circle-question-mark' },
  res_preference: { retractable: 'panel-top-open', always: 'grid-3x3', unsure: 'columns-2' },
  com_area: { storefront: 'store', counter: 'panel-top', merchandise: 'shopping-bag', inventory: 'warehouse', door: 'door-closed', specialty: 'shapes' },
  com_goal: { forced: 'door-closed-locked', visibility: 'eye', airflow: 'wind', storm: 'cloud-lightning', ballistic: 'shield', fire: 'flame', goods: 'package-check', access: 'key-round' },
  com_opening: { window: 'window-frame', glass_door: 'glass-door', open_bay: 'panel-top-open', unsure: 'circle-question-mark' },
  com_location: { exterior: 'cloud-rain', interior: 'panel-top', unsure: 'circle-question-mark' },
  com_visibility: { solid: 'panel-top-close', partial: 'grid-3x3', clear: 'eye', airflow: 'wind', unsure: 'circle-question-mark' },
  com_clear: { uninterrupted: 'eye', retrofit: 'blocks', unsure: 'columns-2' },
  com_width: { standard: 'ruler', wide: 'move-horizontal', oversize: 'maximize-2', unsure: 'circle-question-mark' },
  com_shape: { straight: 'minus', curved: 'route', staggered: 'chart-no-axes-column-increasing', unsure: 'circle-question-mark' },
  com_stack: { compact: 'minimize-2', flexible: 'expand', unsure: 'circle-question-mark' },
  com_fixture: { standalone: 'vault', existing: 'shelving-unit', new: 'blocks', unsure: 'circle-question-mark' },
  com_target: { items: 'package', interior_door: 'door-closed', exterior_exit: 'square-arrow-right-exit', unsure: 'circle-question-mark' },
  com_door: { hollow_outswing: 'square-arrow-right-exit', glass: 'glass-door', other: 'door-closed', unsure: 'circle-question-mark' },
  com_egress: { yes: 'square-arrow-right-exit', no: 'circle-x', unsure: 'circle-question-mark' },
  com_specialty: { equipment: 'cog', kiosk: 'store', fixture: 'shelving-unit', other: 'shapes' }
};

function opt(value, title, desc = '') {
  return { value, title, desc, icon: OPTION_ICONS[state.stage]?.[value] || 'circle-question-mark' };
}
function selected(key) { return state.answers[key]; }
function primaryGoal(key) { return (state.answers[key] || [])[0]; }
function goalIncludes(key, value) { return (state.answers[key] || []).includes(value); }
function isEgress() { return ['yes', 'unsure'].includes(state.answers.res_egress || state.answers.com_egress); }
function q(title, hint, options, config = {}) { return { title, hint, options, ...config }; }

function currentQuestion() {
  const a = state.answers;
  switch (state.stage) {
    case 'audience': return q('What would you like to protect?', 'Choose a path to see products suited to your property.', [
      opt('residential', 'My home', 'Residential protection for windows, doors, and outdoor spaces'),
      opt('commercial', 'My business or organization', 'Protection for storefronts, people, inventory, and exits')
    ], { kicker: 'LET’S GET STARTED', grid: 'one-column' });
    case 'res_goal': return q('What matters most at your home?', 'Select up to two goals. Your first selection is your top priority.', [
      opt('storm', 'Hurricane or storm protection', 'Protect openings from severe weather and flying debris'),
      opt('security', 'Prevent break-ins', 'Add a barrier against forced entry and vandalism'),
      opt('privacy', 'Privacy and comfort', 'Control shade, heat, light, and outside noise')
    ], { kicker: 'YOUR HOME', multi: true, max: 2 });
    case 'res_opening': return q('Where do you need protection?', 'We’ll match the product to the opening you have in mind.', [
      opt('window', 'A window', 'Including bedroom or basement windows'),
      opt('home_door', 'An entry or patio door', 'A door you use to enter or leave'),
      opt('patio', 'A patio or large outdoor opening', 'A broad opening exposed to the outside'),
      opt('multiple', 'Several areas', 'Start with one area, then add another'),
      opt('unsure', 'I’m not sure yet', 'We can still suggest a starting point')
    ], { kicker: 'THE OPENING' });
    case 'res_first_opening': return q('Which area should we start with?', 'You can add your other windows, doors, or patio areas after this result.', [
      opt('window', 'A window', 'Including bedroom or basement windows'),
      opt('home_door', 'An entry or patio door', 'A door you use to enter or leave'),
      opt('patio', 'A patio or large outdoor opening', 'A broad opening exposed to the outside')
    ], { kicker: 'FIRST AREA' });
    case 'res_egress': return q('Could this be an emergency exit?', (a.res_opening === 'window' || a.res_first_opening === 'window') ? 'A bedroom or basement window may need to remain usable for escape.' : 'A door or patio opening may need to remain usable when people leave the home.', [
      opt('yes', (a.res_opening === 'window' || a.res_first_opening === 'window') ? 'Yes, or it is a bedroom / basement window' : 'Yes, people may need to exit here', 'Keep an emergency exit route available'),
      opt('no', 'No', 'This opening does not serve as an escape route'),
      opt('unsure', 'I’m not sure', 'We’ll flag it for a specialist to confirm')
    ], { kicker: 'SAFETY CHECK', grid: 'one-column' });
    case 'res_preference': return q('How would you like it to work?', 'Think about how the opening should feel when protection is in place.', [
      opt('retractable', 'Rolls away when not needed', 'A solid shutter that opens and closes'),
      opt('always', 'Stays in place with view and airflow', 'A subtle screen that protects all day'),
      opt('unsure', 'Show me both approaches', 'Compare the tradeoffs in my result')
    ], { kicker: 'YOUR PREFERENCE', grid: 'one-column' });
    case 'com_area': return q('Which area needs protection?', 'You can add more areas after seeing your first recommendation.', [
      opt('storefront', 'Storefront or windows', 'Glass, entryways, and exposed exterior openings'),
      opt('counter', 'Counter or service opening', 'Transaction windows and interior separations'),
      opt('merchandise', 'Merchandise or displays', 'Valuable products on the sales floor'),
      opt('inventory', 'Inventory or stockroom', 'Stock, racks, or an interior room'),
      opt('door', 'Rear or side exit door', 'A vulnerable perimeter door'),
      opt('specialty', 'Kiosk, equipment, or specialty area', 'A custom-built or unusual application')
    ], { kicker: 'YOUR PROPERTY' });
    case 'com_goal': {
      const maps = {
        storefront: ['forced', 'visibility', 'airflow', 'storm', 'ballistic'],
        counter: ['forced', 'visibility', 'airflow', 'access'],
        merchandise: ['goods', 'forced', 'visibility'],
        inventory: ['goods', 'access', 'forced'],
        door: ['forced', 'access', 'ballistic', 'fire'],
        specialty: ['forced', 'visibility', 'goods', 'storm']
      };
      const choices = {
        forced: opt('forced', 'Prevent forced entry', 'Deter smash-and-grab or tool attacks'),
        visibility: opt('visibility', 'Keep a clear view', 'See through the protected opening'),
        airflow: opt('airflow', 'Keep light and airflow', 'Maintain an open-feeling space'),
        storm: opt('storm', 'Protect against severe weather', 'Wind and debris are a concern'),
        ballistic: opt('ballistic', 'Address a ballistic threat', 'A tested ballistic system is required'),
        fire: opt('fire', 'Preserve a fire-rated assembly', 'Fire rating must be maintained'),
        goods: opt('goods', 'Protect valuable goods', 'Secure products or inventory'),
        access: opt('access', 'Control access', 'Secure a room or door')
      };
      return q('What matters most here?', 'Choose up to two goals. We’ll use the first as your priority.', maps[a.com_area].map(key => choices[key]), { kicker: 'THE NEED', multi: true, max: 2 });
    }
    case 'com_opening': return q('What kind of storefront opening is it?', 'A window, entry door, and open bay can need different products.', [
      opt('window', 'A window or glass wall', 'A fixed glazed opening'),
      opt('glass_door', 'A glass entry door', 'People pass through this opening'),
      opt('open_bay', 'An open storefront bay', 'A wide opening that needs a closure'),
      opt('unsure', 'Several types / not sure', 'We’ll keep the result broader')
    ], { kicker: 'OPENING TYPE' });
    case 'com_location': return q('Where would this protection be installed?', 'Weather exposure changes which products may fit.', [
      opt('exterior', 'Outside / weather-exposed', 'Wind, rain, or debris can reach it'),
      opt('interior', 'Inside the building', 'Protected from direct weather'),
      opt('unsure', 'I’m not sure', 'Ask a specialist to review the location')
    ], { kicker: 'INSTALLATION' });
    case 'com_visibility': return q('What should the closed barrier allow?', 'This helps separate solid shutters, clear shutters, screens, and grilles.', [
      opt('solid', 'A solid visual barrier', 'Privacy or a prominent closed-off appearance'),
      opt('partial', 'Some view through', 'Visibility through punched or open patterns'),
      opt('clear', 'A clear view', 'See through the protected area'),
      opt('airflow', 'Air and light through', 'An open or mesh-style barrier'),
      opt('unsure', 'No strong preference', 'Show the most suitable starting point')
    ], { kicker: 'VISIBILITY' });
    case 'com_clear': return q('What kind of clear solution appeals to you?', 'Both options still need dimensions and installation review.', [
      opt('uninterrupted', 'The clearest uninterrupted view', 'Continuous clear panels and integrated appearance'),
      opt('retrofit', 'A practical retrofit or manual option', 'Segmented clear panels with flexible installation'),
      opt('unsure', 'I’d like to compare both', 'Show both clear-shutter families')
    ], { kicker: 'CLEAR BARRIER', grid: 'one-column' });
    case 'com_width': return q('About how wide is the opening?', 'An estimate helps us flag extra-wide or custom work. Final sizing needs a site review.', [
      opt('standard', 'Under about 20 ft', 'A typical opening or counter span'),
      opt('wide', 'About 20–30 ft', 'A wide, straight span'),
      opt('oversize', 'Over 30 ft', 'Likely to require a custom approach'),
      opt('unsure', 'I don’t know yet', 'A specialist can measure it')
    ], { kicker: 'APPROXIMATE SIZE' });
    case 'com_shape': return q('What shape is the counter or opening?', 'Curves and changing heights usually favor a side-folding solution.', [
      opt('straight', 'Straight opening', 'A single flat line to close'),
      opt('curved', 'Curved or angled', 'The barrier follows a turn'),
      opt('staggered', 'Multiple heights or sections', 'A stepped counter or complex path'),
      opt('unsure', 'I’m not sure', 'We can start with the usual options')
    ], { kicker: 'GEOMETRY' });
    case 'com_stack': return q('How much room is there for the grille to stack?', 'A narrow pocket can affect which grille line is practical.', [
      opt('compact', 'Very little room', 'A slim pocket or discreet storage is important'),
      opt('flexible', 'Room is available', 'A wider stack or broader style range is possible'),
      opt('unsure', 'I’m not sure', 'A designer can check the available space')
    ], { kicker: 'STORAGE SPACE' });
    case 'com_fixture': return q('How should the goods be secured?', 'This separates standalone cabinets from protection built into fixtures.', [
      opt('standalone', 'A standalone security cabinet', 'A separate unit with shelves and a roll-down closure'),
      opt('existing', 'Add protection to existing fixtures', 'Keep current displays or racks'),
      opt('new', 'Build protection into new fixtures', 'Integrate security from the start'),
      opt('unsure', 'I’m not sure yet', 'Compare both approaches')
    ], { kicker: 'THE FIXTURE' });
    case 'com_target': return q('What exactly needs protection?', 'A stockroom can call for a case, an opening barrier, or a secure exit door.', [
      opt('items', 'The goods or storage racks', 'Protect what is inside the room'),
      opt('interior_door', 'An interior room opening', 'Separate the stockroom from the rest of the building'),
      opt('exterior_exit', 'A rear exterior exit', 'Protect an outside door near the stockroom'),
      opt('unsure', 'A combination / not sure', 'Show the likely layers')
    ], { kicker: 'STOCKROOM' });
    case 'com_door': return q('Which kind of door is it?', 'HD1 has a specific fit: an existing hollow-metal outswing exit door.', [
      opt('hollow_outswing', 'Hollow-metal outswing exit', 'A metal door that swings out'),
      opt('glass', 'Glass door', 'Visibility through the door matters'),
      opt('other', 'Another door or an entrance door', 'The construction may need a different solution'),
      opt('unsure', 'I’m not sure', 'Have the door checked before selecting a product')
    ], { kicker: 'DOOR TYPE' });
    case 'com_egress': return q('Is this opening a required exit route?', 'Life-safety requirements can change the product and controls.', [
      opt('yes', 'Yes', 'People may need to escape through it'),
      opt('no', 'No', 'This is not a required exit'),
      opt('unsure', 'I’m not sure', 'We’ll flag it for code review')
    ], { kicker: 'SAFETY CHECK', grid: 'one-column' });
    case 'com_specialty': return q('What kind of custom application is it?', 'QMi engineering may need to configure the product around your equipment.', [
      opt('equipment', 'Equipment or OEM integration', 'A security barrier built into another system'),
      opt('kiosk', 'Kiosk or movable fixture', 'A specialized small-format opening'),
      opt('fixture', 'Custom display or casework', 'Protection integrated into merchandise fixtures'),
      opt('other', 'Another unusual opening', 'Let a specialist review the design')
    ], { kicker: 'CUSTOM APPLICATION' });
  }
  throw new Error(`Unknown stage: ${state.stage}`);
}

function nextStage(stage) {
  const a = state.answers;
  switch (stage) {
    case 'audience': return a.audience === 'residential' ? 'res_goal' : 'com_area';
    case 'res_goal': return 'res_opening';
    case 'res_opening': return a.res_opening === 'multiple' ? 'res_first_opening' : a.res_opening === 'unsure' ? 'quote' : 'res_egress';
    case 'res_first_opening': return 'res_egress';
    case 'res_egress': return (a.res_opening === 'window' || a.res_first_opening === 'window') && (goalIncludes('res_goal', 'storm') || goalIncludes('res_goal', 'security')) ? 'res_preference' : 'quote';
    case 'res_preference': return 'quote';
    case 'com_area': return 'com_goal';
    case 'com_goal': return ({ storefront: 'com_opening', counter: 'com_shape', merchandise: 'com_fixture', inventory: 'com_target', door: 'com_door', specialty: 'com_specialty' })[a.com_area];
    case 'com_opening': return goalIncludes('com_goal', 'ballistic') ? 'com_egress' : 'com_location';
    case 'com_location': return 'com_visibility';
    case 'com_shape': return 'com_width';
    case 'com_width': return a.com_area === 'storefront' ? 'com_egress' : (['curved', 'staggered'].includes(a.com_shape) ? 'com_stack' : 'com_visibility');
    case 'com_stack': return 'com_visibility';
    case 'com_visibility': {
      if (a.com_area === 'storefront' && a.com_opening === 'window' && a.com_visibility === 'airflow') return 'com_egress';
      if (a.com_visibility === 'clear' && a.com_location !== 'exterior') return 'com_clear';
      if (a.com_area === 'storefront') return 'com_width';
      return 'quote';
    }
    case 'com_clear': return a.com_area === 'storefront' ? 'com_width' : 'quote';
    case 'com_fixture': return 'quote';
    case 'com_target': return a.com_target === 'items' ? 'com_fixture' : a.com_target === 'exterior_exit' ? 'com_door' : a.com_target === 'interior_door' ? 'com_egress' : 'quote';
    case 'com_door': return 'com_egress';
    case 'com_egress': return 'quote';
    case 'com_specialty': return a.com_specialty === 'fixture' ? 'quote' : 'com_location';
  }
  return 'quote';
}

function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function uniq(list) { return [...new Set(list.filter(Boolean))]; }
function makeResult(product, why, alternatives = [], checks = [], note = '') { return { product, why, alternatives: uniq(alternatives).filter(id => id !== product), checks: uniq(checks), note }; }

function residentialResult(a) {
  const goals = a.res_goal || [];
  let top = goals[0];
  if (top === 'privacy' && goals.includes('storm')) top = 'storm';
  else if (top === 'privacy' && goals.includes('security')) top = 'security';
  const opening = a.res_opening === 'multiple' ? a.res_first_opening : a.res_opening;
  const exit = ['yes', 'unsure'].includes(a.res_egress);
  const always = a.res_preference === 'always';
  let r;
  if (opening === 'unsure') {
    const possible = top === 'storm' ? ['qhurricane', 'egress'] : top === 'security' ? ['qsecure', 'egress'] : ['al2'];
    r = makeResult(null, 'The opening type is needed before we can make a responsible product match.', possible, ['Identify whether the opening is a window, door, or patio area and whether it serves as an emergency exit.']);
  } else if (top === 'storm') {
    if (always && opening === 'window') r = makeResult(exit ? 'egress' : 'fixed', 'You want storm protection that stays in place while preserving light and airflow.', ['qhurricane'], ['Confirm the exact hurricane approval, opening size, and installation for your location.']);
    else r = makeResult('qhurricane', 'You want a retractable barrier for severe weather at a home opening.', opening === 'window' ? [exit ? 'egress' : 'fixed'] : [], ['Confirm the exact hurricane approval, opening size, and installation for your location.']);
  } else if (top === 'security') {
    if (always && opening === 'window') r = makeResult(exit ? 'egress' : 'fixed', 'You want continuous protection while keeping the window open to light and airflow.', ['qsecure'], ['Confirm the screen configuration and opening dimensions.']);
    else r = makeResult('qsecure', 'You want a strong, retractable barrier to help protect your home from break-ins.', opening === 'window' ? [exit ? 'egress' : 'fixed'] : [], ['Confirm the opening, controls, and installation details.']);
  } else {
    r = opening === 'window'
      ? makeResult('al2', 'Privacy, shade, heat, and noise control are your leading needs; AL2 is designed around those benefits.', [], ['Confirm the opening size and desired controls.'], 'AL2 provides light security and is not wind or hurricane rated.')
      : makeResult(null, 'AL2 is primarily presented as a window treatment; a door or large patio opening needs a fit review before choosing a privacy product.', ['al2', 'qsecure'], ['Confirm the opening type, dimensions, and desired privacy level.'], 'AL2 provides light security and is not wind or hurricane rated.');
  }
  if (goals.includes('storm') && top !== 'storm') { r.alternatives = uniq([...r.alternatives, 'qhurricane']); r.checks.push('Storm protection needs a separately confirmed rated configuration.'); }
  if (goals.includes('security') && top !== 'security') r.alternatives = uniq([...r.alternatives, 'qsecure']);
  if (goals.includes('privacy') && top !== 'privacy') r.alternatives = uniq([...r.alternatives, 'al2']);
  if (exit) r.checks.push('A specialist must confirm that this opening remains a valid emergency exit.');
  if (opening === 'home_door' || opening === 'patio') r.checks.push('Confirm that the selected configuration fits this door or patio opening.');
  if (a.res_opening === 'multiple' || opening === 'unsure') r.checks.push('Confirm each opening separately; different areas may need different products.');
  r.scope = `${goals.map(g => LABELS[g]).join(' + ') || 'Home protection'} · ${LABELS[opening] || 'Home opening'}`;
  return r;
}

function clearShutter(a) {
  const checks = ['Clear shutters need an interior installation and opening-size review.'];
  if (a.com_clear === 'retrofit') return makeResult('lx6', 'A clear, segmented roll-down barrier with retrofit and manual-operation possibilities matches your preference.', ['tr4'], [...checks, 'QMi publishes conflicting maximum-width figures for LX6; verify the current specification.']);
  return makeResult('tr4', 'Continuous clear panels suit your preference for an uninterrupted view through a closed barrier.', ['lx6'], checks);
}

function commercialResult(a) {
  const area = a.com_area;
  const goals = a.com_goal || [];
  const exterior = a.com_location === 'exterior';
  const exit = ['yes', 'unsure'].includes(a.com_egress);
  let r;
  if (goals.includes('fire')) {
    r = makeResult(null, 'A fire-rated assembly needs a product and code review before we can recommend a specific door or shutter.', [], ['QMi states the complete HD1 system is not fire-rated.', 'Confirm the applicable fire, access, and egress requirements.']);
  } else if (goals.includes('ballistic')) {
    r = makeResult('riot', 'Your requirement calls for a tested ballistic glazing system selected to the specific threat and opening.', [], ['A Riot Glass specialist must select the glazing and framing rating.', 'The quiz does not assign a ballistic rating to shutters, screens, or HD1.']);
  } else if (area === 'storefront') {
    if (exterior && goals.includes('storm') && a.com_visibility === 'clear') r = makeResult(null, 'A clear weather-exposed opening with a storm requirement needs a rated-system review before choosing a product.', ['al8', 'riot'], ['Confirm the exact wind/debris approval, glazing or shutter design, opening, and local code.']);
    else if (exterior && goals.includes('storm')) r = makeResult('al8', 'An exterior opening with storm and security needs points to a rated commercial shutter configuration.', [], ['Confirm the required wind/debris approval, opening, structure, and local code.']);
    else if (a.com_opening === 'glass_door' && a.com_visibility === 'clear') r = makeResult('riot', 'A glass entry door that should remain clear points to security glazing designed for that door.', ['al8'], ['Confirm the glazing system, door operation, egress, and any required rating.']);
    else if (a.com_opening === 'glass_door' && a.com_visibility === 'airflow') r = makeResult(null, 'A glass entry door needing airflow and security requires a door-specific design review.', ['al8'], ['A fixed window screen is not a door solution; confirm how the door operates and exits.']);
    else if (a.com_opening === 'open_bay' && a.com_visibility === 'airflow') r = makeResult('performance', 'A side-folding grille can close an open bay while retaining an open feel.', ['al8'], ['Confirm the track, structure, weather exposure, and exit requirements.']);
    else if (exterior && a.com_visibility === 'clear') r = makeResult('riot', 'You want a clear, always-on barrier for a weather-exposed storefront.', ['al8'], ['Confirm forced-entry requirements, glazing system, and exterior installation.']);
    else if (exterior && a.com_visibility === 'airflow' && a.com_opening === 'window') r = makeResult(exit ? 'egress' : 'fixed', 'A security screen preserves light and airflow at a weather-exposed window.', ['al8'], ['Confirm the opening, egress status, and any storm approval.']);
    else if (exterior) r = makeResult('al8', 'A deployable commercial shutter suits a weather-exposed storefront security need.', ['riot'], ['Confirm opening size, attachment, controls, and any required storm rating.']);
    else if (a.com_visibility === 'airflow' && a.com_opening === 'window') r = makeResult(exit ? 'egress' : 'fixed', 'A screen preserves light and airflow while adding an always-on barrier.', ['al8'], ['Confirm the opening and whether a screen or grille fits the installation.']);
    else if (a.com_visibility === 'airflow') r = makeResult(null, 'The exact opening needs confirmation before choosing a screen, grille, or shutter.', ['al8', 'performance'], ['Confirm whether this is a window, door, or open bay and how people exit.']);
    else if (a.com_visibility === 'clear' && a.com_width === 'wide') r = makeResult(null, 'The requested clear roll-down barrier and roughly 20–30 ft span need a specialist size check before naming a model.', ['lx6', 'tr4'], ['TR4 lists an 18 ft maximum width; QMi publishes conflicting LX6 width figures.']);
    else if (a.com_visibility === 'clear' && a.com_width === 'oversize') r = makeResult(null, 'A clear barrier over 30 ft needs a custom design review.', [], ['Confirm exact width, structure, placement, and required security level.']);
    else if (a.com_visibility === 'clear') r = clearShutter(a);
    else if (a.com_width === 'wide') r = makeResult('xl', 'A straight, wide interior opening is a strong starting use case for XL.', ['al8'], ['XL is primarily for interior openings and has no wind/pressure rating.', 'Confirm final span and motor configuration.']);
    else if (a.com_width === 'oversize') r = makeResult(null, 'An opening above 30 ft needs custom design review.', [], ['Confirm exact dimensions, support structure, and use.']);
    else r = makeResult('al8', 'A commercial rolling shutter suits this storefront or window security need.', ['riot'], ['Confirm the final opening size, mounting, and egress details.']);
  } else if (area === 'counter') {
    if (['curved', 'staggered'].includes(a.com_shape)) {
      const compact = a.com_stack === 'compact';
      r = makeResult(compact ? 'profile' : 'performance', 'A side-folding grille can follow a curved, angled, or changing-height counter path.', [compact ? 'performance' : 'profile'], ['Confirm overhead support, clear path, pocket, and grille style.']);
    } else if (a.com_visibility === 'clear' && a.com_width === 'wide') r = makeResult(null, 'A clear roll-down counter barrier at this width needs a model and span review.', ['lx6', 'tr4'], ['TR4 lists an 18 ft maximum width; QMi publishes conflicting LX6 width figures.']);
    else if (a.com_visibility === 'clear') r = clearShutter(a);
    else if (a.com_width === 'wide') r = makeResult('xl', 'A wide, straight interior counter opening is a common XL use case.', ['performance'], ['Confirm final span, motor, and supporting structure.']);
    else if (a.com_width === 'oversize') r = makeResult(null, 'This counter may exceed the listed XL span and needs custom design review.', ['performance', 'profile'], ['Confirm exact opening dimensions and support structure.']);
    else if (a.com_visibility === 'airflow') r = makeResult('performance', 'A side-folding grille can keep the counter visually open with an appropriate style.', ['profile', 'al8'], ['Select grille style, track support, and stacking location with a specialist.']);
    else r = makeResult('al8', 'AL8 is a strong rolling shutter candidate for a standard counter opening.', ['performance'], ['Confirm opening size, mounting, and how staff operate it.']);
  } else if (area === 'merchandise') {
    if (a.com_fixture === 'existing' || a.com_fixture === 'new') r = makeResult('modular', 'Security can be integrated into the display fixtures you have or are planning.', ['freestanding'], ['QMi or a fixture partner should scope the casework and access pattern.']);
    else r = makeResult('freestanding', 'A standalone cabinet protects valuable merchandise without redesigning the whole display area.', ['modular'], ['Confirm shelving, dimensions, doors, and staff access.']);
    if (goals.includes('forced')) r.alternatives = uniq([...r.alternatives, 'al8']);
  } else if (area === 'inventory') {
    if (a.com_target === 'items') r = a.com_fixture === 'existing' || a.com_fixture === 'new'
      ? makeResult('modular', 'Integrated casework can secure goods within existing or planned stockroom fixtures.', ['freestanding'], ['Confirm rack/fixture design and access needs.'])
      : makeResult('freestanding', 'A security case can secure selected stock inside the room.', ['modular'], ['Confirm dimensions, shelving, and access needs.']);
    else if (a.com_target === 'interior_door') r = makeResult('al8', 'A shutter can secure the interior stockroom opening itself.', [], ['Confirm the opening, mounting, operation, and exit requirements.']);
    else if (a.com_target === 'exterior_exit') r = doorResult(a);
    else r = makeResult(null, 'The stockroom may need separate solutions for goods, its interior opening, and the rear exit.', ['freestanding', 'al8'], ['Identify the first opening or asset to protect, then add another area.']);
  } else if (area === 'door') {
    r = doorResult(a);
  } else {
    if (a.com_specialty === 'fixture') r = makeResult('modular', 'A custom display is best scoped as integrated security casework.', [], ['A QMi engineer or fixture partner should review the design.']);
    else if (a.com_visibility === 'clear' && exterior) r = makeResult(null, 'This custom exterior clear barrier needs engineering review before selecting a model.', ['riot'], ['The QMi OEM page and LX6 FAQ conflict on exterior LX6 use.']);
    else if (a.com_visibility === 'clear' && a.com_location === 'interior') r = makeResult('lx6', 'LX6 may offer a clear barrier within an interior custom application.', ['tr4'], ['Confirm mobility, mounting, dimensions, and exact configuration with QMi engineering.']);
    else r = makeResult('al8', 'AL8 is a flexible starting family for equipment, kiosk, and specialty security integration.', ['modular'], ['A QMi engineer must confirm the product and integration details.']);
  }
  if (exit) r.checks.push('Confirm emergency operation and applicable egress code before selecting the final configuration.');
  if (a.com_location === 'unsure') r.checks.push('Confirm whether the opening is weather-exposed.');
  if (area === 'storefront' && goals.includes('visibility') && r.product === 'al8') r.alternatives = uniq([...r.alternatives, 'riot']);
  if (area === 'storefront' && goals.includes('forced') && r.product === 'riot') r.alternatives = uniq([...r.alternatives, 'al8']);
  r.scope = `${LABELS[area] || 'Commercial area'} · ${(goals || []).map(g => LABELS[g]).join(' + ')}`;
  return r;
}

function doorResult(a) {
  if (a.com_door === 'hollow_outswing') return makeResult('hd1', 'HD1 is designed for an existing hollow-metal outswing commercial exit door.', ['al8'], ['Confirm the existing door, frame, exit use, alarms, and local requirements.', 'The complete HD1 system is not fire-rated or ballistic-tested.']);
  if (a.com_door === 'glass') return makeResult('riot', 'A clear glazing system is a better starting point for a glass door than HD1.', [], ['Confirm door framing, use, and required forced-entry or ballistic rating.']);
  return makeResult(null, 'HD1 has a specific door fit; this door needs a specialist assessment before a product match.', [], ['Confirm construction, swing, exit use, and any fire-rating requirement.']);
}

function resultFor(answers) { return answers.audience === 'residential' ? residentialResult(answers) : commercialResult(answers); }

function stepNumber() { return state.history.length + 1; }
function renderHeader() {
  const a = state.answers;
  const path = ['Product guide'];
  if (a.audience) path.push(a.audience === 'residential' ? 'Residential' : 'Commercial');
  if (state.stage === 'result') path.push('Product guidance');
  else if (state.stage === 'quote') path.push('Get a quote');
  else if (a.audience && state.stage !== 'audience') path.push('Find a solution');
  breadcrumb.innerHTML = path.map((part, i) => i === path.length - 1 ? `<strong>${escapeHTML(part)}</strong>` : `<span>${escapeHTML(part)}</span><span class="crumb-sep">/</span>`).join('');
  const active = state.stage === 'result' ? 5 : state.stage === 'quote' ? 4 : Math.min(3, Math.max(1, stepNumber()));
  const label = state.stage === 'quote' ? 'GET A QUOTE' : state.stage === 'result' ? 'PRODUCT GUIDE' : `STEP ${stepNumber()}`;
  progress.innerHTML = `${Array.from({ length: 5 }, (_, i) => `<span class="progress-pill ${i < active ? 'active' : ''}"></span>`).join('')}<span class="progress-label">${label}</span>`;
}

function renderQuestion() {
  const question = currentQuestion();
  const value = selected(state.stage);
  const selectedValues = Array.isArray(value) ? value : [value];
  const cards = question.options.map(option => {
    const on = selectedValues.includes(option.value);
    const rank = question.multi && on ? `<span class="choice-number">${selectedValues.indexOf(option.value) + 1}</span>` : `<span class="choice-arrow" aria-hidden="true">${question.multi ? '+' : '→'}</span>`;
    return `<button type="button" class="choice ${on ? 'selected' : ''}" data-choice="${escapeHTML(option.value)}" ${question.multi ? `aria-pressed="${on ? 'true' : 'false'}"` : ''}><span class="choice-icon" aria-hidden="true"><svg class="choice-symbol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="./assets/icons/sprite.svg#${escapeHTML(option.icon)}"></use></svg></span><span class="choice-copy"><span class="choice-title">${escapeHTML(option.title)}</span><span class="choice-desc">${escapeHTML(option.desc)}</span></span>${rank}</button>`;
  }).join('');
  const backButton = state.history.length ? '<button type="button" class="text-button" data-action="back">← Back</button>' : '';
  const nextControl = question.multi ? `<button type="button" class="primary-button" data-action="continue" ${selectedValues.filter(Boolean).length ? '' : 'disabled'}>Continue <span aria-hidden="true">→</span></button>` : '<span class="helper-line">Select one to continue</span>';
  app.innerHTML = `<div class="step-head"><div class="step-index">${escapeHTML(question.kicker || 'FIND YOUR FIT')}</div><h2 id="workspace-title" tabindex="-1">${escapeHTML(question.title)}</h2><p>${escapeHTML(question.hint)}</p></div><div class="choice-grid ${question.grid || ''} ${question.options.length >= 5 ? 'dense' : ''}">${cards}</div>${backButton || question.multi ? `<div class="step-actions">${backButton}${nextControl}</div>` : ''}`;
}

function alternativesHTML(result) {
  if (!result.alternatives.length) return '<p>No automatic alternative is shown for this opening.</p>';
  return `<ul>${result.alternatives.map(id => `<li><a href="${PRODUCTS[id].url}" target="_blank" rel="noopener noreferrer">${escapeHTML(PRODUCTS[id].name)} ↗</a></li>`).join('')}</ul>`;
}

function resultCard(result) {
  const product = result.product ? PRODUCTS[result.product] : null;
  return `<article class="result-card"><div class="result-band"></div><div class="result-inner"><p class="result-overline">${escapeHTML(product ? product.type : 'Specialist review')}</p><div class="result-title-row"><h3 class="result-title">${escapeHTML(product ? product.name : 'Expert review recommended')}</h3></div><p class="result-why">${escapeHTML(result.why)}</p>${result.note ? `<div class="notice">${escapeHTML(result.note)}</div>` : ''}<div class="result-meta"><div><h3>Also consider</h3>${alternativesHTML(result)}</div><div><h3>Before choosing</h3><ul>${result.checks.map(check => `<li>${escapeHTML(check)}</li>`).join('')}</ul></div></div>${product ? `<a class="product-link" href="${product.url}" target="_blank" rel="noopener noreferrer">View ${escapeHTML(product.name)} <span aria-hidden="true">↗</span></a>` : `<a class="product-link" href="https://qmiusa.com/contact-us/" target="_blank" rel="noopener noreferrer">Discuss this with QMi <span aria-hidden="true">↗</span></a>`}</div></article>`;
}

function allEntries() {
  return [...state.saved, { result: resultFor(state.answers), answers: state.answers }];
}

function openingFor(answers) {
  if (answers.audience === 'residential') {
    const opening = answers.res_opening === 'multiple' ? answers.res_first_opening : answers.res_opening;
    return ({ window: 'window', home_door: 'home_door', patio: 'patio', unsure: 'unsure' })[opening] || 'unsure';
  }
  if (answers.com_area === 'storefront') return ({ window: 'storefront_window', glass_door: 'glass_door', open_bay: 'open_bay' })[answers.com_opening] || 'other';
  if (answers.com_area === 'counter') return 'counter';
  if (answers.com_area === 'merchandise') return 'display';
  if (answers.com_area === 'inventory') return ({ items: 'inventory_items', interior_door: 'stockroom_opening', exterior_exit: 'rear_door' })[answers.com_target] || 'other';
  if (answers.com_area === 'door') return answers.com_door === 'glass' ? 'glass_door' : 'rear_door';
  return 'specialty';
}

function quoteOpeningOptions(audience) {
  return audience === 'residential'
    ? [
      ['window', 'Windows'], ['home_door', 'Entry or patio doors'], ['patio', 'Patio or large outdoor opening'], ['unsure', 'Not sure yet']
    ]
    : [
      ['storefront_window', 'Storefront windows / glass'], ['glass_door', 'Glass entry doors'], ['open_bay', 'Open storefront bay'],
      ['counter', 'Counter / service opening'], ['display', 'Merchandise displays'], ['inventory_items', 'Inventory / racks'],
      ['stockroom_opening', 'Stockroom opening'], ['rear_door', 'Rear or side door'], ['specialty', 'Kiosk / equipment'], ['other', 'Other / not sure']
    ];
}

function inferredQuoteOpenings() { return uniq(allEntries().map(entry => openingFor(entry.answers))); }

function productInterest(entry) {
  const { result, answers } = entry;
  if (!result.product) {
    const label = quoteOpeningOptions(answers.audience).find(([value]) => value === openingFor(answers))?.[1];
    const area = label && !/not sure|other/i.test(label) ? label.toLowerCase() : 'opening or area';
    return { name: 'Professional product review', url: 'https://qmiusa.com/contact-us/', action: 'Ask QMi', note: `A QMi professional can review your ${area} and recommend a suitable solution.` };
  }
  let benefit;
  switch (result.product) {
    case 'qhurricane': benefit = 'storm protection at your home opening'; break;
    case 'qsecure': benefit = 'a roll-down barrier against break-ins at your home'; break;
    case 'al2': benefit = 'privacy, shade, and comfort at your window'; break;
    case 'fixed': benefit = 'continuous window protection while preserving light and airflow'; break;
    case 'egress': benefit = 'continuous window protection while keeping an exit option for professional review'; break;
    case 'al8': benefit = 'roll-down security at your commercial opening'; break;
    case 'xl': benefit = 'protecting a wide interior opening'; break;
    case 'lx6': case 'tr4': benefit = 'keeping a clear view through a closed security barrier'; break;
    case 'hd1': benefit = 'reinforcing a compatible hollow-metal exit door'; break;
    case 'performance': case 'profile': benefit = answers.com_area === 'counter' ? 'securing a curved or open counter path' : 'securing an open commercial bay'; break;
    case 'freestanding': benefit = 'protecting valuable items in a standalone case'; break;
    case 'modular': benefit = 'protecting goods within display or storage fixtures'; break;
    case 'riot': benefit = (answers.com_goal || []).includes('ballistic') ? 'ballistic protection for the glass opening when a specialist selects the appropriate tested system' : 'reinforcing a glass opening while keeping a clear view'; break;
    default: benefit = 'the protection need you described';
  }
  return { name: PRODUCTS[result.product].name, url: PRODUCTS[result.product].url, action: 'Learn more', note: `Can help with ${benefit}.` };
}

function renderResult() {
  const result = resultFor(state.answers);
  const prior = state.saved.map((entry, i) => `<div class="saved-result"><div class="saved-card"><div><strong>${escapeHTML(entry.result.scope)}</strong><span>Area ${i + 1} of your plan</span></div><button type="button" data-action="remove" data-index="${i}" aria-label="Remove ${escapeHTML(entry.result.scope)}">Remove</button></div>${resultCard(entry.result)}</div>`).join('');
  app.innerHTML = `<div class="result-header"><span class="result-count">${state.saved.length + 1} ${state.saved.length ? 'areas explored' : 'starting point found'}</span><h2 id="workspace-title" tabindex="-1">Your protection starting point</h2><p>Based on what you told us, these are product families to explore. Final fit and any required ratings should be confirmed by QMi or an authorized dealer.</p></div>${prior ? `<div aria-label="Other areas in your plan">${prior}</div>` : ''}${state.saved.length ? `<div class="saved-card"><div><strong>${escapeHTML(result.scope)}</strong><span>Current area</span></div></div>` : ''}${resultCard(result)}<div class="result-actions"><button type="button" class="primary-button" data-action="quote">Get a quote <span aria-hidden="true">→</span></button><button type="button" class="outline-button" data-action="add">＋ Add another ${state.answers.audience === 'residential' ? 'opening' : 'area'}</button><button type="button" class="outline-button" data-action="edit">← Edit answers</button></div><p class="helper-line">Have more than one opening? Add it before requesting a quote so your project stays together.</p>`;
  app.querySelector('#workspace-title').textContent = 'Your detailed product guidance';
  app.querySelector('[data-action="quote"]').innerHTML = '← Back to quote';
  app.querySelector('[data-action="edit"]').dataset.action = 'edit-answers';
  app.querySelector('.helper-line').textContent = 'Add another opening or area to include it in the same inquiry.';
}

function renderQuote() {
  const audience = state.answers.audience;
  const quote = state.quote;
  quote.openings ??= inferredQuoteOpenings();
  const allOptions = quoteOpeningOptions(audience);
  const shown = new Set([...inferredQuoteOpenings(), ...quote.openings]);
  const optionHTML = ([value, label]) => `<label class="quote-option"><input type="checkbox" name="quote-openings" value="${escapeHTML(value)}" ${quote.openings.includes(value) ? 'checked' : ''} /><span>${escapeHTML(label)}</span></label>`;
  const extra = allOptions.filter(([value]) => !shown.has(value));
  const options = allOptions.filter(([value]) => shown.has(value)).map(optionHTML).join('') + (extra.length ? `<details class="quote-more"><summary>Add another opening or area</summary><div class="quote-more-grid">${extra.map(optionHTML).join('')}</div></details>` : '');
  const property = audience === 'residential'
    ? `<select id="quote-property" name="property" required><option value="">Choose property type</option>${['Single-family home', 'Townhome', 'Condo / apartment', 'Other / not sure'].map(value => `<option value="${escapeHTML(value)}" ${quote.property === value ? 'selected' : ''}>${escapeHTML(value)}</option>`).join('')}</select>`
    : `<input id="quote-property" name="property" type="text" required maxlength="80" autocomplete="organization" placeholder="e.g. retail store, pharmacy, school" value="${escapeHTML(quote.property)}" />`;
  const projects = allEntries().map(entry => {
    const item = productInterest(entry);
    return `<li><div class="quote-product-head"><strong>${escapeHTML(item.name)}</strong><a href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(item.action)} about ${escapeHTML(item.name)}">${escapeHTML(item.action)} <span aria-hidden="true">↗</span></a></div><small class="quote-product-note"><span aria-hidden="true">*</span> ${escapeHTML(item.note)}</small></li>`;
  }).join('');
  app.innerHTML = `<div class="step-head"><div class="step-index">YOUR QUOTE REQUEST</div><h2 id="workspace-title" tabindex="-1">Get a real quote from a QMi professional.</h2><p>Share a few details about your property and the openings you want to protect.</p></div><div class="quote-panel"><form id="quote-form"><div class="quote-fields"><div class="field"><label for="quote-email">Email address <span aria-hidden="true">*</span></label><input id="quote-email" name="email" type="email" required autocomplete="email" maxlength="120" placeholder="you@example.com" value="${escapeHTML(quote.email)}" /></div><div class="field"><label for="quote-property">${audience === 'residential' ? 'Type of home' : 'Type of business or property'} <span aria-hidden="true">*</span></label>${property}</div></div><fieldset class="quote-openings"><legend>${audience === 'residential' ? 'Which openings need protection?' : 'Which openings or areas need protection?'} <span aria-hidden="true">*</span></legend><p>Selected from your answers. Adjust if needed.</p><div class="quote-options">${options}</div><p id="quote-error" class="quote-error" role="alert"></p></fieldset><div class="field quote-zip"><label for="quote-zip">ZIP code or state <span class="optional">Optional</span></label><input id="quote-zip" name="zip" autocomplete="postal-code" maxlength="30" placeholder="Helps QMi identify local requirements" value="${escapeHTML(quote.zip)}" /></div><div class="field quote-message"><label for="quote-message">Your inquiry <span class="optional">Optional</span></label><textarea id="quote-message" name="message" maxlength="1000" placeholder="Anything else a professional should know?">${escapeHTML(quote.message)}</textarea></div><div class="quote-project"><h3>Products of interest</h3><ul>${projects}</ul><p>These are starting points. A professional will confirm the product, measurements, ratings, and installation.</p></div><p class="quote-note">Your answers help a QMi professional understand your project and prepare a tailored recommendation.</p><div class="result-actions"><a class="primary-button" data-action="quote-handoff" href="https://qmiusa.com/contact-us/" target="_blank" rel="noopener noreferrer">Inquire Now <span aria-hidden="true">↗</span></a><button type="button" class="outline-button" data-action="back-to-result">← Back to results</button></div></form></div>`;
  app.querySelector('.step-index').textContent = 'YOUR QUOTE REQUEST';
  const panel = app.querySelector('.quote-panel');
  const products = panel.querySelector('.quote-project');
  panel.insertBefore(products, panel.querySelector('#quote-form'));
  products.insertAdjacentHTML('beforeend', `<button type="button" class="text-button quote-add-area" data-action="add">＋ Add another ${audience === 'residential' ? 'opening' : 'area'}</button>`);
  const details = panel.querySelector('[data-action="back-to-result"]');
  details.dataset.action = 'to-result';
  details.textContent = 'View full product guidance →';
}

function flowImageKey() {
  const a = state.answers;
  if (!a.audience) return 'default';
  if (state.stage === 'result' || state.stage === 'quote') {
    const product = resultFor(a).product;
    if (product && FLOW_IMAGES[product]) return product;
  }
  if (a.audience === 'residential') {
    const opening = a.res_opening === 'multiple' ? a.res_first_opening : a.res_opening;
    if (state.stage === 'res_preference' && opening === 'window' && a.res_preference === 'always') return isEgress() ? 'egress' : 'fixed';
    const goals = a.res_goal || [];
    if (goals.includes('storm')) return 'qhurricane';
    if (goals.includes('security')) return 'qsecure';
    return goals.includes('privacy') ? 'al2' : 'qsecure';
  }
  const goals = a.com_goal || [];
  if (goals.includes('ballistic')) return 'riot';
  switch (a.com_area) {
    case 'storefront':
      if (a.com_opening === 'glass_door') return 'riot';
      if (a.com_visibility === 'airflow') return 'fixed';
      if (a.com_visibility === 'clear') return a.com_clear === 'retrofit' ? 'lx6' : 'tr4';
      return a.com_width === 'wide' && a.com_location === 'interior' ? 'xl' : 'al8';
    case 'counter':
      if (a.com_visibility === 'clear') return a.com_clear === 'retrofit' ? 'lx6' : 'tr4';
      if (a.com_shape === 'curved' || a.com_shape === 'staggered') return a.com_stack === 'compact' ? 'profile' : 'performance';
      return a.com_width === 'wide' ? 'xl' : 'performance';
    case 'merchandise': return a.com_fixture === 'existing' || a.com_fixture === 'new' ? 'modular' : 'freestanding';
    case 'inventory':
      if (a.com_target === 'exterior_exit') return 'hd1';
      if (a.com_target === 'interior_door') return 'al8';
      return a.com_fixture === 'standalone' ? 'freestanding' : 'modular';
    case 'door': return a.com_door === 'glass' ? 'riot' : 'hd1';
    case 'specialty': return a.com_specialty === 'fixture' ? 'modular' : a.com_specialty === 'kiosk' ? 'lx6' : 'al8';
    default: return 'al8';
  }
}
function updateFlowImages() {
  const source = FLOW_IMAGES[flowImageKey()];
  for (const id of ['rail-image', 'mobile-flow-image']) {
    const image = document.getElementById(id);
    if (!image) continue;
    image.onerror = () => { image.onerror = null; image.src = FLOW_IMAGES.default; };
    if (image.getAttribute?.('src') !== source) image.src = source;
  }
}
function render() {
  updateFlowImages();
  app.className = `app stage-${state.stage}`;
  renderHeader();
  if (state.stage === 'result') renderResult();
  else if (state.stage === 'quote') renderQuote();
  else renderQuestion();
}
function focusAndScroll() {
  app.querySelector('#workspace-title')?.focus({ preventScroll: true });
  if (window.matchMedia('(max-width: 760px)').matches) document.querySelector('.workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}
function clearFuture() { const keep = new Set([...state.history, state.stage]); for (const key of Object.keys(state.answers)) if (!keep.has(key)) delete state.answers[key]; state.quote.openings = null; }
function advance(value) { clearFuture(); state.answers[state.stage] = value; state.history.push(state.stage); state.stage = nextStage(state.stage); render(); focusAndScroll(); }
function toggleMulti(value) {
  const question = currentQuestion();
  const old = Array.isArray(state.answers[state.stage]) ? [...state.answers[state.stage]] : [];
  const index = old.indexOf(value);
  if (index >= 0) old.splice(index, 1);
  else if (old.length < question.max) old.push(value);
  else { toast(`Choose up to ${question.max} goals.`); return; }
  state.answers[state.stage] = old;
  render();
  app.querySelector(`[data-choice="${value}"]`)?.focus();
}
function back() { if (state.stage === 'result') { openQuote(); return; } if (!state.history.length) { restart(); return; } state.stage = state.history.pop(); render(); focusAndScroll(); }
function editAnswers() { state.stage = state.history.pop() || 'audience'; render(); focusAndScroll(); }
function restart() { state.stage = 'audience'; state.answers = {}; state.history = []; state.saved = []; state.quote = { email: '', property: '', openings: null, zip: '', message: '' }; render(); }
function addAnother() { state.saved.push({ result: resultFor(state.answers), answers: JSON.parse(JSON.stringify(state.answers)) }); state.quote.openings = null; const audience = state.answers.audience; state.answers = { audience }; state.history = ['audience']; state.stage = audience === 'residential' ? 'res_goal' : 'com_area'; render(); focusAndScroll(); }
function openQuote() { state.quote.openings ??= inferredQuoteOpenings(); state.stage = 'quote'; render(); focusAndScroll(); }
function resultSummary() {
  const all = allEntries();
  const lines = [`QMi product guide — ${state.answers.audience === 'residential' ? 'Residential' : 'Commercial'} project`, ''];
  if (state.quote.email) lines.push(`Email: ${state.quote.email}`);
  if (state.quote.property) lines.push(`Property: ${state.quote.property}`);
  if (state.quote.openings?.length) {
    const labels = new Map(quoteOpeningOptions(state.answers.audience));
    lines.push(`Openings / areas: ${state.quote.openings.map(value => labels.get(value)).join(', ')}`);
  }
  if (state.quote.zip) lines.push(`Location: ${state.quote.zip}`);
  if (state.quote.message) lines.push(`Additional inquiry: ${state.quote.message}`);
  lines.push('');
  all.forEach(({ result }, index) => {
    const product = result.product ? PRODUCTS[result.product] : null;
    lines.push(`${index + 1}. ${result.scope}`, `Starting point: ${product ? product.name : 'Expert review recommended'}`, result.why);
    if (product) lines.push(product.url);
    if (result.alternatives.length) lines.push(`Also consider: ${result.alternatives.map(id => PRODUCTS[id].name).join('; ')}`);
    lines.push(`Confirm: ${result.checks.join(' ')}`, '');
  });
  lines.push('Product fit, approvals, egress, and installation require specialist confirmation.');
  return lines.join('\n');
}
function prepareQuote(event) {
  const form = document.getElementById('quote-form');
  if (!form.reportValidity()) { event.preventDefault(); return; }
  state.quote.email = form.querySelector('#quote-email').value.trim();
  state.quote.property = form.querySelector('#quote-property').value.trim();
  if (!state.quote.openings.length) {
    event.preventDefault();
    document.getElementById('quote-error').textContent = 'Choose at least one opening or area.';
    form.querySelector('[name="quote-openings"]')?.focus();
    return;
  }
  const request = resultSummary();
  navigator.clipboard.writeText(request)
    .then(() => { state.stage = 'result'; render(); focusAndScroll(); toast('Details copied. Paste them into QMi’s quote form.'); })
    .catch(() => toast('Copying was unavailable; your project summary remains here.'));
}
function toast(message) { document.querySelector('.toast')?.remove(); const el = document.createElement('div'); el.className = 'toast'; el.textContent = message; document.body.appendChild(el); setTimeout(() => el.remove(), 2700); }

app.addEventListener('click', event => {
  const choice = event.target.closest('[data-choice]');
  if (choice) { const value = choice.dataset.choice; currentQuestion().multi ? toggleMulti(value) : advance(value); return; }
  const action = event.target.closest('[data-action]');
  if (!action) return;
  switch (action.dataset.action) {
    case 'back': back(); break;
    case 'continue': if ((state.answers[state.stage] || []).length) { clearFuture(); state.history.push(state.stage); state.stage = nextStage(state.stage); render(); focusAndScroll(); } break;
    case 'edit': back(); break;
    case 'edit-answers': editAnswers(); break;
    case 'add': addAnother(); break;
    case 'restart': restart(); break;
    case 'quote': openQuote(); break;
    case 'quote-handoff': prepareQuote(event); break;
    case 'to-result': state.stage = 'result'; render(); focusAndScroll(); break;
    case 'remove': state.saved.splice(Number(action.dataset.index), 1); state.quote.openings = null; render(); break;
  }
});
app.addEventListener('input', event => {
  if (event.target.id === 'quote-email') state.quote.email = event.target.value;
  if (event.target.id === 'quote-property') state.quote.property = event.target.value;
  if (event.target.id === 'quote-zip') state.quote.zip = event.target.value;
  if (event.target.id === 'quote-message') state.quote.message = event.target.value;
});
app.addEventListener('change', event => {
  if (event.target.name !== 'quote-openings') return;
  state.quote.openings = [...app.querySelectorAll('[name="quote-openings"]:checked')].map(input => input.value);
  document.getElementById('quote-error').textContent = '';
});
render();
