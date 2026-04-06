import { HttpTypes } from "@medusajs/types"
import { getSessionCustomer } from "@/lib/data/customer"
import { Navbar } from "@/components/cells"

type HeaderProps = {
  user?: HttpTypes.StoreCustomer | null
}

export const Header = async ({ user: userProp }: HeaderProps = {}) => {
  const user =
    userProp === undefined ? await getSessionCustomer() : (userProp ?? null)

  return (
    <header>
      <Navbar user={user} />
    </header>
  )
}
