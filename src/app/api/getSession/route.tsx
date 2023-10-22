export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sanityAdminClient, sanityClient } from "../../../lib/sanity-client";
const stripe: Stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export const generateRandomString = (length: number) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const orderData = (customer, product, currency: string, orderId: string) => {
  const images = JSON.parse(product?.images);
  const productUIDs = JSON.parse(product?.productUID);
  const quantities = JSON.parse(product?.quantities);

  const products = [];
  for (let i = 0; i < images.length; i++) {
    const obj = {
      itemReferenceId: generateRandomString(10),
      productUid: productUIDs[i],
      files: [
        {
          type: "default",
          url: images[i],
        },
      ],
      quantity: quantities[i],
    };
    products.push(obj);
  }

  const shippingDetails = {
    companyName: "Test Name",
    addressLine1: customer?.address?.line1,
    addressLine2: customer?.address?.line2,
    state: customer?.address?.state,
    city: customer?.address?.city,
    postCode: customer?.address?.postal_code,
    country: customer?.address?.country,
    email: customer?.email,
    phone: "",
  };

  const data = {
    orderType: "order", // change to 'order' for production & 'draft' for testing
    orderReferenceId: orderId,
    customerReferenceId: customer?.email, //change to auth unique id later
    currency,
    items: products,
    shipmentMethodUid: "express",
    shippingAddress: {
      ...shippingDetails,
      firstName: customer?.name?.split(" ")[0] || customer?.name,
      lastName: customer?.name?.split(" ")[1] || "",
    },
    returnAddress: shippingDetails,
  };

  return data;
};

const createItemInDocument = async (item: any) => {
  try {
    const response = await sanityAdminClient.createIfNotExists(item);

    console.log("Item added successfully:");
    return response;
  } catch (error) {
    console.error("Error adding item:", error.message);
    throw error;
  }
};

const checkOrder = async (orderId: string) => {
  const orders = await sanityClient.fetch(`*[_type == "orders" && id in $id]`, {
    id: [orderId],
  });
  if (orders.length) return true;

  return false;
};

export async function GET(req: Request) {
  try {
    const sessionId = req?.url?.split("=")[1] as string;

    if (sessionId) {
      const session = await stripe.checkout.sessions.listLineItems(sessionId);
      const sessionDetails = await stripe.checkout.sessions.retrieve(sessionId);

      const orderCreated = await checkOrder(sessionId);

      if (!orderCreated) {
        const data = orderData(
          sessionDetails?.customer_details,
          sessionDetails?.metadata,
          sessionDetails?.currency?.toUpperCase(),
          sessionId
        );
        const order = await fetch("https://order.gelatoapis.com/v4/orders", {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.NEXT_PUBLIC_GELATO_API_KEY,
          },
          body: JSON.stringify(data),
        });
        const orderDetails = await order.json();
        console.log("🚀 ~ file: route.tsx:107 ~ GET ~ orderDetails:", orderDetails);

        const doc = {
          _id: `${generateRandomString(10)}`,
          _type: "orders",
          id: sessionId,
          createdAt: new Date().toISOString(),
          totalPrice: (sessionDetails?.amount_total / 100).toFixed(2),
        };
        await createItemInDocument(doc);
      }

      return NextResponse.json({ session, sessionDetails });
    } else {
      return NextResponse.json({ message: "No session id" });
    }
  } catch (err) {
    console.log(err);
    const errorMessage =
      err instanceof Error ? err.message : "Session ID not found";
    return NextResponse.json({ statusCode: 404, message: errorMessage });
  }
}
