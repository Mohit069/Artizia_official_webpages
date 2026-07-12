/* ============================================================
   ARTIZIA — Site data
   MAT: material/product library (palette + content)
   ============================================================ */
window.SITE={
  phone:"+91 89528 15800", phoneRaw:"+918952815800",
  email:"sales@artizia.co.in",
  address:"Plot No. PA-008-020-023, Mahindra World City Jaipur, Bhambhoriya Sanganer, Jaipur — 302037, Rajasthan",
  mapUrl:"https://maps.google.com/?q=Mahindra+World+City+Jaipur",
  hours:[["Monday – Friday","9:00 AM – 6:00 PM"],["Saturday","10:00 AM – 4:00 PM"],["Sunday","Closed"]],
  /* Social links in the footer. Paste the full URL to switch an icon on —
     an empty string hides that icon completely, rather than linking nowhere. */
  social:{
    instagram:"https://www.instagram.com/artizia_by_marudhar/",
    facebook:"",
    linkedin:""
  }
};

/* palette fields: base / vein / glow (hex), seed, flow, sharp, dark
   content fields: name, code, coll, desc, vein(text), grain, finish, thickness, apps[] */
const A = (o)=>Object.assign({flow:.65,sharp:.65,dark:.55,finish:"Polished",thickness:"20 · 30 mm",
  apps:["Kitchen Countertop","Bathroom Vanity","Shower Surround","Interior Cladding","Fireplace Mantel","Furniture Tops"]},o);

window.MAT = {
  /* hero-only cinematic material */
  "hero":{name:"Calacatta Noir",coll:"—",base:"#100f16",vein:"#332f42",glow:"#c9b6e4",seed:3.4,flow:1.0,sharp:.62,dark:.9,hidden:true},

  /* ===== SIGNATURE ===== */
  "oceana":A({name:"Oceana",code:"6130",coll:"Signature",base:"#e8edee",vein:"#8fa2a6",glow:"#bcd4d6",seed:21,flow:.9,sharp:.5,dark:.5,
    veinText:"Fluid Vein",grain:"Medium",desc:"Fluid veining that ripples like ocean waves across a cool, luminous ground — dynamic yet calming, a surface that never sits still."}),
  "sahara-beige":A({name:"Sahara Beige",code:"6210",coll:"Signature",base:"#e6d8c0",vein:"#b39a70",glow:"#d8bd90",seed:5,sharp:.65,
    veinText:"Soft Vein",grain:"Fine",desc:"Warm desert tones drift through a sand-toned base, bringing quiet, sunlit warmth to interiors."}),
  "sherwood":A({name:"Sherwood",code:"6240",coll:"Signature",base:"#dfe2da",vein:"#6f7a63",glow:"#9fae8e",seed:14,sharp:.6,
    veinText:"Organic Vein",grain:"Medium",desc:"Forest-toned veining winds through a muted green-grey field — grounded, natural and richly organic."}),
  "vesuvio":A({name:"Vesuvio",code:"6260",coll:"Signature",base:"#d9d2cc",vein:"#6a5f57",glow:"#b39a80",seed:29,sharp:.7,dark:.6,
    veinText:"Bold Vein",grain:"Coarse",desc:"Volcanic drama — smoky veins erupt across a warm ash ground for a surface with real presence."}),
  "fontana":A({name:"Fontana",code:"6280",coll:"Signature",base:"#eceae4",vein:"#9a9488",glow:"#c8c0b0",seed:37,sharp:.55,
    veinText:"Flowing Vein",grain:"Fine",desc:"Gentle, fountain-like movement across a soft neutral base — understated elegance for any room."}),

  /* ===== LUXURY ===== */
  "calacatta-gold":A({name:"Calacatta Gold",code:"4420",coll:"Luxury",base:"#f1ebdf",vein:"#b9b09c",glow:"#d9c49a",seed:8,sharp:.75,
    veinText:"Long Vein, Natural",grain:"Medium",desc:"A stunning blend of white and gold veining, reminiscent of classic marble — the drama of natural stone, engineered to shrug off heat, stains and time."}),
  "calacatta-valleta":A({name:"Calacatta Valleta",code:"4440",coll:"Luxury",base:"#f4f0ea",vein:"#9a8d76",glow:"#c9c1b0",seed:61,sharp:.7,
    veinText:"Long Vein",grain:"Medium",desc:"Softer, silvery veining over a bright white ground — refined Calacatta character with a lighter, airier touch."}),
  "mystique":A({name:"Mystique",code:"4460",coll:"Luxury",base:"#e9e5e0",vein:"#7c7264",glow:"#c3a888",seed:44,sharp:.7,
    veinText:"Dramatic Vein",grain:"Medium",desc:"Deep, shadowy veins laced with warm bronze — mysterious, moody and unmistakably luxurious."}),
  "berrica":A({name:"Berrica",code:"4480",coll:"Luxury",base:"#ede6da",vein:"#9c7d52",glow:"#d0b488",seed:77,sharp:.68,
    veinText:"Rich Vein",grain:"Medium",desc:"Amber-gold veining flows through a warm cream field for a surface that feels both opulent and inviting."}),

  /* ===== PREMIUM ===== */
  "grigio-cloud":A({name:"Grigio Cloud",code:"5110",coll:"Premium",base:"#d3d1cc",vein:"#8d8b84",glow:"#b7b5ae",seed:33,flow:.5,sharp:.45,
    veinText:"Cloud Vein",grain:"Fine",desc:"Soft grey clouds drift across a balanced neutral ground — versatile, contemporary and endlessly liveable."}),
  "makrana-mist":A({name:"Makrana Mist",code:"5130",coll:"Premium",base:"#f0eee7",vein:"#c9c0ad",glow:"#ded6c4",seed:18,sharp:.5,
    veinText:"Misty Vein",grain:"Fine",desc:"An homage to India's famed Makrana marble — pale, misty veining across a luminous white base."}),
  "volcanic-ash":A({name:"Volcanic Ash",code:"5150",coll:"Premium",base:"#2a2a2e",vein:"#55555e",glow:"#8f8f9a",seed:51,sharp:.6,dark:.85,
    veinText:"Smoke Vein",grain:"Medium",desc:"Deep charcoal shot through with silver smoke — a dark, architectural surface with quiet intensity."}),
  "marminova":A({name:"Marminova",code:"5170",coll:"Premium",base:"#e7e3dc",vein:"#a99f8c",glow:"#cfc6b4",seed:66,sharp:.6,
    veinText:"Marble Vein",grain:"Medium",desc:"A modern marble reinterpretation — natural veining with the consistency and strength of engineered quartz."}),
  "spring-valley":A({name:"Spring Valley",code:"5190",coll:"Premium",base:"#e4e6dd",vein:"#94a084",glow:"#bcc7ad",seed:23,sharp:.55,
    veinText:"Meadow Vein",grain:"Fine",desc:"Fresh green undertones bring a breath of the outdoors to a bright, open surface."}),
  "golden-dream":A({name:"Golden Dream",code:"5210",coll:"Premium",base:"#efe6d2",vein:"#b89a5f",glow:"#e0c489",seed:88,sharp:.65,
    veinText:"Gilded Vein",grain:"Medium",desc:"Warm gold veins shimmer across a soft cream base for a surface that glows in natural light."}),

  /* ===== ESSENTIALS ===== */
  "pearl-white":A({name:"Pearl White",code:"3110",coll:"Essentials",base:"#f2efe8",vein:"#c6bfae",glow:"#ddd6c6",seed:9,flow:.5,sharp:.55,
    veinText:"Subtle Vein",grain:"Fine",desc:"A clean, pearlescent white with the faintest movement — a timeless, do-anything surface."}),
  "midnight-black":A({name:"Midnight Black",code:"3120",coll:"Essentials",base:"#141319",vein:"#43424e",glow:"#8f9ab0",seed:12,flow:.8,sharp:.7,dark:.9,
    veinText:"Fine Vein",grain:"Fine",desc:"Deep, near-solid black with a whisper of silver — bold, modern and endlessly versatile."}),
  "aspen-ice":A({name:"Aspen Ice",code:"3130",coll:"Essentials",base:"#eef1f3",vein:"#a9b4bb",glow:"#cfe0e6",seed:27,sharp:.5,
    veinText:"Frost Vein",grain:"Fine",desc:"Cool, crystalline white with icy blue undertones — crisp and refreshing."}),
  "heirloom-grey":A({name:"Heirloom Grey",code:"3140",coll:"Essentials",base:"#d7d5d0",vein:"#8f8c85",glow:"#b3b0a8",seed:35,sharp:.5,
    veinText:"Soft Vein",grain:"Fine",desc:"A warm, dependable mid-grey that ages gracefully in any interior."}),
  "alabaster-concrete":A({name:"Alabaster Concrete",code:"3150",coll:"Essentials",base:"#e5e2db",vein:"#a8a49b",glow:"#c9c5bb",seed:42,sharp:.4,
    veinText:"Matte Texture",grain:"Fine",finish:"Honed / Polished",desc:"The raw, tactile look of pale concrete — industrial calm with quartz durability."}),
  "concrete-grey":A({name:"Concrete Grey",code:"3160",coll:"Essentials",base:"#cfccc7",vein:"#85837d",glow:"#a8a6a0",seed:48,sharp:.4,
    veinText:"Cement Texture",grain:"Fine",finish:"Honed / Polished",desc:"Urban, mineral grey with a soft cement texture — perfect for minimalist, architectural spaces."}),
  "cemento":A({name:"Cemento",code:"3170",coll:"Essentials",base:"#c9c5be",vein:"#7f7b73",glow:"#a19d95",seed:55,sharp:.4,
    veinText:"Cement Texture",grain:"Fine",finish:"Honed",desc:"A deeper cement tone with subtle mottling — quietly industrial, warmly neutral."}),
  "malibu-white":A({name:"Malibu White",code:"3180",coll:"Essentials",base:"#f4f2ec",vein:"#cfc8ba",glow:"#e6dfce",seed:63,sharp:.5,
    veinText:"Fleck Vein",grain:"Medium",desc:"Bright white with a gentle sandy fleck — coastal, relaxed and light-filled."}),
  "simply-white":A({name:"Simply White",code:"3190",coll:"Essentials",base:"#f5f3ee",vein:"#d5cfc2",glow:"#e8e2d4",seed:71,sharp:.45,
    veinText:"Micro Fleck",grain:"Fine",desc:"The purest, most versatile white in the range — a blank canvas for any design."}),
  "jaipur-fog":A({name:"Jaipur Fog",code:"3200",coll:"Essentials",base:"#ddd8cf",vein:"#9a9384",glow:"#c0b9a8",seed:79,sharp:.5,
    veinText:"Hazy Vein",grain:"Fine",desc:"A soft, warm-grey fog named for our home city — gentle and grounding."}),
  "super-white":A({name:"Super White",code:"3210",coll:"Essentials",base:"#f6f5f1",vein:"#d8d3c7",glow:"#ebe6db",seed:85,sharp:.45,
    veinText:"Faint Vein",grain:"Fine",desc:"A crisp, brilliant white with barely-there movement — clean, bright and enduring."})
};

window.COLLECTIONS = [
  {key:"Signature",lead:"Statement surfaces with distinctive, characterful veining.",hero:"oceana"},
  {key:"Luxury",lead:"Marble-inspired drama, engineered to last a lifetime.",hero:"calacatta-gold"},
  {key:"Premium",lead:"Refined, versatile designs for considered interiors.",hero:"grigio-cloud"},
  {key:"Essentials",lead:"Clean, dependable everyday surfaces in whites, greys and black.",hero:"midnight-black"}
];

window.SPECS = [
  ["Water Absorption","EN-14617-1","<0.03%"],["Bulk Density","EN-14617-1","2.10–2.45 g/cm³"],
  ["Flexural Strength","EN-14617-2","40–82 N/mm²"],["Compressive Strength","ASTM C170",">200 MPa"],
  ["Impact Strength","EN-14617-9","3.50–14.20 J"],["Thermal Expansion","EN-14617-11","1.5–2.8 ×10⁻⁵/°C"],
  ["Abrasion Resistance","EN-14617-4",">23 mm"],["Mohs Hardness","EN-101","6.5–7.5"],
  ["Stain Resistance","ASTM C1378","Unaffected"],["Wear & Cleanability","ASTM Z124","Pass"],
  ["Cigarette Test","ASTM Z124","Pass"],["Surface Burning","ASTM E-84","Class A"],
  ["Chemical Resistance","EN-14617-10","Class C4"]
];

window.CERTS = [
  ["GreenGuard","Certified for low chemical emissions, GreenGuard means Artizia surfaces contribute to healthier indoor air — safe for kitchens, bathrooms and the rooms you live in every day."],
  ["NSF Certified","NSF certification confirms our surfaces meet strict public-health standards for food-contact use — safe wherever you prep, cook and eat."],
  ["Kosher","Independently certified kosher, our quartz is approved for use in observant homes and commercial food environments."]
];

window.FAQS = [
  ["What kinds of products does Artizia offer?","Artizia produces premium engineered quartz surfaces — 26 designs across four collections (Signature, Luxury, Premium and Essentials) — built to international quality benchmarks for countertops, vanities, cladding and more."],
  ["What makes Artizia products unique?","Our surfaces merge timeless design with Breton technology and decades of manufacturing craft, delivering durability, style and easy maintenance in equal measure."],
  ["Are Artizia products suitable for homes and commercial spaces?","Yes. Every surface is engineered to enhance both homes and commercial interiors with elegance, durability and low-maintenance performance."],
  ["Are the surfaces fire and moisture resistant?","Artizia quartz is non-porous and engineered for strength and resistance to moisture and heat — rated Class A for surface burning (ASTM E-84)."],
  ["How do I clean and maintain Artizia surfaces?","Clean with a soft cloth and mild detergent; avoid harsh chemicals and abrasives. See our Care & Maintenance guide for full details."],
  ["Can I order samples before placing a full order?","Yes — add up to four surfaces to your sample set and request free physical samples so you can see the material quality and texture before you decide."],
  ["How long does delivery take?","Lead times vary by product and order size. Samples typically ship in 5–7 days; a delivery estimate for full orders is provided on request."],
  ["Are custom design options available?","Yes — custom designs and personalised solutions are available to meet specific project requirements. Contact our team to discuss."],
  ["Do you provide installation services?","Installation may be available depending on your region. We recommend professional installation by certified partners for a perfect fit and finish."],
  ["What warranty do you offer?","Artizia surfaces are backed by a Lifetime Warranty against manufacturing defects. See our Warranty page for full coverage details."]
];

/* helper collections. NOTE: these MAT entries are only the built-in
   defaults / fallback. On the live site, app.js fetches the real
   product list from the backend API and replaces these at runtime. */
window.productList = ()=>Object.keys(window.MAT).filter(k=>!window.MAT[k].hidden);
