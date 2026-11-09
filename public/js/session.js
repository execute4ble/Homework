window.addEventListener("beforeunload", (event) => {
  //определяем тип навигации
  const navEntries = performance.getEntriesByType("navigation");
  const navType = navEntries.length > 0 ? navEntries[0].type : null;
  //если это перезагрузка не  выходим
  if (navType === "reload") {
    return;
  }
  //Иначе - выходим
  navigator.sendBeacon("/logout");
});
