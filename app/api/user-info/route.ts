import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized();
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();

  if (!accessToken) {
    return unauthorized();
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return unauthorized();
  }

  try {
    const email = user.email ?? "";
    const profile = await prisma.userProfile.upsert({
      where: { id: user.id },
      update: email ? { email } : {},
      create: {
        id: user.id,
        ...(email ? { email } : {}),
      },
    });

    const usage = await prisma.usageCount.upsert({
      where: { userId: profile.id },
      update: {},
      create: { userId: profile.id },
    });

    const userItems = await prisma.userItem.findMany({
      where: { userId: profile.id },
      include: {
        restrictedItem: true,
      },
      orderBy: { id: "asc" },
    });

    const restrictions = userItems.map((item: (typeof userItems)[0]) => ({
      id: item.restrictedItem.id,
      name: item.restrictedItem.name,
      type: item.restrictedItem.type,
    }));

    const preference = await prisma.userPreference.findUnique({
      where: { userId: profile.id },
    });

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
      },
      usage: {
        todayCount: usage.total,
      },
      restrictions,
      preferences: preference
        ? {
            wantsHalal: preference.wantsHalal,
            wantsAllergy: preference.wantsAllergy,
          }
        : null,
    });
  } catch (error) {
    console.error("Failed to fetch user info", error);
    return NextResponse.json(
      { error: "Failed to fetch user info" },
      { status: 500 }
    );
  }
}
