import { getUncachableStripeClient } from './server/stripeClient';

async function createJobPostingProduct() {
  try {
    const stripe = await getUncachableStripeClient();
    
    console.log("Creating job posting product and price in LIVE mode...");
    
    // Create the product
    const product = await stripe.products.create({
      name: 'Job Posting',
      description: 'Post a job listing on Dev Global Jobs - Visible to job seekers worldwide',
      metadata: {
        type: 'job_posting'
      }
    });
    
    console.log("Product created:", product.id);
    
    // Create the price ($2.00 USD)
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 200, // $2.00 in cents
      currency: 'usd',
      metadata: {
        type: 'job_posting_fee'
      }
    });
    
    console.log("Price created:", price.id);
    console.log("\n=== NEW LIVE PRICE ID ===");
    console.log(`Price ID: ${price.id}`);
    console.log("=========================");
    
    return price.id;
  } catch (error: any) {
    console.error("Error:", error.message);
    return null;
  }
}

createJobPostingProduct();
