// redisClient.js
const { createClient } = require("redis");

const redisClient = createClient({
  url: "redis://default:JXRqa9ynlWPVBahC63yLnIDbeaIJn0cm@redis-13561.c244.us-east-1-2.ec2.redns.redis-cloud.com:13561",
});

redisClient.on("error", (err) => console.error("❌ Redis Client Error:", err));

(async () => {
  await redisClient.connect();

  // Set and Get value
  await redisClient.set("foo", "bar");
  const value = await redisClient.get("foo");
  console.log("✅ Redis value:", value); // should print "bar"
})();

module.exports = redisClient;
