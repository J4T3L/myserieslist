const { PrismaClient } = require('@prisma/client')
const { scryptSync, randomBytes } = require('crypto')
const prisma = new PrismaClient()

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

//
async function main() {
  console.log("🔄 Membersihkan database lama...");
  await prisma.watchlistItem.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("🌱 Menanam (seeding) data baru...");

  // 1. Create SuperSU User
  const supersu = await prisma.user.create({
    data: {
      name: "SuperSU Root",
      email: "supersu@cinelist.test",
      password: hashPassword("123456"),
      role: "supersu",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=SuperSU",
      watchlist: {
        create: [
          {
            showId: 82,
            showName: "Game of Thrones",
            showImage: "https://static.tvmaze.com/uploads/images/medium_portrait/190/476117.jpg",
            trackerStatus: "completed",
            personalRating: 10,
            totalEpisodes: 73,
            watchedEpisodeIds: "[]"
          },
          {
            showId: 169,
            showName: "Breaking Bad",
            showImage: "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg",
            trackerStatus: "completed",
            personalRating: 9,
            totalEpisodes: 62,
            watchedEpisodeIds: "[]"
          }
        ]
      }
    }
  });

  // 2. Create Admin User
  const admin = await prisma.user.create({
    data: {
      name: "Admin Moderator",
      email: "admin@cinelist.test",
      password: hashPassword("123456"),
      role: "admin",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
      watchlist: {
        create: [
          {
            showId: 431,
            showName: "Friends",
            showImage: "https://static.tvmaze.com/uploads/images/medium_portrait/41/104550.jpg",
            trackerStatus: "watching",
            personalRating: 8,
            totalEpisodes: 236,
            watchedEpisodeIds: "[1,2,3,4,5]"
          }
        ]
      }
    }
  });

  // 3. Create Regular Users
  const user1 = await prisma.user.create({
    data: {
      name: "Reza Rahardian",
      email: "reza.user@cinelist.test",
      password: hashPassword("123456"),
      role: "user",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Reza",
      watchlist: {
        create: [
          {
            showId: 1,
            showName: "Under the Dome",
            showImage: "https://static.tvmaze.com/uploads/images/medium_portrait/81/202627.jpg",
            trackerStatus: "plantowatch",
            totalEpisodes: 39,
            watchedEpisodeIds: "[]"
          }
        ]
      }
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "budi.user@cinelist.test",
      password: hashPassword("123456"),
      role: "user",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Budi",
      watchlist: {
        create: [
          {
            showId: 139,
            showName: "Girls",
            showImage: "https://static.tvmaze.com/uploads/images/medium_portrait/31/78286.jpg",
            trackerStatus: "dropped",
            personalRating: 5,
            totalEpisodes: 62,
            watchedEpisodeIds: "[]"
          }
        ]
      }
    }
  });

  console.log("✅ Seeder berhasil dieksekusi!");
  console.log("=========================================");
  console.log("Daftar Akun Uji Coba yang ditambahkan:");
  console.log(`1. [SuperSU] : ${supersu.email} (2 Watchlist)`);
  console.log(`2. [Admin]   : ${admin.email} (1 Watchlist)`);
  console.log(`3. [User 1]  : ${user1.email} (1 Watchlist)`);
  console.log(`4. [User 2]  : ${user2.email} (1 Watchlist)`);
  console.log("");
  console.log("🔑 PASSWORD UNTUK SEMUA AKUN DI ATAS: 123456");
  console.log("=========================================");
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
