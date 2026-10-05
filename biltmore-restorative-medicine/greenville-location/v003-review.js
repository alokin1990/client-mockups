document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('#MainContent');
  if (!main) return;

  const intro = main.querySelector('.banner-home');
  const legacyServiceSection = document.querySelector('#shopify-section-template--34010253426941__multicolumn_RYm4Fg');
  legacyServiceSection?.remove();

  const services = [
    ['Men’s Sexual Health', ['P-Shot®', 'Priapus Toxin', 'Girth Enhancement', 'Acoustic Wave Therapy', 'Scrotox', 'Testosterone Replacement Therapy', 'Peyronie’s Disease'], 'https://biltmorerestorativemedicine.com/pages/mens-sexual-health', 'Elevate your drive, confidence, and performance.'],
    ['Women’s Sexual Health', ['O-Shot®', 'Juliet™ Feminine Laser', 'Acoustic Wave Therapy', 'Clitoxin', 'Vaginal Rejuvenation', 'Female Incontinence'], 'https://biltmorerestorativemedicine.com/pages/female-sexual-health'],
    ['Hormone Therapy & Wellness', ['Bioidentical Hormone Replacement Therapy', 'Testosterone Replacement Therapy', 'Peptide Therapy', 'Regenerative Cellular Therapy'], 'https://biltmorerestorativemedicine.com/pages/hormone-therapy-wellness'],
    ['Facial Rejuvenation', ['Y-Lift®', 'PDO Threads', 'Vampire Facelift®', 'Genius® RF Microneedling with Salmon DNA', 'Facial Fat Reduction'], 'https://biltmorerestorativemedicine.com/pages/facial-rejuvenation'],
    ['Injectables & Fillers', ['Botox®', 'Dysport®', 'Dermal Fillers', 'Kybella®', 'Sculptra®', 'Radiesse®', 'Instant BBL', 'Hand Rejuvenation'], 'https://biltmorerestorativemedicine.com/pages/injectables-fillers'],
    ['Body Treatments', ['TruSculpt® iD', 'AccuFit™', 'Medical Weight Loss', 'Scar & Stretch Mark Reduction'], 'https://biltmorerestorativemedicine.com/pages/body-treatments'],
    ['Laser Treatments', ['Excel V®', 'UltraClear®', 'Enlighten® by Cutera', 'LightStim® LED Bed', 'Cool Laser Facial'], 'https://biltmorerestorativemedicine.com/pages/laser-treatments'],
    ['Hair Restoration', ['NeoGraft® Transplant', 'Natural Hair Restoration with PRP'], 'https://biltmorerestorativemedicine.com/pages/hair-restoration'],
  ];

  const localServicePages = [
    ['BHRT in Greenville', 'Review Greenville-specific assessment, treatment options, potential benefits and risks, and ongoing monitoring.', 'https://biltmorerestorativemedicine.com/pages/bhrt-greenville'],
    ['Testosterone Replacement Therapy in Greenville', 'Learn about the Greenville consultation, testing, treatment options, and monitoring process.', 'https://biltmorerestorativemedicine.com/pages/trt-greenville'],
    ['Peptide Therapy in Greenville', 'Explore locally available peptide options, medical supervision, potential risks, and follow-up.', 'https://biltmorerestorativemedicine.com/pages/peptide-therapy-greenville'],
  ];

  const renderServiceCards = (items) => items.map(([name, options, url, hook]) => `
    <article class="v003-card v003-review">
      <h3 class="v003-review">${name}</h3>
      ${hook ? `<p class="v003-review">${hook}</p>` : ''}
      <ul class="v003-review">${options.map((option) => `<li>${option}</li>`).join('')}</ul>
      <a class="v003-review" href="${url}">Explore ${name}</a>
    </article>`).join('');

  const renderLocalCards = (items) => items.map(([name, description, url]) => `
    <article class="v003-card v003-review">
      <h3 class="v003-review">${name}</h3>
      <p class="v003-review">${description}</p>
      <a class="v003-review" href="${url}">View ${name}</a>
    </article>`).join('');

  const page = `
    <div class="v003-page">
      <section class="v003-office v003-review">
        <div class="v003-review">
          <h2 class="v003-review">Greenville office details</h2>
          <p class="v003-review"><strong>2249 Augusta St.<br>Greenville, SC 29605</strong><br><a class="v003-review" href="tel:+18646951469">(864) 695-1469</a></p>
          <p class="v003-review">Monday–Thursday 9 a.m.–4 p.m.<br>Friday 9 a.m.–12 p.m.<br>Saturday–Sunday closed</p>
          <div class="v003-actions v003-review"><a class="v003-btn v003-review" href="https://biltmorerestorativemedicine.com/pages/contact-us">Request an appointment</a><a class="v003-btn alt v003-review" href="https://www.google.com/maps/search/?api=1&amp;query=Biltmore+Restorative+Medicine+2249+Augusta+St+Greenville+SC+29605">Directions</a></div>
        </div>
        <iframe class="v003-map v003-review" title="Map to the Greenville office" loading="lazy" src="https://www.google.com/maps?q=2249+Augusta+St,+Greenville,+SC+29605&amp;output=embed"></iframe>
      </section>

      <section class="v003-lead v003-review" id="greenville-services" aria-labelledby="greenville-services-title">
        <div class="v003-section-intro v003-review">
          <h2 class="v003-review" id="greenville-services-title">Services and wellness support</h2>
          <p class="v003-review">From sexual wellness and hormone optimization to advanced aesthetics and hair restoration, Biltmore offers a broad range of restorative care with physician-led evaluation and treatment planning.</p>
        </div>
        <div class="v003-grid eight v003-review">${renderServiceCards(services)}</div>

        <section class="v003-local-hubs v003-review" aria-labelledby="greenville-local-pages-title">
          <p class="v003-eyebrow v003-review">Greenville service hubs</p>
          <h2 class="v003-review" id="greenville-local-pages-title">Local hormone and wellness pages</h2>
          <p class="v003-review">Looking for personalized hormone and wellness care in Greenville? Start with the option that best matches your goals, then connect with the clinical team to discuss your next step.</p>
          <div class="v003-grid three v003-review">${renderLocalCards(localServicePages)}</div>
        </section>
      </section>
    </div>`;

  (intro || main).insertAdjacentHTML(intro ? 'afterend' : 'afterbegin', page);
});
