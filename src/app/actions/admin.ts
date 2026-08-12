"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { nameSchema, pinSchema } from "@/lib/validation";
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  verifyPin,
  verifySessionToken,
} from "@/lib/auth";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export async function loginWithPin(pin: string): Promise<ActionResult> {
  const parsed = pinSchema.safeParse(pin);
  if (!parsed.success) return { ok: false, message: "PIN salah." };
  if (!verifyPin(parsed.data)) return { ok: false, message: "PIN salah." };

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 24 * 60 * 60,
  });

  return { ok: true, message: "" };
}

export async function addEmployee(input: unknown): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, message: "Akses ditolak." };
  const parsed = nameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Nama wajib diisi." };
  const name = parsed.data;

  const existing = await prisma.employee.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });

  if (existing) {
    if (existing.isActive) {
      return { ok: false, message: "Nama sudah terdaftar." };
    }
    await prisma.employee.update({
      where: { id: existing.id },
      data: { isActive: true },
    });
    return { ok: true, message: "Data berhasil disimpan. Karyawan diaktifkan kembali." };
  }

  await prisma.employee.create({ data: { name } });
  return { ok: true, message: "Data berhasil disimpan." };
}

export async function setEmployeeActive(input: {
  id: number;
  isActive: boolean;
}): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, message: "Akses ditolak." };
  await prisma.employee.update({
    where: { id: input.id },
    data: { isActive: input.isActive },
  });
  return { ok: true, message: "" };
}

export async function addBreadType(input: unknown): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, message: "Akses ditolak." };
  const parsed = nameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Nama wajib diisi." };
  const name = parsed.data;

  const existing = await prisma.breadType.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });

  if (existing) {
    if (existing.isActive) {
      return { ok: false, message: "Nama sudah terdaftar." };
    }
    await prisma.breadType.update({
      where: { id: existing.id },
      data: { isActive: true },
    });
    return { ok: true, message: "Data berhasil disimpan. Jenis roti diaktifkan kembali." };
  }

  await prisma.breadType.create({ data: { name } });
  return { ok: true, message: "Data berhasil disimpan." };
}

export async function setBreadTypeActive(input: {
  id: number;
  isActive: boolean;
}): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, message: "Akses ditolak." };
  await prisma.breadType.update({
    where: { id: input.id },
    data: { isActive: input.isActive },
  });
  return { ok: true, message: "" };
}
