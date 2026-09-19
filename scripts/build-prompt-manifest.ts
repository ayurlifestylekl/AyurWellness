/**
 * Build a deterministic prompts manifest for every category + treatment.
 * Reads /tmp/sanity-items.json (produced by fetch-treatment-items.ts) and
 * writes /tmp/prompt-manifest.json.
 *
 * Each entry: { docId, field, slug, title, prompt, alt }
 */
import { readFileSync, writeFileSync } from 'node:fs'

interface Cat { _id: string; title: string; slug: string; hasImage: boolean }
interface Tr  { _id: string; title: string; slug: string; category: { title: string; slug: string }; hasImage: boolean }

const STYLE_SUFFIX =
  'Soft natural window light, warm cinematic mood. Authentic Kerala Ayurveda clinic setting — wooden treatment table, brass vessels, banana leaves, small clay bowls of green and yellow herbal pastes. Earth-tone palette of cream, deep herbal green, warm gold ochre. Editorial photography quality, shallow depth of field. No text, no logos, no watermarks, no people facing the camera.'

/* ── Per-category scene anchors ───────────────────────────── */
const CATEGORY_SCENES: Record<string, string> = {
  'face-care-therapies':       'a close-up of an Ayurvedic herbal face paste being gently applied to a serene woman\'s face, eyes closed, calm expression',
  'massage-therapies':          'warm golden Ayurvedic oil being slowly poured from a brass vessel onto a person\'s back during a traditional Kerala Abhyanga full-body massage, two therapist hands visible',
  'stress-relieving-sleep':     'a Shirodhara session — golden herbal oil flowing in a thin steady stream from a hanging brass vessel onto a person\'s forehead lying on a wooden treatment table',
  'joint-care-therapies':       'an Ayurvedic herbal poultice (kizhi) being pressed onto a person\'s knee, the steamed-herb cloth bundle slightly steaming, therapist hands in frame',
  'skin-care-therapies':        'warm Ayurvedic oils, herbal powders and ground pastes arranged on a wooden table next to a brass mortar and pestle, fresh herbs and leaves scattered',
  'hair-care-therapies':        'a head and scalp oil massage in progress, dark hair glossy with warm herbal oil, hands working through the roots',
  'weight-management-therapy':  'a Udwarthanam herbal powder scrub being applied to a back, the dry green-and-yellow herbal powder visible on skin',
  'eye-care-therapies':         'a Netra Tarpana session — a small dough ring around the eyes holding warm medicated ghee, the eyes closed and relaxed',
  'nasyam-ear-therapies':       'a Nasya session — a single drop of warm medicated oil being administered into the nostrils, head tilted back gently',
  'rehabilitation-therapies':   'a therapeutic spine and lower-back massage with warm herbal oil being pressed in firm long strokes, towel-draped patient on wooden treatment table',
  'kids-ayurveda-care':         'a calm gentle Ayurvedic oil massage on a young child\'s legs, warm soft light, parent hand on the child\'s shoulder for comfort',
  'oldage-care-therapies':      'a slow gentle warm-oil massage on an elderly person\'s shoulders, soft tender atmosphere, white hair, hands of a younger therapist working gently',
}

/* ── Per-treatment scene overrides (where the title needs a more specific image) ── */
const TREATMENT_SCENES: Record<string, string> = {
  // Face care
  'ayurveda-rejuvenating-face-massage':        'a slow rejuvenating face massage with warm Ayurvedic oil, gentle therapist fingertips on temples',
  'ayurvedic-herbal-facial':                   'a thick green herbal facial paste resting on a woman\'s relaxed face, sliced cucumber on the eyes',
  'ayurvedic-pimple-care':                     'small clay bowls of yellow turmeric and green neem paste, a therapist applying a spot treatment to acne-prone skin',
  'njavara-milk-facial':                       'a small white-cloth poultice being dipped in warm milk infused with red Njavara rice, then pressed onto facial skin',
  'vyanga-care-pigmentation':                  'a delicate herbal mask being patted onto pigmented cheek areas, brass bowls of saffron and sandalwood paste',
  // Massage
  'abhyangam-full-body-oil-massage':           'a full-body Abhyangam session — long sweeping oil-pour strokes down the back on a wooden Ayurvedic table',
  'abhyangam-with-kashaya-dhaara':             'a thin stream of warm herbal Kashaya decoction being poured from a hanging brass vessel onto a body during massage',
  'abhyangam-with-kizhi':                      'two herbal kizhi pouches being pressed onto a back, gentle steam rising, warm oil glistening',
  'abhyangam-with-steam-bath':                 'a person seated inside a traditional wooden Ayurvedic steam box with only their head visible, soft warm steam rising',
  'head-massage':                              'a gentle Indian head massage in progress, warm oil being worked into the scalp by skilled fingers',
  'leg-and-foot-massage':                      'a relaxing leg and foot massage on a wooden table, warm oil glistening on the calves, brass thali nearby',
  'low-back-leg-massage-with-heat':            'a low-back and leg massage with a warm herbal heat pack, hands pressing along the lumbar spine',
  'lymphatic-drainage-massage':                'a gentle lymphatic drainage massage along the neck and collarbone, light slow sweeping strokes',
  'neck-and-shoulder-massage-with-heat':       'a neck and shoulder massage with a warm herbal heat compress, towel-draped client seated forward',
  'paada-abhyangam-foot-massage':              'a foot massage with warm Ayurvedic oil and a brass bowl, slow circular thumb work on the sole',
  'rejuvenating-face-massage':                 'a slow rejuvenating face massage with warm herbal oil, fingertips on cheekbones, calm closed eyes',
  'siro-abhyangam-head-massage':               'a slow scalp and head Ayurvedic oil massage, fingertips working through the hairline',
  'spinal-massage-with-kizhi':                 'a spine-focused massage with two herbal kizhi pouches pressed along the vertebrae, gentle steam rising',
  // Stress relieving & sleep
  'abhyangam-sirodhaara':                      'a combined Abhyangam and Sirodhara session — full body oil massage with gentle continuous oil stream on the forehead',
  'siro-abhyanga-paada-abhyanga':              'a paired head and foot massage in a quiet Ayurveda treatment room, warm lamps glowing',
  'siro-dhaara-with-tailam-stress-sleep':      'a Shirodhara session with golden herbal oil flowing on the forehead, deeply calm expression, dim warm light',
  'sirodhaara-head-neck-foot-massage':         'a Shirodhara session with therapist hands also massaging the foot, golden oil stream onto the forehead',
  // Oldage
  'abhyangam-full-body-oil-massage-2':         'a slow gentle full-body Abhyangam on an elderly person, white hair on the wooden table, tender atmosphere',
  'abhyangam-with-podi-kizhi-heat-compress':   'a gentle massage on elderly hands with a small warm herbal Podi kizhi pouch, brass bowl of warm oil',
  'abhyangam-with-sirodhaara':                 'a gentle Abhyangam paired with a slow Shirodhara on an elderly client, warm calm room',
  'njavara-kizhi-full-body':                   'multiple small white-cloth Njavara rice kizhi pouches steaming, being applied across the body',
  // Hair care
  'ayurveda-hair-treatment':                   'long dark hair laid out on a wooden Ayurvedic table being treated with warm aromatic herbal hair oil',
  'ayurveda-scalp-treatment':                  'a therapist applying a green herbal paste to a partition of dark hair on the scalp',
  'ayurvedic-scalp-hair-oil-massage':          'a slow scalp and hair oil massage in progress, glossy oil-coated dark hair, fingertips at the crown',
  // Skin care
  'abhyangam-specific-oil-massage':            'a targeted oil massage on a back area with warm specifically-blended Ayurvedic oil, focused circular strokes',
  'abhyangam-with-udwarthanam':                'an oil massage transitioning into a herbal powder scrub on the back, warm green-and-yellow powder dusting',
  'ayurvedic-full-body-exfoliation-therapy':   'a full-body herbal-powder exfoliation in progress, dry green-yellow powder being brushed across the back',
  'ayurvedic-full-body-skin-lightening-therapy':'a brightening Ayurvedic body therapy — golden saffron-and-turmeric paste being applied to lighten skin',
  'full-body-abhyangam-and-njavara-kizhi':     'full-body oil massage paired with small Njavara rice kizhi pouches being applied on the back',
  'udwarthanam-full-body-herbal-scrub':        'a vigorous Udwarthanam scrub with dry green herbal powder being applied across the body in upward strokes',
  'upper-back-pigmentation-treatment':         'a delicate herbal-paste treatment being applied to pigmented areas on a person\'s upper back',
  'upper-body-herbal-scrub':                   'a herbal-powder scrub being applied across the upper back and shoulders, fine green powder dust',
  // Rehabilitation
  'abhyangam-with-kashaya-dhaara-full-body-2': 'a long full-body Kashaya Dhaara session — continuous stream of warm herbal decoction poured along the body',
  'abhyangam-with-kizhi-heat-compress':        'a deep tissue Abhyangam followed by warm kizhi compresses across affected muscle groups',
  'abhyangam-with-njavara-kizhi-full-body':    'full-body massage with multiple Njavara rice kizhi pouches steaming and being applied across the back',
  'abhyangam-with-sirodhaara-2':               'a rehabilitation session combining slow full-body Abhyangam with Sirodhara oil stream',
  'udwarthanam-with-kashaya-dhaara':           'a herbal powder Udwarthanam followed by a continuous Kashaya decoction pour, hybrid rehabilitation session',
  // Weight management
  'udwarthanam-steam-bath':                    'a vigorous Udwarthanam herbal powder scrub followed by a wooden Ayurvedic steam box session',
  // Joint care
  'abhyangam-with-kashaya-dhaara-affected-joint':       'a warm herbal Kashaya decoction stream being directed onto a swollen knee joint',
  'abhyangam-with-kashaya-dhaara-full-body':            'a full-body Kashaya Dhaara — continuous warm herbal decoction stream being poured along the body',
  'abhyangam-with-kizhi-affected-joint':                'a kizhi pouch being pressed onto a knee joint, gentle steam rising, focused joint care',
  'abhyangam-with-kizhi-full-body':                     'full-body Abhyangam followed by warm kizhi pouches applied across all major joints',
  'abhyangam-with-njavara-kizhi-affected-joint':        'Njavara rice kizhi pouches being applied to a specific affected joint (shoulder), gentle steam',
  'abhyangam-kizhi-kashaaya-dhaara-with-herbal-bandage':'an intensive joint protocol — oil massage, kizhi pressing, decoction stream, then a herbal bandage being applied',
  'herbal-bandage-affected-joints':                     'a fresh herbal paste being applied to a knee joint and then wrapped in a cotton bandage',
  'pichu-with-partial-abhyangam-and-kizhi':             'a Pichu therapy — oil-soaked cotton pad placed on a specific body area, partial massage in progress',
  // Eye care
  'ayurveda-eye-care-eye-wash-netra-patah':    'a gentle Ayurvedic eye wash — small clay eye cups being held over closed eyes with herbal liquid',
  'netra-tarpanam':                            'a Netra Tarpana session — small dough rings around the eyes holding warm medicated ghee, eyes closed peacefully',
  // Nasyam & ear
  'ear-treatment-karnapooranam-karnadhoopanam':'a Karnapooranam ear treatment — a single drop of warm medicated oil being administered into the ear canal',
  'nasyam':                                    'a Nasya session — head tilted back, single drop of warm medicated oil being placed into the nostril',
  // Kids
  'head-or-leg-massage-ages-11-to-17':         'a calm gentle head or leg massage on a young teenager, soft light, parent quietly in the background',
  'oil-massage-and-sirodhaara-ages-12-to-17':  'a young teenager receiving a combined gentle oil massage and slow Sirodhara session, calm room',
  'oil-massage-ages-1-to-5':                   'a tender warm-oil massage on a toddler\'s legs, parent supporting the child, soft warm light',
  'oil-massage-ages-11-to-17':                 'a calm gentle full-body oil massage on a young teenager, soft natural light, towel-draped',
  'oil-massage-ages-6-to-10':                  'a gentle warm-oil massage on a school-age child\'s legs and back, soft warm light, towel-draped',
  'sirodhaara-ages-11-to-17':                  'a slow Shirodhara session on a young teenager, golden oil stream onto the forehead, deeply relaxed',
  'talam-sirodhaara-ages-12-to-17':            'a young teenager receiving a Talam (medicated paste on crown of head) plus Shirodhara, calm focused atmosphere',
}

interface ManifestRow {
  docId: string
  field: 'image' | 'heroImage'
  slug: string
  title: string
  prompt: string
  alt: string
}

function buildPrompt(scene: string): string {
  return `Warm photorealistic photograph of ${scene}. ${STYLE_SUFFIX}`
}

function main() {
  const { cats, treatments } = JSON.parse(
    readFileSync('/tmp/sanity-items.json', 'utf8'),
  ) as { cats: Cat[]; treatments: Tr[] }

  const manifest: ManifestRow[] = []

  for (const c of cats) {
    const scene = CATEGORY_SCENES[c.slug]
    if (!scene) {
      console.warn(`! no scene defined for category ${c.slug}`)
      continue
    }
    manifest.push({
      docId: c._id,
      field: 'image',
      slug: c.slug,
      title: c.title,
      prompt: buildPrompt(scene),
      alt: `${c.title} — placeholder image`,
    })
  }

  for (const t of treatments) {
    const treatmentScene = TREATMENT_SCENES[t.slug]
    const categoryScene = CATEGORY_SCENES[t.category.slug]
    const scene = treatmentScene ?? categoryScene
    if (!scene) {
      console.warn(`! no scene for treatment ${t.slug} (category ${t.category.slug})`)
      continue
    }
    manifest.push({
      docId: t._id,
      field: 'heroImage',
      slug: t.slug,
      title: t.title,
      prompt: buildPrompt(scene),
      alt: `${t.title} — placeholder image`,
    })
  }

  writeFileSync('/tmp/prompt-manifest.json', JSON.stringify(manifest, null, 2))
  console.log(`Wrote /tmp/prompt-manifest.json (${manifest.length} entries: ${cats.length} categories + ${treatments.length} treatments)`)
}

main()
