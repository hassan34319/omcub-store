import { defineType } from "sanity";

export default defineType({
  name: "orders",
  title: "Orders",
  type: "document",
  fields: [
    {
      name: "id",
      title: "Order Reeference ID (Gelato)",
      type: "string",
      validation: (rule) => rule.required(),
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "string",
      validation: (rule) => rule.required(),
    },
    {
      name: "totalPrice",
      title: "Total Price",
      type: "string",
      validation: (rule) => rule.required(),
    },
  ],
});
