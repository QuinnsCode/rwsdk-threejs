import { defineApp, ErrorResponse } from "rwsdk/worker";
import { route, render, prefix } from "rwsdk/router";
import { Document } from "@/app/Document";
import { Home } from "@/app/pages/Home";
import HomePage from "./app/pages/home/HomePage";
import { setCommonHeaders } from "@/app/headers";
import { userRoutes } from "@/app/pages/user/routes";
import { sessions, setupSessionStore } from "./session/store";
import { Session } from "./session/durableObject";
import { type User, db, setupDb } from "@/db";
import { env } from "cloudflare:workers";
export { SessionDurableObject } from "./session/durableObject";

export type AppContext = {
  session: Session | null;
  user: User | null;
};

// Helper function to serve files from R2 with aggressive caching
async function serveFromR2(key: string, contentType: string, env: any) {
  try {
    const object = await env.R2_BUCKET?.get(key);
    if (!object) {
      return new Response('Library not found', { status: 404 });
    }
    
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        // Aggressive caching - cache for 1 year
        'Cache-Control': 'public, max-age=31536000, immutable',
        // CloudFlare caching - cache for 1 year at edge
        'CF-Cache-Tag': 'static-lib',
        // ETag for conditional requests
        'ETag': object.etag,
        // Additional caching headers
        'Expires': new Date(Date.now() + 31536000000).toUTCString(), // 1 year
        // CORS for cross-origin requests
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Max-Age': '86400',
        // Compression hint
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (error) {
    console.error('Error serving from R2:', error);
    return new Response('Error serving library', { status: 500 });
  }
}

export default defineApp([
  setCommonHeaders(),
  
  async ({ ctx, request, headers }) => {
    await setupDb(env);
    setupSessionStore(env);

    try {
      ctx.session = await sessions.load(request);
    } catch (error) {
      if (error instanceof ErrorResponse && error.code === 401) {
        await sessions.remove(request, headers);
        headers.set("Location", "/user/login");

        return new Response(null, {
          status: 302,
          headers,
        });
      }

      throw error;
    }

    if (ctx.session?.userId) {
      ctx.user = await db.user.findUnique({
        where: {
          id: ctx.session.userId,
        },
      });
    }
  },
  render(Document, [
    // Add Three.js serving routes with conditional request handling
    route("/lib/three.min.js", async ({ request }) => {
      // Check for conditional requests (If-None-Match header)
      const ifNoneMatch = request.headers.get('If-None-Match');
      const expectedETag = '"three-r134-etag"'; // You can make this dynamic
      
      if (ifNoneMatch === expectedETag) {
        return new Response(null, { 
          status: 304, // Not Modified
          headers: {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': expectedETag,
          }
        });
      }
      
      return serveFromR2('three-r134.min.js', 'application/javascript', env);
    }),
    
    route("/lib/three.module.js", async ({ request }) => {
      const ifNoneMatch = request.headers.get('If-None-Match');
      const expectedETag = '"three-r134-module-etag"';
      
      if (ifNoneMatch === expectedETag) {
        return new Response(null, { 
          status: 304,
          headers: {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': expectedETag,
          }
        });
      }
      
      return serveFromR2('three-r134.module.js', 'application/javascript', env);
    }),
    
    route("/", HomePage),
    route("/protected", [
      ({ ctx }) => {
        if (!ctx.user) {
          return new Response(null, {
            status: 302,
            headers: { Location: "/user/login" },
          });
        }
      },
      Home,
    ]),
    prefix("/user", userRoutes),
  ]),
]);