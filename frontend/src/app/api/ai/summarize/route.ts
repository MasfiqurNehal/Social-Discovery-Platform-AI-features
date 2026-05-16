import { NextResponse } from 'next/server';

// ── Seeded selection helpers ──────────────────────────────────────────────────

function nameHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

function picks<T>(arr: T[], seed: number, count: number): T[] {
  const results: T[] = [];
  const used = new Set<number>();
  for (let i = 0; i < count && results.length < arr.length; i++) {
    let idx = ((seed * (i + 3)) % arr.length + arr.length) % arr.length;
    while (used.has(idx)) idx = (idx + 1) % arr.length;
    used.add(idx);
    results.push(arr[idx]);
  }
  return results;
}

// ── Rating helpers ────────────────────────────────────────────────────────────

function ratingLabel(r: number) {
  if (r >= 4.7) return 'Outstanding';
  if (r >= 4.3) return 'Excellent';
  if (r >= 3.8) return 'Very Good';
  if (r >= 3.2) return 'Good';
  return 'Fair';
}

function verdictScore(r: number, reviews: number): number {
  const base = (r / 5) * 8.5;
  const popularity = Math.min(reviews / 500, 1) * 1.5;
  return Math.min(10, parseFloat((base + popularity).toFixed(1)));
}

// ── Overview by category ──────────────────────────────────────────────────────

const PLACE_OVERVIEWS: Record<string, ((n: string, a: string, r: number, s: number) => string)[]> = {
  'Food & Drinks': [
    (n, a, r) => `${n} has carved out a strong reputation in ${a}'s competitive dining scene. Rated ${r.toFixed(1)} stars by a loyal base of regulars and first-timers alike, it delivers the kind of experience that drives repeat visits — consistent flavours, genuine hospitality, and an ambience that feels effortlessly right for any occasion.`,
    (n, a, r) => `Tucked into the rhythm of ${a}, ${n} is the sort of place that earns word-of-mouth praise before any formal review. A ${r.toFixed(1)}-star rating reflects what guests already know: the kitchen takes quality seriously, the service hits its mark, and the overall experience is one you remember.`,
    (n, a, r) => `${n} represents everything that makes ${a}'s food culture worth exploring. With a ${r.toFixed(1)}-star standing built on consistent execution, it appeals equally to neighbourhood regulars seeking comfort and newcomers looking for something worth talking about. The food here doesn't just satisfy — it tells a story.`,
    (n, a, r) => `Few places in ${a} match the overall package that ${n} offers. Its ${r.toFixed(1)}-star rating is the byproduct of a simple philosophy: treat every guest well, serve food you're proud of, and let the space speak for itself. The result is a destination that feels both familiar and special.`,
  ],
  'Landmarks & Heritage': [
    (n, a, r) => `${n} stands as one of ${a}'s most significant cultural and historical touchpoints. With a visitor rating of ${r.toFixed(1)} stars, it draws history enthusiasts, photographers, and curious travellers who come to connect with the stories embedded in its architecture and surroundings. A visit here offers context that no textbook can replicate.`,
    (n, a, r) => `History is tangible at ${n}. Situated in ${a}, this landmark earns its ${r.toFixed(1)}-star reputation through the weight of its past and the quality of the experience it offers today. Whether you're a dedicated history buff or simply looking to understand more about the region's identity, this is a stop that delivers.`,
    (n, a, r) => `${n} is more than a point on a map — it's a living record of ${a}'s heritage. Visitors consistently rate it ${r.toFixed(1)} stars, citing its historical depth, visual impact, and the sense of place it creates. For anyone wanting to understand the cultural DNA of this area, this is where the story begins.`,
    (n, a, r) => `Among ${a}'s heritage sites, ${n} holds a distinct place. Its ${r.toFixed(1)}-star rating reflects the quality of visitor experience — thoughtful access, preserved integrity, and a presence that rewards attention. Photographers, students, and travellers all find something meaningful here.`,
  ],
  'Outdoors': [
    (n, a, r) => `${n} offers one of ${a}'s best outdoor escapes from the city's daily pace. Rated ${r.toFixed(1)} stars by visitors who value fresh air, open space, and natural beauty, it serves as a popular gathering point for families, fitness enthusiasts, and anyone in need of a mindful reset. The greenery and atmosphere here do the work that city parks rarely manage.`,
    (n, a, r) => `In ${a}, finding quality outdoor space is rare — ${n} is the exception. A ${r.toFixed(1)}-star rating confirms what regulars already know: this is a well-maintained, genuinely enjoyable green space that rewards a visit at any time of day. Whether you're here for morning exercise, weekend picnics, or simply to breathe, the environment delivers.`,
    (n, a, r) => `${n} is ${a}'s answer to the growing demand for accessible urban nature. Visitors rate it ${r.toFixed(1)} stars for good reason — the space is well-kept, thoughtfully designed, and consistently pleasant. From early morning joggers to evening strollers, it caters to a wide spectrum of outdoor enthusiasts.`,
    (n, a, r) => `Green spaces in urban Bangladesh are precious, and ${n} in ${a} makes a strong case for their importance. With a ${r.toFixed(1)}-star visitor rating, it earns its place as a go-to retreat for those seeking natural surroundings, physical activity, and community atmosphere away from the city's congestion.`,
  ],
  'Culture': [
    (n, a, r) => `${n} is one of ${a}'s premier cultural venues, drawing artists, intellectuals, and curious visitors into a space where creativity and community intersect. Its ${r.toFixed(1)}-star rating reflects both the quality of programming and the environment it cultivates — one that challenges, inspires, and occasionally surprises.`,
    (n, a, r) => `For those who believe culture should be experienced rather than just observed, ${n} in ${a} delivers. Rated ${r.toFixed(1)} stars by a thoughtful visitor base, it offers rotating exhibitions, curated programmes, and a physical space that elevates the entire experience. This is where ${a}'s creative scene comes alive.`,
    (n, a, r) => `${n} occupies a special place in ${a}'s cultural landscape. With a ${r.toFixed(1)}-star reputation, it attracts a diverse audience — from school groups and art students to professionals and international visitors — all drawn by the quality and relevance of what's on offer. The programming here consistently reflects both local identity and global dialogue.`,
    (n, a, r) => `Culture isn't incidental at ${n} — it's the entire point. Set in ${a}, this venue earns its ${r.toFixed(1)}-star standing through a commitment to thoughtful curation, accessible programming, and an atmosphere that makes every visitor feel like they belong. It's the kind of place that changes how you see the city.`,
  ],
  'Shopping': [
    (n, a, r) => `${n} has established itself as one of ${a}'s most reliable shopping destinations. Rated ${r.toFixed(1)} stars, it combines variety, quality, and accessibility in a way that justifies the visit whether you're on a mission or simply browsing. The range of offerings spans everyday essentials to curated finds that reward careful shoppers.`,
    (n, a, r) => `For a shopping experience that goes beyond the transactional, ${n} in ${a} delivers. Its ${r.toFixed(1)}-star rating is built on a mix of product quality, vendor reliability, and an environment that makes the experience genuinely enjoyable. Whether you're hunting for something specific or open to discovery, this is the place to start.`,
    (n, a, r) => `${n} is ${a}'s go-to for shoppers who value variety and price across a single destination. A ${r.toFixed(1)}-star visitor rating speaks to the consistency of the experience — good selection, fair pricing, and the kind of organised layout that makes browsing efficient and satisfying.`,
    (n, a, r) => `There's a reason ${n} has earned ${r.toFixed(1)} stars from shoppers across ${a}. The combination of product range, accessible pricing, and overall environment makes it a standout in a competitive retail landscape. Smart shoppers come here knowing they'll leave with more than they planned to buy.`,
  ],
  'Cinema & Screenings': [
    (n, a, r) => `${n} is ${a}'s cinema of choice for film lovers who want more than just a screen. Rated ${r.toFixed(1)} stars, it delivers a viewing experience that respects the craft of cinema — sound quality that immerses, visuals that don't disappoint, and a programming schedule that balances blockbusters with titles worth discovering.`,
    (n, a, r) => `Film deserves a proper setting, and ${n} in ${a} provides exactly that. With a ${r.toFixed(1)}-star rating from regular visitors, it has built a reputation for technical quality, comfortable screening environments, and a programme that serves both mainstream tastes and cinema enthusiasts looking for something beyond the multiplex.`,
    (n, a, r) => `${n} takes cinema seriously — and ${a}'s film community has noticed. Its ${r.toFixed(1)}-star standing reflects an experience where the technical details are handled well: audio is clear, screens are maintained, and comfort is prioritised. For date nights, solo screenings, or group outings, it consistently delivers.`,
    (n, a, r) => `There are cinemas, and then there's ${n}. In ${a}'s entertainment landscape, it earns its ${r.toFixed(1)}-star rating through a combination of quality projection, curated programming, and the kind of atmosphere that makes movie-going feel like an event rather than an errand.`,
  ],
  'Nightlife': [
    (n, a, r) => `${n} has earned its place in ${a}'s nightlife circuit by understanding what makes a good night out: atmosphere, music, crowd energy, and drinks done right. Rated ${r.toFixed(1)} stars, it draws a mix of regulars and new arrivals who come for the vibe and stay for the experience. On the right night, it delivers something genuinely memorable.`,
    (n, a, r) => `${a}'s after-dark scene has its standouts, and ${n} is firmly among them. A ${r.toFixed(1)}-star rating reflects consistent delivery on the key elements of nightlife — sound that moves people, a space that invites movement, and an energy that builds as the night progresses. This is where the city comes alive after hours.`,
    (n, a, r) => `${n} isn't just a venue — it's an experience that ${a}'s night crowd has voted on with a ${r.toFixed(1)}-star rating. The draw is the combination: curated music, a crowd that knows how to enjoy itself, and a physical space that supports it all without feeling either too formal or too chaotic. The balance here is real.`,
    (n, a, r) => `For those who take their nightlife seriously, ${n} in ${a} is worth knowing. Rated ${r.toFixed(1)} stars by a crowd that's been to the alternatives, it delivers on the fundamentals — energy, sound quality, drink selection, and the right atmosphere for letting the week go. Weekends here tend to run late.`,
  ],
  'Wellness': [
    (n, a, r) => `${n} offers ${a}'s wellness seekers a refuge from the pace of daily life. With a ${r.toFixed(1)}-star visitor rating, it has built a reputation for treatments that actually deliver — professional therapists, quality products, and environments calibrated for genuine relaxation. A session here doesn't just feel good in the moment; the benefits extend well beyond the door.`,
    (n, a, r) => `In ${a}'s growing wellness landscape, ${n} stands out for the quality of its offering. Rated ${r.toFixed(1)} stars, it attracts clients who want more than surface-level relaxation — they come for structured wellness programmes, skilled practitioners, and a space that takes their wellbeing seriously. The results are what keep people coming back.`,
    (n, a, r) => `${n} is ${a}'s answer to the modern demand for accessible, quality wellness. A ${r.toFixed(1)}-star rating built on real client experiences confirms that the treatments here are effective, the staff is professional, and the atmosphere creates the right conditions for actual recovery and rejuvenation. This isn't just pampering — it's a genuine health investment.`,
    (n, a, r) => `Wellness at ${n} in ${a} is taken seriously. Rated ${r.toFixed(1)} stars by a clientele that knows the difference between good and great, it delivers on its promise through skilled practitioners, quality environments, and programmes that address both physical and mental restoration. A visit here is money genuinely well spent.`,
  ],
  'Family & Kids': [
    (n, a, r) => `${n} has earned its ${r.toFixed(1)}-star rating from families across ${a} by getting the fundamentals right: safe environments, engaging activities for different age groups, and the kind of atmosphere that makes both kids and adults genuinely happy. This is the destination that earns its place on weekend plans without needing to oversell itself.`,
    (n, a, r) => `For families in ${a}, ${n} has become a reliable favourite — and its ${r.toFixed(1)}-star rating shows it. The appeal is clear: activities that hold children's attention, spaces that give parents room to breathe, and an overall environment that's been designed with family dynamics in mind. It's the rare outing that satisfies the whole group.`,
    (n, a, r) => `${n} understands what families actually need: entertainment that engages children, comfort that reassures parents, and a space that makes the experience feel effortless. Its ${r.toFixed(1)}-star rating in ${a} reflects the success of that formula — a family destination that doesn't require compromise from anyone in the group.`,
    (n, a, r) => `Finding quality family entertainment in ${a} is harder than it sounds. ${n} solves that problem with a ${r.toFixed(1)}-star experience that caters to children's energy and parents' need for something genuinely enjoyable. The mix of activities, safety standards, and overall atmosphere makes it a consistent top pick for family outings.`,
  ],
  'Sports & Fitness': [
    (n, a, r) => `${n} is ${a}'s serious option for those committed to their physical development. Rated ${r.toFixed(1)} stars by a fitness community that demands results, it provides quality equipment, professional coaching where available, and a culture of commitment that raises everyone's game. Whether you're a beginner or an experienced athlete, the environment supports real progress.`,
    (n, a, r) => `Fitness culture in ${a} has a benchmark, and ${n} helps set it. A ${r.toFixed(1)}-star rating reflects the quality of facilities, the calibre of the training environment, and the sense of community that develops when serious people work toward serious goals in the same space. This is where fitness becomes a lifestyle.`,
    (n, a, r) => `${n} earns its ${r.toFixed(1)}-star rating the hard way — through consistently maintained equipment, knowledgeable staff, and an atmosphere where progress is the shared goal. In ${a}'s growing fitness landscape, it stands out as a venue that takes physical development as seriously as its members do.`,
    (n, a, r) => `For ${a}'s fitness community, ${n} represents the right combination of facilities, environment, and culture. Its ${r.toFixed(1)}-star standing is built on equipment that works, spaces that are kept clean and organised, and a community that makes showing up feel worthwhile. This is where fitness goals become fitness results.`,
  ],
  'Entertainment': [
    (n, a, r) => `${n} is ${a}'s entertainment hub for those who want more than passive consumption. Rated ${r.toFixed(1)} stars, it curates experiences across a range of formats — performances, events, interactive programming — all delivered with the kind of production quality that makes guests feel the investment was worthwhile. This is where ${a} goes to be genuinely entertained.`,
    (n, a, r) => `In ${a}'s entertainment landscape, ${n} has carved out a clear identity. Its ${r.toFixed(1)}-star rating reflects a venue that understands its audience: people who come for experiences that are well-executed, memorable, and worth talking about afterward. The programming is diverse, the production quality is consistent, and the atmosphere delivers.`,
    (n, a, r) => `${n} offers ${a} an entertainment option that takes quality seriously. Rated ${r.toFixed(1)} stars by visitors who've tried the alternatives, it delivers consistent value through well-curated programming, quality execution, and an environment calibrated for maximum enjoyment. The experience here is designed to be remembered.`,
    (n, a, r) => `${a}'s entertainment scene is better for having ${n} in it. A ${r.toFixed(1)}-star reputation built on real experiences confirms what repeat visitors know: the programming is thoughtful, the production is quality, and the overall experience earns its place in anyone's plans for a good evening or weekend.`,
  ],
};

// ── Why Popular reasons by category ──────────────────────────────────────────

const POPULAR_REASONS: Record<string, string[]> = {
  'Food & Drinks': [
    'Consistently strong kitchen quality across diverse menu options',
    'Ambience that works for both casual visits and special occasions',
    'Genuine value-for-money positioning that keeps regulars loyal',
    'Service team that balances efficiency with personal attention',
    'Menu depth that rewards regular visitors with new discoveries',
    'Location accessibility within a highly trafficked Dhaka neighbourhood',
    'Strong social media presence driven by authentic guest experiences',
    'Reliable consistency that removes the risk from the dining decision',
  ],
  'Landmarks & Heritage': [
    'Rich historical significance that provides genuine educational depth',
    'Architectural character that rewards both casual visitors and specialists',
    'Photography value that draws creative visitors and content creators',
    'Well-managed visitor flow that maintains the integrity of the site',
    'Community importance as a preserved record of local identity',
    'Accessibility for school groups, tourists, and independent visitors alike',
    'Ongoing preservation efforts that demonstrate institutional commitment',
    'Emotional resonance for local residents with historical connections',
  ],
  'Outdoors': [
    'Accessible green space in an urban environment where it is genuinely scarce',
    'Well-maintained pathways and facilities that enable comfortable use',
    'Natural environment that provides meaningful mental health benefits',
    'Versatility for different activity types across age groups',
    'Community gathering function that builds neighbourhood social bonds',
    'Morning fitness culture that creates a dependable daily programme',
    'Seasonal natural beauty that rewards visits across different times of year',
    'Safe and family-friendly environment with consistent management',
  ],
  'Culture': [
    'Programming quality that reflects genuine curation rather than filler content',
    'Accessibility to art and culture for audiences who might not seek it elsewhere',
    'Rotating exhibitions that give regulars consistent reason to return',
    'Educational value for younger audiences and student groups',
    'Community of engaged visitors who share a genuine cultural interest',
    'Physical environment that enhances rather than distracts from the content',
    'Connection to both local artistic identity and international dialogue',
    'Events and openings that create social occasions around cultural engagement',
  ],
  'Shopping': [
    'Product variety that makes single-trip shopping genuinely efficient',
    'Competitive pricing supported by high vendor and tenant turnover',
    'Organised layout that reduces the friction of the shopping experience',
    'Quality control reputation that justifies the destination visit',
    'Mix of established brands and independent vendors for diverse needs',
    'Accessibility by multiple transport modes from across the city',
    'Trusted by local shoppers over many repeat visits',
    'Extended operating hours that accommodate different shopper schedules',
  ],
  'Cinema & Screenings': [
    'Technical quality of projection and audio that justifies the premium',
    'Comfortable seating and well-maintained viewing environments',
    'Diverse programming that serves both mainstream and niche audiences',
    'Reliable air conditioning and hygiene that meet visitor expectations',
    'Convenient location within an accessible Dhaka neighbourhood',
    'Online booking availability that reduces friction in the planning process',
    'Date-night suitability with adjacent dining and refreshment options',
    'Consistent scheduling that allows reliable advance planning',
  ],
  'Nightlife': [
    'Music curation that understands the crowd and the moment',
    'Energy management that builds the right atmosphere over the course of the night',
    'Drink quality and variety that matches the overall experience standard',
    'Crowd demographic that creates the right social environment',
    'Physical space design that enables both dancing and conversation',
    'Consistent performance across different nights of the week',
    'Staff attentiveness that manages the balance between service and atmosphere',
    'Reputation for safety and management that appeals to first-timers',
  ],
  'Wellness': [
    'Practitioner skill and certification that underpins treatment effectiveness',
    'Product quality used in treatments that elevates results',
    'Atmosphere design calibrated specifically for relaxation and recovery',
    'Appointment flexibility that accommodates different schedule types',
    'Treatment range that serves both targeted recovery and general wellness',
    'Hygiene standards that meet the expectations of health-conscious clients',
    'Consultation approach that personalises the experience to individual needs',
    'Reputation for visible, lasting results rather than short-term satisfaction',
  ],
  'Family & Kids': [
    'Age-appropriate activity range that engages children at multiple developmental stages',
    'Safety infrastructure and staff supervision that gives parents confidence',
    'Parent-comfort facilities that make the experience enjoyable for the whole family',
    'Consistent cleanliness standards across all areas of the venue',
    'Duration flexibility that suits both short visits and full-day outings',
    'Educational components woven into entertainment for added value',
    'Crowd management that prevents the experience from feeling overwhelming',
    'Reasonable pricing that makes regular family visits economically sustainable',
  ],
  'Sports & Fitness': [
    'Equipment quality and maintenance that enables effective training',
    'Coaching staff expertise that supports members at all fitness levels',
    'Facility hygiene standards that reflect genuine operational pride',
    'Community culture that motivates consistent attendance and effort',
    'Programme diversity that prevents training plateaus',
    'Operating hours that accommodate early morning and evening training schedules',
    'Fair and transparent membership and session pricing',
    'Progressive environment that rewards commitment with visible results',
  ],
  'Entertainment': [
    'Production quality that distinguishes the experience from lower-tier alternatives',
    'Programming variety that serves multiple entertainment preferences',
    'Venue atmosphere designed to amplify the entertainment experience',
    'Consistent delivery that removes uncertainty from the entertainment choice',
    'Group-friendly layout and ticketing that makes social outings easy',
    'Technology and sound infrastructure that meets modern expectations',
    'Booking ease and customer service that reduces pre-event friction',
    'Community of enthusiastic regulars that contributes to the overall energy',
  ],
};

// ── Highlights by category ────────────────────────────────────────────────────

const HIGHLIGHTS: Record<string, string[]> = {
  'Food & Drinks': ['Curated menu covering local and international flavour profiles', 'Indoor seating with ambience suited for both group meals and solo visits', 'Dedicated chef team with focus on ingredient quality and presentation', 'Beverage selection that complements the food programme', 'Weekend and peak-hour reservation recommended for best experience', 'Takeaway and delivery options available for off-site dining'],
  'Landmarks & Heritage': ['Photography permitted in designated areas with strong natural light', 'Guided interpretation available for deeper historical context', 'Accessible pathways for visitors with mobility requirements', 'Best visited in early morning or late afternoon for optimal atmosphere', 'Adjacent cultural and dining options to complement the visit', 'Seasonal events and commemorative programmes throughout the year'],
  'Outdoors': ['Multiple walking and jogging trails across varied terrain', 'Open recreational space suitable for group sports and family activities', 'Natural canopy providing shade during peak afternoon hours', 'Water features and landscaping maintained to high standards', 'Designated picnic and rest areas with basic amenities', 'Regular seasonal programmes and community fitness initiatives'],
  'Culture': ['Rotating exhibition programme with new installations every quarter', 'Dedicated workshop and programme space for participatory events', 'Curated permanent collection representing local and regional artists', 'Public café or refreshment space integrated into the cultural experience', 'Educational outreach programmes for school and community groups', 'Artist residency and emerging talent development initiatives'],
  'Shopping': ['Multi-category retail offering covering fashion, lifestyle, and essentials', 'Food court or dining options for extended shopping visits', 'Accessible parking and public transport connectivity', 'Regular promotional events and seasonal sales with competitive pricing', 'Customer service desks and returns policies clearly communicated', 'Mix of national brands and independent retailers under one roof'],
  'Cinema & Screenings': ['State-of-the-art digital projection across multiple screen formats', 'Tiered seating designed for unobstructed sightlines from all positions', 'High-quality Dolby or equivalent sound system', 'Advance booking available online with seat selection', 'Refreshment counter with standard and premium concessions', 'Dedicated pre-screening lounge area for early arrivals'],
  'Nightlife': ['DJ programme and live performances on rotation throughout the week', 'Well-stocked bar with trained mixologists and classic cocktail menu', 'Dance floor capacity designed for the venue\'s peak crowd size', 'Separate lounge area for conversation and social grouping', 'Smart casual to smart dress code maintained on peak nights', 'Security and management team ensuring safe and controlled environment'],
  'Wellness': ['Full menu of massage therapies including deep tissue and relaxation variants', 'Skincare and facial treatment programme using professional-grade products', 'Hydrotherapy and sauna facilities where available', 'Private consultation and customised treatment planning', 'Membership and package options for regular clients seeking value', 'Trained and certified practitioners across all service categories'],
  'Family & Kids': ['Dedicated play zones segmented by age group for safety and engagement', 'Interactive and educational activity stations throughout the venue', 'Cafeteria or family dining area with child-friendly menu options', 'Party and event hosting packages for birthdays and celebrations', 'Trained staff with child supervision and first-aid certification', 'Stroller-accessible layout with clean and well-equipped parent rooms'],
  'Sports & Fitness': ['Full gym floor with cardio, strength, and functional training zones', 'Group fitness class schedule covering yoga, HIIT, and sport-specific training', 'Professional coaching available for personal training and skill development', 'Clean locker and shower facilities with secure storage', 'Nutritional guidance and supplementation support on-site', 'Flexible membership options including daily, monthly, and annual passes'],
  'Entertainment': ['Live performance programme spanning music, comedy, and theatrical formats', 'State-of-the-art sound and lighting rig for immersive experience delivery', 'General admission and premium seating options for different budgets', 'Pre-event and interval food and beverage service', 'Accessible venue design with clear wayfinding and crowd management', 'Private event and corporate booking packages available'],
};

// ── Best For by category ──────────────────────────────────────────────────────

const BEST_FOR: Record<string, string[]> = {
  'Food & Drinks': ['Solo diners', 'Couples', 'Group celebrations', 'Business lunches', 'Weekend brunches', 'Date nights', 'Family gatherings'],
  'Landmarks & Heritage': ['History enthusiasts', 'Photographers', 'Student groups', 'International visitors', 'Cultural explorers', 'Family trips', 'Researchers'],
  'Outdoors': ['Morning joggers', 'Families with children', 'Weekend picnickers', 'Yoga practitioners', 'Dog walkers', 'Photography sessions', 'Mental recharge'],
  'Culture': ['Art lovers', 'Creative professionals', 'Students', 'Corporate groups', 'International visitors', 'Weekend explorers', 'Intellectuals'],
  'Shopping': ['Budget shoppers', 'Fashion enthusiasts', 'Gift hunters', 'Families', 'Weekend browsers', 'Deal seekers', 'One-stop shoppers'],
  'Cinema & Screenings': ['Movie enthusiasts', 'Date nights', 'Family outings', 'Friend groups', 'Solo film lovers', 'Weekend plans', 'Film club gatherings'],
  'Nightlife': ['Weekend night-owls', 'Corporate groups', 'Social butterfly personalities', 'Music lovers', 'Birthday celebrations', 'Friend reunions', 'Young professionals'],
  'Wellness': ['Stressed professionals', 'Athletes recovering', 'Couples seeking relaxation', 'Skincare enthusiasts', 'Mental health prioritisers', 'Regular self-care practitioners', 'Gift recipients'],
  'Family & Kids': ['Parents with toddlers', 'School-age children', 'Multi-generational families', 'Birthday party groups', 'Rainy day solutions', 'Weekend outings', 'Homeschool groups'],
  'Sports & Fitness': ['Beginners starting out', 'Serious athletes', 'Weight loss seekers', 'Sports team members', 'Corporate wellness groups', 'Youth fitness', 'Rehabilitation clients'],
  'Entertainment': ['Event-goers', 'Music fans', 'Comedy lovers', 'Corporate groups', 'Date nights', 'Friend groups', 'Performing arts supporters'],
};

// ── Budget cost insights ──────────────────────────────────────────────────────

function buildCostSection(tier: string, label: string, range: string, category: string) {
  const [low, high] = range.split('-').map(Number);
  const midPoint = Math.round((low + high) / 2);

  const valueMap: Record<string, string> = {
    '$':   'Strong value proposition with pricing accessible to a wide range of visitors.',
    '$$':  'Mid-range pricing that reflects genuine quality without unnecessary premium.',
    '$$$': 'Premium positioning justified by quality, experience, and exclusivity of offering.',
  };

  const categoryPerPersonNotes: Record<string, string> = {
    'Food & Drinks':       `Typical per-person spend of ৳${Math.round(midPoint * 0.6)}–৳${Math.round(midPoint * 0.85)} for a standard meal.`,
    'Landmarks & Heritage': `Entry and tour experience typically costs ৳${low}–৳${Math.round(midPoint * 0.7)} per visitor.`,
    'Outdoors':            `Entry and activity costs range from ৳${low} to ৳${Math.round(midPoint * 0.6)} per person.`,
    'Culture':             `Gallery entry and programme access typically ৳${low}–৳${Math.round(midPoint * 0.6)} per visitor.`,
    'Shopping':            `Average transaction value of ৳${Math.round(midPoint * 0.4)}–৳${high} depending on category and intent.`,
    'Cinema & Screenings': `Ticket pricing typically ৳${Math.round(midPoint * 0.4)}–৳${Math.round(midPoint * 0.7)} per seat with premium seating available.`,
    'Nightlife':           `Entry and drink spend averaging ৳${Math.round(midPoint * 0.5)}–৳${Math.round(midPoint * 0.8)} per person for a standard evening.`,
    'Wellness':            `Individual treatment pricing from ৳${low} to ৳${high} depending on service duration and type.`,
    'Family & Kids':       `Family entry and activity packages range from ৳${Math.round(low * 1.5)}–৳${Math.round(high * 0.8)} for 2 adults + 2 children.`,
    'Sports & Fitness':    `Day pass ৳${low}–৳${Math.round(midPoint * 0.5)}, monthly membership from ৳${Math.round(midPoint * 0.8)}–৳${high}.`,
    'Entertainment':       `General admission from ৳${low}–৳${Math.round(midPoint * 0.6)}, premium seating up to ৳${high}.`,
  };

  return {
    tier,
    label,
    range: `৳${range} BDT`,
    estimate: categoryPerPersonNotes[category] || `Spend typically ranges from ৳${low}–৳${high} per visit.`,
    value: valueMap[tier] || valueMap['$$'],
  };
}

// ── AI Verdict ────────────────────────────────────────────────────────────────

function buildVerdict(rating: number, reviews: number, category: string, seed: number) {
  const score = verdictScore(rating, reviews);
  const label = ratingLabel(rating);

  const highRec = [
    `A top-tier ${category.toLowerCase()} destination that consistently earns its reputation — visit with confidence.`,
    `Among the best options in its category in Dhaka — the rating and review volume back up the quality.`,
    `A well-established choice with strong visitor consensus. The kind of place that makes planning easy.`,
    `Highly recommended without qualification — the experience matches the expectation it sets.`,
  ];
  const midRec = [
    `A solid choice that performs reliably across the key dimensions. Worth including in your plans.`,
    `Delivers on its core promise with consistent quality. A dependable option in a competitive category.`,
    `Good overall experience with room for standout moments. The visit is consistently worthwhile.`,
    `A reliable pick that satisfies without necessarily surprising. Well-suited for most visitor types.`,
  ];
  const lowRec = [
    `A competent option in its category. Set appropriate expectations and the visit will satisfy.`,
    `Shows genuine promise with some areas for improvement. Worth a visit for those nearby.`,
    `Offers real value in specific dimensions even where overall consistency varies.`,
    `A developing option that merits consideration especially for budget-conscious visitors.`,
  ];

  const recommendation = rating >= 4.2
    ? pick(highRec, seed)
    : rating >= 3.5
      ? pick(midRec, seed + 1)
      : pick(lowRec, seed + 2);

  return { score, label, recommendation };
}

// ── Main place summary generator ──────────────────────────────────────────────

function generatePlaceSummary(place: any) {
  const name = (place.name || 'This place').replace(/\s+\d+$/, '');
  const area = place.area_name || 'Dhaka';
  const category = place.category || 'Place';
  const rating = parseFloat(String(place.average_rating)) || 4.0;
  const reviews = parseInt(String(place.total_reviews)) || 0;
  const tier = place.budget_tier || '$$';
  const label = place.budget_label || 'Mid-Range';
  const range = place.budget_range && place.budget_range !== '0-0' ? place.budget_range : '300-1200';

  const seed = (place.id || 1) * 37 + nameHash(name);

  const overviewPool = PLACE_OVERVIEWS[category] ?? PLACE_OVERVIEWS['Food & Drinks'];
  const overview = pick(overviewPool, seed)(name, area, rating, seed);

  const reasonPool = POPULAR_REASONS[category] ?? POPULAR_REASONS['Food & Drinks'];
  const whyPopular = picks(reasonPool, seed + 1, 3);

  const highlightPool = HIGHLIGHTS[category] ?? HIGHLIGHTS['Food & Drinks'];
  const highlights = picks(highlightPool, seed + 2, 4);

  const audiencePool = BEST_FOR[category] ?? BEST_FOR['Food & Drinks'];
  const perfectFor = picks(audiencePool, seed + 3, 5);

  const cost = buildCostSection(tier, label, range, category);
  const verdict = buildVerdict(rating, reviews, category, seed + 4);

  return {
    type: 'place',
    name,
    area,
    category,
    rating,
    reviews,
    overview,
    whyPopular,
    highlights,
    perfectFor,
    cost,
    verdict,
  };
}

// ── Event overview by category ────────────────────────────────────────────────

const EVENT_OVERVIEWS: Record<string, ((t: string, a: string, c: string, s: number) => string)[]> = {
  'Culture': [
    (t, a) => `${t} is one of ${a}'s cultural calendar highlights — a carefully programmed event that brings together artists, enthusiasts, and curious visitors in a setting designed for meaningful engagement. Expect a programme that balances discovery with depth.`,
    (t, a) => `Cultural events in ${a} come in many forms, but ${t} distinguishes itself through curatorial quality and genuine community investment. The programming reflects a commitment to relevance and accessibility that makes it worthwhile for both specialists and first-timers.`,
  ],
  'Entertainment': [
    (t, a) => `${t} delivers the kind of entertainment experience ${a}'s audiences have come to expect from quality productions — high-energy programming, strong technical delivery, and an atmosphere built around genuine enjoyment. This is a night worth planning for.`,
    (t, a) => `${a}'s entertainment scene has its peaks, and ${t} is among them. The production quality, lineup, and audience energy combine to create an experience that goes beyond passive attendance. Come prepared to be genuinely entertained.`,
  ],
  'Food & Drinks': [
    (t, a) => `${t} is ${a}'s premier food-focused event — a gathering that celebrates culinary diversity, quality ingredients, and the social pleasure of eating well. Whether you're a dedicated foodie or simply enjoy discovering new flavours, the programming delivers.`,
    (t, a) => `For food lovers in ${a}, ${t} represents the best of the city's culinary community in one place. Expect curated tasting opportunities, chef demonstrations, and the kind of food culture content that makes the experience as educational as it is delicious.`,
  ],
  'Workshops': [
    (t, a) => `${t} is a hands-on learning experience designed for ${a}'s growing community of curious, skills-focused individuals. The workshop format prioritises participation over observation — you leave with something tangible, whether it's a skill, a perspective, or a finished product.`,
    (t, a) => `Learning experiences in ${a} rarely combine quality instruction with genuine community. ${t} manages both — structured programming delivered by practitioners, in an environment that makes the process as enjoyable as the outcome.`,
  ],
  'Community': [
    (t, a) => `${t} is one of ${a}'s community-building anchors — an event that brings people together around shared interests, local identity, and the simple human value of collective experience. The programming serves both longtime residents and newcomers looking to connect.`,
    (t, a) => `${a}'s best community events create something that outlasts the event itself — new connections, shared memories, and a sense of belonging. ${t} has built a reputation for exactly that through programming that prioritises genuine community over spectacle.`,
  ],
  'Nightlife': [
    (t, a) => `${t} is ${a}'s after-dark event calendar at its most curated — a night built around music quality, crowd energy, and the kind of atmosphere that makes the city's nightlife reputation. Come with your best energy and minimal plans.`,
    (t, a) => `Few nightlife events in ${a} combine production quality with authentic atmosphere the way ${t} does. The music, the crowd, and the space work together to create something that feels special rather than simply scheduled.`,
  ],
  'Cinema & Screenings': [
    (t, a) => `${t} offers ${a}'s film community a screening experience that goes beyond the multiplex. The curation is thoughtful, the setting is intentional, and the audience tends to be the kind that takes cinema seriously. A worthwhile evening for any film lover.`,
    (t, a) => `Cinema as community experience is what ${t} delivers to ${a}'s film-going public. Whether it's a classic, a local production, or an international festival selection, the programming reflects genuine curatorial thought and respect for the art form.`,
  ],
  'Sports & Fitness': [
    (t, a) => `${t} brings ${a}'s athletic community together for a shared experience that combines competitive spirit, physical challenge, and community celebration. Whether you're participating or spectating, the energy of a live sports event delivers something screens cannot replicate.`,
    (t, a) => `For ${a}'s fitness community, ${t} represents both a personal challenge and a communal celebration. The event format encourages participation at all levels while creating an atmosphere of shared effort and collective achievement.`,
  ],
};

// ── Main event summary generator ─────────────────────────────────────────────

function generateEventSummary(event: any) {
  const title = event.title || 'This Event';
  const area = event.area_name || 'Dhaka';
  const category = event.category || 'Entertainment';
  const rating = parseFloat(String(event.average_rating)) || 4.0;
  const reviews = parseInt(String(event.total_reviews)) || 0;

  const seed = (event.id || 1) * 41 + nameHash(title);

  const overviewPool = EVENT_OVERVIEWS[category] ?? EVENT_OVERVIEWS['Entertainment'];
  const overview = pick(overviewPool, seed)(title, area, category, seed);

  const reasonPool = POPULAR_REASONS[category] ?? POPULAR_REASONS['Entertainment'];
  const whyAttend = picks(reasonPool, seed + 1, 3);

  const audiencePool = BEST_FOR[category] ?? BEST_FOR['Entertainment'];
  const perfectFor = picks(audiencePool, seed + 3, 5);

  const verdict = buildVerdict(rating, reviews, category, seed + 4);

  const startDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Date TBC';
  const endDate = event.end_date && event.end_date !== event.event_date
    ? new Date(event.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const priceInfo = event.price_type === 'paid' && event.price_amount
    ? `৳${event.price_amount} BDT per ticket`
    : 'Free entry';

  const timing = event.start_time
    ? `Doors open at ${event.start_time}`
    : 'Check event page for timing';

  return {
    type: 'event',
    title,
    area,
    category,
    rating,
    reviews,
    overview,
    whyAttend,
    perfectFor,
    verdict,
    eventDetails: {
      date: endDate ? `${startDate} – ${endDate}` : startDate,
      time: timing,
      price: priceInfo,
      location: `${area}, Dhaka`,
    },
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { type, data } = await req.json();

    // Try Claude API if key is configured
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const isPlace = type === 'place';
        const name = isPlace
          ? (data.name || '').replace(/\s+\d+$/, '')
          : data.title || '';

        const prompt = isPlace
          ? `You are an AI city guide for VibeSpot, a Dhaka discovery platform. Generate a JSON summary for this place:
Name: ${name}, Category: ${data.category}, Area: ${data.area_name}, Budget: ${data.budget_label} (${data.budget_tier} · ৳${data.budget_range} BDT), Rating: ${data.average_rating}/5, Reviews: ${data.total_reviews}.
Return ONLY valid JSON matching: {"overview":"...","whyPopular":["...","...","..."],"highlights":["...","...","...","..."],"perfectFor":["...","...","...","...","..."],"verdict":{"score":0,"label":"...","recommendation":"..."}}
Make it specific, insightful, and unique to this exact place.`
          : `You are an AI city guide for VibeSpot. Generate a JSON summary for this event:
Title: ${name}, Category: ${data.category}, Area: ${data.area_name}, Date: ${data.event_date}, Rating: ${data.average_rating}/5, Reviews: ${data.total_reviews}.
Return ONLY valid JSON matching: {"overview":"...","whyAttend":["...","...","..."],"perfectFor":["...","...","...","...","..."],"verdict":{"score":0,"label":"...","recommendation":"..."}}
Make it specific, insightful, and unique to this exact event.`;

        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 600,
            messages: [{ role: 'user', content: prompt }],
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const text = aiData.content?.[0]?.text || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const base = type === 'place'
              ? generatePlaceSummary(data)
              : generateEventSummary(data);
            return NextResponse.json({
              summary: { ...base, ...parsed, source: 'claude' },
            });
          }
        }
      } catch {
        // Fall through to local generator
      }
    }

    const summary = type === 'place'
      ? generatePlaceSummary(data)
      : generateEventSummary(data);

    return NextResponse.json({ summary: { ...summary, source: 'local' } });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
