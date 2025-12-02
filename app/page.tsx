import { redirect } from 'next/navigation';
import { getUser } from "@/lib/auth/get-user";

export default async function HomePage() {
  const user = await getUser();
  
  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }
  
  // If not authenticated, redirect to signin
  redirect("/auth/signin");
}
