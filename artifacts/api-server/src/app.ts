import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use("/api/{*splat}", (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    req.log.error({ err }, "Unhandled error");
    if (res.headersSent) return;
    res.status(500).json({ error: "Internal server error" });
  },
);

export default app;
