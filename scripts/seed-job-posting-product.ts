import { getUncachableStripeClient } from '../server/stripeClient';

async function createJobPostingProduct() {
  console.log('Creating Job Posting Product in Stripe...');
  
  const stripe = await getUncachableStripeClient();

  const existingProducts = await stripe.products.search({ 
    query: "name:'Job Posting Fee'" 
  });
  
  if (existingProducts.data.length > 0) {
    console.log('Job Posting Fee product already exists:', existingProducts.data[0].id);
    
    const prices = await stripe.prices.list({ 
      product: existingProducts.data[0].id,
      active: true 
    });
    
    if (prices.data.length > 0) {
      console.log('Price ID:', prices.data[0].id);
      console.log('Amount: $' + (prices.data[0].unit_amount! / 100).toFixed(2));
    }
    return;
  }

  const product = await stripe.products.create({
    name: 'Job Posting Fee',
    description: 'Post your job listing on Dev Global Jobs - visible to international job seekers worldwide',
    metadata: {
      type: 'job_posting',
      platform: 'dev_global_jobs'
    }
  });

  console.log('Created product:', product.id);

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 200,
    currency: 'usd',
    metadata: {
      type: 'job_posting_fee'
    }
  });

  console.log('Created price:', price.id);
  console.log('Amount: $2.00 USD');
  console.log('\n✅ Job Posting Product created successfully!');
  console.log('Product ID:', product.id);
  console.log('Price ID:', price.id);
}

createJobPostingProduct()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error creating product:', error);
    process.exit(1);
  });
