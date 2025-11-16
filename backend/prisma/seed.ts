import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create/Update users with correct passwords
  const saccoHash = await bcrypt.hash("admin123", 10);
  const conductorHash = await bcrypt.hash("pass1234", 10);
  const driverHash = await bcrypt.hash("driver123", 10);
  const ownerHash = await bcrypt.hash("owner123", 10);

  const sacco = await prisma.user.upsert({
    where: { phoneNumber: "0712345678" },
    update: {
      password: saccoHash, // Always update password to ensure it's correct
      name: "Super Sacco",
      role: "sacco",
    },
    create: {
      name: "Super Sacco",
      phoneNumber: "0712345678",
      password: saccoHash,
      role: "sacco",
    },
  });

  const conductor = await prisma.user.upsert({
    where: { phoneNumber: "0723456789" },
    update: {
      password: conductorHash, // Always update password to ensure it's correct
      name: "Test Conductor",
      role: "conductor",
    },
    create: {
      name: "Test Conductor",
      phoneNumber: "0723456789",
      password: conductorHash,
      role: "conductor",
    },
  });

  const driver = await prisma.user.upsert({
    where: { phoneNumber: "0734567890" },
    update: {
      password: driverHash, // Always update password to ensure it's correct
      name: "Test Driver",
      role: "driver",
    },
    create: {
      name: "Test Driver",
      phoneNumber: "0734567890",
      password: driverHash,
      role: "driver",
    },
  });

  const owner = await prisma.user.upsert({
    where: { phoneNumber: "0745678901" },
    update: {
      password: ownerHash, // Always update password to ensure it's correct
      name: "Test Owner",
      role: "owner",
    },
    create: {
      name: "Test Owner",
      phoneNumber: "0745678901",
      password: ownerHash,
      role: "owner",
    },
  });

  // Create routes with fare rules
  const existingRoute1 = await prisma.route.findFirst({
    where: { from: "CBD", to: "Ongata Rongai" },
  });

  const route1 = existingRoute1 || await prisma.route.create({
    data: {
      name: "CBD - Ongata Rongai",
      from: "CBD",
      to: "Ongata Rongai",
      distance: 25.5,
      fareRules: {
        create: [
          { fareType: "normal", amount: 100 },
          { fareType: "rush_hour", amount: 120 },
          { fareType: "off_peak", amount: 80 },
          { fareType: "rain", amount: 150 },
        ],
      },
    },
    include: { fareRules: true },
  });

  const existingRoute2 = await prisma.route.findFirst({
    where: { from: "CBD", to: "Ngong" },
  });

  const route2 = existingRoute2 || await prisma.route.create({
    data: {
      name: "CBD - Ngong",
      from: "CBD",
      to: "Ngong",
      distance: 30.0,
      fareRules: {
        create: [
          { fareType: "normal", amount: 120 },
          { fareType: "rush_hour", amount: 150 },
          { fareType: "off_peak", amount: 100 },
          { fareType: "rain", amount: 180 },
        ],
      },
    },
    include: { fareRules: true },
  });

  const existingRoute3 = await prisma.route.findFirst({
    where: { from: "CBD", to: "Kikuyu" },
  });

  const route3 = existingRoute3 || await prisma.route.create({
    data: {
      name: "CBD - Kikuyu",
      from: "CBD",
      to: "Kikuyu",
      distance: 20.0,
      fareRules: {
        create: [
          { fareType: "normal", amount: 80 },
          { fareType: "rush_hour", amount: 100 },
          { fareType: "off_peak", amount: 70 },
          { fareType: "rain", amount: 120 },
        ],
      },
    },
    include: { fareRules: true },
  });

  // Create matatus
  await prisma.matatu.upsert({
    where: { plateNumber: "KCA 123A" },
    update: {},
    create: {
      plateNumber: "KCA 123A",
      model: "Toyota Hiace",
      capacity: 14,
      ownerId: owner.id,
    },
  });

  await prisma.matatu.upsert({
    where: { plateNumber: "KCB 456B" },
    update: {},
    create: {
      plateNumber: "KCB 456B",
      model: "Nissan Urvan",
      capacity: 14,
      ownerId: owner.id,
    },
  });

  console.log("Seeded users, routes, and matatus successfully");
}

main()
  .then(() => {
    console.log("Seeded successfully");
    prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

