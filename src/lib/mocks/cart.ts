export const mockCart = {
  id: "cart_mock_123",
  currency_code: "THB",
  email: "user@example.com",
  items: [
    {
      id: "item_1",
      quantity: 1,
      unit_price: 33300, // 333.00 THB (Discounted)
      original_price: 38200, // 382.00 THB (Original)
      product_title: "Earthborn Holistic Primitive Natural",
      thumbnail: "", // Placeholder
      variant: {
        id: "variant_1",
        title: "Default Variant",
        options: [
          { id: "opt_1", option_id: "color", value: "Red" },
          // { id: "opt_2", option_id: "size", value: "1 กล่อง" },
        ],
      },
      product: {
        id: "prod_1",
        title: "Earthborn Holistic Primitive Natural",
        handle: "earthborn-holistic",
        thumbnail: "",
        seller: {
          id: "seller_1",
          store_name: "SOPet Official Store",
        },
      },
    },
    {
      id: "item_2",
      quantity: 2,
      unit_price: 12000, // 120.00 THB
      product_title: "Cat Toy",
      thumbnail: "",
      variant: {
        id: "variant_2",
        title: "Blue",
        options: [{ id: "opt_3", option_id: "color", value: "Blue" }],
      },
      product: {
        id: "prod_2",
        title: "Cat Toy Interactive",
        handle: "cat-toy",
        thumbnail: "",
        seller: {
          id: "seller_2",
          store_name: "Pet Lovers Shop",
        },
      },
    },
    {
      id: "item_3",
      quantity: 1,
      unit_price: 4500000,
      product_title: "Premium Dog House",
      thumbnail: "",
      variant: {
        id: "variant_3",
        title: "Large",
        options: [{ id: "opt_4", option_id: "size", value: "Large" }],
      },
      product: {
        id: "prod_3",
        title: "Premium Dog House",
        handle: "premium-dog-house",
        thumbnail: "",
        seller: {
          id: "seller_1",
          store_name: "SOPet Official Store",
        },
      },
    },
  ],
  subtotal: 4547000,
  discount_total: 10000,
  shipping_total: 5000,
  tax_total: 318290,
  total: 4860290,
}
