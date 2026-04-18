import fs from "fs";
import { sliceOrder } from "./src/lib/helpers/order-slicer";

const payload = JSON.parse(fs.readFileSync('/tmp/sopet-debug.json', 'utf8'));

if (payload.orders && payload.orders.length > 0) {
  const order = payload.orders[0];
  const slices = sliceOrder(order as any);
  console.log("Total Slices:", slices.length);
  slices.forEach(s => {
     console.log(`Seller: ${s.seller_name}, slice_shipping: ${s.slice_shipping}, slice_discount: ${s.slice_discount}, slice_total: ${s.slice_total}, slice_subtotal: ${s.slice_subtotal}`);
  })
}
