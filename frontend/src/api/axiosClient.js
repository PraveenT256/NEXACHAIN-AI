// Demo-mode mock API client.
//
// This frontend is deployed as a static portfolio demo with no live backend
// or database behind it. This module implements the same get/post interface
// the rest of the app expects, backed by localStorage, so the dashboard is
// fully explorable without any real money, accounts, or servers involved.

const STORAGE_KEY = "nexachain_demo_state";
const NETWORK_DELAY_MS = 350;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function generateReferralCode(fullName) {
  const prefix = (fullName || "USER").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "USR";
  return `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function daysAgoIso(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}

function daysFromNowIso(days) {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function buildReferralTree() {
  return [
    {
      _id: generateId(),
      fullName: "Asha Rao",
      email: "asha.rao@example.com",
      accountStatus: "ACTIVE",
      children: [
        {
          _id: generateId(),
          fullName: "Vikram Nair",
          email: "vikram.nair@example.com",
          accountStatus: "ACTIVE",
          children: [],
        },
        {
          _id: generateId(),
          fullName: "Priya Menon",
          email: "priya.menon@example.com",
          accountStatus: "ACTIVE",
          children: [],
        },
      ],
    },
    {
      _id: generateId(),
      fullName: "Karan Shah",
      email: "karan.shah@example.com",
      accountStatus: "PENDING",
      children: [],
    },
  ];
}

function buildDemoState({ fullName, email, mobileNumber, referralCode }, richSeed) {
  const user = {
    _id: generateId(),
    fullName: fullName || "Demo User",
    email,
    mobileNumber: mobileNumber || "9999999999",
    referralCode: generateReferralCode(fullName),
    accountStatus: "ACTIVE",
  };

  if (!richSeed) {
    return {
      user,
      investments: [],
      roiHistory: [],
      referralIncome: [],
      referralTree: [],
      summary: { totalInvestments: 0, todayRoi: 0, totalLevelIncomeEarned: 0, walletBalance: 0 },
    };
  }

  const investments = [
    {
      _id: generateId(),
      planName: "Growth Plan",
      investmentAmount: 50000,
      dailyRoiPercentage: 1.2,
      startDate: daysAgoIso(20),
      endDate: daysFromNowIso(10),
      investmentStatus: "ACTIVE",
    },
    {
      _id: generateId(),
      planName: "Starter Plan",
      investmentAmount: 15000,
      dailyRoiPercentage: 1,
      startDate: daysAgoIso(45),
      endDate: daysAgoIso(15),
      investmentStatus: "COMPLETED",
    },
    {
      _id: generateId(),
      planName: "Pro Plan",
      investmentAmount: 100000,
      dailyRoiPercentage: 1.5,
      startDate: daysAgoIso(5),
      endDate: daysFromNowIso(25),
      investmentStatus: "ACTIVE",
    },
  ];

  const roiHistory = [];
  for (let day = 13; day >= 0; day -= 1) {
    const investment = investments[day % 2 === 0 ? 0 : 2];
    roiHistory.push({
      _id: generateId(),
      date: daysAgoIso(day),
      investment: { planName: investment.planName },
      roiAmount: Math.round((investment.investmentAmount * investment.dailyRoiPercentage) / 100),
      status: "CREDITED",
    });
  }

  const referralIncome = [
    { name: "Asha Rao", level: 1, amount: 620 },
    { name: "Vikram Nair", level: 2, amount: 180 },
    { name: "Priya Menon", level: 2, amount: 240 },
    { name: "Karan Shah", level: 1, amount: 410 },
    { name: "Asha Rao", level: 1, amount: 590 },
    { name: "Vikram Nair", level: 2, amount: 165 },
  ].map((entry, index) => ({
    _id: generateId(),
    date: daysAgoIso(index * 2),
    sourceUser: { fullName: entry.name },
    referralLevel: entry.level,
    incomeAmount: entry.amount,
  }));

  const totalInvestments = investments.reduce((sum, item) => sum + item.investmentAmount, 0);
  const todayRoi = roiHistory[0]?.roiAmount ?? 0;
  const totalLevelIncomeEarned = referralIncome.reduce((sum, item) => sum + item.incomeAmount, 0);
  const totalRoiEarned = roiHistory.reduce((sum, item) => sum + item.roiAmount, 0);

  return {
    user,
    investments,
    roiHistory,
    referralIncome,
    referralTree: buildReferralTree(),
    summary: {
      totalInvestments,
      todayRoi,
      totalLevelIncomeEarned,
      walletBalance: totalRoiEarned + totalLevelIncomeEarned,
    },
  };
}

function unauthorized() {
  const error = new Error("Not authenticated");
  error.response = { status: 401, data: { message: "Not authenticated" } };
  return error;
}

const axiosClient = {
  async get(url) {
    await delay(NETWORK_DELAY_MS);
    const state = loadState();
    if (!state) throw unauthorized();

    if (url === "/auth/me") return { data: { data: state.user } };
    if (url === "/dashboard/summary") return { data: { data: state.summary } };
    if (url === "/investments") return { data: { data: state.investments } };
    if (url === "/dashboard/roi-history") return { data: { data: state.roiHistory } };
    if (url === "/dashboard/referral-income-history") return { data: { data: state.referralIncome } };
    if (url === "/referrals/tree") return { data: { data: state.referralTree } };

    const error = new Error("Not found");
    error.response = { status: 404, data: { message: "Not found" } };
    throw error;
  },

  async post(url, body) {
    await delay(NETWORK_DELAY_MS);

    if (url === "/auth/login") {
      const state = buildDemoState({ fullName: "Demo User", email: body.email }, true);
      saveState(state);
      return { data: { data: { token: "demo-token", user: state.user } } };
    }

    if (url === "/auth/register") {
      const state = buildDemoState(body, false);
      saveState(state);
      return { data: { data: { token: "demo-token", user: state.user } } };
    }

    if (url === "/investments") {
      const state = loadState();
      if (!state) throw unauthorized();

      const newInvestment = {
        _id: generateId(),
        planName: body.planName,
        investmentAmount: body.investmentAmount,
        dailyRoiPercentage: body.dailyRoiPercentage,
        startDate: new Date().toISOString(),
        endDate: daysFromNowIso(body.planDurationInDays),
        investmentStatus: "ACTIVE",
      };
      state.investments = [newInvestment, ...state.investments];
      state.summary.totalInvestments += newInvestment.investmentAmount;
      saveState(state);
      return { data: { data: newInvestment } };
    }

    const error = new Error("Not found");
    error.response = { status: 404, data: { message: "Not found" } };
    throw error;
  },
};

export default axiosClient;
