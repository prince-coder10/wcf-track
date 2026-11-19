import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User, { IUser } from "@/models/User";

export interface VerifiedInviteUser {
  id: string;
  fullName: string;
  login: string;
  role: string;
  unit?: string;
  phone?: string;
}

/**
 * Verifies an invite token and returns the corresponding invited user document.
 * Supports:
 * - Direct lookup with userId + token (fast O(1) path)
 * - Candidate lookup with only token (checks pending invited users)
 */
export async function verifyInviteToken(
  token: string,
  userId?: string
): Promise<{ user: IUser | null; error?: string }> {
  if (!token || typeof token !== "string") {
    return { user: null, error: "Invalid invitation token" };
  }

  await connectDB();

  // If userId is provided, do a direct lookup
  if (userId) {
    try {
      const user = await User.findById(userId)
        .select("+invite.tokenHash invite.expiresAt invite.usedAt createdBy fullName login role unit phone status tokenVersion")
        .exec();

      if (!user) {
        return { user: null, error: "Account not found" };
      }

      if (user.status !== "invited") {
        return {
          user: null,
          error: "This invitation has already been accepted or the account is already active.",
        };
      }

      if (!user.invite?.tokenHash || !user.invite?.expiresAt) {
        return { user: null, error: "Invitation record is missing or invalid." };
      }

      if (new Date(user.invite.expiresAt) < new Date()) {
        return {
          user: null,
          error: "This invitation link has expired (links are valid for 24 hours).",
        };
      }

      if (user.invite.usedAt) {
        return {
          user: null,
          error: "This one-time invitation link has already been used.",
        };
      }

      const matches = await bcrypt.compare(token, user.invite.tokenHash);
      if (!matches) {
        return { user: null, error: "Invalid invitation token." };
      }

      return { user };
    } catch {
      // If userId is malformed, fall through to token candidate scan
    }
  }

  // If only token is provided, search all pending invited users whose invite hasn't expired
  const now = new Date();
  const candidates = await User.find({
    status: "invited",
    "invite.expiresAt": { $gt: now },
    "invite.usedAt": { $exists: false },
  })
    .select("+invite.tokenHash createdBy fullName login role unit phone status tokenVersion")
    .exec();

  for (const candidate of candidates) {
    if (candidate.invite?.tokenHash) {
      const matches = await bcrypt.compare(token, candidate.invite.tokenHash);
      if (matches) {
        return { user: candidate };
      }
    }
  }

  return {
    user: null,
    error: "This invitation link is invalid, expired, or has already been used.",
  };
}
