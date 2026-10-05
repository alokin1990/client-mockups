document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('#MainContent');
  if (!main) return;

  const intro = main.querySelector('.banner-home');
  const legacyServiceSection = document.querySelector('#shopify-section-template--34010253820157__multicolumn_jTpGnz');
  legacyServiceSection?.remove();

  const services = [
    ['Men’s Sexual Health', 'Non-surgical sexual wellness for men — from the P-Shot® to testosterone optimization. Available in Asheville, NC and Greenville, SC.', 'https://biltmorerestorativemedicine.com/pages/mens-sexual-health'],
    ['Women’s Sexual Health', 'Personalized, non-surgical sexual wellness for women, including the O-Shot®, Acoustic Wave Therapy, and Juliet™ Laser. Available at both our Asheville and Greenville locations.', 'https://biltmorerestorativemedicine.com/pages/female-sexual-health'],
    ['Hormone Therapy & Wellness', 'Science-backed hormone optimization designed to restore energy, mood, and libido through physician-supervised BHRT and testosterone replacement therapy programs.', 'https://biltmorerestorativemedicine.com/pages/hormone-therapy-wellness'],
    ['Facial Rejuvenation', 'From PDO threads to the Vampire Facelift®, Dr. Ibrahim’s facial rejuvenation treatments are designed to turn back the clock non-surgically, with precision and results that still look like you.', 'https://biltmorerestorativemedicine.com/pages/facial-rejuvenation'],
    ['Injectables & Fillers', 'Explore physician-led injectable and filler services designed to restore volume, soften wrinkles, and enhance facial contours with natural-looking results.', 'https://biltmorerestorativemedicine.com/pages/injectables-fillers'],
    ['Body Treatments', 'Sculpt, tone, and redefine without surgery or downtime through non-surgical body treatments, including TruSculpt® iD and AccuFit™.', 'https://biltmorerestorativemedicine.com/pages/body-treatments'],
    ['Laser Treatments', 'Medical-grade laser technology can address texture, tone, pigmentation, and resurfacing with physician oversight at every step.', 'https://biltmorerestorativemedicine.com/pages/laser-treatments'],
    ['Hair Restoration', 'Physician-led hair-restoration options, including NeoGraft® and PRP therapy, are available for patients considering a personalized approach to hair loss.', 'https://biltmorerestorativemedicine.com/pages/hair-restoration'],
  ];

  const localServicePages = [
    ['Hormone Therapy & Wellness', 'Start with the broad overview of hormone assessment, available paths, and follow-up.', 'https://biltmorerestorativemedicine.com/pages/hormone-therapy-wellness'],
    ['Bioidentical Hormone Replacement Therapy', 'Review BHRT assessment, treatment options, potential benefits and risks, and ongoing monitoring.', 'https://biltmorerestorativemedicine.com/pages/bioidentical-hormone-replacement-therapy'],
    ['Testosterone Replacement Therapy', 'Learn how testosterone concerns may be assessed and how treatment and monitoring are approached.', 'https://biltmorerestorativemedicine.com/pages/trt-therapy'],
    ['Peptide Therapy', 'Explore physician-supervised peptide options, consultation, potential risks, and follow-up.', 'https://biltmorerestorativemedicine.com/pages/peptide-therapy'],
  ];

  const renderCards = (items) => items.map(([name, description, url]) => `
    <article class="v003-card v003-review">
      <h3 class="v003-review">${name}</h3>
      <p class="v003-review">${description}</p>
      <a class="v003-review" href="${url}">Explore ${name}</a>
    </article>`).join('');

  const page = `
    <div class="v003-page">
      <section class="v003-office v003-review">
        <div class="v003-review">
          <h2 class="v003-review">Asheville office details</h2>
          <p class="v003-review"><strong>1 Vanderbilt Park Dr #230<br>Asheville, NC 28803</strong><br><a class="v003-review" href="tel:+18287825245">(828) 782-5245</a></p>
          <p class="v003-review">Monday–Thursday 9 a.m.–4 p.m.<br>Friday 9 a.m.–12 p.m.<br>Saturday–Sunday closed</p>
          <div class="v003-actions v003-review"><a class="v003-btn v003-review" href="https://biltmorerestorativemedicine.com/pages/contact-us">Request an appointment</a><a class="v003-btn alt v003-review" href="https://www.google.com/maps/search/?api=1&amp;query=Biltmore+Restorative+Medicine+1+Vanderbilt+Park+Dr+230+Asheville+NC+28803">Directions</a></div>
        </div>
        <iframe class="v003-map v003-review" title="Map to the Asheville office" loading="lazy" src="https://www.google.com/maps?q=1+Vanderbilt+Park+Dr+230,+Asheville,+NC+28803&amp;output=embed"></iframe>
      </section>

      <section class="v003-lead v003-review" id="asheville-services" aria-labelledby="asheville-services-title">
        <div class="v003-section-intro v003-review">
          <h2 class="v003-review" id="asheville-services-title">Services and wellness support</h2>
          <p class="v003-review">From sexual wellness and hormone optimization to advanced aesthetics and hair restoration, Biltmore offers a broad range of restorative care with physician-led evaluation and treatment planning.</p>
        </div>
        <div class="v003-grid eight v003-review">${renderCards(services)}</div>

        <section class="v003-local-hubs v003-review" aria-labelledby="asheville-hormone-pages-title">
          <p class="v003-eyebrow v003-review">Asheville service hubs</p>
          <h2 class="v003-review" id="asheville-hormone-pages-title">Hormone and wellness pages for Asheville patients</h2>
          <p class="v003-review">Use these treatment pages to understand the options that can be discussed with the Asheville clinical team, including assessment, treatment pathways, potential risks, and follow-up.</p>
          <div class="v003-grid four v003-review">${renderCards(localServicePages)}</div>
        </section>
      </section>

      <section class="v003-review">
        <h2 class="v003-review">Meet the care team</h2>
        <p class="v003-review">Dr. George Ibrahim leads Biltmore Restorative Medicine with a physician-directed approach to evaluation, treatment planning, and follow-up.</p>
        <img class="v003-review" src="assets/cd791247a08b2f4d.webp" alt="Biltmore Restorative Medicine clinical team" style="max-width:100%;height:auto">
      </section>
    </div>`;

  (intro || main).insertAdjacentHTML(intro ? 'afterend' : 'afterbegin', page);
});
