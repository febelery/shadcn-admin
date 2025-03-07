import { http, HttpResponse } from "msw";
import { buildMockApiUrl } from "@/lib/utils";

export default [
  http.get(buildMockApiUrl("/qiniu/uptoken"), async ({ request }) => {
    return HttpResponse.json({
      uptoken: "xxx",
    });
  }),
];
