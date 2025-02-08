import { setupWorker } from "msw/browser";
import users from "./users";

export const worker = setupWorker(...users);

// async function startWorker() {
//   // 仅在开发环境启动
//   if (process.env.NODE_ENV === "development") {
//     await worker.start({
//       onUnhandledRequest: "bypass", // 对未处理的请求直接放行
//     });
//   }
// }
// startWorker();
