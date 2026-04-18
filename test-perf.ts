import { retrieveCart } from "./src/lib/data/cart";
import { getCheckoutPageInitialData } from "./src/lib/data/checkout-page";

async function run() {
  const t0 = Date.now();
  console.log("Fetching cart...");
  const cart = await retrieveCart();
  if(!cart) { console.log("No cart"); return; }
  console.log(`Cart fetched in ${Date.now() - t0}ms`);
  
  const regionId = cart.region_id ?? cart.region?.id ?? null;
  const t1 = Date.now();
  
  console.log("Fetching checkout data...");
  const data = await getCheckoutPageInitialData(cart.id, regionId);
  console.log(`Checkout data in ${Date.now() - t1}ms`);
  
  console.log(`Total time: ${Date.now() - t0}ms`);
}
run();
