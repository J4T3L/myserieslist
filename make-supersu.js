const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  if (users.length === 0) {
    console.log("⚠️ Belum ada user yang terdaftar di database.");
    console.log("💡 Silakan buka http://localhost:3000 dan login dengan akun Google Anda terlebih dahulu.");
    return;
  }
  
  const email = process.argv[2];
  if (!email) {
    console.log("👤 Daftar user yang saat ini ada di database:");
    users.forEach(u => console.log(`  - ${u.email} (Role: ${u.role})`));
    console.log("\n🚀 CARA MENJADIKAN AKUN SEBAGAI SUPERSU:");
    console.log("Jalankan perintah ini di terminal:");
    console.log("node make-supersu.js <email_anda>");
    return;
  }

  try {
    const updated = await prisma.user.update({
      where: { email },
      data: { role: "supersu" }
    });
    console.log(`✅ BERHASIL! Akun ${email} sekarang memiliki role: ${updated.role.toUpperCase()}`);
    console.log("Silakan refresh browser Anda, lalu buka halaman /supersu");
  } catch (err) {
    console.log(`❌ Gagal mengubah role: Pastikan email ${email} benar-benar ada di database.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
