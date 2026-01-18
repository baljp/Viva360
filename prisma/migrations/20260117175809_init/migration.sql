-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "price" REAL NOT NULL,
    "specialties" TEXT NOT NULL,
    "clinicId" TEXT,
    "clinicName" TEXT,
    "location" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "badges" TEXT,
    "nextSession" TEXT,
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "image" TEXT NOT NULL,
    "specialties" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "amenities" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
