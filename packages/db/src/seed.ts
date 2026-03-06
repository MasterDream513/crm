/**
 * Seed script — pre-loads all confirmed client data (2026-03-05).
 * Run: npm run db:seed
 */
import 'dotenv/config'
import { PrismaClient, ProductCategory, BillingType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Tenant ────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { id: 'seed-tenant-001' },
    update: {},
    create: {
      id: 'seed-tenant-001',
      name: '中村光太郎 事務所',
      plan: 'starter',
    },
  })
  console.log(`✅ Tenant: ${tenant.name}`)

  // ── Tenant Settings ───────────────────────────────────────
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      churnThresholdDays: 90,
      maCpsMarginRate: 0.60,
      currency: 'JPY',
      timezone: 'Asia/Tokyo',
      dailyHandledMethod: 'follow_log_autocount',
    },
  })
  console.log('✅ Tenant settings: churn=90d, MA-CPS margin=60%')

  // ── Admin User ────────────────────────────────────────────
  await prisma.user.upsert({
    where: { id: 'seed-user-admin' },
    update: {},
    create: {
      id: 'seed-user-admin',
      tenantId: tenant.id,
      email: 'after.seitai@gmail.com',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user: after.seitai@gmail.com')

  // ── Products (23 items, all tax-included, confirmed 2026-03-05) ──
  const products: Array<{
    name: string
    priceJpy: number
    category: ProductCategory
    billingType?: BillingType
  }> = [
    // リスト獲得
    { name: '無料セミナー（新規集客革命セミナー）', priceJpy: 0, category: 'LIST_ACQUISITION' },
    { name: '無料セミナー（集客１０倍セミナー）', priceJpy: 0, category: 'LIST_ACQUISITION' },
    { name: '本：無料プレゼント（送料なし）', priceJpy: 0, category: 'LIST_ACQUISITION' },
    { name: '本：無料プレゼント（送料のみ負担）', priceJpy: 700, category: 'LIST_ACQUISITION' },
    { name: '本：マーケティングシークレット', priceJpy: 1_320, category: 'LIST_ACQUISITION' },
    // 個別面談
    { name: '個別面談', priceJpy: 5_000, category: 'INDIVIDUAL' },
    // セミナー
    { name: '個別コーチング', priceJpy: 49_700, category: 'SEMINAR' },
    { name: '店舗マーケティング３DAYチャレンジ', priceJpy: 9_800, category: 'SEMINAR' },
    { name: 'セールスプレゼンテーション講座', priceJpy: 39_800, category: 'SEMINAR' },
    { name: '店舗マーケティング１０DAYチャレンジ', priceJpy: 99_800, category: 'SEMINAR' },
    { name: 'セミナー・コンテンツビジネス構築講座', priceJpy: 109_780, category: 'SEMINAR' }, // corrected 2026-03-05
    { name: 'マイスターメソッド 店舗マーケティング講座 動画コース', priceJpy: 649_000, category: 'SEMINAR' },
    { name: 'セールスファネルマスター講座 ベーシックコース', priceJpy: 750_000, category: 'SEMINAR' },
    { name: 'マイスターメソッド 店舗マーケティング講座 ベーシックコース', priceJpy: 1_485_000, category: 'SEMINAR' },
    { name: 'セールスファネルマスター講座 個人サポート付きコース', priceJpy: 1_980_000, category: 'SEMINAR' },
    { name: 'マイスターメソッド 店舗マーケティング講座 個人サポート付きコース', priceJpy: 2_398_000, category: 'SEMINAR' },
    { name: 'マイスターメソッド 店舗マーケティング講座 VIPコース', priceJpy: 8_250_000, category: 'SEMINAR' },
    // オンライン教材
    { name: '"複製型ビジネス"スターターキット', priceJpy: 2_900, category: 'ONLINE_COURSE' },
    { name: '超速!!多店舗展開 完全マニュアル プレミアムビデオ講座', priceJpy: 9_700, category: 'ONLINE_COURSE' },
    { name: '社長の虎の巻 - 41の極意', priceJpy: 19_700, category: 'ONLINE_COURSE' },
    { name: '業界トップ企業の極秘社内マニュアル', priceJpy: 59_800, category: 'ONLINE_COURSE' },
    // サブスク
    { name: '有料メルマガ', priceJpy: 700, category: 'SUBSCRIPTION', billingType: 'ONE_TIME' }, // one-time shipping, confirmed B
    { name: 'The Leaders College', priceJpy: 24_200, category: 'SUBSCRIPTION', billingType: 'RECURRING_MONTHLY' },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: `seed-product-${p.name}` },
      update: { priceJpy: p.priceJpy },
      create: {
        id: `seed-product-${p.name}`,
        tenantId: tenant.id,
        name: p.name,
        priceJpy: p.priceJpy,
        category: p.category,
        billingType: p.billingType ?? 'ONE_TIME',
      },
    })
  }
  console.log(`✅ Products: ${products.length} items seeded`)

  // ── Events (pre-seeded names, confirmed 2026-03-05) ───────
  const events = [
    '無料セミナー（新規集客革命セミナー）',
    '無料セミナー（集客１０倍セミナー）',
    '個別相談',
  ]
  for (const name of events) {
    await prisma.event.upsert({
      where: { id: `seed-event-${name}` },
      update: {},
      create: {
        id: `seed-event-${name}`,
        tenantId: tenant.id,
        name,
        eventDate: new Date('2099-12-31'), // template event — date updated per actual booking
        description: '定型イベント（日付は各回ごとに設定）',
      },
    })
  }
  console.log(`✅ Events: ${events.length} template events seeded`)

  // ── Phase 2 Integration stubs ─────────────────────────────
  const integrations: Array<{ type: any }> = [
    { type: 'UTAGE' },
    { type: 'FREEE' },
    { type: 'GOOGLE_ANALYTICS' },
    { type: 'META_ADS' },
    { type: 'CLICKFUNNELS' },
  ]
  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: { tenantId_type: { tenantId: tenant.id, type: integration.type } },
      update: {},
      create: {
        tenantId: tenant.id,
        type: integration.type,
        isEnabled: false,
      },
    })
  }
  console.log('✅ Integration stubs: UTAGE, Freee, GA4, Meta, ClickFunnels (all disabled)')

  console.log('\n🎉 Seed complete!')
  console.log(`   Tenant ID : ${tenant.id}`)
  console.log('   Login     : after.seitai@gmail.com')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
