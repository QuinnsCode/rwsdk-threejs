# Standard RedwoodSDK Starter

This "standard starter" is the recommended implementation for RedwoodSDK. You get a Typescript project with:

- Vite
- database (Prisma via D1)
- Session Management (via DurableObjects)
- Passkey authentication (Webauthn)
- Storage (via R2)

## Creating your project

```shell
npx create-rwsdk my-project-name
cd my-project-name
pnpm install
```

## Running the dev server

```shell
pnpm dev
```

Point your browser to the URL displayed in the terminal (e.g. `http://localhost:5173/`). You should see a "Hello World" message in your browser.

## Deploying your app

### Wrangler Setup

Within your project's `wrangler.jsonc`:

- Replace the `__change_me__` placeholders with a name for your application

- Create a new D1 database:

```shell
npx wrangler d1 create my-project-db
```

Copy the database ID provided and paste it into your project's `wrangler.jsonc` file:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-project-db",
      "database_id": "your-database-id",
    },
  ],
}
```

### R2 Storage Setup

This starter includes R2 storage configuration for serving large libraries (like Three.js) efficiently from Cloudflare's edge network while keeping your worker bundle small.

#### 1. Create an R2 bucket

```shell
# Create your R2 bucket
npx wrangler r2 bucket create my-project-assets

# Add the bucket binding to your wrangler.jsonc
```

Update your `wrangler.jsonc` to include the R2 bucket:

```jsonc
{
  "r2_buckets": [
    {
      "binding": "R2_BUCKET",
      "bucket_name": "my-project-assets"
    }
  ]
}
```

#### 2. Upload Three.js to R2 (Example)

```shell
# Download Three.js r134 (latest stable on CDNJS)
curl -o three-r134.min.js https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js
curl -o three-r134.module.js https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.module.js

# Upload to your R2 bucket
npx wrangler r2 object put my-project-assets/three-r134.min.js --file three-r134.min.js
npx wrangler r2 object put my-project-assets/three-r134.module.js --file three-r134.module.js

# Verify uploads
npx wrangler r2 object list my-project-assets
```

#### 3. Configure worker for R2 serving

The worker is configured to serve libraries from R2 with aggressive caching. The included setup provides:

- **1-year browser caching** with `immutable` directive
- **Conditional requests** (304 Not Modified) to minimize bandwidth
- **ETag support** for cache validation
- **CORS headers** for cross-origin requests

#### 4. Example Components

The starter includes example components demonstrating R2 + Three.js integration:

**ThreeJSScene Component** (`src/app/components/ThreeJSScene.tsx`):
- Loads Three.js dynamically from R2
- Multi-level caching (memory → localStorage → browser cache → network)
- Performance monitoring with cache source indicators
- Interactive 3D scene with rotating cubes

**BundleAnalyzer Component** (`src/app/components/BundleAnalyzer.tsx`):
- Real-time bundle size analysis
- Shows savings from external library loading
- Performance and cost impact visualization
- Cache hit monitoring

**Homepage** (`src/app/pages/Homepage.tsx`):
- Demonstrates integration of both components
- Shows cache performance indicators
- Displays bundle size savings

#### 5. Cache Performance Monitoring

The setup includes comprehensive cache monitoring:

- **🧠 Memory**: Library already loaded in browser memory
- **💾 Local Storage**: Fastest - avoids network requests entirely  
- **🌐 Browser Cache**: Very fast - HTTP cache hit
- **📡 Network**: First visit - downloads from R2

#### 6. Cost Optimization

This setup minimizes costs through aggressive caching:

- **First visit**: ~$0.0000036 per R2 request
- **Subsequent visits**: $0.00 (served from cache)
- **Global users**: $0.00 after edge cache warm-up
- **R2 storage**: ~$0.000009/month for 600KB Three.js file

Expected bundle size reduction: **60-80% smaller** compared to bundling large libraries directly.

#### 7. Adding Other Libraries

To serve additional libraries from R2:

```shell
# Download library
curl -o library-name.min.js https://cdn.example.com/library.min.js

# Upload to R2
npx wrangler r2 object put my-project-assets/library-name.min.js --file library-name.min.js
```

Add routes in your worker (`src/worker.tsx`):

```typescript
route("/lib/library-name.min.js", async ({ request }) => {
  return serveFromR2('library-name.min.js', 'application/javascript', env);
}),
```

### Authentication Setup

For authentication setup and configuration, including optional bot protection, see the [Authentication Documentation](https://docs.rwsdk.com/core/authentication).

## Performance Benefits

Using R2 for large libraries provides:

- **Faster cold starts**: Smaller worker bundles load faster
- **Parallel loading**: Libraries load while worker initializes
- **Global edge caching**: Libraries cached at 300+ locations worldwide
- **Memory efficiency**: Libraries not loaded into worker memory
- **Cost efficiency**: Near-zero costs after initial cache warm-up

## Further Reading

- [RedwoodSDK Documentation](https://docs.rwsdk.com/)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/runtime-apis/secrets/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)