export type Locale = 'ja' | 'en'

export interface Dictionary {
  common: {
    appTitle: string
    loading: string
    cancel: string
    save: string
    delete: string
    refresh: string
    search: string
    noData: string
    unit_people: string
    unit_items: string
    unit_days: string
    unit_yen: string
    daysAgo: string
    dash: string
  }
  login: {
    title: string
    subtitle: string
    email: string
    emailPlaceholder: string
    password: string
    submit: string
    submitting: string
    error: string
  }
  nav: {
    dashboard: string
    customers: string
    sales: string
    products: string
    settings: string
    logout: string
    admin: string
    viewer: string
    overdueFollowUp: string
  }
  dashboard: {
    todayStatus: string
    lastUpdated: string
    dailyHeader: string
    todayRevenue: string
    profitLabel: string
    lossLabel: string
    expense: string
    newCustomers: string
    existingHandled: string
    fromFollowLog: string
    repeatRate: string
    repeatRateDesc: string
    churnRisk: string
    churnRiskDesc: string
    weeklyHeader: string
    notEntered: string
    cpaLabel: string
    cpsLabel: string
    epcLabel: string
    cpcLabel: string
    productVolumeWeek: string
    referralsThisWeek: string
    monthlyHeader: string
    ltvLabel: string
    ltvDesc: string
    dataAccumulating: string
    maCpsLabel: string
    maCpsFormula: string
    balanceThisMonth: string
    revenue: string
    subscriptionMrr: string
    recurringRevenue: string
    newVsRepeat: string
    newLabel: string
    repeatLabel: string
  }
  kpiTooltips: {
    cpa: { desc: string; hint: string }
    cps: { desc: string; hint: string }
    cvr: { desc: string; hint: string }
    epc: { desc: string; hint: string }
    cpc: { desc: string; hint: string }
    ltv: { desc: string; hint: string }
    maCps: { desc: string; hint: string }
  }
  customers: {
    title: string
    addCustomer: string
    searchPlaceholder: string
    allRanks: string
    dormantOnly: string
    name: string
    rank: string
    cumulativeSpend: string
    lastPurchase: string
    status: string
    source: string
    dormantRisk: string
    active: string
    notFound: string
    newCustomerTitle: string
    fullName: string
    phone: string
    email: string
    address: string
    acquisitionSource: string
    notes: string
    register: string
  }
  customerDetail: {
    backToList: string
    cumulativeSpend: string
    maCpsLimit: string
    lastPurchase: string
    noPurchaseHistory: string
    referralCount: string
    source: string
    purchaseHistory: string
    directAmountEntry: string
    noPurchases: string
    followUpHistory: string
    addFollowLog: string
    noFollowHistory: string
    resultLabel: string
    nextActionLabel: string
    deadline: string
    addFollowTitle: string
    activityType: string
    contentNotes: string
    outcome: string
    nextAction: string
    nextDueDate: string
    record: string
  }
  followTypes: {
    CALL: string
    LINE: string
    MEETING: string
    EMAIL: string
    LETTER: string
    OTHER: string
  }
  sales: {
    title: string
    recordSale: string
    selectFromProduct: string
    directAmount: string
    customer: string
    selectCustomer: string
    product: string
    selectProduct: string
    amount: string
    amountLabel: string
    amountPlaceholder: string
    subscriptionStatus: string
    active: string
    paused: string
    cancelled: string
    transactionDate: string
    memo: string
    memoPlaceholder: string
    submitSale: string
    recorded: string
    summary: string
    today: string
    thisWeek: string
    thisMonth: string
    revenueLabel: string
    profitLabel: string
    lossLabel: string
    vsLastPeriod: string
    expenseLabel: string
    transactionCount: string
    byProduct: string
  }
  products: {
    title: string
    addProduct: string
    editProduct: string
    addProductTitle: string
    productName: string
    price: string
    category: string
    billingType: string
    onSale: string
    confirmDelete: string
  }
  categories: {
    LIST_ACQUISITION: string
    INDIVIDUAL: string
    SEMINAR: string
    ONLINE_COURSE: string
    SUBSCRIPTION: string
  }
  billingTypes: {
    ONE_TIME: string
    RECURRING_MONTHLY: string
    RECURRING_ANNUAL: string
  }
  settings: {
    title: string
    systemSettings: string
    churnDays: string
    marginRate: string
    maCpsFormula: string
    maCpsFormulaValue: string
    changeNote: string
    rankCriteria: string
    rankAutoUpdate: string
    integrations: string
    integrationsPhaseNote: string
    integrationsComingSoon: string
    enabled: string
    notConfigured: string
    utageDesc: string
    freeeDesc: string
    ga4Desc: string
    metaDesc: string
    clickFunnelsDesc: string
  }
  ranks: {
    RANK_1: string
    RANK_2: string
    RANK_3: string
    RANK_4: string
    RANK_5: string
    RANK_6: string
  }
  rankRanges: {
    RANK_1: string
    RANK_2: string
    RANK_3: string
    RANK_4: string
    RANK_5: string
    RANK_6: string
  }
}
