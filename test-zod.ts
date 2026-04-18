import { z } from "zod";
console.log(z.coerce.number().safeParse(undefined));
