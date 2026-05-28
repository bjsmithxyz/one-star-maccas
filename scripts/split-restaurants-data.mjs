#!/usr/bin/env node
/**
 * Split restaurants.json into a lightweight index + per-restaurant review files.
 *
 * Usage: npm run data:split
 */

import {
  DATA_PATH,
  INDEX_PATH,
  REVIEW_INDEX_PATH,
  REVIEWS_DIR,
  readRestaurants,
  splitRestaurantsData,
} from './lib/restaurant-data.mjs'

const stats = splitRestaurantsData(readRestaurants())

console.log(
  `Split ${DATA_PATH} → ${INDEX_PATH}, ${REVIEW_INDEX_PATH}, ${REVIEWS_DIR}/ (${stats.restaurantCount} restaurants, ${stats.reviewCount} reviews)`,
)
