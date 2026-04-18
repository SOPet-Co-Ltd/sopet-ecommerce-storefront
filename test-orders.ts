import { listOrders } from "./src/lib/data/orders";
listOrders(100, 0).then(res => console.log("Orders found:", res?.length)).catch(console.error);
