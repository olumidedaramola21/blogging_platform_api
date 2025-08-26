require("dotenv").config();
const fastify = require("fastify")({
  logger: true, // enable request logging
});
const connectDB = require("./config/database"); // connect to database

// function to start server
async function startServer() {
  try {
    await connectDB(); // connect to database
    await fastify.register(require("./routes/article")); // register article route
    // heath check endpoint to monitor server status
    fastify.get("/health", async (request, reply) => {
      return {
        status: "Ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    });

    // start the server
    const host = process.env.HOST || "localhost";
    const port = process.env.PORT || 3000;

    await fastify.listen({ port, host });
    console.log(`Server running at http://${host}/${port}`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {  // handles graceful shutdown (ctrl + c = sigint)
  console.log("\n shutting down server...");
  await fastify.close();
  process.exit(0);
});

startServer();
