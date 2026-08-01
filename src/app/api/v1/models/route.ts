import { NextResponse } from "next/server";

import { findPreset } from "@/lib/ai/providers";
import { authenticateRequest } from "@/lib/api/authenticate";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Daftar provider/model yang saat ini siap melayani request.
 *
 * Hanya mengembalikan metadata agregat — tidak ada informasi kunci, dan tidak
 * dibatasi per user karena kolam kunci memang dipakai bersama.
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status },
    );
  }

  const grouped = await prisma.providerKey.groupBy({
    by: ["providerName", "modelName"],
    where: { isActive: true },
    _count: { _all: true },
    _max: { priority: true },
  });

  const models = grouped
    .map((row) => {
      const preset = findPreset(row.providerName);
      return {
        provider: row.providerName,
        model: row.modelName ?? preset?.defaultModel ?? null,
        format: preset?.format ?? "openai",
        availableKeys: row._count._all,
        priority: row._max.priority ?? 0,
      };
    })
    .sort((a, b) => b.priority - a.priority);

  return NextResponse.json({
    success: true,
    count: models.length,
    models,
  });
}
