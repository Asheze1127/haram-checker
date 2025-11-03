import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import type { User } from "@supabase/supabase-js";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const ensureAccessToken = (request: NextRequest) => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) {
    return null;
  }

  return accessToken;
};

const getSupabaseUser = async (accessToken: string) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return user;
};

const ensureProfile = async (user: User) => {
  const email = user.email?.trim();

  const profile = await prisma.userProfile.upsert({
    where: { id: user.id },
    update: email ? { email } : {},
    create: {
      id: user.id,
      ...(email ? { email } : {}),
    },
  });

  return profile;
};

const serializePreference = (preference: {
  wantsHalal: boolean;
  wantsAllergy: boolean;
}) => ({
  wantsHalal: preference.wantsHalal,
  wantsAllergy: preference.wantsAllergy,
});

export async function GET(request: NextRequest) {
  const accessToken = ensureAccessToken(request);
  if (!accessToken) {
    return unauthorized();
  }

  const user = await getSupabaseUser(accessToken);
  if (!user) {
    return unauthorized();
  }

  const profile = await ensureProfile(user);

  const preference = await prisma.userPreference.findUnique({
    where: { userId: profile.id },
  });

  if (!preference) {
    return NextResponse.json(
      { preference: null },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(serializePreference(preference));
}

export async function POST(request: NextRequest) {
  const accessToken = ensureAccessToken(request);
  if (!accessToken) {
    return unauthorized();
  }

  const user = await getSupabaseUser(accessToken);
  if (!user) {
    return unauthorized();
  }

  const profile = await ensureProfile(user);

  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.wantsHalal !== "boolean" ||
    typeof body.wantsAllergy !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }

  const preference = await prisma.userPreference.upsert({
    where: { userId: profile.id },
    update: {
      wantsHalal: body.wantsHalal,
      wantsAllergy: body.wantsAllergy,
    },
    create: {
      userId: profile.id,
      wantsHalal: body.wantsHalal,
      wantsAllergy: body.wantsAllergy,
    },
  });

  return NextResponse.json(serializePreference(preference));
}
