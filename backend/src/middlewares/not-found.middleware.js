import { AppError } from "../utils/app-error.js";

export function notFoundMiddleware(req, _res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}
