import { type Config } from "@coinbase/cdp-react";

export const cdpConfig: Config = {
  projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID || "",
  ethereum: {
    createOnLogin: "smart",
  },
  appName: "Cherry Pick",
  appLogoUrl: "/cherrypick-logo.png",
  // Use email/SMS/OAuth instead of wallet connections to avoid MetaMask errors
  authMethods: ["email", "sms", "oauth:google", "oauth:apple", "oauth:x"],
  showCoinbaseFooter: true,
};

export const SUPPORTED_CROPS = [
  "Mangoes",
  "Pineapples",
  "Cashew nuts",
  "Tomatoes",
  "Beetroot",
  "Bananas",
  "Pawpaw",
  "Strawberries",
] as const;

export type CropType = typeof SUPPORTED_CROPS[number];

export const CROP_MILESTONES: Record<string, string[]> = {
  "Mangoes": [
    "Land preparation completed",
    "Planting verified",
    "Flowering/fruit set confirmed",
    "Pest/disease inspection passed",
    "Pre-harvest quality inspection approved",
    "Harvest and delivery"
  ],
  "Pineapples": [
    "Land preparation completed",
    "Planting verified",
    "Flowering/fruit set confirmed",
    "Pest/disease inspection passed",
    "Pre-harvest quality inspection approved",
    "Harvest and delivery"
  ],
  "Pawpaw": [
    "Land preparation completed",
    "Planting verified",
    "Flowering/fruit set confirmed",
    "Pest/disease inspection passed",
    "Pre-harvest quality inspection approved",
    "Harvest and delivery"
  ],
  "Bananas": [
    "Land preparation completed",
    "Planting verified",
    "Flowering/fruit set confirmed",
    "Pest/disease inspection passed",
    "Pre-harvest quality inspection approved",
    "Harvest and delivery"
  ],
  "Strawberries": [
    "Land preparation completed",
    "Planting verified",
    "Flowering/fruit set confirmed",
    "Pest/disease inspection passed",
    "Pre-harvest quality inspection approved",
    "Harvest and delivery"
  ],
  "Cashew nuts": [
    "Seedling establishment verified",
    "Year 1 maintenance",
    "Flowering and nut set inspection",
    "Pest/disease control adherence",
    "Harvest and grading"
  ],
  "Tomatoes": [
    "Nursery establishment",
    "Transplanting into main field",
    "First flowering",
    "First harvest milestone",
    "Final harvest and delivery"
  ],
  "Beetroot": [
    "Nursery establishment",
    "Transplanting into main field",
    "First flowering",
    "First harvest milestone",
    "Final harvest and delivery"
  ]
};
