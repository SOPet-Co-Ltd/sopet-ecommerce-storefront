import { redirect } from "next/navigation"

export default async function UserPage() {
  return redirect(`user/profile`)
}
