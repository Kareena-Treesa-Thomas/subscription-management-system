<<<<<<< HEAD
export default function Home() {
  return <main style={{ padding: 24 }}><h1>Brightloop Subscriptions</h1><p>App shell coming from Anjanapriya.</p></main>;
=======
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { homeFor } from "@/lib/roles";

export default async function Home() {
  const session = await auth();
  redirect(session?.user ? homeFor(session.user.role) : "/login");
>>>>>>> 9d94d5b124606e296a74351ec4aebede17456d55
}
