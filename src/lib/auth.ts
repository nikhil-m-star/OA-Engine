import { currentUser } from "@clerk/nextjs/server";

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || "nikhilm9110@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export async function isAdminUser() {
  try {
    const user = await currentUser();
    if (!user) {
      return false;
    }

    return user.emailAddresses.some((email) =>
      ADMIN_EMAILS.has(email.emailAddress.toLowerCase())
    );
  } catch (err) {
    console.error("Error verifying admin status:", err);
    return false;
  }
}

