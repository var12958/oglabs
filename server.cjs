// Custom server with EPIPE guard — prevents Next.js dev server crashes
// when clients disconnect during long-running API routes.

process.on("uncaughtException", (err) => {
  if (err.code === "EPIPE" || err.message?.includes("EPIPE")) {
    // Silently ignore EPIPE — client disconnected, nothing to do
    return;
  }
  // For all other uncaught exceptions, log and continue
  console.error("[Server] Uncaught exception:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled rejection:", reason);
});

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("[Server] Request error:", err.message);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  })
    .once("error", (err) => {
      console.error("[Server] Fatal:", err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`[Server] Ready on http://${hostname}:${port}`);
    });
});
