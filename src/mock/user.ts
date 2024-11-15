import Mock from "mockjs";

Mock.mock(new RegExp("/auth/admin$"), "post", function (options) {
  const { username, password } = JSON.parse(options.body);

  if (username !== "admin" || password !== "admin") {
    return {
      status: 400,
      message: "用户名或密码错误",
    };
  }

  return {
    avatar: "https://wximg.chuanbaoguancha.cn/FiTobW1ALPNQB8NfnK_bGCx-onth",
    expire_at: 1731989664,
    name: "Ross",
    nickname: "Ross",
    need_two_factor: true,
    two_factor_key: "1234567890",
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MzE5ODk2NjQsImlhdCI6IjIwMjQtMTEtMTJUMTI6MTQ6MjQuODg3OTI1NTg2KzA4OjAwIiwianRpIjoicXVkZ0ExektLYjJDMzdwZTBmTmxOUT09IiwibmFtZSI6IuW3neinguaWsOmXuyIsInByb3ZpZGVyIjoiYWRtaW4iLCJzdGF0dXMiOjF9.LMXN1vG-JqIEPydYSPMxv7sOOYetuL1GVAY1WAYoAiw",
  };
});

Mock.mock(new RegExp("/auth/admin/two-factor"), "post", function () {
  // 80%概率返回错误
  if (Math.random() < 0.8) {
    return {
      status: 400,
      message: "二次验证失败",
    };
  }

  return {
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MzE5ODk2NjQsImlhdCI6IjIwMjQtMTEtMTJUMTI6MTQ6MjQuODg3OTI1NTg2KzA4OjAwIiwianRpIjoicXVkZ0ExektLYjJDMzdwZTBmTmxPUT09IiwibmFtZSI6IuW3neinguaWsOmXuyIsInByb3ZpZGVyIjoiYWRtaW4iLCJzdGF0dXMiOjF9.LMXN1vG-JqIEPydYSPMxv7sOOYetuL1GVAY1WAYoAiw",
  };
});

Mock.mock(new RegExp("/user/info$"),"get",()=>{
  return {
    name: "Ross",
    nickname: "Ross",
    provider: "admin",
    avatar: "https://wximg.chuanbaoguancha.cn/FiTobW1ALPNQB8NfnK_bGCx-onth",
    created_at: "2024-02-19 10:55:05", 
  }
})