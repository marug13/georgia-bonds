import { PrismaClient, MarketCategory, MarketStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bazari.ge' },
    update: {},
    create: {
      email: 'admin@bazari.ge',
      username: 'admin',
      password: adminPassword,
      balance: 50000,
      isAdmin: true,
    },
  });
  console.log('✅ Created admin user:', admin.username);

  // Create demo users
  const demoPassword = await bcrypt.hash('demo123', 10);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'giorgi@example.com' },
      update: {},
      create: {
        email: 'giorgi@example.com',
        username: 'giorgi_trader',
        password: demoPassword,
        balance: 10000,
      },
    }),
    prisma.user.upsert({
      where: { email: 'nino@example.com' },
      update: {},
      create: {
        email: 'nino@example.com',
        username: 'nino_predictor',
        password: demoPassword,
        balance: 10000,
      },
    }),
    prisma.user.upsert({
      where: { email: 'tamari@example.com' },
      update: {},
      create: {
        email: 'tamari@example.com',
        username: 'tamari_markets',
        password: demoPassword,
        balance: 10000,
      },
    }),
  ]);
  console.log('✅ Created demo users');

  // Create sample markets
  const markets = [
    {
      titleKa: 'იქნება თუ არა თოვლი თბილისში 2025 წლის იანვარში?',
      titleEn: 'Will it snow in Tbilisi in January 2025?',
      description: 'ბაზარი განსაზღვრავს დაეცემა თუ არა თოვლი თბილისში 2025 წლის იანვარში. "დიახ" ნიშნავს რომ მინიმუმ ერთი თოვლის ფიფქი დაეცემა.',
      category: MarketCategory.WEATHER,
      resolutionDate: new Date('2025-02-01'),
      status: MarketStatus.OPEN,
      yesLiquidity: 5000,
      noLiquidity: 5000,
    },
    {
      titleKa: 'მოიგებს თუ არა საქართველოს რაგბის ნაკრები იტალიას 2025 Six Nations-ში?',
      titleEn: 'Will Georgia beat Italy in 2025 Six Nations?',
      description: 'პროგნოზი საქართველოს რაგბის ნაკრების გამარჯვების შესახებ იტალიასთან Six Nations ტურნირის ფარგლებში.',
      category: MarketCategory.SPORTS,
      resolutionDate: new Date('2025-03-15'),
      status: MarketStatus.OPEN,
      yesLiquidity: 6000,
      noLiquidity: 4000,
    },
    {
      titleKa: 'გადააჭარბებს თუ არა ლარის კურსი 3.00-ს დოლართან მიმართებაში 2025 წლის მარტამდე?',
      titleEn: 'Will GEL/USD exchange rate exceed 3.00 by March 2025?',
      description: 'ბაზარი პროგნოზირებს ლარის გაუფასურებას დოლართან მიმართებაში. "დიახ" ნიშნავს რომ კურსი მიაღწევს ან გადააჭარბებს 3.00 ლარს.',
      category: MarketCategory.ECONOMY,
      resolutionDate: new Date('2025-03-31'),
      status: MarketStatus.OPEN,
      yesLiquidity: 4500,
      noLiquidity: 5500,
    },
    {
      titleKa: 'ჩაივლის თუ არა საქართველოს ფილმი ოსკარის შორთლისტში 2025 წელს?',
      titleEn: 'Will a Georgian film make the Oscar shortlist in 2025?',
      description: 'პროგნოზი საქართველოს წარმოდგენილი ფილმის საერთაშორისო ფილმის კატეგორიაში ოსკარის შორთლისტში მოხვედრის შესახებ.',
      category: MarketCategory.CULTURE,
      resolutionDate: new Date('2025-02-15'),
      status: MarketStatus.OPEN,
      yesLiquidity: 5200,
      noLiquidity: 4800,
    },
    {
      titleKa: 'დაინიშნება თუ არა ახალი პრემიერ-მინისტრი 2025 წლის პირველ კვარტალში?',
      titleEn: 'Will a new Prime Minister be appointed in Q1 2025?',
      description: 'ბაზარი პროგნოზირებს პრემიერ-მინისტრის თანამდებობაზე ცვლილებას 2025 წლის პირველ სამ თვეში.',
      category: MarketCategory.POLITICS,
      resolutionDate: new Date('2025-04-01'),
      status: MarketStatus.OPEN,
      yesLiquidity: 4000,
      noLiquidity: 6000,
    },
    {
      titleKa: 'გაიმართება თუ არა ევროვიზიის ფინალი 10 მილიონზე მეტი მაყურებლით?',
      titleEn: 'Will Eurovision final have over 10 million viewers?',
      description: 'პროგნოზი ევროვიზიის 2025 წლის ფინალის ტელე-მაყურებლების რაოდენობის შესახებ.',
      category: MarketCategory.ENTERTAINMENT,
      resolutionDate: new Date('2025-05-20'),
      status: MarketStatus.OPEN,
      yesLiquidity: 5500,
      noLiquidity: 4500,
    },
    {
      titleKa: 'მიაღწევს თუ არა დინამო თბილისი ევროპის ლიგის ჯგუფურ ეტაპს 2025 წელს?',
      titleEn: 'Will Dinamo Tbilisi reach Europa League group stage in 2025?',
      description: 'საფეხბურთო კლუბ დინამო თბილისის შედეგების პროგნოზი ევროპის ლიგის კვალიფიკაციაში.',
      category: MarketCategory.SPORTS,
      resolutionDate: new Date('2025-08-31'),
      status: MarketStatus.OPEN,
      yesLiquidity: 4800,
      noLiquidity: 5200,
    },
    {
      titleKa: 'აღემატება თუ არა ინფლაცია 5%-ს საქართველოში 2025 წლის ივნისში?',
      titleEn: 'Will inflation exceed 5% in Georgia in June 2025?',
      description: 'ეკონომიკური პროგნოზი საქართველოში წლიური ინფლაციის მაჩვენებლის შესახებ.',
      category: MarketCategory.ECONOMY,
      resolutionDate: new Date('2025-07-10'),
      status: MarketStatus.OPEN,
      yesLiquidity: 5100,
      noLiquidity: 4900,
    },
    {
      titleKa: 'გაიხსნება თუ არა ახალი მეტრო სადგური თბილისში 2025 წელს?',
      titleEn: 'Will a new metro station open in Tbilisi in 2025?',
      description: 'ინფრასტრუქტურული პროექტების პროგნოზი - ახალი მეტროს სადგურის გახსნა დედაქალაქში.',
      category: MarketCategory.CULTURE,
      resolutionDate: new Date('2025-12-31'),
      status: MarketStatus.OPEN,
      yesLiquidity: 4500,
      noLiquidity: 5500,
    },
    {
      titleKa: 'ჩაბარდება თუ არა თბილისში საშუალო ტემპერატურა 35°C-ზე მაღალი ივლისში?',
      titleEn: 'Will Tbilisi temperature exceed 35°C in July 2025?',
      description: 'ამინდის პროგნოზი - საშუალო დღიური ტემპერატურა თბილისში ივლისის თვეში.',
      category: MarketCategory.WEATHER,
      resolutionDate: new Date('2025-08-01'),
      status: MarketStatus.OPEN,
      yesLiquidity: 5300,
      noLiquidity: 4700,
    },
  ];

  for (const market of markets) {
    await prisma.market.create({
      data: market,
    });
  }
  console.log(`✅ Created ${markets.length} sample markets`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
