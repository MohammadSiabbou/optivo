/**
 * Migration: Seed default service definitions
 *
 * Inserts system defaults (client_id = NULL) with stable UUIDs so this
 * migration is safe to re-run (ON CONFLICT DO NOTHING).
 *
 * Photo services
 */

const PHOTO_SERVICES = [
  { id: 'a1000000-0000-0000-0000-000000000001', icon: 'Sun',           name_key: 'services.catalog.outdoorPhotography',    category: 'photo' },
  { id: 'a1000000-0000-0000-0000-000000000002', icon: 'Camera',        name_key: 'services.catalog.studioPhotography',     category: 'photo' },
  { id: 'a1000000-0000-0000-0000-000000000003', icon: 'User',          name_key: 'services.catalog.portraitPhotography',   category: 'photo' },
  { id: 'a1000000-0000-0000-0000-000000000004', icon: 'PartyPopper',   name_key: 'services.catalog.eventPhotography',      category: 'photo' },
  { id: 'a1000000-0000-0000-0000-000000000005', icon: 'HeartHandshake',name_key: 'services.catalog.weddingPhotography',    category: 'photo' },
  { id: 'a1000000-0000-0000-0000-000000000006', icon: 'Package',       name_key: 'services.catalog.productPhotography',    category: 'photo' },
  { id: 'a1000000-0000-0000-0000-000000000007', icon: 'Building2',     name_key: 'services.catalog.realEstatePhotography', category: 'photo' },
  { id: 'a1000000-0000-0000-0000-000000000008', icon: 'Plane',         name_key: 'services.catalog.aerialPhotography',     category: 'photo' },
  { id: 'a1000000-0000-0000-0000-000000000009', icon: 'Baby',          name_key: 'services.catalog.newbornPhotography',    category: 'photo' },
  { id: 'a1000000-0000-0000-0000-000000000010', icon: 'Shirt',         name_key: 'services.catalog.fashionPhotography',    category: 'photo' },
]

const VIDEO_SERVICES = [
  { id: 'a2000000-0000-0000-0000-000000000001', icon: 'Clapperboard',  name_key: 'services.catalog.cinematicFilms',        category: 'video' },
  { id: 'a2000000-0000-0000-0000-000000000002', icon: 'Gauge',         name_key: 'services.catalog.slowMotionVideo',        category: 'video' },
  { id: 'a2000000-0000-0000-0000-000000000003', icon: 'Video',         name_key: 'services.catalog.eventVideography',       category: 'video' },
  { id: 'a2000000-0000-0000-0000-000000000004', icon: 'HeartHandshake',name_key: 'services.catalog.weddingFilms',           category: 'video' },
  { id: 'a2000000-0000-0000-0000-000000000005', icon: 'Plane',         name_key: 'services.catalog.droneVideo',             category: 'video' },
  { id: 'a2000000-0000-0000-0000-000000000006', icon: 'Megaphone',     name_key: 'services.catalog.promotionalVideo',       category: 'video' },
  { id: 'a2000000-0000-0000-0000-000000000007', icon: 'Music',         name_key: 'services.catalog.musicVideos',            category: 'video' },
  { id: 'a2000000-0000-0000-0000-000000000008', icon: 'Smartphone',    name_key: 'services.catalog.reelsShortForm',         category: 'video' },
]

export async function up({ context: client }) {
  const all = [...PHOTO_SERVICES, ...VIDEO_SERVICES]
  for (const row of all) {
    await client.query(
      `INSERT INTO service_definitions (id, client_id, category, icon, name_key, custom_label)
       VALUES ($1, NULL, $2, $3, $4, NULL)
       ON CONFLICT (id) DO NOTHING`,
      [row.id, row.category, row.icon, row.name_key],
    )
  }
}

export async function down({ context: client }) {
  const ids = [...PHOTO_SERVICES, ...VIDEO_SERVICES].map((r) => r.id)
  await client.query(
    `DELETE FROM service_definitions WHERE id = ANY($1::uuid[]) AND client_id IS NULL`,
    [ids],
  )
}
