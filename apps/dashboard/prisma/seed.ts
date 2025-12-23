import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user (you'll need to sign up with this email in Clerk first)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@starbidz.io' },
    update: {},
    create: {
      clerkId: 'admin_placeholder', // Will be updated when user signs up
      email: 'admin@starbidz.io',
      name: 'Admin User',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user created:', adminUser.email)

  // Create test publisher
  const testUser = await prisma.user.upsert({
    where: { email: 'publisher@example.com' },
    update: {},
    create: {
      clerkId: 'publisher_placeholder',
      email: 'publisher@example.com',
      name: 'Test Publisher',
      role: 'PUBLISHER',
      publisher: {
        create: {
          company: 'Test Games Inc.',
        },
      },
    },
  })
  console.log('✅ Test publisher created:', testUser.email)

  // Get publisher
  const publisher = await prisma.publisher.findUnique({
    where: { userId: testUser.id },
  })

  if (publisher) {
    // Create test app
    const testApp = await prisma.app.upsert({
      where: {
        publisherId_bundleId_platform: {
          publisherId: publisher.id,
          bundleId: 'com.starbidz.testapp',
          platform: 'ANDROID',
        },
      },
      update: {},
      create: {
        publisherId: publisher.id,
        name: 'Test Game App',
        bundleId: 'com.starbidz.testapp',
        platform: 'ANDROID',
        mediation: 'MAX',
        appKey: 'sbz_app_test123456789',
        isActive: true,
      },
    })
    console.log('✅ Test app created:', testApp.name, '- Key:', testApp.appKey)

    // Create test ad units
    const bannerUnit = await prisma.adUnit.upsert({
      where: { placementId: 'sbz_plc_banner_test' },
      update: {},
      create: {
        appId: testApp.id,
        name: 'Home Banner',
        format: 'BANNER',
        placementId: 'sbz_plc_banner_test',
        width: 320,
        height: 50,
        isActive: true,
      },
    })
    console.log('✅ Banner ad unit created:', bannerUnit.placementId)

    const interstitialUnit = await prisma.adUnit.upsert({
      where: { placementId: 'sbz_plc_inter_test' },
      update: {},
      create: {
        appId: testApp.id,
        name: 'Level Complete Interstitial',
        format: 'INTERSTITIAL',
        placementId: 'sbz_plc_inter_test',
        isActive: true,
      },
    })
    console.log('✅ Interstitial ad unit created:', interstitialUnit.placementId)

    const rewardedUnit = await prisma.adUnit.upsert({
      where: { placementId: 'sbz_plc_rewarded_test' },
      update: {},
      create: {
        appId: testApp.id,
        name: 'Extra Lives Rewarded',
        format: 'REWARDED',
        placementId: 'sbz_plc_rewarded_test',
        isActive: true,
      },
    })
    console.log('✅ Rewarded ad unit created:', rewardedUnit.placementId)
  }

  // Create demand sources
  const gamSource = await prisma.demandSource.upsert({
    where: { id: 'gam_test_source' },
    update: {},
    create: {
      id: 'gam_test_source',
      type: 'GAM',
      name: 'Test GAM Account',
      priority: 1,
      isActive: true,
      gamConfig: {
        create: {
          networkCode: '123456789',
          credentials: null,
        },
      },
    },
  })
  console.log('✅ GAM demand source created:', gamSource.name)

  const ortbSource = await prisma.demandSource.upsert({
    where: { id: 'ortb_test_source' },
    update: {},
    create: {
      id: 'ortb_test_source',
      type: 'ORTB',
      name: 'Test OpenRTB DSP',
      priority: 2,
      isActive: true,
      ortbConfig: {
        create: {
          endpoint: 'https://dsp.example.com/bid',
          timeout: 200,
          bannerEnabled: true,
          bannerFloor: 1.0,
          interstitialEnabled: true,
          interstitialFloor: 5.0,
          rewardedEnabled: true,
          rewardedFloor: 8.0,
        },
      },
    },
  })
  console.log('✅ OpenRTB demand source created:', ortbSource.name)

  console.log('')
  console.log('🎉 Seed completed!')
  console.log('')
  console.log('📋 Test credentials:')
  console.log('   App Key: sbz_app_test123456789')
  console.log('   Placements:')
  console.log('   - Banner: sbz_plc_banner_test')
  console.log('   - Interstitial: sbz_plc_inter_test')
  console.log('   - Rewarded: sbz_plc_rewarded_test')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
