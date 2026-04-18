import { listOrdersResponseSchema, orderSchema } from "./src/lib/schemas/orders";
import fs from "fs";

const payload = JSON.parse(fs.readFileSync('/tmp/sopet-debug.json', 'utf8'));

if (payload.orders && payload.orders.length > 0) {
  const result = orderSchema.safeParse(payload.orders[0]);
  if (!result.success) {
    console.error("Order 0 failed validation:", JSON.stringify(result.error.flatten(), null, 2));
  } else {
    console.log("Order 0 success");
  }
}
