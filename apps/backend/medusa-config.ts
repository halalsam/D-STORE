import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const env = process.env
const REDIS_URL = env.REDIS_URL

// Every integration below is enabled only when its credentials are set, so the
// app boots with none of them (local dev) and gains each one as keys arrive.

const redisModules = REDIS_URL
  ? [
      { resolve: "@medusajs/medusa/event-bus-redis", options: { redisUrl: REDIS_URL } },
      { resolve: "@medusajs/medusa/workflow-engine-redis", options: { redis: { redisUrl: REDIS_URL } } },
      {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [{ resolve: "@medusajs/medusa/locking-redis", id: "locking-redis", is_default: true, options: { redisUrl: REDIS_URL } }],
        },
      },
    ]
  : []

const fileModule = env.S3_BUCKET
  ? [
      {
        resolve: "@medusajs/medusa/file",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/file-s3",
              id: "s3",
              options: {
                file_url: env.S3_FILE_URL,
                access_key_id: env.S3_ACCESS_KEY_ID,
                secret_access_key: env.S3_SECRET_ACCESS_KEY,
                region: env.S3_REGION,
                bucket: env.S3_BUCKET,
                endpoint: env.S3_ENDPOINT || undefined,
                prefix: env.S3_PREFIX || undefined,
                // R2 and buckets with Object Ownership "BucketOwnerEnforced" reject ACL headers.
                ...(env.S3_ACL === "false" ? { acl: false } : {}),
                additional_client_config: env.S3_FORCE_PATH_STYLE === "true" ? { forcePathStyle: true } : {},
              },
            },
          ],
        },
      },
    ]
  : []

const searchModule = env.MEILISEARCH_HOST
  ? [
      {
        resolve: "@medusajs/medusa/search",
        options: {
          index_prefix: env.MEILISEARCH_INDEX_PREFIX ?? "dstore_",
          providers: [
            {
              resolve: "./src/modules/meilisearch",
              id: "meilisearch",
              options: { host: env.MEILISEARCH_HOST, apiKey: env.MEILISEARCH_API_KEY },
            },
          ],
        },
      },
    ]
  : []

const paymentProviders = [
  ...(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? [
        {
          resolve: "./src/modules/razorpay",
          id: "razorpay",
          options: {
            keyId: env.RAZORPAY_KEY_ID,
            keySecret: env.RAZORPAY_KEY_SECRET,
            webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
            autoCapture: env.RAZORPAY_AUTO_CAPTURE !== "false",
          },
        },
      ]
    : []),
  ...(env.PHONEPE_CLIENT_ID && env.PHONEPE_CLIENT_SECRET
    ? [
        {
          resolve: "./src/modules/phonepe",
          id: "phonepe",
          options: {
            clientId: env.PHONEPE_CLIENT_ID,
            clientSecret: env.PHONEPE_CLIENT_SECRET,
            clientVersion: env.PHONEPE_CLIENT_VERSION ?? "1",
            env: env.PHONEPE_ENV === "production" ? "production" : "sandbox",
            redirectUrl: env.PHONEPE_REDIRECT_URL ?? `${env.STOREFRONT_URL ?? "http://localhost:8000"}/checkout/payment-return`,
            webhookUsername: env.PHONEPE_WEBHOOK_USERNAME,
            webhookPassword: env.PHONEPE_WEBHOOK_PASSWORD,
          },
        },
      ]
    : []),
]

const authProviders = env.GOOGLE_CLIENT_ID
  ? [
      {
        resolve: "@medusajs/medusa/auth",
        options: {
          providers: [
            { resolve: "@medusajs/medusa/auth-emailpass", id: "emailpass" },
            {
              resolve: "@medusajs/medusa/auth-google",
              id: "google",
              options: {
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
                callbackUrl: env.GOOGLE_CALLBACK_URL ?? `${env.STOREFRONT_URL ?? "http://localhost:8000"}/auth/google/callback`,
              },
            },
          ],
        },
      },
    ]
  : []

const notificationModule = [
  {
    resolve: "@medusajs/medusa/notification",
    options: {
      providers: env.RESEND_API_KEY
        ? [
            {
              resolve: "./src/modules/resend",
              id: "resend",
              options: { channels: ["email"], apiKey: env.RESEND_API_KEY, from: env.RESEND_FROM ?? "D-STORE <orders@example.com>", replyTo: env.RESEND_REPLY_TO },
            },
            { resolve: "@medusajs/medusa/notification-local", id: "local", options: { channels: ["feed"] } },
          ]
        : // Without Resend, emails are logged to the console instead of sent.
          [{ resolve: "@medusajs/medusa/notification-local", id: "local", options: { channels: ["email", "feed"] } }],
    },
  },
]

const fulfillmentModule = [
  {
    resolve: "@medusajs/medusa/fulfillment",
    options: {
      providers: [
        { resolve: "@medusajs/medusa/fulfillment-manual", id: "manual" },
        ...(env.SHIPROCKET_EMAIL && env.SHIPROCKET_PASSWORD
          ? [
              {
                resolve: "./src/modules/shiprocket",
                id: "shiprocket",
                options: {
                  email: env.SHIPROCKET_EMAIL,
                  password: env.SHIPROCKET_PASSWORD,
                  pickupLocation: env.SHIPROCKET_PICKUP_LOCATION ?? "Primary",
                  pickupPostcode: env.SHIPROCKET_PICKUP_POSTCODE ?? "400050",
                  defaultItemWeightGrams: Number(env.SHIPROCKET_DEFAULT_WEIGHT_GRAMS ?? 400),
                  autoPickup: env.SHIPROCKET_AUTO_PICKUP !== "false",
                },
              },
            ]
          : []),
      ],
    },
  },
]

module.exports = defineConfig({
  plugins: [
    // New reviews wait for approval in Admin -> Product Reviews.
    { resolve: "@lambdacurry/medusa-product-reviews", options: { defaultReviewStatus: "pending" } },
    { resolve: "@medusajs/loyalty-plugin", options: { prefix: "DSTORE", sections: 3 } },
  ],
  projectConfig: {
    databaseUrl: env.DATABASE_URL,
    redisUrl: REDIS_URL,
    workerMode: env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server" | undefined,
    http: {
      storeCors: env.STORE_CORS!,
      adminCors: env.ADMIN_CORS!,
      authCors: env.AUTH_CORS!,
      jwtSecret: env.JWT_SECRET || "supersecret",
      cookieSecret: env.COOKIE_SECRET || "supersecret",
    },
  },
  admin: {
    disable: env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: env.MEDUSA_BACKEND_URL,
  },
  modules: [
    { resolve: "./src/modules/restock" },
    ...redisModules,
    ...fileModule,
    ...searchModule,
    ...(paymentProviders.length ? [{ resolve: "@medusajs/medusa/payment", options: { providers: paymentProviders } }] : []),
    ...authProviders,
    ...notificationModule,
    ...fulfillmentModule,
  ],
})
