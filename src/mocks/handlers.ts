const apiModules = import.meta.glob("./api/**/*.ts", { eager: true });

// 收集所有导出的处理器
const handlers = Object.values(apiModules).reduce((acc: any[], module: any) => {
  // 如果模块有默认导出，则添加到处理器数组中
  if (module.default) {
    acc.push(...module.default);
  }
  return acc;
}, []);

export default handlers;
