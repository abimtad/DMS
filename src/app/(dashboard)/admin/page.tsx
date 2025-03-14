import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { Session } from "next-auth"; // Import Session type

export default async function Admin() {
  const session = await getServerSession(authOptions);
  if (!session) {
    // Redirect if there's no session
    return <div>You need to sign in to access the admin page.</div>;
  }
  return <div className="text-4xl">Welcome to admin page</div>;
}
