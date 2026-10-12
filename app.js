const OVERRIDES_VERSION = 2;
const BUILTIN_OVERRIDES_2026 = {
  rest: [
    "2026-01-01",
    "2026-01-02",
    "2026-01-03",
    "2026-02-15",
    "2026-02-16",
    "2026-02-17",
    "2026-02-18",
    "2026-02-19",
    "2026-02-20",
    "2026-02-21",
    "2026-02-22",
    "2026-02-23",
    "2026-04-04",
    "2026-04-05",
    "2026-04-06",
    "2026-05-01",
    "2026-05-02",
    "2026-05-03",
    "2026-05-04",
    "2026-05-05",
    "2026-06-19",
    "2026-06-20",
    "2026-06-21",
    "2026-09-25",
    "2026-09-26",
    "2026-09-27",
    "2026-10-01",
    "2026-10-02",
    "2026-10-03",
    "2026-10-04",
    "2026-10-05",
    "2026-10-06",
    "2026-10-07",
  ],
  work: [
    "2026-01-04",
    "2026-02-14",
    "2026-02-28",
    "2026-05-09",
    "2026-09-20",
    "2026-10-10",
  ],
};

const state = {
  monthlySalary: 10000,
  hoursPerDay: 8,
  period: "month",
  running: true,
  lastWallSecond: Math.floor(Date.now() / 1000),
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),
  overrides: loadOverrides(),
};

const elements = {
  salaryInput: document.querySelector("#salaryInput"),
  hoursInput: document.querySelector("#hoursInput"),
  currentWorkdays: document.querySelector("#currentWorkdays"),
  calendarTrigger: document.querySelector("#calendarTrigger"),
  calendarNote: document.querySelector("#calendarNote"),
  presetRow: document.querySelector(".preset-row"),
  tabs: [...document.querySelectorAll(".tab")],
  panels: [...document.querySelectorAll("[data-panel]")],
  periodTabs: [...document.querySelectorAll(".period-tab")],
  toggleButton: document.querySelector("#toggleButton"),
  resetButton: document.querySelector("#resetButton"),
  earnedAmount: document.querySelector("#earnedAmount"),
  liveRate: document.querySelector("#liveRate"),
  counterTitle: document.querySelector("#counterTitle"),
  periodCaption: document.querySelector("#periodCaption"),
  restNotice: document.querySelector("#restNotice"),
  coinStage: document.querySelector("#coinStage"),
  miniMinute: document.querySelector("#miniMinute"),
  miniHour: document.querySelector("#miniHour"),
  miniDay: document.querySelector("#miniDay"),
  miniDayLabel: document.querySelector("#miniDayLabel"),
  metricSecond: document.querySelector("#metricSecond"),
  metricMinute: document.querySelector("#metricMinute"),
  metricHour: document.querySelector("#metricHour"),
  metricDay: document.querySelector("#metricDay"),
  metricMonth: document.querySelector("#metricMonth"),
  metricYear: document.querySelector("#metricYear"),
  contextLine: document.querySelector("#contextLine"),
  summaryBasis: document.querySelector("#summaryBasis"),
  footerBasis: document.querySelector("#footerBasis"),
  barList: document.querySelector("#barList"),
  calendarModal: document.querySelector("#calendarModal"),
  calendarTitle: document.querySelector("#calendarTitle"),
  monthSummary: document.querySelector("#monthSummary"),
  calendarGrid: document.querySelector("#calendarGrid"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  closeCalendar: document.querySelector("#closeCalendar"),
  confirmCalendar: document.querySelector("#confirmCalendar"),
  clearMonthAdjustments: document.querySelector("#clearMonthAdjustments"),
  alertModal: document.querySelector("#alertModal"),
  alertTitle: document.querySelector("#alertTitle"),
  alertMessage: document.querySelector("#alertMessage"),
  alertConfirm: document.querySelector("#alertConfirm"),
};

const formatters = {
  currency: new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  precise: new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }),
  number: new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
  }),
};

const pad2 = (number) => String(number).padStart(2, "0");

function uniqueKeys(keys) {
  return [...new Set(keys.filter((key) => typeof key === "string"))];
}

function loadOverrides() {
  try {
    const saved = JSON.parse(localStorage.getItem("salary-clock-overrides") || "null");
    if (saved?.version === OVERRIDES_VERSION && Array.isArray(saved.rest) && Array.isArray(saved.work)) {
      return { rest: uniqueKeys(saved.rest), work: uniqueKeys(saved.work) };
    }

    const legacyRest = Array.isArray(saved?.rest) ? saved.rest : [];
    const legacyWork = Array.isArray(saved?.work) ? saved.work : [];
    return {
      rest: uniqueKeys([...legacyRest, ...BUILTIN_OVERRIDES_2026.rest]),
      work: uniqueKeys([...legacyWork, ...BUILTIN_OVERRIDES_2026.work]),
    };
  } catch {
    return {
      rest: [...BUILTIN_OVERRIDES_2026.rest],
      work: [...BUILTIN_OVERRIDES_2026.work],
    };
  }
}

function saveOverrides() {
  try {
    localStorage.setItem(
      "salary-clock-overrides",
      JSON.stringify({
        version: OVERRIDES_VERSION,
        rest: [...state.overrides.rest],
        work: [...state.overrides.work],
      }),
    );
  } catch {
    // Local storage is unavailable in some private browsing modes.
  }
}

function parseInputNumber(input) {
  const raw = input.value.trim();
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function isValidSalary(value) {
  return value !== null && value > 0;
}

function isValidHours(value) {
  return value !== null && value >= 0.5 && value <= 24;
}

function dateKey(year, monthIndex, day) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month: month - 1, day };
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function isWeekend(year, monthIndex, day) {
  const weekday = new Date(year, monthIndex, day).getDay();
  return weekday === 0 || weekday === 6;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

function dayStatus(key) {
  if (state.overrides.rest.includes(key)) return "rest";
  if (state.overrides.work.includes(key)) return "work";
  const { year, month, day } = parseDateKey(key);
  return isWeekend(year, month, day) ? "rest" : "work";
}

function monthWorkDays(year, monthIndex) {
  const total = daysInMonth(year, monthIndex);
  let count = 0;
  for (let day = 1; day <= total; day += 1) {
    if (dayStatus(dateKey(year, monthIndex, day)) === "work") count += 1;
  }
  return count || 1;
}

function monthStats(year, monthIndex) {
  const workDays = monthWorkDays(year, monthIndex);
  const totalWorkSeconds = workDays * state.hoursPerDay * 3600;
  const secondRate = state.monthlySalary / totalWorkSeconds;
  return {
    workDays,
    secondRate,
    minuteRate: secondRate * 60,
    hourRate: secondRate * 3600,
    dayRate: state.monthlySalary / workDays,
  };
}

function currentStats(date = new Date()) {
  return monthStats(date.getFullYear(), date.getMonth());
}

function elapsedDayFraction(date) {
  const dayStart = startOfDay(date);
  return Math.min(Math.max((date.getTime() - dayStart.getTime()) / 86400000, 0), 1);
}

function earnedMonthToDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const stats = monthStats(year, month);
  const dayFraction = elapsedDayFraction(date);
  let total = 0;

  for (let day = 1; day <= date.getDate(); day += 1) {
    const key = dateKey(year, month, day);
    if (dayStatus(key) !== "work") continue;
    total += stats.dayRate * (day === date.getDate() ? dayFraction : 1);
  }

  return total;
}

function periodEarnings(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (state.period === "day") {
    const key = dateKey(year, month, date.getDate());
    return dayStatus(key) === "work"
      ? monthStats(year, month).dayRate * elapsedDayFraction(date)
      : 0;
  }

  if (state.period === "month") {
    return earnedMonthToDate(date);
  }

  let total = 0;
  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    if (monthIndex < month) {
      total += state.monthlySalary;
    } else if (monthIndex === month) {
      total += earnedMonthToDate(date);
    }
  }
  return total;
}

function liveSecondRate(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const key = dateKey(year, month, date.getDate());
  return dayStatus(key) === "work" ? monthStats(year, month).secondRate : 0;
}

function formatClock(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function formatDuration(start, end) {
  let total = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
  const days = Math.floor(total / 86400);
  total -= days * 86400;
  const hours = Math.floor(total / 3600);
  total -= hours * 3600;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${days > 0 ? `${days}天` : ""}${pad2(hours)}小时${pad2(minutes)}分${pad2(seconds)}秒`;
}

function formatWorkDays(value) {
  return formatters.number.format(value);
}

function updatePeriodCaption(date) {
  let start;
  let startLabel;
  if (state.period === "day") {
    start = startOfDay(date);
    startLabel = "今日从 00:00";
  } else if (state.period === "month") {
    start = startOfMonth(date);
    startLabel = `${date.getMonth() + 1}月1日`;
  } else {
    start = startOfYear(date);
    startLabel = "1月1日";
  }
  elements.periodCaption.textContent = `${formatClock(date)} · ${startLabel} 已累计 ${formatDuration(start, date)}`;
}

function updateWorkdayNotice(date) {
  const key = dateKey(date.getFullYear(), date.getMonth(), date.getDate());
  const isNonWorkday = dayStatus(key) !== "work";
  elements.restNotice.hidden = !isNonWorkday;
  if (isNonWorkday) {
    elements.restNotice.querySelector("span").textContent = "今天是非工作日，金额暂不增加";
  }
}

function renderBreakdown(stats) {
  const rows = [
    ["1 秒", stats.secondRate],
    ["1 分钟", stats.minuteRate],
    ["1 小时", stats.hourRate],
    ["1 天", stats.dayRate],
    ["1 月", state.monthlySalary],
    ["1 年", state.monthlySalary * 12],
  ];
  const max = Math.max(...rows.map(([, value]) => value), 1);

  elements.barList.innerHTML = rows
    .map(([label, value]) => {
      const width = Math.max((value / max) * 100, 0.5);
      const amount = label === "1 秒" ? formatters.precise.format(value) : formatters.currency.format(value);
      return `
        <div class="bar-row">
          <span>${label}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
          <strong>${amount}</strong>
        </div>
      `;
    })
    .join("");
}

function updateDerivedValues() {
  const now = new Date();
  const stats = currentStats(now);
  const workDaysText = formatWorkDays(stats.workDays);

  elements.currentWorkdays.textContent = `${workDaysText} 天`;
  elements.calendarNote.textContent = `本月 ${workDaysText} 个工作日，已考虑节假日与调休`;
  elements.liveRate.textContent = formatters.precise.format(liveSecondRate(now));
  elements.miniMinute.textContent = formatters.currency.format(stats.minuteRate);
  elements.miniHour.textContent = formatters.currency.format(stats.hourRate);
  elements.miniDay.textContent = formatters.currency.format(stats.dayRate);
  elements.miniDayLabel.textContent = "本月日薪";
  elements.metricSecond.textContent = formatters.precise.format(stats.secondRate);
  elements.metricMinute.textContent = formatters.currency.format(stats.minuteRate);
  elements.metricHour.textContent = formatters.currency.format(stats.hourRate);
  elements.metricDay.textContent = formatters.currency.format(stats.dayRate);
  elements.metricMonth.textContent = formatters.currency.format(state.monthlySalary);
  elements.metricYear.textContent = formatters.currency.format(state.monthlySalary * 12);

  const context = `本月 ${workDaysText} 个工作日 · 每日 ${state.hoursPerDay} 小时`;
  elements.contextLine.textContent = `按 ${context}`;
  elements.summaryBasis.textContent = `${now.getMonth() + 1}月 · ${workDaysText} 天 × ${state.hoursPerDay} 小时`;
  elements.footerBasis.textContent = `月薪 ${formatters.currency.format(state.monthlySalary)} · ${context}`;

  updatePresetSelection();
  renderBreakdown(stats);
  refreshEarned(now);
}

function updatePresetSelection() {
  elements.presetRow.querySelectorAll("[data-salary]").forEach((button) => {
    button.classList.toggle("selected", Number(button.dataset.salary) === state.monthlySalary);
  });
}

function refreshEarned(date = new Date()) {
  elements.earnedAmount.textContent = formatters.precise.format(periodEarnings(date));
  updatePeriodCaption(date);
  updateWorkdayNotice(date);
}

function setView(view) {
  elements.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  elements.panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === view));
}

function setPeriod(period) {
  state.period = period;
  elements.periodTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.period === period));
  elements.counterTitle.textContent =
    period === "day" ? "今日已赚" : period === "month" ? "本月已赚" : "今年已赚";
  state.lastWallSecond = Math.floor(Date.now() / 1000);
  refreshEarned();
}

function setRunning(running) {
  state.running = running;
  if (running) {
    state.lastWallSecond = Math.floor(Date.now() / 1000);
    refreshEarned();
  }
  elements.toggleButton.innerHTML = `<i data-lucide="${running ? "pause" : "play"}"></i>`;
  elements.toggleButton.setAttribute("aria-label", running ? "暂停" : "继续");
  window.lucide?.createIcons();
}

function tickAmount() {
  elements.earnedAmount.classList.remove("tick");
  void elements.earnedAmount.offsetWidth;
  elements.earnedAmount.classList.add("tick");
}

function spawnCoin() {
  const secondRate = liveSecondRate(new Date());
  if (secondRate <= 0) return;
  const coin = document.createElement("span");
  coin.className = "coin-pop";
  coin.textContent = `+${formatters.precise.format(secondRate)}`;
  coin.style.setProperty("--drift", `${Math.round(Math.random() * 90 - 45)}px`);
  coin.style.setProperty("--spin", `${Math.round(Math.random() * 24 - 12)}deg`);
  elements.coinStage.appendChild(coin);
  coin.addEventListener("animationend", () => coin.remove(), { once: true });

  while (elements.coinStage.children.length > 8) {
    elements.coinStage.firstElementChild.remove();
  }
}

function frame() {
  if (state.running) {
    const now = new Date();
    refreshEarned(now);
    const wallSecond = Math.floor(now.getTime() / 1000);
    if (wallSecond !== state.lastWallSecond) {
      state.lastWallSecond = wallSecond;
      if (liveSecondRate(now) > 0) {
        spawnCoin();
        tickAmount();
      }
    }
  }
  requestAnimationFrame(frame);
}

function toggleOverride(key) {
  const { year, month, day } = parseDateKey(key);
  const currentlyOverridden =
    state.overrides.rest.includes(key) || state.overrides.work.includes(key);

  if (currentlyOverridden) {
    state.overrides.rest = state.overrides.rest.filter((item) => item !== key);
    state.overrides.work = state.overrides.work.filter((item) => item !== key);
  } else if (isWeekend(year, month, day)) {
    state.overrides.work.push(key);
  } else {
    state.overrides.rest.push(key);
  }

  saveOverrides();
}

function calendarStatusMeta(key) {
  const status = dayStatus(key);
  const isHolidayOverride = state.overrides.rest.includes(key);
  const isMakeupOverride = state.overrides.work.includes(key);
  if (isHolidayOverride) return { className: "rest holiday", label: "法定假日", badge: "假" };
  if (isMakeupOverride) return { className: "work makeup", label: "调休上班", badge: "班" };
  return status === "work"
    ? { className: "work", label: "工作日", badge: "" }
    : { className: "rest", label: "周末", badge: "" };
}

function renderCalendar() {
  const year = state.calendarYear;
  const month = state.calendarMonth;
  const totalDays = daysInMonth(year, month);
  const firstWeekday = new Date(year, month, 1).getDay();
  const todayKey = dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  elements.calendarTitle.textContent = `${year}年${month + 1}月`;
  elements.monthSummary.textContent = `${monthWorkDays(year, month)} 个工作日`;

  let html = "";
  for (let i = 0; i < firstWeekday; i += 1) {
    html += '<div class="calendar-blank"></div>';
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const key = dateKey(year, month, day);
    const meta = calendarStatusMeta(key);
    const todayClass = key === todayKey ? " today" : "";
    html += `
      <button class="calendar-day ${meta.className}${todayClass}" type="button" data-date="${key}" title="${meta.label}">
        <span>${day}</span>${meta.badge ? `<b>${meta.badge}</b>` : ""}
      </button>
    `;
  }

  elements.calendarGrid.innerHTML = html;
}

function openCalendar() {
  const now = new Date();
  state.calendarYear = now.getFullYear();
  state.calendarMonth = now.getMonth();
  renderCalendar();
  elements.calendarModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeCalendar() {
  elements.calendarModal.hidden = true;
  if (elements.alertModal.hidden) {
    document.body.classList.remove("modal-open");
  }
}

function clearMonthOverrides() {
  const prefix = `${state.calendarYear}-${pad2(state.calendarMonth + 1)}-`;
  state.overrides.rest = state.overrides.rest.filter((key) => !key.startsWith(prefix));
  state.overrides.work = state.overrides.work.filter((key) => !key.startsWith(prefix));
  saveOverrides();
  renderCalendar();
  updateDerivedValues();
}

function showAlert(title, message) {
  elements.alertTitle.textContent = title;
  elements.alertMessage.textContent = message;
  elements.alertModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeAlert() {
  elements.alertModal.hidden = true;
  if (elements.calendarModal.hidden) {
    document.body.classList.remove("modal-open");
  }
}

function restoreInput(input, value) {
  input.value = value;
}

function commitSalaryInput(showErrors = true) {
  const value = parseInputNumber(elements.salaryInput);
  if (value === null || !isValidSalary(value)) {
    if (showErrors) {
      showAlert("月工资输入有误", "请输入大于 0 的有效数字。");
    }
    restoreInput(elements.salaryInput, state.monthlySalary);
    return;
  }
  state.monthlySalary = value;
  elements.salaryInput.value = state.monthlySalary;
  updateDerivedValues();
  state.lastWallSecond = Math.floor(Date.now() / 1000);
}

function commitHoursInput(showErrors = true) {
  const value = parseInputNumber(elements.hoursInput);
  if (value === null || !isValidHours(value)) {
    if (showErrors) {
      showAlert("工作时长输入有误", "请输入 0.5 到 24 小时之间的有效数字。");
    }
    restoreInput(elements.hoursInput, state.hoursPerDay);
    return;
  }
  state.hoursPerDay = value;
  elements.hoursInput.value = state.hoursPerDay;
  updateDerivedValues();
  state.lastWallSecond = Math.floor(Date.now() / 1000);
}

elements.salaryInput.addEventListener("input", () => {
  const value = parseInputNumber(elements.salaryInput);
  if (value === null) return;
  if (isValidSalary(value)) commitSalaryInput(false);
});
elements.salaryInput.addEventListener("change", () => commitSalaryInput(true));
elements.salaryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") elements.salaryInput.blur();
});

elements.hoursInput.addEventListener("input", () => {
  const value = parseInputNumber(elements.hoursInput);
  if (value === null) return;
  if (isValidHours(value)) commitHoursInput(false);
});
elements.hoursInput.addEventListener("change", () => commitHoursInput(true));
elements.hoursInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") elements.hoursInput.blur();
});

elements.presetRow.addEventListener("click", (event) => {
  const button = event.target.closest("[data-salary]");
  if (!button) return;
  elements.salaryInput.value = button.dataset.salary;
  commitSalaryInput(false);
});

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});

elements.periodTabs.forEach((tab) => {
  tab.addEventListener("click", () => setPeriod(tab.dataset.period));
});

elements.toggleButton.addEventListener("click", () => setRunning(!state.running));
elements.resetButton.addEventListener("click", () => {
  state.lastWallSecond = Math.floor(Date.now() / 1000);
  elements.coinStage.replaceChildren();
  refreshEarned();
});

elements.calendarTrigger.addEventListener("click", openCalendar);
elements.closeCalendar.addEventListener("click", closeCalendar);
elements.confirmCalendar.addEventListener("click", closeCalendar);
elements.prevMonth.addEventListener("click", () => {
  state.calendarMonth -= 1;
  if (state.calendarMonth < 0) {
    state.calendarMonth = 11;
    state.calendarYear -= 1;
  }
  renderCalendar();
});
elements.nextMonth.addEventListener("click", () => {
  state.calendarMonth += 1;
  if (state.calendarMonth > 11) {
    state.calendarMonth = 0;
    state.calendarYear += 1;
  }
  renderCalendar();
});
elements.clearMonthAdjustments.addEventListener("click", clearMonthOverrides);
elements.calendarGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-date]");
  if (!button) return;
  toggleOverride(button.dataset.date);
  renderCalendar();
  updateDerivedValues();
});
elements.calendarModal.addEventListener("click", (event) => {
  if (event.target === elements.calendarModal) closeCalendar();
});
elements.alertConfirm.addEventListener("click", closeAlert);
elements.alertModal.addEventListener("click", (event) => {
  if (event.target === elements.alertModal) closeAlert();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!elements.alertModal.hidden) {
    closeAlert();
  } else if (!elements.calendarModal.hidden) {
    closeCalendar();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    state.lastWallSecond = Math.floor(Date.now() / 1000);
    refreshEarned();
  }
});

updateDerivedValues();
window.lucide?.createIcons();
requestAnimationFrame(frame);
