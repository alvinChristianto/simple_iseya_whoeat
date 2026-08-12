-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('HO', 'LUAR');

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bread_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bread_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bread_records" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "bread_type_id" INTEGER NOT NULL,
    "category" "Category" NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bread_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_name_key" ON "employees"("name");

-- CreateIndex
CREATE INDEX "employees_is_active_idx" ON "employees"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "bread_types_name_key" ON "bread_types"("name");

-- CreateIndex
CREATE INDEX "bread_types_is_active_idx" ON "bread_types"("is_active");

-- CreateIndex
CREATE INDEX "bread_records_recorded_at_idx" ON "bread_records"("recorded_at");

-- CreateIndex
CREATE INDEX "bread_records_employee_id_idx" ON "bread_records"("employee_id");

-- CreateIndex
CREATE INDEX "bread_records_bread_type_id_idx" ON "bread_records"("bread_type_id");

-- AddForeignKey
ALTER TABLE "bread_records" ADD CONSTRAINT "bread_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bread_records" ADD CONSTRAINT "bread_records_bread_type_id_fkey" FOREIGN KEY ("bread_type_id") REFERENCES "bread_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

