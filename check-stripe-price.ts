import { getUncachableStripeClient } from './server/stripeClient';

async function checkPrice() {
  try {
    const stripe = await getUncachableStripeClient();
    
    // Try to retrieve the existing price
    const priceId = "price_1Sw7OMD8mo7cB4Da5oksygga";
    try {
      const price = await stripe.prices.retrieve(priceId);
      console.log("Price exists:", JSON.stringify(price, null, 2));
    } catch (e: any) {
      console.log("Price not found, error:", e.message);
      
      // List all products to see what exists
      console.log("\n--- Listing all products ---");
      const products = await stripe.products.list({ limit: 10 });
      console.log("Products:", JSON.stringify(products.data.map(p => ({ id: p.id, name: p.name })), null, 2));
      
      // List all prices
      console.log("\n--- Listing all prices ---");
      const prices = await stripe.prices.list({ limit: 10 });
      console.log("Prices:", JSON.stringify(prices.data.map(p => ({ id: p.id, unit_amount: p.unit_amount, product: p.product })), null, 2));
    }
  } catch (error: any) {
    console.error("Error:", error.message);
  }
}

checkPrice();
